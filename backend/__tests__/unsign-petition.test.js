/**
 * Tests pour la route DELETE /api/v1/petitions/:id/sign
 * Format de réponse: { unsigned: true/false, totalSignatures: 122, message? }
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

describe('DELETE /api/v1/petitions/:id/sign — Unsign Petition', () => {
  let testUser;
  let testElu;
  let testPetition;
  let jwtToken;

  beforeAll(async () => {
    await sequelize.authenticate();
    console.log('✅ Connexion à la BD établie');

    // Créer utilisateur de test
    testUser = await User.create({
      email: 'test-unsign-petition@citoyenavise.com',
      nomComplet: 'Test Unsign User',
      province: 'QC',
      codePostal: 'H1A 1A1',
    });

    // Créer JWT pour l'utilisateur
    jwtToken = createJWT(testUser.id);

    // Créer élu de test
    testElu = await Elu.create({
      nom: 'Test Elu Unsign',
      titre: 'Député',
      region: 'Québec',
      niveau: 'fédéral',
      email: 'test-unsign-elu@parl.gc.ca',
    });

    // Créer pétition publiée
    testPetition = await Petition.create({
      titre: 'Test Petition for Unsigned',
      description: 'This is a test petition to verify unsigned response format',
      citoyenId: testUser.id,
      eluId: testElu.id,
      status: 'published',
      signaturesCount: 0,
    });

    // Créer une signature initiale pour avoir quelque chose à retirer
    await Signature.create({
      petitionId: testPetition.id,
      citoyenId: testUser.id,
    });
    testPetition.signaturesCount = 1;
    await testPetition.save();
  });

  afterAll(async () => {
    if (testPetition) await testPetition.destroy();
    if (testElu) await testElu.destroy();
    if (testUser) await testUser.destroy();
    // sequelize.close() retiré (Famille A) — instance partagée, forceExit handle exit
  });

  describe('✅ Cas de succès', () => {
    it('Retirer signature : 200 OK avec { unsigned: true, totalSignatures }', async () => {
      const response = await request(app)
        .delete(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('unsigned');
      expect(response.body).toHaveProperty('totalSignatures');
      expect(response.body.unsigned).toBe(true);
      expect(response.body.totalSignatures).toBe(0);
      expect(response.body).not.toHaveProperty('success');
      expect(response.body).not.toHaveProperty('message');
    });

    it('signatures_count décrémenté à 0', async () => {
      const petition = await Petition.findByPk(testPetition.id);
      expect(petition.signaturesCount).toBe(0);
    });
  });

  describe("❌ Erreur : Signature n'existe pas (404)", () => {
    it('Retirer signature inexistante : 404 Not Found', async () => {
      // L'utilisateur a déjà retiré sa signature dans le test précédent
      const response = await request(app)
        .delete(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(404);
      expect(response.body.unsigned).toBe(false);
      expect(response.body.message).toBe(
        "Vous n'aviez pas signé cette pétition"
      );
    });

    it('signatures_count inchangé', async () => {
      const petition = await Petition.findByPk(testPetition.id);
      expect(petition.signaturesCount).toBe(0);
    });
  });

  describe('❌ Erreur : Validation Zod', () => {
    it('petition_id invalide : 400 Bad Request', async () => {
      const response = await request(app)
        .delete('/api/v1/petitions/invalid-id/sign')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(400);
      expect(response.body.unsigned).toBe(false);
      expect(response.body.message).toContain('invalide');
    });

    it('petition_id négatif : 400 Bad Request', async () => {
      const response = await request(app)
        .delete('/api/v1/petitions/-123/sign')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(400);
      expect(response.body.unsigned).toBe(false);
    });

    it('petition_id zéro : 400 Bad Request', async () => {
      const response = await request(app)
        .delete('/api/v1/petitions/0/sign')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(400);
      expect(response.body.unsigned).toBe(false);
    });
  });

  describe('❌ Erreur : Pétition inexistante (404)', () => {
    it('petition_id inexistant : 404 Not Found', async () => {
      const response = await request(app)
        .delete('/api/v1/petitions/99999/sign')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(404);
      expect(response.body.unsigned).toBe(false);
      expect(response.body.message).toBe('Pétition non trouvée');
    });
  });

  describe('❌ Erreur : Authentification (401)', () => {
    it('Sans JWT : 401 Unauthorized', async () => {
      const response = await request(app).delete(
        `/api/v1/petitions/${testPetition.id}/sign`
      );

      expect(response.status).toBe(401);
    });

    it('JWT invalide : 401/403', async () => {
      const response = await request(app)
        .delete(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', 'Bearer invalid-token');

      expect([401, 403]).toContain(response.status);
    });

    it('Format Authorization invalide : 401', async () => {
      const response = await request(app)
        .delete(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `InvalidFormat ${jwtToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('🔒 Sécurité : citoyen_id du token', () => {
    it('citoyen_id utilisé depuis req.user.userId (not body)', async () => {
      // Créer une nouvelle signature
      const newSig = await Signature.create({
        petitionId: testPetition.id,
        citoyenId: testUser.id,
      });
      testPetition.signaturesCount = 1;
      await testPetition.save();

      // Essayer d'injecter un citoyen_id en body (doit être ignoré)
      const response = await request(app)
        .delete(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ citoyenId: 9999 });

      // Signature doit être retirée avec req.user.userId, pas body
      expect(response.status).toBe(200);
      expect(response.body.unsigned).toBe(true);
      expect(response.body.totalSignatures).toBe(0);
    });
  });

  describe('🔄 Format de réponse', () => {
    it('Réponse succès a SEULEMENT { unsigned, totalSignatures }', async () => {
      // Créer une nouvelle pétition avec signature
      const newPetition = await Petition.create({
        titre: 'Response Format Test',
        description: 'Test response format',
        citoyenId: testUser.id,
        status: 'published',
        signaturesCount: 0,
      });

      await Signature.create({
        petitionId: newPetition.id,
        citoyenId: testUser.id,
      });
      newPetition.signaturesCount = 1;
      await newPetition.save();

      const response = await request(app)
        .delete(`/api/v1/petitions/${newPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      // Vérifier que la réponse a EXACTEMENT ces champs
      const keys = Object.keys(response.body).sort();
      expect(keys).toEqual(['totalSignatures', 'unsigned']);
      expect(response.body.unsigned).toBe(true);
      expect(typeof response.body.totalSignatures).toBe('number');

      await newPetition.destroy();
    });

    it('Réponse erreur a { unsigned: false, message }', async () => {
      const response = await request(app)
        .delete(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(404);
      const keys = Object.keys(response.body).sort();
      expect(keys).toEqual(['message', 'unsigned']);
      expect(response.body.unsigned).toBe(false);
      expect(typeof response.body.message).toBe('string');
    });
  });

  describe('📊 Décrément signatures_count', () => {
    it('Multiple users unsign décrémente correctement', async () => {
      // Créer 3 utilisateurs et une pétition
      const users = [];
      for (let i = 0; i < 3; i++) {
        const user = await User.create({
          email: `multi-unsign-user-${i}@test.com`,
          nomComplet: `Multi Unsign User ${i}`,
          province: 'QC',
          codePostal: 'H1A 1A1',
        });
        users.push(user);
      }

      const multiPetition = await Petition.create({
        titre: 'Multi Unsign Petition',
        description: 'Test multiple unsigned',
        citoyenId: testUser.id,
        status: 'published',
        signaturesCount: 0,
      });

      // Créer 3 signatures
      for (const user of users) {
        await Signature.create({
          petitionId: multiPetition.id,
          citoyenId: user.id,
        });
      }
      multiPetition.signaturesCount = 3;
      await multiPetition.save();

      // Retirer les signatures une par une
      let expectedCount = 3;

      for (const user of users) {
        const jwt = createJWT(user.id);
        const response = await request(app)
          .delete(`/api/v1/petitions/${multiPetition.id}/sign`)
          .set('Authorization', `Bearer ${jwt}`);

        expectedCount--;
        expect(response.status).toBe(200);
        expect(response.body.totalSignatures).toBe(expectedCount);
      }

      // Vérifier dans la BD
      const petition = await Petition.findByPk(multiPetition.id);
      expect(petition.signaturesCount).toBe(0);

      // Cleanup
      await multiPetition.destroy();
      for (const user of users) {
        await user.destroy();
      }
    });
  });

  describe('🔄 Sign/Unsign Cycle', () => {
    it('Peut re-signer après unsign', async () => {
      // Créer pétition et signer
      const cyclePetition = await Petition.create({
        titre: 'Cycle Petition',
        description: 'Test sign/unsign cycle',
        citoyenId: testUser.id,
        status: 'published',
        signaturesCount: 0,
      });

      // 1. Signer
      const signResponse = await request(app)
        .post(`/api/v1/petitions/${cyclePetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(signResponse.status).toBe(201);
      expect(signResponse.body.signed).toBe(true);
      expect(signResponse.body.totalSignatures).toBe(1);

      // 2. Unsign
      const unsignResponse = await request(app)
        .delete(`/api/v1/petitions/${cyclePetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(unsignResponse.status).toBe(200);
      expect(unsignResponse.body.unsigned).toBe(true);
      expect(unsignResponse.body.totalSignatures).toBe(0);

      // 3. Re-sign
      const resignResponse = await request(app)
        .post(`/api/v1/petitions/${cyclePetition.id}/sign`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(resignResponse.status).toBe(201);
      expect(resignResponse.body.signed).toBe(true);
      expect(resignResponse.body.totalSignatures).toBe(1);

      await cyclePetition.destroy();
    });
  });
});
