/**
 * Tests pour les routes de commentaires
 * GET /api/v1/petitions/:id/comments
 * POST /api/v1/petitions/:id/comments
 * DELETE /api/v1/comments/:id
 */

import request from 'supertest';
import express from 'express';
import sequelize from '../src/db/sequelize.js';
import User from '../src/models/User.js';
import Elu from '../src/models/Elu.js';
import Petition from '../src/models/Petition.js';
import Comment from '../src/models/Comment.js';
import { createJWT } from '../src/services/auth.js';
import routes from '../src/routes/index.js';
import '../src/models/index.js';

// Créer l'app pour les tests
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', routes);

describe('Comments Routes', () => {
  let testUser;
  let otherUser;
  let testElu;
  let testPetition;
  let testComment;
  let userJWT;
  let otherUserJWT;

  beforeAll(async () => {
    await sequelize.authenticate();
    console.log('✅ Connexion à la BD établie');

    // Créer deux utilisateurs
    testUser = await User.create({
      email: 'test-comments-user@citoyenavise.com',
      nomComplet: 'Test Comments User',
      province: 'QC',
      codePostal: 'H1A 1A1',
    });

    otherUser = await User.create({
      email: 'other-comments-user@citoyenavise.com',
      nomComplet: 'Other Comments User',
      province: 'ON',
      codePostal: 'M1A 1A1',
    });

    // Créer JWT
    userJWT = createJWT(testUser.id);
    otherUserJWT = createJWT(otherUser.id);

    // Créer élu
    testElu = await Elu.create({
      nom: 'Test Elu Comments',
      titre: 'Députée',
      region: 'Québec',
      niveau: 'fédéral',
      email: 'test-comments-elu@parl.gc.ca',
    });

    // Créer pétition publiée
    testPetition = await Petition.create({
      titre: 'Test Petition for Comments',
      description: 'This is a test petition for comments',
      citoyenId: testUser.id,
      eluId: testElu.id,
      status: 'published',
      signaturesCount: 0,
    });

    // Créer un commentaire initial
    testComment = await Comment.create({
      petitionId: testPetition.id,
      citoyenId: testUser.id,
      contenu: 'This is an initial test comment with some content',
    });
  });

  afterAll(async () => {
    if (testComment) await testComment.destroy();
    if (testPetition) await testPetition.destroy();
    if (testElu) await testElu.destroy();
    if (otherUser) await otherUser.destroy();
    if (testUser) await testUser.destroy();
    await sequelize.close();
  });

  describe('GET /api/v1/petitions/:id/comments', () => {
    it('Lister les commentaires : 200 OK', async () => {
      const response = await request(app)
        .get(`/api/v1/petitions/${testPetition.id}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.petitionId).toBe(testPetition.id);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('data');
    });

    it('Commentaires incluent author info', async () => {
      const response = await request(app)
        .get(`/api/v1/petitions/${testPetition.id}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);

      const comment = response.body.data[0];
      expect(comment).toHaveProperty('id');
      expect(comment).toHaveProperty('contenu');
      expect(comment).toHaveProperty('author');
      expect(comment.author).toHaveProperty('id');
      expect(comment.author).toHaveProperty('email');
      expect(comment.author).toHaveProperty('nomComplet');
    });

    it('Pagination fonctionne', async () => {
      const response = await request(app)
        .get(`/api/v1/petitions/${testPetition.id}/comments`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
    });

    it('Pétition inexistante : 404 Not Found', async () => {
      const response = await request(app)
        .get('/api/v1/petitions/99999/comments');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Pétition non trouvée');
    });

    it('petition_id invalide : 400 Bad Request', async () => {
      const response = await request(app)
        .get('/api/v1/petitions/invalid/comments');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/petitions/:id/comments', () => {
    it('Créer un commentaire : 201 Created', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/comments`)
        .set('Authorization', `Bearer ${userJWT}`)
        .send({ contenu: 'This is a new test comment' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Commentaire créé');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.contenu).toBe('This is a new test comment');
      expect(response.body.data.citoyenId).toBe(testUser.id);
      expect(response.body.data.author).toBeDefined();
    });

    it('Sans authentification : 401 Unauthorized', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/comments`)
        .send({ contenu: 'This should fail' });

      expect(response.status).toBe(401);
    });

    it('Contenu trop court : 400 Bad Request', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/comments`)
        .set('Authorization', `Bearer ${userJWT}`)
        .send({ contenu: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('Contenu trop long : 400 Bad Request', async () => {
      const longContent = 'a'.repeat(1001);
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/comments`)
        .set('Authorization', `Bearer ${userJWT}`)
        .send({ contenu: longContent });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('Pétition inexistante : 404 Not Found', async () => {
      const response = await request(app)
        .post('/api/v1/petitions/99999/comments')
        .set('Authorization', `Bearer ${userJWT}`)
        .send({ contenu: 'This should fail' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Pétition non trouvée');
    });

    it('contenu manquant : 400 Bad Request', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/comments`)
        .set('Authorization', `Bearer ${userJWT}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/comments/:id', () => {
    let commentToDelete;

    beforeAll(async () => {
      // Créer un commentaire à supprimer
      commentToDelete = await Comment.create({
        petitionId: testPetition.id,
        citoyenId: testUser.id,
        contenu: 'This comment will be deleted',
      });
    });

    it('Supprimer son propre commentaire : 200 OK', async () => {
      const response = await request(app)
        .delete(`/api/v1/comments/${commentToDelete.id}`)
        .set('Authorization', `Bearer ${userJWT}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Commentaire supprimé');
      expect(response.body.data.id).toBe(commentToDelete.id);
    });

    it('Commentaire supprimé est absent : 404 Not Found', async () => {
      const response = await request(app)
        .delete(`/api/v1/comments/${commentToDelete.id}`)
        .set('Authorization', `Bearer ${userJWT}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('Supprimer commentaire d\'un autre : 403 Forbidden', async () => {
      // Créer un commentaire par testUser
      const otherComment = await Comment.create({
        petitionId: testPetition.id,
        citoyenId: testUser.id,
        contenu: 'This comment is by test user',
      });

      // Essayer de le supprimer avec otherUser
      const response = await request(app)
        .delete(`/api/v1/comments/${otherComment.id}`)
        .set('Authorization', `Bearer ${otherUserJWT}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FORBIDDEN_DELETE');

      // Cleanup
      await otherComment.destroy();
    });

    it('Sans authentification : 401 Unauthorized', async () => {
      const response = await request(app)
        .delete(`/api/v1/comments/${testComment.id}`);

      expect(response.status).toBe(401);
    });

    it('comment_id invalide : 400 Bad Request', async () => {
      const response = await request(app)
        .delete('/api/v1/comments/invalid')
        .set('Authorization', `Bearer ${userJWT}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('comment_id inexistant : 404 Not Found', async () => {
      const response = await request(app)
        .delete('/api/v1/comments/99999')
        .set('Authorization', `Bearer ${userJWT}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Commentaire non trouvé');
    });
  });

  describe('Validation Zod - contenu', () => {
    it('Contenu min 5 caractères', async () => {
      // 4 caractères : trop court
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/comments`)
        .set('Authorization', `Bearer ${userJWT}`)
        .send({ contenu: 'abcd' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('Contenu max 1000 caractères', async () => {
      const tooLong = 'a'.repeat(1001);
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/comments`)
        .set('Authorization', `Bearer ${userJWT}`)
        .send({ contenu: tooLong });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('Contenu exactement 5 caractères : OK', async () => {
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/comments`)
        .set('Authorization', `Bearer ${userJWT}`)
        .send({ contenu: 'abcde' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Cleanup
      if (response.body.data.id) {
        await Comment.destroy({ where: { id: response.body.data.id } });
      }
    });

    it('Contenu exactement 1000 caractères : OK', async () => {
      const maxContent = 'a'.repeat(1000);
      const response = await request(app)
        .post(`/api/v1/petitions/${testPetition.id}/comments`)
        .set('Authorization', `Bearer ${userJWT}`)
        .send({ contenu: maxContent });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Cleanup
      if (response.body.data.id) {
        await Comment.destroy({ where: { id: response.body.data.id } });
      }
    });
  });

  describe('Relations & Data Integrity', () => {
    it('Commentaire supprimé avec pétition', async () => {
      // Créer une pétition avec un commentaire
      const tempPetition = await Petition.create({
        titre: 'Temp Petition',
        description: 'Will be deleted',
        citoyenId: testUser.id,
        status: 'published',
        signaturesCount: 0,
      });

      const tempComment = await Comment.create({
        petitionId: tempPetition.id,
        citoyenId: testUser.id,
        contenu: 'This will be cascade deleted',
      });

      const commentId = tempComment.id;

      // Supprimer la pétition
      await tempPetition.destroy();

      // Vérifier que le commentaire est aussi supprimé
      const deleted = await Comment.findByPk(commentId);
      expect(deleted).toBeNull();
    });

    it('Commentaire supprimé avec utilisateur', async () => {
      // Créer un utilisateur avec un commentaire
      const tempUser = await User.create({
        email: 'temp-comment-user@test.com',
        nomComplet: 'Temp User',
        province: 'QC',
        codePostal: 'H1A 1A1',
      });

      const tempComment = await Comment.create({
        petitionId: testPetition.id,
        citoyenId: tempUser.id,
        contenu: 'Will be cascade deleted',
      });

      const commentId = tempComment.id;

      // Supprimer l'utilisateur
      await tempUser.destroy();

      // Vérifier que le commentaire est aussi supprimé
      const deleted = await Comment.findByPk(commentId);
      expect(deleted).toBeNull();
    });
  });
});
