/**
 * Tests d'intégration complets pour les pétitions
 * Coverage: GET list, POST sign, DELETE sign, GET stats, POST comments
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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', routes);

// ═══════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════

async function createTestUser(suffix = '') {
  return User.create({
    email: `test-user${suffix}@citoyenavise.com`,
    nomComplet: `Test User${suffix}`,
    province: 'QC',
    codePostal: 'H1A 1A1',
  });
}

async function createTestElu(suffix = '') {
  return Elu.create({
    nom: `Test Elu${suffix}`,
    titre: 'Député',
    region: 'Québec',
    niveau: 'fédéral',
    email: `elu${suffix}@parl.gc.ca`,
  });
}

async function createTestPetition(
  creator,
  elu,
  status = 'published',
  signaturesCount = 0
) {
  return Petition.create({
    titre: `Test Petition - ${Math.random()}`,
    description: 'This is a test petition with meaningful content',
    citoyenId: creator.id,
    eluId: elu.id,
    status,
    signaturesCount,
  });
}

// ═══════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════

describe("Pétitions - Suite d'intégration complète", () => {
  let user1;
  let user2;
  let user3;
  let elu1;
  let elu2;
  let petition1;
  let petition2;
  let petition3;
  let jwt1;
  let jwt2;
  let jwt3;

  beforeAll(async () => {
    await sequelize.authenticate();
    console.log('✅ Connexion BD établie');

    // Créer utilisateurs
    user1 = await createTestUser('-1');
    user2 = await createTestUser('-2');
    user3 = await createTestUser('-3');

    // Créer JWTs
    jwt1 = createJWT(user1.id);
    jwt2 = createJWT(user2.id);
    jwt3 = createJWT(user3.id);

    // Créer élus
    elu1 = await createTestElu('-1');
    elu2 = await createTestElu('-2');

    // Créer pétitions
    petition1 = await createTestPetition(user1, elu1, 'published', 10);
    petition2 = await createTestPetition(user2, elu2, 'published', 25);
    petition3 = await createTestPetition(user3, elu1, 'draft', 0);
  });

  afterAll(async () => {
    // Cleanup
    if (petition1) await petition1.destroy();
    if (petition2) await petition2.destroy();
    if (petition3) await petition3.destroy();
    if (elu1) await elu1.destroy();
    if (elu2) await elu2.destroy();
    if (user1) await user1.destroy();
    if (user2) await user2.destroy();
    if (user3) await user3.destroy();
    // sequelize.close() retiré (Famille A) — instance partagée, forceExit handle exit
  });

  // ═══════════════════════════════════════════════════════════════
  // Test 1: GET /petitions returns published
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/v1/petitions', () => {
    it('returns published petitions only', async () => {
      const response = await request(app).get('/api/v1/petitions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Vérifier que toutes les pétitions sont publiées (ou sinon filtrées)
      response.body.data.forEach((p) => {
        expect(['published', 'closed', 'won']).toContain(p.status);
      });
    });

    it('returns pagination metadata', async () => {
      const response = await request(app).get(
        '/api/v1/petitions?page=1&limit=10'
      );

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('count');
    });

    it('returns creator and elu info', async () => {
      const response = await request(app).get('/api/v1/petitions?limit=10');

      expect(response.body.data.length).toBeGreaterThan(0);
      const petition = response.body.data[0];

      expect(petition).toHaveProperty('creator');
      expect(petition.creator).toHaveProperty('id');
      expect(petition.creator).toHaveProperty('nomComplet');

      if (petition.elu) {
        expect(petition.elu).toHaveProperty('id');
        expect(petition.elu).toHaveProperty('nom');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Test 2: POST /petitions/:id/sign creates signature
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/v1/petitions/:id/sign', () => {
    it('creates signature for authenticated user', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${petition1.id}/sign`)
        .set('Authorization', `Bearer ${jwt2}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('signed');
      expect(response.body.data.signed).toBe(true);
      expect(response.body.data.totalSignatures).toBeGreaterThanOrEqual(11);
    });

    it('requires authentication', async () => {
      const response = await request(app).post(
        `/api/v1/petitions/${petition2.id}/sign`
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('returns error for invalid petition', async () => {
      const response = await request(app)
        .post('/api/v1/petitions/99999/sign')
        .set('Authorization', `Bearer ${jwt1}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Test 3: POST /petitions/:id/sign twice returns 409
  // ═══════════════════════════════════════════════════════════════
  describe('Idempotence - POST /sign twice', () => {
    it('returns 409 when already signed', async () => {
      // Premier appel : succès
      const response1 = await request(app)
        .post(`/api/v1/petitions/${petition2.id}/sign`)
        .set('Authorization', `Bearer ${jwt3}`);

      expect(response1.status).toBe(201);
      expect(response1.body.data.signed).toBe(true);
      const firstCount = response1.body.data.totalSignatures;

      // Deuxième appel : conflit (déjà signé)
      const response2 = await request(app)
        .post(`/api/v1/petitions/${petition2.id}/sign`)
        .set('Authorization', `Bearer ${jwt3}`);

      expect(response2.status).toBe(409);
      expect(response2.body.success).toBe(false);
      expect(response2.body.code).toBe('ALREADY_SIGNED');

      // Vérifier que le nombre de signatures n'a pas augmenté
      expect(response2.body.data.totalSignatures).toBe(firstCount);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Test 4: DELETE /petitions/:id/sign removes signature
  // ═══════════════════════════════════════════════════════════════
  describe('DELETE /api/v1/petitions/:id/sign', () => {
    let tempUser;
    let tempPetition;

    beforeAll(async () => {
      tempUser = await createTestUser('-temp');
      tempPetition = await createTestPetition(user1, elu1, 'published', 5);

      // Signer d'abord
      await request(app)
        .post(`/api/v1/petitions/${tempPetition.id}/sign`)
        .set('Authorization', `Bearer ${createJWT(tempUser.id)}`);
    });

    afterAll(async () => {
      if (tempPetition) await tempPetition.destroy();
      if (tempUser) await tempUser.destroy();
    });

    it('removes signature from petition', async () => {
      const countBefore = (
        await request(app).get(`/api/v1/petitions/${tempPetition.id}`)
      ).body.data.signaturesCount;

      const response = await request(app)
        .delete(`/api/v1/petitions/${tempPetition.id}/sign`)
        .set('Authorization', `Bearer ${createJWT(tempUser.id)}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.unsigned).toBe(true);
      expect(response.body.data.totalSignatures).toBeLessThan(countBefore);
    });

    it('returns 404 if not signed', async () => {
      const otherUser = await createTestUser('-other');

      const response = await request(app)
        .delete(`/api/v1/petitions/${tempPetition.id}/sign`)
        .set('Authorization', `Bearer ${createJWT(otherUser.id)}`);

      expect(response.status).toBe(404);

      await otherUser.destroy();
    });

    it('requires authentication', async () => {
      const response = await request(app).delete(
        `/api/v1/petitions/${tempPetition.id}/sign`
      );

      expect(response.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Test 5: GET /petitions/:id/stats returns count
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/v1/petitions/:id/stats', () => {
    it('returns statistics with signatures and comments', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${petition1.id}/stats`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSignatures');
      expect(response.body.data).toHaveProperty('totalComments');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('creator');
      expect(response.body.data).toHaveProperty('targetElu');
      expect(response.body.data).toHaveProperty('percentageToGoal');
    });

    it('calculates percentageToGoal with goal param', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${petition2.id}/stats?goal=50`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.percentageToGoal).toBeDefined();
      expect(typeof response.body.data.percentageToGoal).toBe('number');
      expect(response.body.data.percentageToGoal).toBeGreaterThanOrEqual(0);
    });

    it('returns null percentageToGoal without goal', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${petition1.id}/stats`
      );

      expect(response.body.data.percentageToGoal).toBeNull();
    });

    it('returns 404 for non-existent petition', async () => {
      const response = await request(app).get('/api/v1/petitions/99999/stats');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Test 6: POST /comments adds comment
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/v1/petitions/:id/comments', () => {
    it('creates comment for authenticated user', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${petition1.id}/comments`)
        .set('Authorization', `Bearer ${jwt1}`)
        .send({ contenu: 'This is a meaningful comment with substance' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Commentaire créé');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.contenu).toBe(
        'This is a meaningful comment with substance'
      );
      expect(response.body.data).toHaveProperty('author');
      expect(response.body.data.author.nomComplet).toBe(user1.nomComplet);
    });

    it('validates comment length (min 5)', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${petition1.id}/comments`)
        .set('Authorization', `Bearer ${jwt2}`)
        .send({ contenu: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('validates comment length (max 1000)', async () => {
      const longContent = 'a'.repeat(1001);
      const response = await request(app)
        .post(`/api/v1/petitions/${petition1.id}/comments`)
        .set('Authorization', `Bearer ${jwt2}`)
        .send({ contenu: longContent });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('requires authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${petition1.id}/comments`)
        .send({ contenu: 'This should fail without JWT' });

      expect(response.status).toBe(401);
    });

    it('returns 404 for non-existent petition', async () => {
      const response = await request(app)
        .post('/api/v1/petitions/99999/comments')
        .set('Authorization', `Bearer ${jwt1}`)
        .send({ contenu: 'Valid comment text here' });

      expect(response.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Test 7: GET /petitions with filters works
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/v1/petitions with filters', () => {
    it('filters by status=published', async () => {
      const response = await request(app).get(
        '/api/v1/petitions?status=published'
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((p) => {
        expect(p.status).toBe('published');
      });
    });

    it('filters by elu_id', async () => {
      const response = await request(app).get(
        `/api/v1/petitions?elu_id=${elu1.id}&status=published`
      );

      expect(response.status).toBe(200);
      response.body.data.forEach((p) => {
        expect(p.elu.id).toBe(elu1.id);
      });
    });

    it('searches by text in titre/description', async () => {
      const response = await request(app).get(
        '/api/v1/petitions?search=test&status=published'
      );

      expect(response.status).toBe(200);
      // Devrait trouver au moins petition1 et petition2 qui ont "Test Petition" dans le titre
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('sorts by signatures_count', async () => {
      const response = await request(app).get(
        '/api/v1/petitions?sort=signatures_count&status=published'
      );

      expect(response.status).toBe(200);
      expect(response.body.sort).toBe('signatures_count');

      // Vérifier que c'est trié en ordre décroissant
      for (let i = 1; i < response.body.data.length; i++) {
        expect(response.body.data[i].signaturesCount).toBeLessThanOrEqual(
          response.body.data[i - 1].signaturesCount
        );
      }
    });

    it('combines multiple filters', async () => {
      const response = await request(app).get(
        `/api/v1/petitions?elu_id=${elu1.id}&search=test&sort=signatures_count&status=published`
      );

      expect(response.status).toBe(200);
      expect(response.body.sort).toBe('signatures_count');
      response.body.data.forEach((p) => {
        expect(p.elu.id).toBe(elu1.id);
      });
    });

    it('respects pagination', async () => {
      const response1 = await request(app).get(
        '/api/v1/petitions?page=1&limit=1'
      );

      expect(response1.status).toBe(200);
      expect(response1.body.page).toBe(1);
      expect(response1.body.limit).toBe(1);
      expect(response1.body.count).toBeLessThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Test 8: Integration - Complete workflow
  // ═══════════════════════════════════════════════════════════════
  describe('Workflow complet', () => {
    let workflowUser;
    let workflowPetition;
    let workflowJWT;

    beforeAll(async () => {
      workflowUser = await createTestUser('-workflow');
      workflowPetition = await createTestPetition(user1, elu1, 'published', 0);
      workflowJWT = createJWT(workflowUser.id);
    });

    afterAll(async () => {
      if (workflowPetition) await workflowPetition.destroy();
      if (workflowUser) await workflowUser.destroy();
    });

    it('1. User signs petition', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${workflowPetition.id}/sign`)
        .set('Authorization', `Bearer ${workflowJWT}`);

      expect(response.status).toBe(201);
      expect(response.body.data.signed).toBe(true);
    });

    it('2. User adds comment', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${workflowPetition.id}/comments`)
        .set('Authorization', `Bearer ${workflowJWT}`)
        .send({ contenu: 'I support this petition initiative' });

      expect(response.status).toBe(201);
      expect(response.body.data.contenu).toBe(
        'I support this petition initiative'
      );
    });

    it('3. Stats show updated counts', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${workflowPetition.id}/stats`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.totalSignatures).toBeGreaterThan(0);
      expect(response.body.data.totalComments).toBeGreaterThan(0);
    });

    it('4. User unsigns petition', async () => {
      const response = await request(app)
        .delete(`/api/v1/petitions/${workflowPetition.id}/sign`)
        .set('Authorization', `Bearer ${workflowJWT}`);

      expect(response.status).toBe(200);
      expect(response.body.data.unsigned).toBe(true);
    });

    it('5. Signatures count decreased', async () => {
      const response = await request(app).get(
        `/api/v1/petitions/${workflowPetition.id}/stats?goal=100`
      );

      expect(response.status).toBe(200);
      // Après unsign, totalSignatures devrait être à zéro
      expect(response.body.data.totalSignatures).toBe(0);
      expect(response.body.data.percentageToGoal).toBe(0);
    });
  });
});
