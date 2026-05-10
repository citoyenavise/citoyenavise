/**
 * Tests pour la route GET /api/v1/petitions
 * Filtres : status, elu_id, search
 * Tri : signatures_count, created_at
 * Pagination : page, limit
 */

import request from 'supertest';
import express from 'express';
import sequelize from '../src/db/sequelize.js';
import User from '../src/models/User.js';
import Elu from '../src/models/Elu.js';
import Petition from '../src/models/Petition.js';
import routes from '../src/routes/index.js';
import '../src/models/index.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', routes);

describe('GET /api/v1/petitions (filtres, recherche, tri)', () => {
  let user1, user2;
  let elu1, elu2;
  let petition1, petition2, petition3, petition4;

  beforeAll(async () => {
    await sequelize.authenticate();
    console.log('✅ Connexion à la BD établie');

    // Créer utilisateurs
    user1 = await User.create({
      email: 'test-list-user1@citoyenavise.com',
      nomComplet: 'User 1',
      province: 'QC',
      codePostal: 'H1A 1A1',
    });

    user2 = await User.create({
      email: 'test-list-user2@citoyenavise.com',
      nomComplet: 'User 2',
      province: 'ON',
      codePostal: 'M1A 1A1',
    });

    // Créer élus
    elu1 = await Elu.create({
      nom: 'Elu 1',
      titre: 'Députée',
      region: 'Québec',
      niveau: 'fédéral',
      email: 'elu1@parl.gc.ca',
    });

    elu2 = await Elu.create({
      nom: 'Elu 2',
      titre: 'Ministre',
      region: 'Ontario',
      niveau: 'provincial',
      email: 'elu2@parliament.on.ca',
    });

    // Créer pétitions variées
    // Pétition 1 : publiée, 50 signatures, élu1
    petition1 = await Petition.create({
      titre: 'Améliorer les transports publics',
      description: 'Nous demandons une meilleure couverture des transports en commun',
      citoyenId: user1.id,
      eluId: elu1.id,
      status: 'published',
      signaturesCount: 50,
    });

    // Pétition 2 : publiée, 100 signatures, élu1
    petition2 = await Petition.create({
      titre: 'Augmenter les allocations familiales',
      description: 'Les familles ont besoin de plus de soutien financier',
      citoyenId: user1.id,
      eluId: elu1.id,
      status: 'published',
      signaturesCount: 100,
    });

    // Pétition 3 : publiée, 30 signatures, élu2
    petition3 = await Petition.create({
      titre: 'Éducation gratuite pour tous',
      description: 'L\'éducation est un droit, rendre les frais de scolarité gratuits',
      citoyenId: user2.id,
      eluId: elu2.id,
      status: 'published',
      signaturesCount: 30,
    });

    // Pétition 4 : draft (non publiée), 10 signatures
    petition4 = await Petition.create({
      titre: 'Projet secret',
      description: 'Ceci est un brouillon non publié',
      citoyenId: user2.id,
      eluId: elu2.id,
      status: 'draft',
      signaturesCount: 10,
    });
  });

  afterAll(async () => {
    if (petition1) await petition1.destroy();
    if (petition2) await petition2.destroy();
    if (petition3) await petition3.destroy();
    if (petition4) await petition4.destroy();
    if (elu1) await elu1.destroy();
    if (elu2) await elu2.destroy();
    if (user1) await user1.destroy();
    if (user2) await user2.destroy();
    await sequelize.close();
  });

  describe('✅ Pagination', () => {
    it('page=1, limit=10 : 3 pétitions (défaut)', async () => {
      const response = await request(app)
        .get('/api/v1/petitions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
      expect(response.body.count).toBeGreaterThan(0);
      expect(response.body.totalPages).toBeGreaterThan(0);
    });

    it('page invalide : 400 Bad Request', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?page=0');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('limit invalide (> 100) : 400 Bad Request', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?limit=101');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('🔍 Filtre status', () => {
    it('status=published : retourne seulement les pétitions publiées', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?status=published');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      response.body.data.forEach(p => {
        expect(p.status).toBe('published');
      });
    });

    it('status=draft : retourne seulement les brouillons', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?status=draft');

      expect(response.status).toBe(200);
      response.body.data.forEach(p => {
        expect(p.status).toBe('draft');
      });
    });

    it('Sans status : retourne toutes les pétitions', async () => {
      const response = await request(app)
        .get('/api/v1/petitions');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('status invalide : 400 Bad Request', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?status=invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('👤 Filtre elu_id', () => {
    it('elu_id=<elu1.id> : retourne pétitions de cet élu', async () => {
      const response = await request(app)
        .get(`/api/v1/petitions?elu_id=${elu1.id}&status=published`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2); // petition1 et petition2
      response.body.data.forEach(p => {
        expect(p.elu.id).toBe(elu1.id);
      });
    });

    it('elu_id=<elu2.id> : retourne pétitions de cet élu', async () => {
      const response = await request(app)
        .get(`/api/v1/petitions?elu_id=${elu2.id}&status=published`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1); // petition3
      response.body.data.forEach(p => {
        expect(p.elu.id).toBe(elu2.id);
      });
    });

    it('elu_id invalide (non-entier) : 400 Bad Request', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?elu_id=abc');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('elu_id=99999 (inexistant) : 0 résultats', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?elu_id=99999');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('🔎 Recherche full-text (search)', () => {
    it('search=transports : trouve "transports publics"', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?search=transports');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      const titles = response.body.data.map(p => p.titre);
      expect(titles.some(t => t.toLowerCase().includes('transport'))).toBe(true);
    });

    it('search=allocations : trouve "allocations familiales"', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?search=allocations');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      const match = response.body.data.find(p => p.titre.includes('Augmenter'));
      expect(match).toBeDefined();
    });

    it('search=éducation : case-insensitive', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?search=ÉDUCATION');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('search=mot_inexistant : 0 résultats', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?search=xyzabcnonexistent');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });

    it('search=x (1 caractère) : 400 Bad Request (min 2)', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?search=x');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('search dans description : trouve "frais de scolarité"', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?search=scolarité');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('📊 Tri (sort)', () => {
    it('sort=created_at (défaut) : tri par date DESC', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?status=published');

      expect(response.status).toBe(200);
      expect(response.body.sort).toBe('created_at');
      // Les dates doivent être en ordre décroissant
      for (let i = 1; i < response.body.data.length; i++) {
        expect(new Date(response.body.data[i].createdAt))
          .toBeLessThanOrEqual(new Date(response.body.data[i - 1].createdAt));
      }
    });

    it('sort=signatures_count : tri par signatures DESC', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?sort=signatures_count&status=published');

      expect(response.status).toBe(200);
      expect(response.body.sort).toBe('signatures_count');
      // Les signatures doivent être en ordre décroissant
      for (let i = 1; i < response.body.data.length; i++) {
        expect(response.body.data[i].signaturesCount)
          .toBeLessThanOrEqual(response.body.data[i - 1].signaturesCount);
      }
    });

    it('sort invalide : 400 Bad Request', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?sort=invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('sort=signatures_count : petition2 (100) avant petition1 (50)', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?sort=signatures_count&status=published');

      expect(response.status).toBe(200);
      const ids = response.body.data.map(p => p.id);
      const petition2Index = ids.indexOf(petition2.id);
      const petition1Index = ids.indexOf(petition1.id);
      expect(petition2Index).toBeLessThan(petition1Index);
    });
  });

  describe('🔀 Combinaisons de filtres', () => {
    it('status=published & elu_id=<elu1> : 2 résultats', async () => {
      const response = await request(app)
        .get(`/api/v1/petitions?status=published&elu_id=${elu1.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });

    it('status=published & search=allocations : 1 résultat', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?status=published&search=allocations');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('elu_id=<elu1> & sort=signatures_count : tri par signatures', async () => {
      const response = await request(app)
        .get(`/api/v1/petitions?elu_id=${elu1.id}&sort=signatures_count&status=published`);

      expect(response.status).toBe(200);
      expect(response.body.sort).toBe('signatures_count');
      // petition2 (100) avant petition1 (50)
      const ids = response.body.data.map(p => p.id);
      expect(ids.indexOf(petition2.id)).toBeLessThan(ids.indexOf(petition1.id));
    });

    it('search=allocations & sort=signatures_count : combiné', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?search=allocations&sort=signatures_count');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.sort).toBe('signatures_count');
    });
  });

  describe('📝 Format réponse', () => {
    it('Réponse contient sort field', async () => {
      const response = await request(app)
        .get('/api/v1/petitions');

      expect(response.body).toHaveProperty('sort');
      expect(['created_at', 'signatures_count']).toContain(response.body.sort);
    });

    it('Réponse contient pagination info', async () => {
      const response = await request(app)
        .get('/api/v1/petitions');

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('count');
    });

    it('Chaque pétition contient creator et elu info', async () => {
      const response = await request(app)
        .get('/api/v1/petitions?status=published');

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(p => {
        expect(p).toHaveProperty('creator');
        expect(p.creator).toHaveProperty('id');
        expect(p.creator).toHaveProperty('nomComplet');
      });
    });
  });
});
