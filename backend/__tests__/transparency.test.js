import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import sequelize from '../src/db/sequelize.js';
import app from '../src/server.js';
import Elu from '../src/models/Elu.js';
import PromiseModel from '../src/models/Promise.js';

let testElus = [];
let testPromises = [];

describe('Transparency API', () => {
  beforeAll(async () => {
    // sync alter:false — schéma déjà appliqué au boot serveur, alter:true cassait
    // sur Circonscription.elus_ids INTEGER[] (Famille A bug Phase F)
    await sequelize.sync({ alter: false });

    // Créer des élus de test avec différents niveaux
    // Bug #26 corrigé : aligné sur modèle Elu (nom seul, niveau='fédéral', titre='Conseiller')
    testElus = await Promise.all([
      Elu.create({
        nom: 'Jean Dupont',
        titre: 'Député',
        niveau: 'provincial',
        region: 'Montréal',
        email: 'jean.transparency@test.com',
      }),
      Elu.create({
        nom: 'Marie Martin',
        titre: 'Sénateur',
        niveau: 'fédéral',
        region: 'Québec',
        email: 'marie.transparency@test.com',
      }),
      Elu.create({
        nom: 'Pierre Bernard',
        titre: 'Maire',
        niveau: 'municipal',
        region: 'Toronto',
        email: 'pierre.transparency@test.com',
      }),
      Elu.create({
        nom: 'Sophie Arsenault',
        titre: 'Conseiller',
        niveau: 'municipal',
        region: 'Montréal',
        email: 'sophie.transparency@test.com',
      }),
      Elu.create({
        nom: 'Marc Zaplata',
        titre: 'Député',
        niveau: 'provincial',
        region: 'Laval',
        email: 'marc.transparency@test.com',
      }),
    ]);

    // Créer des promesses avec différents statuts pour chaque élu
    // Élu 1: 9 complétées, 1 en cours = score 95
    testPromises = await Promise.all([
      ...Array(9)
        .fill(null)
        .map(() =>
          PromiseModel.create({
            elu_id: testElus[0].id,
            titre: 'Promesse complétée',
            status: 'completee',
          })
        ),
      PromiseModel.create({
        elu_id: testElus[0].id,
        titre: 'Promesse en cours',
        status: 'en_cours',
      }),
      // Élu 2: 3 complétées, 2 abandonnées = score 60
      ...Array(3)
        .fill(null)
        .map(() =>
          PromiseModel.create({
            elu_id: testElus[1].id,
            titre: 'Promesse complétée',
            status: 'completee',
          })
        ),
      ...Array(2)
        .fill(null)
        .map(() =>
          PromiseModel.create({
            elu_id: testElus[1].id,
            titre: 'Promesse abandonnée',
            status: 'abandonnee',
          })
        ),
      // Élu 3: 2 complétées, 8 en cours = score 50
      ...Array(2)
        .fill(null)
        .map(() =>
          PromiseModel.create({
            elu_id: testElus[2].id,
            titre: 'Promesse complétée',
            status: 'completee',
          })
        ),
      ...Array(8)
        .fill(null)
        .map(() =>
          PromiseModel.create({
            elu_id: testElus[2].id,
            titre: 'Promesse en cours',
            status: 'en_cours',
          })
        ),
      // Élu 4: 0 promesses = score 0
      // Élu 5: 5 complétées, 5 en cours = score 60
      ...Array(5)
        .fill(null)
        .map(() =>
          PromiseModel.create({
            elu_id: testElus[4].id,
            titre: 'Promesse complétée',
            status: 'completee',
          })
        ),
      ...Array(5)
        .fill(null)
        .map(() =>
          PromiseModel.create({
            elu_id: testElus[4].id,
            titre: 'Promesse en cours',
            status: 'en_cours',
          })
        ),
    ]);
  });

  afterAll(async () => {
    // Bug #28 corrigé : ne pas drop ni close (instance partagée avec autres tests).
    // Nettoyage ciblé des entités créées par ce test uniquement.
    try {
      await Promise.all(testPromises.map((p) => p.destroy({ force: true })));
      await Promise.all(testElus.map((e) => e.destroy({ force: true })));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Nettoyage transparency partiel:', err.message);
    }
  });

  describe('GET /api/v1/transparency/ranking', () => {
    it('should return all elus ranked by score', async () => {
      const res = await request(app).get('/api/v1/transparency/ranking');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(5);
      expect(res.body.data.length).toBeLessThanOrEqual(10);

      // Vérifier que c'est trié par score décroissant
      for (let i = 1; i < res.body.data.length; i++) {
        expect(res.body.data[i - 1].score).toBeGreaterThanOrEqual(
          res.body.data[i].score
        );
      }
    });

    it('should filter by level (provincial)', async () => {
      const res = await request(app)
        .get('/api/v1/transparency/ranking')
        .query({ level: 'provincial' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((e) => e.niveau === 'provincial')).toBe(true);
    });

    it('should filter by level (municipal)', async () => {
      const res = await request(app)
        .get('/api/v1/transparency/ranking')
        .query({ level: 'municipal' });

      expect(res.status).toBe(200);
      expect(res.body.data.every((e) => e.niveau === 'municipal')).toBe(true);
    });

    it('should filter by level (federal)', async () => {
      const res = await request(app)
        .get('/api/v1/transparency/ranking')
        .query({ level: 'federal' });

      expect(res.status).toBe(200);
      // BD stocke 'fédéral' (avec accent), API accepte 'federal' (mapping route)
      expect(res.body.data.every((e) => e.niveau === 'fédéral')).toBe(true);
    });

    it('should paginate correctly with page and limit', async () => {
      const res = await request(app)
        .get('/api/v1/transparency/ranking')
        .query({ page: 1, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.total).toBe(5);
      expect(res.body.pagination.pages).toBe(3);
    });

    it('should handle page 2 correctly', async () => {
      const res = await request(app)
        .get('/api/v1/transparency/ranking')
        .query({ page: 2, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should sort by name when requested', async () => {
      const res = await request(app)
        .get('/api/v1/transparency/ranking')
        .query({ sort: 'name' });

      expect(res.status).toBe(200);
      expect(res.body.filter.sort).toBe('name');

      // Vérifier que c'est trié alphabétiquement
      for (let i = 1; i < res.body.data.length; i++) {
        expect(
          res.body.data[i - 1].nom.localeCompare(res.body.data[i].nom, 'fr')
        ).toBeLessThanOrEqual(0);
      }
    });

    it('should sort by score by default', async () => {
      const res = await request(app).get('/api/v1/transparency/ranking');

      expect(res.status).toBe(200);
      expect(res.body.filter.sort).toBe('score');

      // Vérifier que c'est trié par score décroissant
      for (let i = 1; i < res.body.data.length; i++) {
        expect(res.body.data[i - 1].score).toBeGreaterThanOrEqual(
          res.body.data[i].score
        );
      }
    });

    it('should validate limit is between 1 and 100', async () => {
      const res = await request(app)
        .get('/api/v1/transparency/ranking')
        .query({ limit: 200 });

      // Doit être clamped à 100
      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(100);
    });

    it('should return error for invalid level', async () => {
      const res = await request(app)
        .get('/api/v1/transparency/ranking')
        .query({ level: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return error for invalid sort', async () => {
      const res = await request(app)
        .get('/api/v1/transparency/ranking')
        .query({ sort: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return error for page out of range', async () => {
      const res = await request(app)
        .get('/api/v1/transparency/ranking')
        .query({ page: 999, limit: 10 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/transparency/top', () => {
    it('should return top 5 elus by default', async () => {
      const res = await request(app).get('/api/v1/transparency/top');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
      expect(res.body.data[0].rank).toBe(1);
    });

    it('should return top N elus when limit specified', async () => {
      const res = await request(app)
        .get('/api/v1/transparency/top')
        .query({ limit: 3 });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(3);
    });

    it('should rank elus correctly', async () => {
      const res = await request(app)
        .get('/api/v1/transparency/top')
        .query({ limit: 5 });

      // Vérifier que les ranks sont correctes
      for (let i = 0; i < res.body.data.length; i++) {
        expect(res.body.data[i].rank).toBe(i + 1);
      }

      // Vérifier que c'est trié par score
      for (let i = 1; i < res.body.data.length; i++) {
        expect(res.body.data[i - 1].score).toBeGreaterThanOrEqual(
          res.body.data[i].score
        );
      }
    });
  });

  describe('GET /api/v1/transparency/stats', () => {
    it('should return transparency statistics', async () => {
      const res = await request(app).get('/api/v1/transparency/stats');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(5);
      expect(res.body.data.average).toBeDefined();
      expect(res.body.data.median).toBeDefined();
      expect(res.body.data.min).toBeDefined();
      expect(res.body.data.max).toBeDefined();
      expect(res.body.data.distribution).toBeDefined();
    });

    it('should calculate distribution correctly', async () => {
      const res = await request(app).get('/api/v1/transparency/stats');

      expect(res.status).toBe(200);
      const dist = res.body.data.distribution;
      const total = dist.excellent + dist.bon + dist.moyen + dist.faible;
      expect(total).toBe(res.body.data.count);
    });

    it('should filter stats by level', async () => {
      const res = await request(app)
        .get('/api/v1/transparency/stats')
        .query({ level: 'municipal' });

      expect(res.status).toBe(200);
      expect(res.body.filter.level).toBe('municipal');
      expect(res.body.data.count).toBe(2); // 2 élus municipaux
    });
  });
});
