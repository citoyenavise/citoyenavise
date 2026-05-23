/**
 * Tests pour les signatures (idempotence)
 * Vérifie que la contrainte UNIQUE sur (petition_id, citoyen_id) fonctionne
 */

import request from 'supertest';
import express from 'express';
import sequelize from '../src/db/sequelize.js';
import User from '../src/models/User.js';
import Elu from '../src/models/Elu.js';
import Petition from '../src/models/Petition.js';
import Signature from '../src/models/Signature.js';
import { createJWT } from '../src/services/auth.js';
import routes from '../src/routes/index.js';
import '../src/models/index.js';

// Créer l'app pour les tests sans démarrer le serveur
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', routes);

describe('Signatures - Idempotence & UNIQUE Constraint', () => {
  let testUser;
  let testElu;
  let testPetition;
  let jwtToken;

  beforeAll(async () => {
    // Vérifier la connexion à la BD
    await sequelize.authenticate();
    console.log('✅ Connexion à la BD établie');

    // Créer utilisateur de test
    testUser = await User.create({
      email: 'test-signature@citoyenavise.com',
      nomComplet: 'Test Signature User',
      province: 'QC',
      codePostal: 'H1A 1A1',
    });

    // Créer JWT pour l'utilisateur
    jwtToken = createJWT(testUser.id);

    // Créer élu de test
    testElu = await Elu.create({
      nom: 'Test Elu',
      titre: 'Député',
      region: 'Québec',
      niveau: 'fédéral',
      email: 'test-elu@parl.gc.ca',
    });

    // Créer pétition publiée
    testPetition = await Petition.create({
      titre: 'Test Petition for Signatures',
      description: 'This is a test petition to verify idempotent signatures',
      citoyenId: testUser.id,
      eluId: testElu.id,
      status: 'published',
      signaturesCount: 0,
    });
  });

  afterAll(async () => {
    // Nettoyer les données de test
    if (testPetition) await testPetition.destroy();
    if (testElu) await testElu.destroy();
    if (testUser) await testUser.destroy();
    // sequelize.close() retiré (Famille A) — instance partagée, forceExit handle exit
  });

  describe('POST /api/v1/petitions/:id/sign', () => {
    it('Première signature : 201 Created', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(201);
      expect(response.body.signed).toBe(true);
      expect(response.body.totalSignatures).toBe(1);
    });

    it('Signature count incrémenté', async () => {
      const petition = await Petition.findByPk(testPetition.id);
      expect(petition.signaturesCount).toBe(1);
    });

    it('Deuxième signature du même utilisateur : 409 Conflict', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(409);
      expect(response.body.signed).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('Signature count pas changé après doublon', async () => {
      const petition = await Petition.findByPk(testPetition.id);
      expect(petition.signaturesCount).toBe(1);
    });
  });

  describe('Vérification BD directe', () => {
    it('Une seule signature en BD pour cette pétition', async () => {
      const signatures = await Signature.findAll({
        where: {
          petitionId: testPetition.id,
          citoyenId: testUser.id,
        },
      });

      expect(signatures.length).toBe(1);
    });

    it('Tentative de création directe via Sequelize échoue', async () => {
      try {
        await Signature.create({
          petitionId: testPetition.id,
          citoyenId: testUser.id,
        });
        fail('Should have thrown a UNIQUE constraint error');
      } catch (err) {
        // UNIQUE constraint devrait générer une erreur
        expect(
          err.name === 'SequelizeUniqueConstraintError' ||
            err.name === 'UniqueConstraintError' ||
            err.message.includes('duplicate')
        ).toBe(true);
      }
    });
  });

  describe('DELETE /api/v1/petitions/:id/sign', () => {
    it('Retirer sa signature : 200 OK', async () => {
      const response = await request(app)
        .delete(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.unsigned).toBe(true);
      expect(response.body.totalSignatures).toBe(0);
    });

    it('Signature count décrémenté', async () => {
      const petition = await Petition.findByPk(testPetition.id);
      expect(petition.signaturesCount).toBe(0);
    });

    it('Après retrait, peut signer à nouveau : 201 Created', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(201);
      expect(response.body.signed).toBe(true);
    });

    it('Signature count back to 1', async () => {
      const petition = await Petition.findByPk(testPetition.id);
      expect(petition.signaturesCount).toBe(1);
    });
  });

  describe('Erreurs communes', () => {
    it('Signer sans authentification : 401 Unauthorized', async () => {
      const response = await request(app).post(
        `/api/v1/petitions/${testPetition.id}/sign`
      );

      expect(response.status).toBe(401);
    });

    it('Signer pétition non publiée : 400 Bad Request', async () => {
      // Créer pétition en draft
      const draftPetition = await Petition.create({
        titre: 'Draft Petition',
        description: 'This petition is in draft status',
        citoyenId: testUser.id,
        status: 'draft',
        signaturesCount: 0,
      });

      const response = await request(app)
        .post(`/api/v1/petitions/${draftPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(400);
      expect(response.body.signed).toBe(false);

      await draftPetition.destroy();
    });

    it('Signer pétition inexistante : 404 Not Found', async () => {
      const response = await request(app)
        .post('/api/v1/petitions/99999/sign')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(404);
      expect(response.body.signed).toBe(false);
    });
  });
});
