/**
 * API Integration Tests
 * Teste les endpoints principaux avec Supertest
 */

import request from 'supertest';
import app from '../src/server.js';
import sequelize from '../src/db/sequelize.js';
import User from '../src/models/User.js';
import Elu from '../src/models/Elu.js';
import Petition from '../src/models/Petition.js';
import Signature from '../src/models/Signature.js';
import Actualite from '../src/models/Actualite.js';
import EmailVerification from '../src/models/EmailVerification.js';
import { createJWT } from '../src/services/auth.js';

describe('Citoyen Avisé API Integration Tests', () => {
  let testUser = null;
  let testElu = null;
  let testPetition = null;
  let testActualite = null;
  let validJWT = null;

  /**
   * Setup: Créer données de test
   */
  beforeAll(async () => {
    // Attendre la connexion Sequelize
    await new Promise((resolve) => {
      const checkConnection = async () => {
        try {
          await sequelize.authenticate();
          resolve();
        } catch (err) {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });

    try {
      // Créer un utilisateur de test
      testUser = await User.create({
        email: `test-${Date.now()}@citoyenavise.com`,
        nomComplet: 'Test User',
        province: 'QC',
        codePostal: 'H1A 1A1',
        verifiedAt: new Date(),
      });

      // Créer un JWT valide
      validJWT = createJWT(testUser.id);

      // Créer un élu de test
      testElu = await Elu.create({
        nom: 'Test Elu',
        titre: 'Député',
        region: 'Quebec',
        niveau: 'fédéral',
        email: 'test-elu@example.com',
      });

      // Créer une actualité publiée de test
      testActualite = await Actualite.create({
        titre: 'Actualité de test publiée',
        contenu:
          "Contenu de l'actualité de test pour vérifier que seules les publiées sont affichées.",
        authorId: testUser.id,
        status: 'published',
        publishedAt: new Date(),
      });

      // Créer une actualité brouillon (ne doit pas apparaître dans la liste)
      await Actualite.create({
        titre: 'Actualité de test brouillon',
        contenu:
          'Cette actualité est en brouillon et ne doit pas être affichée.',
        authorId: testUser.id,
        status: 'draft',
      });

      // Créer une pétition publiée de test
      testPetition = await Petition.create({
        titre: 'Pétition de test',
        description:
          'Description de la pétition de test pour les signatures idempotentes.',
        citoyenId: testUser.id,
        eluId: testElu.id,
        status: 'published',
        signaturesCount: 0,
      });
    } catch (err) {
      console.error('Setup error:', err);
      throw err;
    }
  }, 30000);

  /**
   * Cleanup: Supprimer données de test
   */
  afterAll(async () => {
    try {
      // Supprimer les données de test (les relations sont gérées par CASCADE)
      if (testPetition) {
        await Petition.destroy({ where: { id: testPetition.id } });
      }
      if (testActualite) {
        await Actualite.destroy({ where: { id: testActualite.id } });
      }
      if (testElu) {
        await Elu.destroy({ where: { id: testElu.id } });
      }
      if (testUser) {
        await User.destroy({ where: { id: testUser.id } });
      }

      // Fermer la connexion
      await sequelize.close();
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  }, 10000);

  // ════════════════════════════════════════════════════════════════
  // TEST 1: GET /api/v1/elus returns list
  // ════════════════════════════════════════════════════════════════
  describe('GET /api/v1/elus', () => {
    test('should return list of elus with 200 status', async () => {
      const response = await request(app)
        .get('/api/v1/elus')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);

      // Vérifier qu'au moins notre élu de test est présent
      const eluIds = response.body.data.map((e) => e.id);
      expect(eluIds).toContain(testElu.id);
    });

    test('should return elu details with all required fields', async () => {
      const response = await request(app).get('/api/v1/elus').expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);

      const elu = response.body.data[0];
      expect(elu).toHaveProperty('id');
      expect(elu).toHaveProperty('nom');
      expect(elu).toHaveProperty('titre');
      expect(elu).toHaveProperty('region');
      expect(elu).toHaveProperty('niveau');
    });

    test('should support pagination with limit and offset', async () => {
      const response = await request(app)
        .get('/api/v1/elus?limit=1&offset=0')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // TEST 2: GET /api/v1/actualites returns published only
  // ════════════════════════════════════════════════════════════════
  describe('GET /api/v1/actualites', () => {
    test('should return list of published actualites only', async () => {
      const response = await request(app)
        .get('/api/v1/actualites')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);

      // Vérifier que toutes les actualités sont publiées
      for (const actualite of response.body.data) {
        expect(actualite.status).toBe('published');
      }

      // Vérifier que notre actualité publiée est présente
      const actualiteIds = response.body.data.map((a) => a.id);
      expect(actualiteIds).toContain(testActualite.id);
    });

    test('should not return draft actualites', async () => {
      const response = await request(app).get('/api/v1/actualites').expect(200);

      const statuses = response.body.data.map((a) => a.status);
      expect(statuses).not.toContain('draft');
    });

    test('should include author information', async () => {
      const response = await request(app).get('/api/v1/actualites').expect(200);

      if (response.body.data.length > 0) {
        const actualite = response.body.data[0];
        expect(actualite).toHaveProperty('author');
        expect(actualite.author).toHaveProperty('id');
        expect(actualite.author).toHaveProperty('email');
      }
    });
  });

  // ════════════════════════════════════════════════════════════════
  // TEST 3: POST /api/v1/auth/magic-link creates token
  // ════════════════════════════════════════════════════════════════
  describe('POST /api/v1/auth/magic-link', () => {
    test('should create email verification token', async () => {
      const testEmail = `magiclink-${Date.now()}@citoyenavise.com`;

      const response = await request(app)
        .post('/api/v1/auth/magic-link')
        .send({ email: testEmail })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('email', testEmail);
      expect(response.body).toHaveProperty('expiresIn', 900); // 15 minutes
    });

    test('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/magic-link')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    test('should handle missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/magic-link')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  // ════════════════════════════════════════════════════════════════
  // TEST 4: POST /api/v1/petitions/:id/sign prevents duplicate (409)
  // ════════════════════════════════════════════════════════════════
  describe('POST /api/v1/petitions/:id/sign - Idempotency', () => {
    test('should allow first signature with 201 status', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${validJWT}`)
        .expect(201)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Pétition signée');
      expect(response.body.data).toHaveProperty('petitionId', testPetition.id);
      expect(response.body.data).toHaveProperty('citoyenId', testUser.id);
    });

    test('should prevent duplicate signature with 409 status', async () => {
      // Première signature
      await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${validJWT}`)
        .expect(201);

      // Deuxième signature (même utilisateur) - doit retourner 409
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`)
        .set('Authorization', `Bearer ${validJWT}`)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        'Vous avez déjà signé cette pétition'
      );
      expect(response.body).toHaveProperty('code', 'DUPLICATE_SIGNATURE');
    });

    test('should reject signature on unpublished petition', async () => {
      // Créer une pétition non publiée
      const draftPetition = await Petition.create({
        titre: 'Pétition brouillon',
        description: "Une pétition qui n'est pas encore publiée",
        citoyenId: testUser.id,
        status: 'draft',
      });

      const response = await request(app)
        .post(`/api/v1/petitions/${draftPetition.id}/sign`)
        .set('Authorization', `Bearer ${validJWT}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain("n'est pas publiée");

      // Cleanup
      await Petition.destroy({ where: { id: draftPetition.id } });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // TEST 5: Protected route rejects no JWT
  // ════════════════════════════════════════════════════════════════
  describe('Protected Routes - JWT Validation', () => {
    test('should reject POST /api/v1/petitions without JWT', async () => {
      const response = await request(app)
        .post('/api/v1/petitions')
        .send({
          titre: 'Test petition',
          description:
            'Test description for the petition to ensure validation works correctly',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Token manquant');
      expect(response.body).toHaveProperty('message');
    });

    test('should reject POST /api/v1/petitions/:id/sign without JWT', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/sign`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Token manquant');
    });

    test('should reject with invalid JWT format', async () => {
      const response = await request(app)
        .post('/api/v1/petitions')
        .set('Authorization', 'InvalidFormat')
        .send({
          titre: 'Test petition',
          description:
            'Test description for the petition to ensure validation works correctly',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        "Format d'authentification invalide"
      );
    });

    test('should reject with invalid JWT signature', async () => {
      const invalidJWT =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5OX0.invalid-signature';

      const response = await request(app)
        .post('/api/v1/petitions')
        .set('Authorization', `Bearer ${invalidJWT}`)
        .send({
          titre: 'Test petition',
          description:
            'Test description for the petition to ensure validation works correctly',
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Signature invalide');
    });

    test('should accept valid JWT and allow protected action', async () => {
      const response = await request(app)
        .post('/api/v1/petitions')
        .set('Authorization', `Bearer ${validJWT}`)
        .send({
          titre: 'Test Petition for Protected Route',
          description:
            'This is a complete description for testing protected routes with valid JWT authentication tokens.',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Pétition créée');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status', 'draft');

      // Cleanup
      await Petition.destroy({ where: { id: response.body.data.id } });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // TEST 6: Additional coverage tests
  // ════════════════════════════════════════════════════════════════
  describe('Additional Coverage Tests', () => {
    test('GET /api/v1/elus/:id should return single elu', async () => {
      const response = await request(app)
        .get(`/api/v1/elus/${testElu.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testElu.id);
      expect(response.body.data).toHaveProperty('nom', 'Test Elu');
    });

    test('GET /api/v1/elus/:id should return 404 for non-existent elu', async () => {
      const response = await request(app).get('/api/v1/elus/99999').expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Élu non trouvé');
    });

    test('GET /api/v1/actualites/:id should return single actualite', async () => {
      const response = await request(app)
        .get(`/api/v1/actualites/${testActualite.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testActualite.id);
      expect(response.body.data.status).toBe('published');
    });

    test('GET /api/v1/petitions should return published petitions only', async () => {
      const response = await request(app).get('/api/v1/petitions').expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      for (const petition of response.body.data) {
        expect(petition.status).toBe('published');
      }
    });

    test('GET /health endpoint should be available', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('POST /api/v1/auth/logout should require JWT', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('POST /api/v1/auth/logout should accept valid JWT', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${validJWT}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });
});
