/**
 * Routes pour les élus (Députés, Sénateurs, Maires, Conseillers)
 * Endpoints publics — Pas d'authentification requise
 */

import express from 'express';
import { z } from 'zod';
import Elu from '../models/Elu.js';
import Petition from '../models/Petition.js';
import Promise from '../models/Promise.js';
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
        'region',
        'niveau',
        'email',
        'photoUrl',
        'siteWeb',
        'latitude',
        'longitude',
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
        'region',
        'niveau',
        'email',
        'photoUrl',
        'siteWeb',
        'latitude',
        'longitude',
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
      data: promises.map(p => toSnakeCase(p.toJSON())),
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
      breakdown: toSnakeCase(transparency.breakdown || {
        completionRate: transparency.completionRate,
        keepRate: transparency.keepRate,
      }),
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
      data: petitions.map(p => toSnakeCase(p.toJSON())),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
