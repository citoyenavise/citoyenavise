import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import sequelize from '../src/config/database.js';
import app from '../src/server.js';
import { User } from '../src/models/User.js';
import { Elu } from '../src/models/Elu.js';
import { Promise as PromiseModel } from '../src/models/Promise.js';

let testUser;
let testAdminUser;
let testElu;
let testPromise;
let authToken;
let adminToken;

describe('Promises API', () => {
  beforeAll(async () => {
    // sync alter:false — schéma déjà appliqué au boot serveur (Famille A bug Phase F)
    await sequelize.sync({ alter: false });

    testUser = await User.create({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'citizen',
    });

    testAdminUser = await User.create({
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });

    testElu = await Elu.create({
      prenom: 'Jean',
      nom: 'Martin',
      titre: 'Député',
      niveau: 'provincial',
      region: 'Québec',
      email: 'jean.martin@parliament.qc.ca',
    });

    testPromise = await PromiseModel.create({
      elu_id: testElu.id,
      titre: "Investir dans l'éducation",
      description: '100M$ pour les écoles',
      status: 'engagee',
      deadline: '2027-12-31',
    });

    authToken = 'test-user-token';
    adminToken = 'test-admin-token';
  });

  afterAll(async () => {
    await sequelize.drop();
    // sequelize.close() retiré (Famille A) — instance partagée, forceExit handle exit
  });

  describe('GET /api/v1/promises returns by elu', () => {
    it('should filter promises by eluId', async () => {
      const res = await request(app)
        .get('/api/v1/promises')
        .query({ eluId: testElu.id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].elu_id).toBe(testElu.id);
    });

    it('should return empty array for non-existent eluId', async () => {
      const res = await request(app)
        .get('/api/v1/promises')
        .query({ eluId: 99999 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('should support limit and offset pagination', async () => {
      const res = await request(app)
        .get('/api/v1/promises')
        .query({ limit: 10, offset: 0 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/v1/promises/:id returns detail', () => {
    it('should return promise detail with elu information', async () => {
      const res = await request(app).get(`/api/v1/promises/${testPromise.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testPromise.id);
      expect(res.body.data.titre).toBe("Investir dans l'éducation");
      expect(res.body.data.elu).toBeDefined();
      expect(res.body.data.elu.id).toBe(testElu.id);
      expect(res.body.data.elu.nom).toBe('Martin');
    });

    it('should return 404 for non-existent promise', async () => {
      const res = await request(app).get('/api/v1/promises/99999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should include description field in detail response', async () => {
      const res = await request(app).get(`/api/v1/promises/${testPromise.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('100M$ pour les écoles');
    });
  });

  describe('POST /api/v1/promises requires admin', () => {
    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post(`/api/v1/elus/${testElu.id}/promises`)
        .send({
          titre: 'Test Promise',
          description: 'Test Description',
          status: 'engagee',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post(`/api/v1/elus/${testElu.id}/promises`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titre: 'Test Promise',
          description: 'Test Description',
          status: 'engagee',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin user to create promise', async () => {
      const res = await request(app)
        .post(`/api/v1/elus/${testElu.id}/promises`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titre: 'Admin Created Promise',
          description: 'Description',
          status: 'engagee',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/promises creates promise', () => {
    it('should create promise with valid data', async () => {
      const res = await request(app)
        .post(`/api/v1/elus/${testElu.id}/promises`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titre: 'Améliorer les transports',
          description: 'Investir dans transport en commun',
          deadline: '2028-06-30',
          status: 'engagee',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.titre).toBe('Améliorer les transports');
      expect(res.body.data.elu_id).toBe(testElu.id);
      expect(res.body.data.status).toBe('engagee');
    });

    it('should require titre field', async () => {
      const res = await request(app)
        .post(`/api/v1/elus/${testElu.id}/promises`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Missing titre',
          status: 'engagee',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should set default status to engagee', async () => {
      const res = await request(app)
        .post(`/api/v1/elus/${testElu.id}/promises`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titre: 'Promise with default status',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('engagee');
    });

    it('should accept optional description and deadline', async () => {
      const res = await request(app)
        .post(`/api/v1/elus/${testElu.id}/promises`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titre: 'Optional fields test',
          description: 'Description provided',
          deadline: '2027-12-31',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.description).toBe('Description provided');
      expect(res.body.data.deadline).toBe('2027-12-31');
    });
  });

  describe('PUT /api/v1/promises/:id updates status', () => {
    it('should update promise status', async () => {
      const res = await request(app)
        .put(`/api/v1/promises/${testPromise.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'en_cours' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('en_cours');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .put(`/api/v1/promises/${testPromise.id}/status`)
        .send({ status: 'en_cours' });

      expect(res.status).toBe(401);
    });

    it('should accept valid status values', async () => {
      const validStatuses = ['engagee', 'en_cours', 'completee', 'abandonnee'];
      const promise = await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'Test status values',
        status: 'engagee',
      });

      for (const status of validStatuses) {
        const res = await request(app)
          .put(`/api/v1/promises/${promise.id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe(status);
      }
    });

    it('should reject invalid status values', async () => {
      const res = await request(app)
        .put(`/api/v1/promises/${testPromise.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/promises/:id with completee sets completed_at', () => {
    it('should set completedAt when status changes to completee', async () => {
      const promise = await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'Promise to complete',
        status: 'engagee',
      });

      const res = await request(app)
        .put(`/api/v1/promises/${promise.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completee' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completee');
      expect(res.body.data.completedAt).toBeDefined();
      expect(new Date(res.body.data.completedAt)).toBeInstanceOf(Date);
    });

    it('should not set completedAt for other statuses', async () => {
      const promise = await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'Promise for en_cours',
        status: 'engagee',
      });

      const res = await request(app)
        .put(`/api/v1/promises/${promise.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'en_cours' });

      expect(res.status).toBe(200);
      expect(res.body.data.completedAt).toBeNull();
    });

    it('should preserve completedAt timestamp on subsequent updates', async () => {
      const promise = await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'Promise to preserve timestamp',
        status: 'engagee',
      });

      const res1 = await request(app)
        .put(`/api/v1/promises/${promise.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completee' });

      const firstCompletedAt = res1.body.data.completedAt;

      const res2 = await request(app)
        .put(`/api/v1/promises/${promise.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'abandonnee' });

      expect(res2.status).toBe(200);
    });
  });

  describe('DELETE /api/v1/promises/:id requires admin', () => {
    it('should require authentication to delete', async () => {
      const res = await request(app).delete(
        `/api/v1/promises/${testPromise.id}`
      );

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should require admin role to delete', async () => {
      const res = await request(app)
        .delete(`/api/v1/promises/${testPromise.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should delete promise as admin', async () => {
      const promise = await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'Promise to delete',
        status: 'engagee',
      });

      const res = await request(app)
        .delete(`/api/v1/promises/${promise.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app).get(`/api/v1/promises/${promise.id}`);

      expect(checkRes.status).toBe(404);
    });

    it('should return 404 when deleting non-existent promise', async () => {
      const res = await request(app)
        .delete('/api/v1/promises/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Promises filtered by status', () => {
    it('should filter by engagee status', async () => {
      const res = await request(app)
        .get('/api/v1/promises')
        .query({ status: 'engagee' });

      expect(res.status).toBe(200);
      expect(res.body.data.every((p) => p.status === 'engagee')).toBe(true);
    });

    it('should filter by en_cours status', async () => {
      await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'In progress promise',
        status: 'en_cours',
      });

      const res = await request(app)
        .get('/api/v1/promises')
        .query({ status: 'en_cours' });

      expect(res.status).toBe(200);
      expect(res.body.data.every((p) => p.status === 'en_cours')).toBe(true);
    });

    it('should filter by completee status', async () => {
      await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'Completed promise',
        status: 'completee',
        completedAt: new Date(),
      });

      const res = await request(app)
        .get('/api/v1/promises')
        .query({ status: 'completee' });

      expect(res.status).toBe(200);
      expect(res.body.data.every((p) => p.status === 'completee')).toBe(true);
    });

    it('should filter by abandonnee status', async () => {
      await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'Abandoned promise',
        status: 'abandonnee',
      });

      const res = await request(app)
        .get('/api/v1/promises')
        .query({ status: 'abandonnee' });

      expect(res.status).toBe(200);
      expect(res.body.data.every((p) => p.status === 'abandonnee')).toBe(true);
    });

    it('should return error for non-existent status filter', async () => {
      const res = await request(app)
        .get('/api/v1/promises')
        .query({ status: 'nonexistent' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should support combining status and eluId filters', async () => {
      const res = await request(app)
        .get('/api/v1/promises')
        .query({ status: 'engagee', eluId: testElu.id });

      expect(res.status).toBe(200);
      expect(
        res.body.data.every(
          (p) => p.status === 'engagee' && p.elu_id === testElu.id
        )
      ).toBe(true);
    });
  });

  describe('Deadline calculation works', () => {
    it('should store and retrieve deadline correctly', async () => {
      const deadline = '2027-12-31';
      const promise = await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'Deadline test',
        deadline,
      });

      const res = await request(app).get(`/api/v1/promises/${promise.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deadline).toBe(deadline);
    });

    it('should order promises by deadline', async () => {
      const promise1 = await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'Promise 1',
        deadline: '2025-12-31',
      });

      const promise2 = await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'Promise 2',
        deadline: '2026-12-31',
      });

      const promise3 = await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'Promise 3',
        deadline: '2027-12-31',
      });

      const res = await request(app)
        .get('/api/v1/promises')
        .query({ sort: 'deadline' });

      expect(res.status).toBe(200);
      if (res.body.data.some((p) => p.deadline)) {
        const deadlines = res.body.data
          .filter((p) => p.deadline)
          .map((p) => new Date(p.deadline).getTime());

        for (let i = 1; i < deadlines.length; i++) {
          expect(deadlines[i] >= deadlines[i - 1]).toBe(true);
        }
      }
    });

    it('should handle null deadline', async () => {
      const promise = await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'No deadline promise',
        deadline: null,
      });

      const res = await request(app).get(`/api/v1/promises/${promise.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deadline).toBeNull();
    });

    it('should allow deadline update via PUT', async () => {
      const promise = await PromiseModel.create({
        elu_id: testElu.id,
        titre: 'Update deadline test',
        deadline: '2026-12-31',
      });

      const res = await request(app)
        .put(`/api/v1/promises/${promise.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titre: 'Updated title',
          deadline: '2028-06-30',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.deadline).toBe('2028-06-30');
    });

    it('should validate deadline format', async () => {
      const res = await request(app)
        .post(`/api/v1/elus/${testElu.id}/promises`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titre: 'Invalid deadline',
          deadline: 'invalid-date',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
