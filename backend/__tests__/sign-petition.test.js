/**
 * Tests pour la route POST /api/v1/petitions/:id/sign
 * Format de réponse: { signed: true/false, totalSignatures: 123, message? }
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

describe('POST /api/v1/petitions/:id/sign — Sign Petition', () => {
  let testUser;
  let testElu;
  let testPetition;
  let jwtToken;

  beforeAll(async () => {
    await sequelize.authenticate();
    console.log('✅ Connexion à la BD établie');

    // Créer utilisateur de test
    testUser = await User.create({
      email: 'test-sign-petition@citoyenavise.com',
      nomComplet: 'Test Sign User',
      province: 'QC',
      codePostal: 'H1A 1A1',
    });

    // Créer JWT pour l'utilisateur
    jwtToken = createJWT(testUser.id);

    // Créer élu de test
    testElu = await Elu.create({
      nom: 'Test Elu Sign',
      titre: 'Député',
      region: 'Québec',
      niveau: 'fédéral',
      email: 'test-sign-elu@parl.gc.ca',
    });

    // Créer pétition publiée
    testPetition = await Petition.create({
      titre: 'Test Petition for Signing',
      description: 'This is a test petition to verify signing response format',
      citoyenId: testUser.id,
      eluId: testElu.id,
      status: 'published',
      signaturesCount: 0,
    });
  });

  afterAll(async () => {
    if (testPetition) await testPetition.destroy();
    if (testElu) await testElu.destroy();
    if (testUser) await testUser.destroy();
    await sequelize.close();
  });

  describe('✅ Cas de succès', () => {
    it('Première signature : 201 Created avec { signed: true, totalSignatures }', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('signed');
      expect(response.body).toHaveProperty('totalSignatures');
      expect(response.body.signed).toBe(true);
      expect(response.body.totalSignatures).toBe(1);
      expect(response.body).not.toHaveProperty('success');
      expect(response.body).not.toHaveProperty('message');
    });

    it('signatures_count incrémenté à 1', async () => {
      const petition = await Petition.findByPk(testPetition.id);
      expect(petition.signaturesCount).toBe(1);
    });
  });

  describe('❌ Erreur : UNIQUE violation (409)', () => {
    it('Deuxième signature : 409 Conflict', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(409);
      expect(response.body.signed).toBe(false);
      expect(response.body.message).toBe('Vous avez déjà signé cette pétition');
    });

    it('signatures_count ne change pas (reste 1)', async () => {
      const petition = await Petition.findByPk(testPetition.id);
      expect(petition.signaturesCount).toBe(1);
    });
  });

  describe('❌ Erreur : Validation Zod', () => {
    it('petition_id invalide : 400 Bad Request', async () => {
      const response = await request(app)
        .post('/api/v1/petitions/invalid-id/sign')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(400);
      expect(response.body.signed).toBe(false);
      expect(response.body.message).toContain('invalide');
    });

    it('petition_id négatif : 400 Bad Request', async () => {
      const response = await request(app)
        .post('/api/v1/petitions/-123/sign')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(400);
      expect(response.body.signed).toBe(false);
    });

    it('petition_id zéro : 400 Bad Request', async () => {
      const response = await request(app)
        .post('/api/v1/petitions/0/sign')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(400);
      expect(response.body.signed).toBe(false);
    });
  });

  describe('❌ Erreur : Pétition n\'existe pas (404)', () => {
    it('petition_id inexistant : 404 Not Found', async () => {
      const response = await request(app)
        .post('/api/v1/petitions/99999/sign')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(404);
      expect(response.body.signed).toBe(false);
      expect(response.body.message).toBe('Pétition non trouvée');
    });
  });

  describe('❌ Erreur : Pétition not published (400)', () => {
    it('Signer pétition en draft : 400 Bad Request', async () => {
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
      expect(response.body.message).toContain('n\'est pas publiée');

      await draftPetition.destroy();
    });

    it('Signer pétition fermée : 400 Bad Request', async () => {
      const closedPetition = await Petition.create({
        titre: 'Closed Petition',
        description: 'This petition is closed',
        citoyenId: testUser.id,
        status: 'closed',
        signaturesCount: 0,
      });

      const response = await request(app)
        .post(`/api/v1/petitions/${closedPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(400);
      expect(response.body.signed).toBe(false);

      await closedPetition.destroy();
    });
  });

  describe('❌ Erreur : Authentification (401)', () => {
    it('Sans JWT : 401 Unauthorized', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`);

      expect(response.status).toBe(401);
    });

    it('JWT invalide : 401/403', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', 'Bearer invalid-token');

      expect([401, 403]).toContain(response.status);
    });

    it('Format Authorization invalide : 401', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `InvalidFormat ${jwtToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('🔒 Sécurité : citoyen_id du token', () => {
    it('citoyen_id utilisé depuis req.user.userId (not body)', async () => {
      // Essayer d'injecter un citoyen_id en body (doit être ignoré)
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ citoyenId: 9999 });

      // L'injection doit être ignorée, signature doit échouer car déjà signé
      expect(response.status).toBe(409);
      expect(response.body.signed).toBe(false);
    });
  });

  describe('🔄 Format de réponse', () => {
    it('Réponse succès a SEULEMENT { signed, totalSignatures }', async () => {
      // Créer une nouvelle pétition pour une réponse 201
      const newPetition = await Petition.create({
        titre: 'Response Format Test',
        description: 'Test response format',
        citoyenId: testUser.id,
        status: 'published',
        signaturesCount: 0,
      });

      const response = await request(app)
        .post(`/api/v1/petitions/${newPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      // Vérifier que la réponse a EXACTEMENT ces champs
      const keys = Object.keys(response.body).sort();
      expect(keys).toEqual(['signed', 'totalSignatures']);
      expect(response.body.signed).toBe(true);
      expect(typeof response.body.totalSignatures).toBe('number');

      await newPetition.destroy();
    });

    it('Réponse erreur a { signed: false, message }', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(409);
      const keys = Object.keys(response.body).sort();
      expect(keys).toEqual(['message', 'signed']);
      expect(response.body.signed).toBe(false);
      expect(typeof response.body.message).toBe('string');
    });
  });

  describe('📊 Incrément signatures_count', () => {
    it('Multiple signatures incrémente correctement', async () => {
      // Créer 3 utilisateurs et une pétition
      const users = [];
      for (let i = 0; i < 3; i++) {
        const user = await User.create({
          email: `multi-sign-user-${i}@test.com`,
          nomComplet: `Multi Sign User ${i}`,
          province: 'QC',
          codePostal: 'H1A 1A1',
        });
        users.push(user);
      }

      const multiPetition = await Petition.create({
        titre: 'Multi Signature Petition',
        description: 'Test multiple signatures',
        citoyenId: testUser.id,
        status: 'published',
        signaturesCount: 0,
      });

      let expectedCount = 0;

      for (const user of users) {
        const jwt = createJWT(user.id);
        const response = await request(app)
          .post(`/api/v1/petitions/${multiPetition.id}/sign`)
          .set('Authorization', `Bearer ${jwt}`);

        expectedCount++;
        expect(response.status).toBe(201);
        expect(response.body.totalSignatures).toBe(expectedCount);
      }

      // Vérifier dans la BD
      const petition = await Petition.findByPk(multiPetition.id);
      expect(petition.signaturesCount).toBe(3);

      // Cleanup
      await multiPetition.destroy();
      for (const user of users) {
        await user.destroy();
      }
    });
  });
});
