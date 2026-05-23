/**
 * Routes pour les élus (Députés, Sénateurs, Maires, Conseillers)
 * Endpoints publics — Pas d'authentification requise
 */

import express from 'express';
import { z } from 'zod';
import Elu from '../models/Elu.js';
import Petition from '../models/Petition.js';
import Promise from '../models/Promise.js';
import Action from '../models/Action.js';
import Vote from '../models/Vote.js';
import Controverse from '../models/Controverse.js';
import Donateur from '../models/Donateur.js';
import LienInteret from '../models/LienInteret.js';
import EluComment from '../models/EluComment.js';
import EluFollow from '../models/EluFollow.js';
import Mandat from '../models/Mandat.js';
import EluChangelog from '../models/EluChangelog.js';
import { emailService } from '../services/EmailService.js';
import { eluContactLimiter } from '../middlewares/rateLimiter.js';
import User from '../models/User.js';
import { authMiddleware, authOptional } from '../middlewares/auth.js';
import { toSnakeCase } from '../utils/serialize.js';
import {
  calculateDetailedTransparencyScore,
  getTransparencyRating,
} from '../services/transparencyScore.js';

const router = express.Router();

const idSchema = z.object({
  id: z.coerce.number().int().positive('ID doit être un entier positif'),
});

/**
 * GET /api/v1/elus
 * Lister tous les élus avec score de transparence
 */
router.get('/', async (req, res, next) => {
  try {
    const elus = await Elu.findAll({
      attributes: [
        'id',
        'nom',
        'titre',
        'poste',
        'partiPolitique',
        'partiCouleur',
        'region',
        'niveau',
        'circonscriptionId',
        'legislature',
        'mandatDebut',
        'mandatFin',
        'statut',
        'email',
        'telephone',
        'photoUrl',
        'siteWeb',
        'reseauxSociaux',
        'latitude',
        'longitude',
        'sourceUrl',
        'sourceDerniereMaj',
      ],
      include: [
        {
          model: Promise,
          as: 'promises',
          attributes: ['status'],
          required: false,
        },
      ],
      order: [['nom', 'ASC']],
    });

    const elusWithTransparency = elus.map((elu) => {
      const transparency = calculateDetailedTransparencyScore(elu);
      const rating = getTransparencyRating(transparency.overall);
      const eluJson = elu.toJSON();

      return toSnakeCase({
        ...eluJson,
        commitments_count: eluJson.promises ? eluJson.promises.length : 0,
        transparency,
        rating,
      });
    });

    res.json({
      success: true,
      count: elusWithTransparency.length,
      data: elusWithTransparency,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id
 * Obtenir détail d'un élu avec score de transparence
 */
router.get('/:id', async (req, res, next) => {
  try {
    const validation = idSchema.safeParse({ id: req.params.id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: validation.error.errors,
      });
    }

    const { id } = validation.data;
    const elu = await Elu.findByPk(id, {
      attributes: [
        'id',
        'nom',
        'titre',
        'poste',
        'rolesSecondaires',
        'partiPolitique',
        'partiCouleur',
        'region',
        'niveau',
        'circonscriptionId',
        'legislature',
        'mandatDebut',
        'mandatFin',
        'statut',
        'causeFin',
        'email',
        'telephone',
        'adresseBureau',
        'photoUrl',
        'siteWeb',
        'reseauxSociaux',
        'latitude',
        'longitude',
        'sourceUrl',
        'sourceDerniereMaj',
        'createdAt',
        'updatedAt',
      ],
      include: [
        {
          model: Promise,
          as: 'promises',
          attributes: ['id', 'titre', 'status', 'deadline', 'completedAt'],
        },
      ],
    });

    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    const transparency = calculateDetailedTransparencyScore(elu);
    const rating = getTransparencyRating(transparency.overall);
    const eluJson = elu.toJSON();

    res.json({
      success: true,
      data: toSnakeCase({
        ...eluJson,
        commitments_count: eluJson.Promises ? eluJson.Promises.length : 0,
        transparency,
        rating,
      }),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id/promises
 * Lister les promesses d'un élu avec transparence
 */
router.get('/:id/promises', async (req, res, next) => {
  try {
    const validation = idSchema.safeParse({ id: req.params.id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: validation.error.errors,
      });
    }

    const { id } = validation.data;

    const elu = await Elu.findByPk(id);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    const promises = await Promise.findAll({
      where: { elu_id: id },
      attributes: [
        'id',
        'titre',
        'description',
        'status',
        'source',
        'sourceUrl',
        'datePromesse',
        'contexte',
        'deadline',
        'completedAt',
        'createdAt',
      ],
      order: [['createdAt', 'DESC']],
    });

    const transparency = calculateDetailedTransparencyScore({
      promises,
    });
    const rating = getTransparencyRating(transparency.overall);

    res.json({
      success: true,
      elu_id: id,
      elu_nom: elu.nom,
      count: promises.length,
      transparency: toSnakeCase(transparency),
      rating: toSnakeCase(rating),
      data: promises.map((p) => toSnakeCase(p.toJSON())),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id/transparency
 * Score de transparence détaillé pour un élu
 */
router.get('/:id/transparency', async (req, res, next) => {
  try {
    const validation = idSchema.safeParse({ id: req.params.id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: validation.error.errors,
      });
    }

    const { id } = validation.data;

    const elu = await Elu.findByPk(id, {
      attributes: ['id', 'nom', 'titre', 'region', 'niveau'],
      include: [
        {
          model: Promise,
          as: 'promises',
          attributes: ['id', 'titre', 'status', 'deadline', 'completedAt'],
        },
      ],
    });

    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    const promises = elu.promises || [];

    if (promises.length === 0) {
      return res.json({
        success: true,
        elu_id: id,
        elu_nom: elu.nom,
        overall: 0,
        total_promises: 0,
        completed: 0,
        in_progress: 0,
        abandoned: 0,
        committed: 0,
        breakdown: {
          completion_rate: 0,
          keep_rate: 0,
        },
        message: 'Aucune promesse enregistrée',
      });
    }

    const transparency = calculateDetailedTransparencyScore(elu);
    const rating = getTransparencyRating(transparency.overall);

    res.json({
      success: true,
      elu_id: id,
      elu_nom: elu.nom,
      titre: elu.titre,
      region: elu.region,
      niveau: elu.niveau,
      overall: transparency.overall,
      rating: rating.rating,
      color: rating.color,
      total_promises: transparency.totalPromises,
      completed: transparency.completed,
      in_progress: transparency.inProgress,
      abandoned: transparency.abandoned,
      committed: transparency.committed,
      breakdown: toSnakeCase(
        transparency.breakdown || {
          completionRate: transparency.completionRate,
          keepRate: transparency.keepRate,
        }
      ),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id/petitions
 * Lister pétitions adressées à cet élu
 */
router.get('/:id/petitions', async (req, res, next) => {
  try {
    const validation = idSchema.safeParse({ id: req.params.id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: validation.error.errors,
      });
    }

    const { id } = validation.data;

    const elu = await Elu.findByPk(id);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    const petitions = await Petition.findAll({
      where: { eluId: id },
      attributes: [
        'id',
        'titre',
        'description',
        'status',
        'signaturesCount',
        'deadline',
        'createdAt',
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      elu_id: id,
      elu_nom: elu.nom,
      count: petitions.length,
      data: petitions.map((p) => toSnakeCase(p.toJSON())),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id/actions
 * Lister les actions concrètes d'un élu (timeline)
 * Filtres : ?type=loi|projet_loi|...  ?from=YYYY-MM-DD  ?to=YYYY-MM-DD
 */
router.get('/:id/actions', async (req, res, next) => {
  try {
    const validation = idSchema.safeParse({ id: req.params.id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: validation.error.errors,
      });
    }

    const { id } = validation.data;

    const elu = await Elu.findByPk(id);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    const where = { eluId: id, isPublished: true };

    if (req.query.type) {
      where.type = req.query.type;
    }

    if (req.query.from || req.query.to) {
      where.date = {};
      if (req.query.from) where.date.$gte = req.query.from;
      if (req.query.to) where.date.$lte = req.query.to;
    }

    const actions = await Action.findAll({
      where,
      attributes: [
        'id',
        'type',
        'titre',
        'description',
        'date',
        'source',
        'sourceUrl',
        'promiseId',
        'createdAt',
      ],
      order: [['date', 'DESC']],
    });

    res.json({
      success: true,
      elu_id: id,
      elu_nom: elu.nom,
      count: actions.length,
      data: actions.map((a) => toSnakeCase(a.toJSON())),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id/votes
 * Lister les votes parlementaires d'un élu
 * Filtres :
 *   ?position=pour|contre|abstention|absent|paire
 *   ?alignement=true|false  (alignement avec parti)
 *   ?cle=true               (votes clés uniquement)
 *   ?enjeu=<categorie>
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   ?legislature=45
 */
router.get('/:id/votes', async (req, res, next) => {
  try {
    const validation = idSchema.safeParse({ id: req.params.id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: validation.error.errors,
      });
    }

    const { id } = validation.data;

    const elu = await Elu.findByPk(id);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    const where = { eluId: id };

    if (req.query.position) where.position = req.query.position;
    if (req.query.alignement !== undefined) {
      where.alignementParti = req.query.alignement === 'true';
    }
    if (req.query.cle === 'true') where.estVoteCle = true;
    if (req.query.enjeu) where.enjeu = req.query.enjeu;
    if (req.query.legislature) where.legislature = req.query.legislature;

    if (req.query.from || req.query.to) {
      where.date = {};
      if (req.query.from) where.date.$gte = req.query.from;
      if (req.query.to) where.date.$lte = req.query.to;
    }

    const votes = await Vote.findAll({
      where,
      attributes: [
        'id',
        'loiTitre',
        'loiReference',
        'loiDescription',
        'enjeu',
        'position',
        'alignementParti',
        'estVoteCle',
        'legislature',
        'session',
        'date',
        'source',
        'sourceUrl',
      ],
      order: [['date', 'DESC']],
    });

    // Statistiques agrégées (pour KPI résumé)
    const stats = {
      total: votes.length,
      pour: votes.filter((v) => v.position === 'pour').length,
      contre: votes.filter((v) => v.position === 'contre').length,
      abstention: votes.filter((v) => v.position === 'abstention').length,
      absent: votes.filter((v) => v.position === 'absent').length,
      paire: votes.filter((v) => v.position === 'paire').length,
    };

    stats.participation_pct = stats.total > 0
      ? Math.round(((stats.total - stats.absent) / stats.total) * 100)
      : 0;

    const votesAvecAlignement = votes.filter((v) => v.alignementParti !== null);
    stats.alignement_parti_pct = votesAvecAlignement.length > 0
      ? Math.round(
          (votesAvecAlignement.filter((v) => v.alignementParti).length /
            votesAvecAlignement.length) *
            100
        )
      : null;

    res.json({
      success: true,
      elu_id: id,
      elu_nom: elu.nom,
      count: votes.length,
      stats,
      data: votes.map((v) => toSnakeCase(v.toJSON())),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id/controverses
 * Lister controverses publiées (validées admin) d'un élu
 * Filtres :
 *   ?type=scandale|enquete|sanction|correction|allegation|...
 *   ?statut=en_cours|cloturee|rejetee|confirmee|non_lieu
 *   ?gravite=mineure|moderee|majeure
 */
router.get('/:id/controverses', async (req, res, next) => {
  try {
    const validation = idSchema.safeParse({ id: req.params.id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: validation.error.errors,
      });
    }

    const { id } = validation.data;

    const elu = await Elu.findByPk(id);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    // Public : uniquement is_published = TRUE
    const where = { eluId: id, isPublished: true };

    if (req.query.type) where.type = req.query.type;
    if (req.query.statut) where.statut = req.query.statut;
    if (req.query.gravite) where.gravite = req.query.gravite;

    const controverses = await Controverse.findAll({
      where,
      attributes: [
        'id',
        'type',
        'gravite',
        'titre',
        'description',
        'positionOfficielle',
        'statut',
        'dateDebut',
        'dateFin',
        'source',
        'sourceUrl',
        'sourcesComplementaires',
      ],
      order: [['dateDebut', 'DESC']],
    });

    res.json({
      success: true,
      elu_id: id,
      elu_nom: elu.nom,
      count: controverses.length,
      data: controverses.map((c) => toSnakeCase(c.toJSON())),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id/financement
 * Agrégation donateurs + liens d'intérêts d'un élu
 * Filtres :
 *   ?annee=2024
 *   ?type_donateur=entreprise|syndicat|...
 *   ?actuel=true|false  (liens d'intérêts en cours)
 */
router.get('/:id/financement', async (req, res, next) => {
  try {
    const validation = idSchema.safeParse({ id: req.params.id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: validation.error.errors,
      });
    }

    const { id } = validation.data;

    const elu = await Elu.findByPk(id);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    // === Donateurs ===
    const whereDonateurs = { eluId: id, isPublished: true };
    if (req.query.annee) whereDonateurs.anneeFiscale = parseInt(req.query.annee, 10);
    if (req.query.type_donateur) whereDonateurs.typeDonateur = req.query.type_donateur;

    const donateurs = await Donateur.findAll({
      where: whereDonateurs,
      attributes: [
        'id',
        'nom',
        'typeDonateur',
        'montant',
        'devise',
        'date',
        'anneeFiscale',
        'typeDon',
        'campagne',
        'source',
        'sourceUrl',
      ],
      order: [
        ['date', 'DESC'],
        ['montant', 'DESC'],
      ],
    });

    // === Liens d'intérêts ===
    const whereLiens = { eluId: id, isPublished: true };
    if (req.query.actuel !== undefined) {
      whereLiens.actuel = req.query.actuel === 'true';
    }

    const liensInterets = await LienInteret.findAll({
      where: whereLiens,
      attributes: [
        'id',
        'type',
        'entite',
        'role',
        'secteur',
        'description',
        'dateDebut',
        'dateFin',
        'actuel',
        'declareOfficiellement',
        'dateDeclaration',
        'source',
        'sourceUrl',
      ],
      order: [
        ['actuel', 'DESC'],
        ['dateDebut', 'DESC'],
      ],
    });

    // === Agrégations ===
    const totalDons = donateurs.reduce(
      (sum, d) => sum + (parseFloat(d.montant) || 0),
      0
    );

    const repartitionParType = {};
    donateurs.forEach((d) => {
      const t = d.typeDonateur;
      if (!repartitionParType[t]) {
        repartitionParType[t] = { count: 0, total: 0 };
      }
      repartitionParType[t].count += 1;
      repartitionParType[t].total += parseFloat(d.montant) || 0;
    });

    const liensActuels = liensInterets.filter((l) => l.actuel).length;
    const liensDeclares = liensInterets.filter((l) => l.declareOfficiellement).length;

    res.json({
      success: true,
      elu_id: id,
      elu_nom: elu.nom,
      donateurs: {
        count: donateurs.length,
        total_dons: parseFloat(totalDons.toFixed(2)),
        repartition: repartitionParType,
        data: donateurs.map((d) => toSnakeCase(d.toJSON())),
      },
      liens_interets: {
        count: liensInterets.length,
        actuels: liensActuels,
        declares_officiellement: liensDeclares,
        data: liensInterets.map((l) => toSnakeCase(l.toJSON())),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id/comments
 * Lister commentaires/questions/signalements PUBLIÉS d'un élu
 * Filtres : ?type=commentaire|question|signalement
 *           ?limit=20  ?offset=0
 */
router.get('/:id/comments', async (req, res, next) => {
  try {
    const validation = idSchema.safeParse({ id: req.params.id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: validation.error.errors,
      });
    }

    const { id } = validation.data;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    const elu = await Elu.findByPk(id);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    const where = {
      eluId: id,
      statut: 'publie',
      parentId: null,
    };

    if (req.query.type) where.type = req.query.type;

    const { count, rows: comments } = await EluComment.findAndCountAll({
      where,
      attributes: [
        'id',
        'type',
        'contenu',
        'reponse',
        'reponseAt',
        'likesCount',
        'createdAt',
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatarUrl'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      elu_id: id,
      elu_nom: elu.nom,
      count,
      limit,
      offset,
      data: comments.map((c) => toSnakeCase(c.toJSON())),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/elus/:id/comments
 * Créer un commentaire / question / signalement (authentifié)
 * Body : { type, contenu, parent_id? }
 * Statut initial : 'en_attente' (modération admin requise)
 */
const createCommentSchema = z.object({
  type: z.enum(['commentaire', 'question', 'signalement']).default('commentaire'),
  contenu: z.string().min(1).max(5000),
  parent_id: z.number().int().positive().optional(),
});

router.post('/:id/comments', authMiddleware, async (req, res, next) => {
  try {
    const idValidation = idSchema.safeParse({ id: req.params.id });
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: idValidation.error.errors,
      });
    }

    const bodyValidation = createCommentSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'Payload invalide',
        details: bodyValidation.error.errors,
      });
    }

    const { id } = idValidation.data;
    const { type, contenu, parent_id } = bodyValidation.data;

    const elu = await Elu.findByPk(id);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    if (parent_id) {
      const parent = await EluComment.findByPk(parent_id);
      if (!parent || parent.eluId !== id) {
        return res.status(400).json({
          success: false,
          error: 'Commentaire parent invalide',
        });
      }
    }

    const comment = await EluComment.create({
      eluId: id,
      citoyenId: req.user.id,
      type,
      contenu,
      parentId: parent_id || null,
      statut: 'en_attente',
    });

    res.status(201).json({
      success: true,
      data: toSnakeCase(comment.toJSON()),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/elus/:id/comments/:commentId
 * Suppression douce d'un commentaire (auteur uniquement)
 */
router.delete(
  '/:id/comments/:commentId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const idValidation = idSchema.safeParse({ id: req.params.id });
      const commentIdValidation = idSchema.safeParse({
        id: req.params.commentId,
      });

      if (!idValidation.success || !commentIdValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'ID invalide',
        });
      }

      const { id } = idValidation.data;
      const commentId = commentIdValidation.data.id;

      const comment = await EluComment.findOne({
        where: { id: commentId, eluId: id },
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Commentaire non trouvé',
        });
      }

      if (comment.citoyenId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Non autorisé — suppression réservée à l\'auteur',
        });
      }

      await comment.update({ statut: 'supprime' });
      await comment.destroy();

      res.json({
        success: true,
        message: 'Commentaire supprimé',
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/elus/:id/follow
 * S'abonner aux mises à jour d'un élu (authentifié)
 * Body optionnel : { notif_promesse, notif_action, notif_vote,
 *                    notif_controverse, notif_fin_mandat }
 */
const followPrefsSchema = z.object({
  notif_promesse: z.boolean().optional(),
  notif_action: z.boolean().optional(),
  notif_vote: z.boolean().optional(),
  notif_controverse: z.boolean().optional(),
  notif_fin_mandat: z.boolean().optional(),
});

router.post('/:id/follow', authMiddleware, async (req, res, next) => {
  try {
    const idValidation = idSchema.safeParse({ id: req.params.id });
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
      });
    }

    const bodyValidation = followPrefsSchema.safeParse(req.body || {});
    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'Payload invalide',
        details: bodyValidation.error.errors,
      });
    }

    const { id } = idValidation.data;

    const elu = await Elu.findByPk(id);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    const prefs = bodyValidation.data;

    const [follow, created] = await EluFollow.findOrCreate({
      where: { userId: req.user.id, eluId: id },
      defaults: {
        notifPromesse: prefs.notif_promesse ?? true,
        notifAction: prefs.notif_action ?? true,
        notifVote: prefs.notif_vote ?? false,
        notifControverse: prefs.notif_controverse ?? true,
        notifFinMandat: prefs.notif_fin_mandat ?? true,
      },
    });

    // Mise à jour des préférences si fourniture explicite
    if (!created && Object.keys(prefs).length > 0) {
      const updates = {};
      if (prefs.notif_promesse !== undefined) updates.notifPromesse = prefs.notif_promesse;
      if (prefs.notif_action !== undefined) updates.notifAction = prefs.notif_action;
      if (prefs.notif_vote !== undefined) updates.notifVote = prefs.notif_vote;
      if (prefs.notif_controverse !== undefined) updates.notifControverse = prefs.notif_controverse;
      if (prefs.notif_fin_mandat !== undefined) updates.notifFinMandat = prefs.notif_fin_mandat;
      await follow.update(updates);
    }

    res.status(created ? 201 : 200).json({
      success: true,
      followed: true,
      created,
      elu_id: id,
      data: toSnakeCase(follow.toJSON()),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/elus/:id/follow
 * Se désabonner d'un élu (authentifié)
 */
router.delete('/:id/follow', authMiddleware, async (req, res, next) => {
  try {
    const idValidation = idSchema.safeParse({ id: req.params.id });
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
      });
    }

    const { id } = idValidation.data;

    const deleted = await EluFollow.destroy({
      where: { userId: req.user.id, eluId: id },
    });

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: 'Abonnement inexistant',
      });
    }

    res.json({
      success: true,
      followed: false,
      elu_id: id,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id/follow-status
 * État d'abonnement de l'utilisateur courant + nombre total de followers
 * authOptional : retourne followed:false si non authentifié
 */
router.get('/:id/follow-status', authOptional, async (req, res, next) => {
  try {
    const idValidation = idSchema.safeParse({ id: req.params.id });
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
      });
    }

    const { id } = idValidation.data;

    const totalFollowers = await EluFollow.count({ where: { eluId: id } });

    let followed = false;
    let prefs = null;

    if (req.user) {
      const follow = await EluFollow.findOne({
        where: { userId: req.user.id, eluId: id },
      });
      if (follow) {
        followed = true;
        prefs = toSnakeCase(follow.toJSON());
      }
    }

    res.json({
      success: true,
      elu_id: id,
      followed,
      total_followers: totalFollowers,
      prefs,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id/mandats
 * Historique chronologique des mandats d'un élu
 * Filtres : ?niveau=fédéral|provincial|municipal
 *           ?actuel=true|false
 *           ?legislature=45
 */
router.get('/:id/mandats', async (req, res, next) => {
  try {
    const validation = idSchema.safeParse({ id: req.params.id });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: validation.error.errors,
      });
    }

    const { id } = validation.data;

    const elu = await Elu.findByPk(id);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    const where = { eluId: id };
    if (req.query.niveau) where.niveau = req.query.niveau;
    if (req.query.actuel !== undefined) {
      where.estActuel = req.query.actuel === 'true';
    }
    if (req.query.legislature) where.legislature = req.query.legislature;

    const mandats = await Mandat.findAll({
      where,
      attributes: [
        'id',
        'titre',
        'poste',
        'rolesSecondaires',
        'partiPolitique',
        'partiCouleur',
        'circonscriptionId',
        'niveau',
        'region',
        'legislature',
        'dateDebut',
        'dateFin',
        'causeFin',
        'estActuel',
        'source',
        'sourceUrl',
      ],
      order: [['dateDebut', 'DESC']],
    });

    res.json({
      success: true,
      elu_id: id,
      elu_nom: elu.nom,
      count: mandats.length,
      data: mandats.map((m) => toSnakeCase(m.toJSON())),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id/changelog
 * Journal d'audit des modifications concernant un élu
 * Filtres :
 *   ?entite_type=elu|promise|action|vote|controverse|donateur|lien_interet|mandat|elu_comment
 *   ?action=create|update|delete
 *   ?source=manuel|sync_ourcommons|sync_openparl|...
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   ?limit=50  ?offset=0
 */
router.get('/:id/changelog', async (req, res, next) => {
  try {
    const validation = idSchema.safeParse({ id: req.params.id });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: validation.error.errors,
      });
    }

    const { id } = validation.data;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;

    const elu = await Elu.findByPk(id);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    const where = { eluId: id };
    if (req.query.entite_type) where.entiteType = req.query.entite_type;
    if (req.query.action) where.action = req.query.action;
    if (req.query.source) where.source = req.query.source;

    if (req.query.from || req.query.to) {
      where.modifieLe = {};
      if (req.query.from) where.modifieLe.$gte = req.query.from;
      if (req.query.to) where.modifieLe.$lte = req.query.to;
    }

    const { count, rows } = await EluChangelog.findAndCountAll({
      where,
      attributes: [
        'id',
        'entiteType',
        'entiteId',
        'action',
        'champ',
        'ancienneValeur',
        'nouvelleValeur',
        'source',
        'sourceDetails',
        'modifiePar',
        'modifieLe',
      ],
      order: [['modifieLe', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      elu_id: id,
      elu_nom: elu.nom,
      count,
      limit,
      offset,
      data: rows.map((r) => toSnakeCase(r.toJSON())),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id/summary
 * 3 KPIs résumé : pct_promesses_tenues, pct_participation_votes,
 *                 score_transparence_global + breakdown détaillé
 */
router.get('/:id/summary', async (req, res, next) => {
  try {
    const validation = idSchema.safeParse({ id: req.params.id });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: validation.error.errors,
      });
    }

    const { id } = validation.data;

    const elu = await Elu.findByPk(id, {
      attributes: [
        'id',
        'nom',
        'titre',
        'poste',
        'partiPolitique',
        'partiCouleur',
        'niveau',
        'region',
        'statut',
      ],
      include: [
        {
          model: Promise,
          as: 'promises',
          attributes: ['id', 'status', 'sourceUrl'],
        },
        {
          model: Vote,
          as: 'votes',
          attributes: ['id', 'position', 'alignementParti', 'sourceUrl'],
        },
        {
          model: Action,
          as: 'actions',
          attributes: ['id', 'sourceUrl'],
        },
      ],
    });

    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    const transparency = calculateDetailedTransparencyScore(elu);
    const rating = getTransparencyRating(transparency.overall);

    res.json({
      success: true,
      elu_id: id,
      elu_nom: elu.nom,
      elu_titre: elu.titre,
      elu_poste: elu.poste,
      parti_politique: elu.partiPolitique,
      parti_couleur: elu.partiCouleur,
      niveau: elu.niveau,
      region: elu.region,
      statut: elu.statut,

      // KPI principaux
      kpi: {
        pct_promesses_tenues: transparency.completionRate,
        pct_participation_votes: transparency.participationRate,
        score_transparence_global: transparency.overall,
      },

      rating: rating.rating,
      color: rating.color,

      breakdown: toSnakeCase(transparency.breakdown),

      counts: {
        promesses: transparency.totalPromises,
        votes: transparency.totalVotes,
        actions: transparency.totalActions,
      },

      detail: toSnakeCase(transparency),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/elus/:id/contact
 * Relayer un message d'un citoyen à un élu via email (Brevo SMTP)
 * Rate limit : 3 messages / heure / utilisateur
 * Body : { sujet, message }
 */
const contactSchema = z.object({
  sujet: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
});

router.post(
  '/:id/contact',
  authMiddleware,
  eluContactLimiter,
  async (req, res, next) => {
    try {
      const idValidation = idSchema.safeParse({ id: req.params.id });
      if (!idValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'ID invalide',
        });
      }

      const bodyValidation = contactSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Payload invalide',
          details: bodyValidation.error.errors,
        });
      }

      const { id } = idValidation.data;
      const { sujet, message } = bodyValidation.data;

      const elu = await Elu.findByPk(id, {
        attributes: ['id', 'nom', 'titre', 'email'],
      });

      if (!elu) {
        return res.status(404).json({
          success: false,
          error: 'Élu non trouvé',
        });
      }

      if (!elu.email) {
        return res.status(422).json({
          success: false,
          error: "Cet élu n'a pas d'email public configuré",
        });
      }

      const citoyen = await User.findByPk(req.user.id, {
        attributes: ['id', 'username', 'email'],
      });

      if (!citoyen) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non trouvé',
        });
      }

      try {
        await emailService.relayToElu(elu, citoyen, sujet, message);
      } catch (mailErr) {
        return res.status(502).json({
          success: false,
          error: "Échec d'envoi du message",
          details: mailErr.message,
        });
      }

      res.status(202).json({
        success: true,
        message: 'Message transmis',
        elu_id: id,
        elu_nom: elu.nom,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
