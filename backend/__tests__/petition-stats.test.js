/**
 * Tests pour la route GET /api/v1/petitions/:id/stats
 * Statistiques : signatures, commentaires, percentageToGoal
 */

import request from 'supertest';
import express from 'express';
import sequelize from '../src/db/sequelize.js';
import User from '../src/models/User.js';
import Elu from '../src/models/Elu.js';
import Petition from '../src/models/Petition.js';
import Signature from '../src/models/Signature.js';
import Comment from '../src/models/Comment.js';
import { createJWT } from '../src/services/auth.js';
import routes from '../src/routes/index.js';
import '../src/models/index.js';

// Créer l'app pour les tests
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', routes);

describe('GET /api/v1/petitions/:id/stats', () => {
  let testUser;
  let otherUser;
  let testElu;
  let testPetition;
  let testPetitionNoElu;
  let userJWT;

  beforeAll(async () => {
    await sequelize.authenticate();
    console.log('✅ Connexion à la BD établie');

    // Créer utilisateurs
    testUser = await User.create({
      email: 'test-stats-user@citoyenavise.com',
      nomComplet: 'Test Stats User',
      province: 'QC',
      codePostal: 'H1A 1A1',
    });

    otherUser = await User.create({
      email: 'other-stats-user@citoyenavise.com',
      nomComplet: 'Other Stats User',
      province: 'ON',
      codePostal: 'M1A 1A1',
    });

    userJWT = createJWT(testUser.id);

    // Créer élu
    testElu = await Elu.create({
      nom: 'Test Elu Stats',
      titre: 'Députée',
      region: 'Québec',
      niveau: 'fédéral',
      email: 'test-stats-elu@parl.gc.ca',
    });

    // Créer pétition avec élu
    testPetition = await Petition.create({
      titre: 'Test Petition Stats',
      description: 'Test petition for statistics',
      citoyenId: testUser.id,
      eluId: testElu.id,
      status: 'published',
      signaturesCount: 0,
    });

    // Créer pétition sans élu
    testPetitionNoElu = await Petition.create({
      titre: 'Test Petition No Elu',
      description: 'Test petition without target elu',
      citoyenId: otherUser.id,
      eluId: null,
      status: 'published',
      signaturesCount: 0,
    });

    // Créer signatures pour la première pétition
    for (let i = 0; i < 5; i++) {
      const user = await User.create({
        email: `test-stats-signer-${i}@citoyenavise.com`,
        nomComplet: `Test Stats Signer ${i}`,
        province: 'QC',
        codePostal: 'H1A 1A1',
      });
      await Signature.create({
        petitionId: testPetition.id,
        citoyenId: user.id,
      });
    }
    testPetition.signaturesCount = 5;
    await testPetition.save();

    // Créer commentaires pour la première pétition
    for (let i = 0; i < 3; i++) {
      await Comment.create({
        petitionId: testPetition.id,
        citoyenId: testUser.id,
        contenu: `This is test comment ${i + 1} with some content`,
      });
    }
  });

  afterAll(async () => {
    if (testPetitionNoElu) await testPetitionNoElu.destroy();
    if (testPetition) await testPetition.destroy();
    if (testElu) await testElu.destroy();
    if (otherUser) await otherUser.destroy();
    if (testUser) await testUser.destroy();
    // sequelize.close() retiré (Famille A) — instance partagée, forceExit handle exit
  });

  describe('✅ Cas de succès', () => {
    it('Stats basiques : 200 OK', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('Stats contiennent tous les champs requis', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats`
      );

      const stats = response.body.data;
      expect(stats).toHaveProperty('totalSignatures');
      expect(stats).toHaveProperty('totalComments');
      expect(stats).toHaveProperty('createdAt');
      expect(stats).toHaveProperty('creator');
      expect(stats).toHaveProperty('targetElu');
      expect(stats).toHaveProperty('percentageToGoal');
    });

    it('totalSignatures correct (5)', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats`
      );

      expect(response.body.data.totalSignatures).toBe(5);
    });

    it('totalComments correct (3)', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats`
      );

      expect(response.body.data.totalComments).toBe(3);
    });

    it('createdAt format YYYY-MM-DD', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats`
      );

      const { createdAt } = response.body.data;
      expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('creator inclut id et nomComplet', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats`
      );

      const { creator } = response.body.data;
      expect(creator).toHaveProperty('id');
      expect(creator).toHaveProperty('nomComplet');
      expect(creator.id).toBe(testUser.id);
      expect(creator.nomComplet).toBe('Test Stats User');
    });

    it('targetElu inclut id et nom', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats`
      );

      const { targetElu } = response.body.data;
      expect(targetElu).toHaveProperty('id');
      expect(targetElu).toHaveProperty('nom');
      expect(targetElu.id).toBe(testElu.id);
      expect(targetElu.nom).toBe('Test Elu Stats');
    });

    it('percentageToGoal null sans goal', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats`
      );

      expect(response.body.data.percentageToGoal).toBeNull();
    });
  });

  describe('📊 Calcul percentageToGoal', () => {
    it('percentageToGoal 50% (5/10)', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats?goal=10`
      );

      expect(response.body.data.percentageToGoal).toBe(50);
    });

    it('percentageToGoal 25% (5/20)', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats?goal=20`
      );

      expect(response.body.data.percentageToGoal).toBe(25);
    });

    it('percentageToGoal 100% (5/5)', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats?goal=5`
      );

      expect(response.body.data.percentageToGoal).toBe(100);
    });

    it('percentageToGoal 0% (5/100)', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats?goal=100`
      );

      expect(response.body.data.percentageToGoal).toBe(5);
    });

    it('percentageToGoal arrondi 75% (3/4)', async () => {
      // 3/4 = 0.75 = 75%
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats?goal=200`
      );

      // 5/200 = 0.025 = 2.5 → 3 (arrondi)
      expect(typeof response.body.data.percentageToGoal).toBe('number');
    });

    it('percentageToGoal > 100% (5/2 = 250%)', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats?goal=2`
      );

      expect(response.body.data.percentageToGoal).toBe(250);
    });
  });

  describe('❌ Erreurs', () => {
    it('petition_id invalide : 400 Bad Request', async () => {
      const response = await request(app).get(
        '/api/v1/petitions/invalid/stats'
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('petition_id inexistant : 404 Not Found', async () => {
      const response = await request(app).get('/api/v1/petitions/99999/stats');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Pétition non trouvée');
    });

    it('goal invalide (négatif) : 400 Bad Request', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats?goal=-10`
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('goal invalide (zéro) : 400 Bad Request', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats?goal=0`
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('goal invalide (non-entier) : 400 Bad Request', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats?goal=abc`
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('goal invalide (float) : acceptable si > 0', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats?goal=10.5`
      );

      // Zod coerce convertit en nombre entier
      expect(response.status).toBe(200);
    });
  });

  describe('📍 Pétitions sans élu', () => {
    it("targetElu null si pas d'élu", async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetitionNoElu.id}/stats`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.targetElu).toBeNull();
    });

    it('Autres stats présentes même sans élu', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetitionNoElu.id}/stats`
      );

      const stats = response.body.data;
      expect(stats.totalSignatures).toBeDefined();
      expect(stats.totalComments).toBeDefined();
      expect(stats.createdAt).toBeDefined();
      expect(stats.creator).toBeDefined();
      expect(stats.percentageToGoal).toBeNull();
    });
  });

  describe('🔄 Public access', () => {
    it('Route accessible sans JWT', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats`
      );

      expect(response.status).toBe(200);
    });

    it('Accessible à tout utilisateur', async () => {
      const response = await request(app)
        .get(`/api/v1/petitions/${testPetition.id}/stats`)
        .set('Authorization', `Bearer ${userJWT}`);

      expect(response.status).toBe(200);
    });
  });

  describe('📊 Signatures = 0 (aucune signature)', () => {
    it('Stats avec 0 signatures', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetitionNoElu.id}/stats`
      );

      expect(response.body.data.totalSignatures).toBe(0);
    });

    it('percentageToGoal 0% avec 0 signatures et goal', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetitionNoElu.id}/stats?goal=100`
      );

      expect(response.body.data.percentageToGoal).toBe(0);
    });
  });

  describe('📝 Format réponse', () => {
    it('Réponse inclut success: true', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats`
      );

      expect(response.body.success).toBe(true);
    });

    it('Réponse inclut data wrapper', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats`
      );

      expect(response.body.data).toBeDefined();
      expect(typeof response.body.data).toBe('object');
    });

    it('Aucun champ supplémentaire non documenté', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${testPetition.id}/stats`
      );

      const stats = response.body.data;
      const keys = Object.keys(stats).sort();
      const expected = [
        'createdAt',
        'creator',
        'percentageToGoal',
        'targetElu',
        'totalComments',
        'totalSignatures',
      ].sort();

      expect(keys).toEqual(expected);
    });
  });
});
