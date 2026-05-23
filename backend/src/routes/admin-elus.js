/**
 * Routes admin CRUD — entités liées aux élus
 * Phase G.2 - Lot 12
 *
 * Endpoints protégés : authMiddleware + checkAdmin
 * Audit automatique via hooks (auditUserId injecté dans options Sequelize).
 *
 * Montage : /api/v1/admin/elus
 */

import express from 'express';
import { z } from 'zod';

import Elu, {
  TITRES_AUTORISES,
  NIVEAUX_AUTORISES,
  STATUTS_AUTORISES,
  CAUSES_FIN_AUTORISEES,
} from '../models/Elu.js';
import Promise from '../models/Promise.js';
import Action from '../models/Action.js';
import Vote from '../models/Vote.js';
import Controverse from '../models/Controverse.js';
import Donateur from '../models/Donateur.js';
import LienInteret from '../models/LienInteret.js';
import Mandat from '../models/Mandat.js';
import EluComment from '../models/EluComment.js';

import { authMiddleware } from '../middlewares/auth.js';
import { checkAdmin } from '../middlewares/admin.js';
import { toSnakeCase } from '../utils/serialize.js';
import { syncFromSource, syncFromCsv } from '../services/electoralSync.js';

const router = express.Router();

// Toutes les routes admin protégées
router.use(authMiddleware, checkAdmin);

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const idSchema = z.coerce.number().int().positive();

function auditOpts(req) {
  return {
    auditSource: req.body?._source || 'api_admin',
    auditUserId: req.user?.id || null,
    auditDetails: req.body?._sourceDetails || null,
  };
}

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data: toSnakeCase(data.toJSON ? data.toJSON() : data) });
}

function notFound(res, what = 'Ressource') {
  return res.status(404).json({ success: false, error: `${what} non trouvé(e)` });
}

function badInput(res, errors) {
  return res.status(400).json({ success: false, error: 'Payload invalide', details: errors });
}

// ═══════════════════════════════════════════════════════════════════
// CRUD ELU
// ═══════════════════════════════════════════════════════════════════

const eluSchema = z.object({
  nom: z.string().min(1).max(255),
  titre: z.enum(TITRES_AUTORISES),
  poste: z.string().max(150).optional().nullable(),
  rolesSecondaires: z.string().optional().nullable(),
  partiPolitique: z.string().max(100).optional().nullable(),
  partiCouleur: z.string().max(20).optional().nullable(),
  region: z.string().min(1).max(50),
  niveau: z.enum(NIVEAUX_AUTORISES),
  circonscriptionId: z.number().int().positive().optional().nullable(),
  mandatDebut: z.string().optional().nullable(),
  mandatFin: z.string().optional().nullable(),
  legislature: z.string().max(10).optional().nullable(),
  email: z.string().email().optional().nullable(),
  telephone: z.string().max(30).optional().nullable(),
  adresseBureau: z.string().optional().nullable(),
  siteWeb: z.string().url().optional().nullable(),
  reseauxSociaux: z.record(z.string(), z.string()).optional(),
  photoUrl: z.string().url().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  statut: z.enum(STATUTS_AUTORISES).optional(),
  causeFin: z.enum(CAUSES_FIN_AUTORISEES).optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
});

router.post('/', async (req, res, next) => {
  try {
    const v = eluSchema.safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const elu = await Elu.create(v.data, auditOpts(req));
    return ok(res, elu, 201);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const v = eluSchema.partial().safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const elu = await Elu.findByPk(idSchema.parse(req.params.id));
    if (!elu) return notFound(res, 'Élu');
    await elu.update(v.data, auditOpts(req));
    return ok(res, elu);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const elu = await Elu.findByPk(idSchema.parse(req.params.id));
    if (!elu) return notFound(res, 'Élu');
    await elu.destroy(auditOpts(req));
    return res.json({ success: true, message: 'Élu supprimé' });
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════════
// CRUD PROMISES (sous /elus/:id/promises)
// ═══════════════════════════════════════════════════════════════════

const promiseSchema = z.object({
  titre: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['engagee', 'en_cours', 'completee', 'abandonnee']).optional(),
  source: z.string().max(255).optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  datePromesse: z.string().optional().nullable(),
  contexte: z.string().max(100).optional().nullable(),
  deadline: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
});

router.post('/:id/promises', async (req, res, next) => {
  try {
    const eluId = idSchema.parse(req.params.id);
    const v = promiseSchema.safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const elu = await Elu.findByPk(eluId);
    if (!elu) return notFound(res, 'Élu');
    const p = await Promise.create({ ...v.data, eluId }, auditOpts(req));
    return ok(res, p, 201);
  } catch (e) {
    next(e);
  }
});

router.put('/:id/promises/:promiseId', async (req, res, next) => {
  try {
    const v = promiseSchema.partial().safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const p = await Promise.findOne({
      where: { id: idSchema.parse(req.params.promiseId), eluId: idSchema.parse(req.params.id) },
    });
    if (!p) return notFound(res, 'Promesse');
    await p.update(v.data, auditOpts(req));
    return ok(res, p);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/promises/:promiseId', async (req, res, next) => {
  try {
    const p = await Promise.findOne({
      where: { id: idSchema.parse(req.params.promiseId), eluId: idSchema.parse(req.params.id) },
    });
    if (!p) return notFound(res, 'Promesse');
    await p.destroy(auditOpts(req));
    return res.json({ success: true, message: 'Promesse supprimée' });
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════════
// CRUD ACTIONS
// ═══════════════════════════════════════════════════════════════════

const actionSchema = z.object({
  type: z.enum(['loi', 'projet_loi', 'motion', 'vote', 'decision', 'declaration', 'intervention', 'communique', 'autre']),
  titre: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  date: z.string(),
  promiseId: z.number().int().positive().optional().nullable(),
  source: z.string().max(255).optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
});

router.post('/:id/actions', async (req, res, next) => {
  try {
    const eluId = idSchema.parse(req.params.id);
    const v = actionSchema.safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const elu = await Elu.findByPk(eluId);
    if (!elu) return notFound(res, 'Élu');
    const a = await Action.create({ ...v.data, eluId }, auditOpts(req));
    return ok(res, a, 201);
  } catch (e) {
    next(e);
  }
});

router.put('/:id/actions/:actionId', async (req, res, next) => {
  try {
    const v = actionSchema.partial().safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const a = await Action.findOne({
      where: { id: idSchema.parse(req.params.actionId), eluId: idSchema.parse(req.params.id) },
    });
    if (!a) return notFound(res, 'Action');
    await a.update(v.data, auditOpts(req));
    return ok(res, a);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/actions/:actionId', async (req, res, next) => {
  try {
    const a = await Action.findOne({
      where: { id: idSchema.parse(req.params.actionId), eluId: idSchema.parse(req.params.id) },
    });
    if (!a) return notFound(res, 'Action');
    await a.destroy(auditOpts(req));
    return res.json({ success: true, message: 'Action supprimée' });
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════════
// CRUD VOTES
// ═══════════════════════════════════════════════════════════════════

const voteSchema = z.object({
  loiTitre: z.string().min(1).max(500),
  loiReference: z.string().max(100).optional().nullable(),
  loiDescription: z.string().optional().nullable(),
  enjeu: z.string().max(50).optional().nullable(),
  position: z.enum(['pour', 'contre', 'abstention', 'absent', 'paire']),
  alignementParti: z.boolean().optional().nullable(),
  estVoteCle: z.boolean().optional(),
  legislature: z.string().max(10).optional().nullable(),
  session: z.string().max(20).optional().nullable(),
  date: z.string(),
  source: z.string().max(255).optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
});

router.post('/:id/votes', async (req, res, next) => {
  try {
    const eluId = idSchema.parse(req.params.id);
    const v = voteSchema.safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const elu = await Elu.findByPk(eluId);
    if (!elu) return notFound(res, 'Élu');
    const vote = await Vote.create({ ...v.data, eluId }, auditOpts(req));
    return ok(res, vote, 201);
  } catch (e) {
    next(e);
  }
});

router.put('/:id/votes/:voteId', async (req, res, next) => {
  try {
    const v = voteSchema.partial().safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const vote = await Vote.findOne({
      where: { id: idSchema.parse(req.params.voteId), eluId: idSchema.parse(req.params.id) },
    });
    if (!vote) return notFound(res, 'Vote');
    await vote.update(v.data, auditOpts(req));
    return ok(res, vote);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/votes/:voteId', async (req, res, next) => {
  try {
    const vote = await Vote.findOne({
      where: { id: idSchema.parse(req.params.voteId), eluId: idSchema.parse(req.params.id) },
    });
    if (!vote) return notFound(res, 'Vote');
    await vote.destroy(auditOpts(req));
    return res.json({ success: true, message: 'Vote supprimé' });
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════════
// CRUD CONTROVERSES (avec validation admin = publication)
// ═══════════════════════════════════════════════════════════════════

const controverseSchema = z.object({
  type: z.enum(['scandale', 'enquete', 'sanction', 'correction', 'allegation', 'condamnation', 'rappel_ethique', 'autre']),
  gravite: z.enum(['mineure', 'moderee', 'majeure']).optional().nullable(),
  titre: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  positionOfficielle: z.string().optional().nullable(),
  statut: z.enum(['en_cours', 'cloturee', 'rejetee', 'confirmee', 'non_lieu']).optional(),
  dateDebut: z.string(),
  dateFin: z.string().optional().nullable(),
  source: z.string().max(255).optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  sourcesComplementaires: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  isPublished: z.boolean().optional(),
  validatedByAdmin: z.boolean().optional(),
});

router.post('/:id/controverses', async (req, res, next) => {
  try {
    const eluId = idSchema.parse(req.params.id);
    const v = controverseSchema.safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const elu = await Elu.findByPk(eluId);
    if (!elu) return notFound(res, 'Élu');

    const payload = { ...v.data, eluId };
    if (payload.isPublished && !payload.validatedByAdmin) {
      payload.validatedByAdmin = true;
      payload.validatedAt = new Date();
    }

    const c = await Controverse.create(payload, auditOpts(req));
    return ok(res, c, 201);
  } catch (e) {
    next(e);
  }
});

router.put('/:id/controverses/:cid', async (req, res, next) => {
  try {
    const v = controverseSchema.partial().safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const c = await Controverse.findOne({
      where: { id: idSchema.parse(req.params.cid), eluId: idSchema.parse(req.params.id) },
    });
    if (!c) return notFound(res, 'Controverse');

    const payload = { ...v.data };
    if (payload.isPublished && !c.validatedByAdmin) {
      payload.validatedByAdmin = true;
      payload.validatedAt = new Date();
    }

    await c.update(payload, auditOpts(req));
    return ok(res, c);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/controverses/:cid', async (req, res, next) => {
  try {
    const c = await Controverse.findOne({
      where: { id: idSchema.parse(req.params.cid), eluId: idSchema.parse(req.params.id) },
    });
    if (!c) return notFound(res, 'Controverse');
    await c.destroy(auditOpts(req));
    return res.json({ success: true, message: 'Controverse supprimée' });
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════════
// CRUD DONATEURS
// ═══════════════════════════════════════════════════════════════════

const donateurSchema = z.object({
  nom: z.string().min(1).max(255),
  typeDonateur: z.enum(['particulier', 'entreprise', 'syndicat', 'organisme', 'parti', 'comite', 'anonyme', 'autre']),
  montant: z.number().nonnegative().optional().nullable(),
  devise: z.string().length(3).optional(),
  date: z.string(),
  anneeFiscale: z.number().int().optional().nullable(),
  typeDon: z.enum(['monetaire', 'service', 'bien', 'pret', 'evenement', 'autre']).optional().nullable(),
  campagne: z.string().max(150).optional().nullable(),
  source: z.string().max(255).optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
});

router.post('/:id/donateurs', async (req, res, next) => {
  try {
    const eluId = idSchema.parse(req.params.id);
    const v = donateurSchema.safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const elu = await Elu.findByPk(eluId);
    if (!elu) return notFound(res, 'Élu');
    const d = await Donateur.create({ ...v.data, eluId }, auditOpts(req));
    return ok(res, d, 201);
  } catch (e) {
    next(e);
  }
});

router.put('/:id/donateurs/:did', async (req, res, next) => {
  try {
    const v = donateurSchema.partial().safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const d = await Donateur.findOne({
      where: { id: idSchema.parse(req.params.did), eluId: idSchema.parse(req.params.id) },
    });
    if (!d) return notFound(res, 'Donateur');
    await d.update(v.data, auditOpts(req));
    return ok(res, d);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/donateurs/:did', async (req, res, next) => {
  try {
    const d = await Donateur.findOne({
      where: { id: idSchema.parse(req.params.did), eluId: idSchema.parse(req.params.id) },
    });
    if (!d) return notFound(res, 'Donateur');
    await d.destroy(auditOpts(req));
    return res.json({ success: true, message: 'Donateur supprimé' });
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════════
// CRUD LIENS D'INTÉRÊTS
// ═══════════════════════════════════════════════════════════════════

const lienSchema = z.object({
  type: z.enum(['directorat', 'actionnariat', 'emploi', 'consultation', 'lobby', 'beneficiaire', 'famille', 'association', 'autre']),
  entite: z.string().min(1).max(255),
  role: z.string().max(150).optional().nullable(),
  secteur: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  dateDebut: z.string().optional().nullable(),
  dateFin: z.string().optional().nullable(),
  actuel: z.boolean().optional(),
  declareOfficiellement: z.boolean().optional(),
  dateDeclaration: z.string().optional().nullable(),
  source: z.string().max(255).optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
});

router.post('/:id/liens-interets', async (req, res, next) => {
  try {
    const eluId = idSchema.parse(req.params.id);
    const v = lienSchema.safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const elu = await Elu.findByPk(eluId);
    if (!elu) return notFound(res, 'Élu');
    const l = await LienInteret.create({ ...v.data, eluId }, auditOpts(req));
    return ok(res, l, 201);
  } catch (e) {
    next(e);
  }
});

router.put('/:id/liens-interets/:lid', async (req, res, next) => {
  try {
    const v = lienSchema.partial().safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const l = await LienInteret.findOne({
      where: { id: idSchema.parse(req.params.lid), eluId: idSchema.parse(req.params.id) },
    });
    if (!l) return notFound(res, 'Lien d\'intérêt');
    await l.update(v.data, auditOpts(req));
    return ok(res, l);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/liens-interets/:lid', async (req, res, next) => {
  try {
    const l = await LienInteret.findOne({
      where: { id: idSchema.parse(req.params.lid), eluId: idSchema.parse(req.params.id) },
    });
    if (!l) return notFound(res, 'Lien d\'intérêt');
    await l.destroy(auditOpts(req));
    return res.json({ success: true, message: 'Lien d\'intérêt supprimé' });
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════════
// CRUD MANDATS
// ═══════════════════════════════════════════════════════════════════

const mandatSchema = z.object({
  titre: z.string().min(1).max(100),
  poste: z.string().max(150).optional().nullable(),
  rolesSecondaires: z.string().optional().nullable(),
  partiPolitique: z.string().max(100).optional().nullable(),
  partiCouleur: z.string().max(20).optional().nullable(),
  circonscriptionId: z.number().int().positive().optional().nullable(),
  niveau: z.enum(['fédéral', 'provincial', 'municipal']),
  region: z.string().max(50).optional().nullable(),
  legislature: z.string().max(10).optional().nullable(),
  dateDebut: z.string(),
  dateFin: z.string().optional().nullable(),
  causeFin: z.enum(['fin_mandat', 'demission', 'defaite_electorale', 'deces', 'revocation', 'autre']).optional().nullable(),
  estActuel: z.boolean().optional(),
  source: z.string().max(255).optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
});

router.post('/:id/mandats', async (req, res, next) => {
  try {
    const eluId = idSchema.parse(req.params.id);
    const v = mandatSchema.safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const elu = await Elu.findByPk(eluId);
    if (!elu) return notFound(res, 'Élu');

    // Si nouveau mandat actuel, fermer l'ancien
    if (v.data.estActuel) {
      await Mandat.update(
        { estActuel: false },
        { where: { eluId, estActuel: true }, ...auditOpts(req) }
      );
    }

    const m = await Mandat.create({ ...v.data, eluId }, auditOpts(req));
    return ok(res, m, 201);
  } catch (e) {
    next(e);
  }
});

router.put('/:id/mandats/:mid', async (req, res, next) => {
  try {
    const v = mandatSchema.partial().safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);
    const eluId = idSchema.parse(req.params.id);
    const m = await Mandat.findOne({
      where: { id: idSchema.parse(req.params.mid), eluId },
    });
    if (!m) return notFound(res, 'Mandat');

    if (v.data.estActuel === true && !m.estActuel) {
      await Mandat.update(
        { estActuel: false },
        { where: { eluId, estActuel: true }, ...auditOpts(req) }
      );
    }

    await m.update(v.data, auditOpts(req));
    return ok(res, m);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/mandats/:mid', async (req, res, next) => {
  try {
    const m = await Mandat.findOne({
      where: { id: idSchema.parse(req.params.mid), eluId: idSchema.parse(req.params.id) },
    });
    if (!m) return notFound(res, 'Mandat');
    await m.destroy(auditOpts(req));
    return res.json({ success: true, message: 'Mandat supprimé' });
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════════
// MODÉRATION COMMENTAIRES (publication / rejet)
// ═══════════════════════════════════════════════════════════════════

const moderationSchema = z.object({
  statut: z.enum(['publie', 'rejete', 'masque']),
  motif_rejet: z.string().max(500).optional().nullable(),
});

router.put('/:id/comments/:cid/moderate', async (req, res, next) => {
  try {
    const v = moderationSchema.safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);

    const c = await EluComment.findOne({
      where: { id: idSchema.parse(req.params.cid), eluId: idSchema.parse(req.params.id) },
    });
    if (!c) return notFound(res, 'Commentaire');

    await c.update({
      statut: v.data.statut,
      motifRejet: v.data.motif_rejet || null,
      moderatedBy: req.user.id,
      moderatedAt: new Date(),
    });

    return ok(res, c);
  } catch (e) {
    next(e);
  }
});

const responseSchema = z.object({
  reponse: z.string().min(1).max(5000),
});

router.put('/:id/comments/:cid/reponse', async (req, res, next) => {
  try {
    const v = responseSchema.safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);

    const c = await EluComment.findOne({
      where: { id: idSchema.parse(req.params.cid), eluId: idSchema.parse(req.params.id) },
    });
    if (!c) return notFound(res, 'Commentaire');

    await c.update({
      reponse: v.data.reponse,
      reponsePar: req.user.id,
      reponseAt: new Date(),
    });

    return ok(res, c);
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════════
// SYNCHRONISATION SOURCES OFFICIELLES
// ═══════════════════════════════════════════════════════════════════

const syncSchema = z.object({
  dry_run: z.boolean().optional(),
  auto_mark_sortant: z.boolean().optional(),
});

/**
 * POST /admin/elus/sync/:source
 * Synchroniser depuis source officielle ('ourcommons' | 'openparliament')
 * Body : { dry_run?: boolean, auto_mark_sortant?: boolean }
 */
router.post('/sync/:source', async (req, res, next) => {
  try {
    const source = req.params.source;
    if (!['ourcommons', 'openparliament'].includes(source)) {
      return res.status(400).json({
        success: false,
        error: 'Source invalide',
        valid: ['ourcommons', 'openparliament'],
      });
    }

    const v = syncSchema.safeParse(req.body || {});
    if (!v.success) return badInput(res, v.error.errors);

    const result = await syncFromSource(source, {
      dryRun: v.data.dry_run || false,
      autoMarkSortant: v.data.auto_mark_sortant || false,
      userId: req.user.id,
    });

    return res.json({ success: true, source, result });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /admin/elus/sync/csv
 * Synchroniser depuis contenu CSV
 * Body : { csv: string, niveau?: string, legislature?: string,
 *          dry_run?: boolean, auto_mark_sortant?: boolean }
 */
const csvSyncSchema = z.object({
  csv: z.string().min(20),
  niveau: z.enum(['fédéral', 'provincial', 'municipal']).optional(),
  legislature: z.string().max(10).optional(),
  dry_run: z.boolean().optional(),
  auto_mark_sortant: z.boolean().optional(),
});

router.post('/sync-csv', async (req, res, next) => {
  try {
    const v = csvSyncSchema.safeParse(req.body);
    if (!v.success) return badInput(res, v.error.errors);

    const result = await syncFromCsv(v.data.csv, {
      niveau: v.data.niveau || 'fédéral',
      legislature: v.data.legislature || '45',
      dryRun: v.data.dry_run || false,
      autoMarkSortant: v.data.auto_mark_sortant || false,
      userId: req.user.id,
    });

    return res.json({ success: true, source: 'csv', result });
  } catch (e) {
    next(e);
  }
});

export default router;
