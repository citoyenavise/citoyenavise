/**
 * Routes Transparence - Classement des élus
 * GET /api/v1/transparency/ranking - Classement par score de transparence
 */

import express from 'express';
import { z } from 'zod';
import Elu from '../models/Elu.js';
import Promise from '../models/Promise.js';
import {
  calculateDetailedTransparencyScore,
  getTransparencyRating,
} from '../services/transparencyScore.js';

const router = express.Router();

const rankingQuerySchema = z.object({
  level: z.enum(['federal', 'provincial', 'municipal']).optional(),
  page: z.coerce.number().int().positive('Page doit être > 0').default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .default(10)
    .transform((v) => Math.min(v, 100)),
  sort: z.enum(['score', 'name']).default('score'),
});

// Mapping API (ASCII) → BD (avec accent)
// Le modèle Elu valide 'fédéral' (avec accent) mais l'API accepte 'federal' (sans accent)
// pour faciliter les query string. Cleanup F.4 (bug #26).
const NIVEAU_MAP = {
  federal: 'fédéral',
  provincial: 'provincial',
  municipal: 'municipal',
};

/**
 * GET /api/v1/transparency/ranking
 * Classement des élus par score de transparence
 */
router.get('/ranking', async (req, res, next) => {
  try {
    const validation = rankingQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres invalides',
        details: validation.error.errors,
      });
    }

    const { level, page, limit, sort } = validation.data;

    // Fetch tous les élus avec leurs promesses
    const where = {};
    if (level) {
      where.niveau = NIVEAU_MAP[level] || level;
    }

    const elus = await Elu.findAll({
      where,
      attributes: ['id', 'nom', 'titre', 'region', 'niveau'],
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

    // Calculer score de transparence pour chaque élu
    const elusWithScores = elus.map((elu) => {
      const transparency = calculateDetailedTransparencyScore(elu);
      const rating = getTransparencyRating(transparency.overall);

      return {
        id: elu.id,
        nom: elu.nom,
        titre: elu.titre,
        region: elu.region,
        niveau: elu.niveau,
        score: transparency.overall,
        rating: rating.rating,
        color: rating.color,
        breakdown: {
          totalPromises: transparency.totalPromises,
          completed: transparency.completed,
          inProgress: transparency.inProgress,
          abandoned: transparency.abandoned,
          committed: transparency.committed,
          completionRate: transparency.completionRate,
          keepRate: transparency.keepRate,
        },
      };
    });

    // Trier selon le paramètre sort
    if (sort === 'score') {
      elusWithScores.sort((a, b) => b.score - a.score);
    } else if (sort === 'name') {
      elusWithScores.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    }

    // Calculer pagination
    const total = elusWithScores.length;
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedData = elusWithScores.slice(skip, skip + limit);

    // Valider que page existe
    if (page > pages && total > 0) {
      return res.status(400).json({
        success: false,
        error: `Page ${page} n'existe pas (total: ${pages})`,
      });
    }

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
      filter: {
        level: level || 'all',
        sort,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/transparency/top
 * Top 5 élus par transparence (sans pagination)
 */
router.get('/top', async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit) || 5, 1), 100);

    const elus = await Elu.findAll({
      attributes: ['id', 'nom', 'titre', 'region', 'niveau'],
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

    const elusWithScores = elus
      .map((elu) => {
        const transparency = calculateDetailedTransparencyScore(elu);
        const rating = getTransparencyRating(transparency.overall);

        return {
          rank: 0, // sera défini après tri
          id: elu.id,
          nom: elu.nom,
          titre: elu.titre,
          region: elu.region,
          niveau: elu.niveau,
          score: transparency.overall,
          rating: rating.rating,
          color: rating.color,
          breakdown: {
            totalPromises: transparency.totalPromises,
            completed: transparency.completed,
            completionRate: transparency.completionRate,
          },
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limitNum)
      .map((elu, index) => ({
        ...elu,
        rank: index + 1,
      }));

    res.json({
      success: true,
      count: elusWithScores.length,
      data: elusWithScores,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/transparency/stats
 * Statistiques globales de transparence
 */
router.get('/stats', async (req, res, next) => {
  try {
    const { level } = req.query;

    const where = {};
    if (level) {
      where.niveau = NIVEAU_MAP[level] || level;
    }

    const elus = await Elu.findAll({
      where,
      attributes: ['id'],
      include: [
        {
          model: Promise,
          as: 'promises',
          attributes: ['status'],
          required: false,
        },
      ],
    });

    const elusWithScores = elus.map((elu) => {
      const transparency = calculateDetailedTransparencyScore(elu);
      return transparency.overall;
    });

    if (elusWithScores.length === 0) {
      return res.json({
        success: true,
        data: {
          count: 0,
          average: 0,
          median: 0,
          min: 0,
          max: 0,
          distribution: {},
        },
      });
    }

    const sortedScores = [...elusWithScores].sort((a, b) => a - b);
    const median =
      sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] +
            sortedScores[sortedScores.length / 2]) /
          2
        : sortedScores[Math.floor(sortedScores.length / 2)];

    const average = Math.round(
      elusWithScores.reduce((a, b) => a + b, 0) / elusWithScores.length
    );
    const min = Math.min(...elusWithScores);
    const max = Math.max(...elusWithScores);

    // Distribution par catégorie
    const distribution = {
      excellent: elusWithScores.filter((s) => s >= 80).length,
      bon: elusWithScores.filter((s) => s >= 60 && s < 80).length,
      moyen: elusWithScores.filter((s) => s >= 40 && s < 60).length,
      faible: elusWithScores.filter((s) => s < 40).length,
    };

    res.json({
      success: true,
      data: {
        count: elusWithScores.length,
        average,
        median: Math.round(median),
        min,
        max,
        distribution,
      },
      filter: {
        level: level || 'all',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
