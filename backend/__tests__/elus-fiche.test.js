/**
 * Tests Phase G.2 — fiche descriptive élu
 * Couvre : nouveaux endpoints lecture + composantes du modèle Elu étendu.
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import sequelize from '../src/db/sequelize.js';
import app from '../src/server.js';
import Elu from '../src/models/Elu.js';
import Mandat from '../src/models/Mandat.js';
import Action from '../src/models/Action.js';
import Vote from '../src/models/Vote.js';
import Controverse from '../src/models/Controverse.js';
import PromiseModel from '../src/models/Promise.js';

let testEluId;

describe('Phase G.2 — Fiche descriptive élu', () => {
  beforeAll(async () => {
    await sequelize.sync({ alter: false });

    const elu = await Elu.create({
      nom: 'Test Phase G.2 — élu fictif',
      titre: 'Député',
      poste: 'Critique en transparence',
      partiPolitique: 'Parti libéral du Canada',
      partiCouleur: '#d71920',
      region: 'Québec',
      niveau: 'fédéral',
      legislature: '45',
      statut: 'actif',
      email: 'test-g2@test.local',
      telephone: '1-555-0100',
      adresseBureau: '123 rue de la Colline',
      siteWeb: 'https://example.test',
      reseauxSociaux: { twitter: 'https://twitter.com/test' },
      sourceUrl: 'https://example.test/source',
    });
    testEluId = elu.id;

    await Mandat.create({
      eluId: testEluId,
      titre: 'Député',
      partiPolitique: 'Parti libéral du Canada',
      niveau: 'fédéral',
      legislature: '45',
      dateDebut: '2025-04-28',
      estActuel: true,
      source: 'sync_openparl',
    });

    await PromiseModel.create({
      eluId: testEluId,
      titre: 'Promesse test G.2',
      status: 'completee',
      source: 'discours',
      sourceUrl: 'https://example.test/promesse-1',
      datePromesse: '2025-04-01',
      contexte: 'campagne',
    });

    await Action.create({
      eluId: testEluId,
      type: 'loi',
      titre: 'Action test G.2',
      date: '2025-05-15',
      sourceUrl: 'https://example.test/action-1',
    });

    await Vote.create({
      eluId: testEluId,
      loiTitre: 'Projet de loi C-99 (test)',
      loiReference: 'C-99',
      position: 'pour',
      alignementParti: true,
      estVoteCle: true,
      legislature: '45',
      date: '2025-06-01',
      sourceUrl: 'https://example.test/vote-1',
    });

    await Controverse.create({
      eluId: testEluId,
      type: 'allegation',
      gravite: 'mineure',
      titre: 'Controverse test G.2',
      dateDebut: '2025-07-01',
      statut: 'en_cours',
      isPublished: true,
      validatedByAdmin: true,
      validatedAt: new Date(),
      sourceUrl: 'https://example.test/controverse-1',
    });
  });

  afterAll(async () => {
    await Elu.destroy({ where: { id: testEluId } });
    // Force fermeture connexions Sequelize pour éviter hang CI (bug #20 ré-émergent)
    if (sequelize.connectionManager && sequelize.connectionManager.pool) {
      await sequelize.connectionManager.close();
    }
  });

  it('GET /api/v1/elus/:id expose tous les champs étendus', async () => {
    const res = await request(app).get(`/api/v1/elus/${testEluId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const d = res.body.data;
    expect(d.parti_politique).toBe('Parti libéral du Canada');
    expect(d.poste).toBe('Critique en transparence');
    expect(d.statut).toBe('actif');
    expect(d.legislature).toBe('45');
    expect(d.email).toBe('test-g2@test.local');
    expect(d.reseaux_sociaux).toEqual({ twitter: 'https://twitter.com/test' });
    expect(d.source_url).toBe('https://example.test/source');
  });

  it('GET /api/v1/elus/:id/summary renvoie 3 KPIs', async () => {
    const res = await request(app).get(`/api/v1/elus/${testEluId}/summary`);
    expect(res.status).toBe(200);
    expect(res.body.kpi).toBeDefined();
    expect(typeof res.body.kpi.pct_promesses_tenues).toBe('number');
    expect(typeof res.body.kpi.pct_participation_votes).toBe('number');
    expect(typeof res.body.kpi.score_transparence_global).toBe('number');
    expect(res.body.kpi.pct_promesses_tenues).toBe(100); // 1/1 promesse tenue
    expect(res.body.kpi.pct_participation_votes).toBe(100); // 1/1 vote présent
  });

  it('GET /api/v1/elus/:id/promises retourne les promesses avec source', async () => {
    const res = await request(app).get(`/api/v1/elus/${testEluId}/promises`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].source_url).toBe('https://example.test/promesse-1');
  });

  it('GET /api/v1/elus/:id/actions retourne les actions', async () => {
    const res = await request(app).get(`/api/v1/elus/${testEluId}/actions`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].type).toBe('loi');
  });

  it('GET /api/v1/elus/:id/votes retourne votes + stats', async () => {
    const res = await request(app).get(`/api/v1/elus/${testEluId}/votes`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.stats.pour).toBe(1);
    expect(res.body.stats.participation_pct).toBe(100);
    expect(res.body.data[0].est_vote_cle).toBe(true);
  });

  it('GET /api/v1/elus/:id/controverses retourne uniquement publiées', async () => {
    const res = await request(app).get(`/api/v1/elus/${testEluId}/controverses`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].type).toBe('allegation');
  });

  it('GET /api/v1/elus/:id/financement structure agrégée', async () => {
    const res = await request(app).get(`/api/v1/elus/${testEluId}/financement`);
    expect(res.status).toBe(200);
    expect(res.body.donateurs).toBeDefined();
    expect(res.body.liens_interets).toBeDefined();
    expect(res.body.donateurs.count).toBe(0);
  });

  it('GET /api/v1/elus/:id/mandats retourne le mandat actuel', async () => {
    const res = await request(app).get(`/api/v1/elus/${testEluId}/mandats`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].est_actuel).toBe(true);
    expect(res.body.data[0].legislature).toBe('45');
  });

  it('GET /api/v1/elus/:id/follow-status (non authentifié) retourne followed=false', async () => {
    const res = await request(app).get(`/api/v1/elus/${testEluId}/follow-status`);
    expect(res.status).toBe(200);
    expect(res.body.followed).toBe(false);
    expect(typeof res.body.total_followers).toBe('number');
  });

  it('GET /api/v1/elus/:id/changelog retourne le journal d\'audit', async () => {
    const res = await request(app).get(`/api/v1/elus/${testEluId}/changelog`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Au moins 1 entrée create grâce au hook afterCreate
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('POST /api/v1/elus/:id/comments sans token → 401', async () => {
    const res = await request(app)
      .post(`/api/v1/elus/${testEluId}/comments`)
      .send({ type: 'commentaire', contenu: 'Test sans auth' });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/elus/:id/follow sans token → 401', async () => {
    const res = await request(app)
      .post(`/api/v1/elus/${testEluId}/follow`)
      .send({});
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/elus/:id/contact sans token → 401', async () => {
    const res = await request(app)
      .post(`/api/v1/elus/${testEluId}/contact`)
      .send({ sujet: 'Test', message: 'Hello' });
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/elus/99999/summary → 404', async () => {
    const res = await request(app).get('/api/v1/elus/99999/summary');
    expect(res.status).toBe(404);
  });

  it('POST /api/v1/admin/elus sans token → 401', async () => {
    const res = await request(app)
      .post('/api/v1/admin/elus')
      .send({ nom: 'X', titre: 'Député', niveau: 'fédéral', region: 'Québec' });
    expect(res.status).toBe(401);
  });
});
