/**
 * Routes pour les circonscriptions électorales
 * Endpoints publics — Pas d'authentification requise
 */

import express from 'express';
import {
  Circonscription,
  CodePostalCirconscription,
} from '../models/Circonscription.js';

const router = express.Router();

/**
 * GET /api/v1/circonscriptions
 * Lister circonscriptions avec filtres
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      niveau,
      région,
      search,
      codePostal,
      limit = 50,
      offset = 0,
    } = req.query;

    const filters = {
      niveau,
      région,
      searchTerm: search,
      codePostal,
    };

    const circonscriptions = await Circonscription.list(
      filters,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      count: circonscriptions.length,
      data: circonscriptions,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/circonscriptions/:id
 * Obtenir détail circonscription
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const circonscription = await Circonscription.findById(parseInt(id));

    if (!circonscription) {
      return res.status(404).json({
        success: false,
        error: 'Circonscription non trouvée',
      });
    }

    res.json({
      success: true,
      data: circonscription,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/circonscriptions/by-code-postal/:codePostal
 * Trouver circonscription(s) par code postal
 */
router.get('/by-code-postal/:codePostal', async (req, res, next) => {
  try {
    const { codePostal } = req.params;
    const { niveau } = req.query;

    const circonscriptions = await Circonscription.findByCodePostal(
      codePostal,
      niveau
    );

    res.json({
      success: true,
      codePostal,
      count: circonscriptions.length,
      data: circonscriptions,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/circonscriptions/by-région/:région
 * Lister circonscriptions par région
 */
router.get('/by-région/:région', async (req, res, next) => {
  try {
    const { région } = req.params;
    const { niveau, limit = 50, offset = 0 } = req.query;

    const circonscriptions = await Circonscription.findByRégion(région, niveau);

    res.json({
      success: true,
      région,
      count: circonscriptions.length,
      data: circonscriptions,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/circonscriptions/niveau/:niveau
 * Lister circonscriptions par niveau
 */
router.get('/niveau/:niveau', async (req, res, next) => {
  try {
    const { niveau } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const validNiveaux = ['fédéral', 'provincial', 'municipal'];
    if (!validNiveaux.includes(niveau)) {
      return res.status(400).json({
        success: false,
        error: `Niveau invalide. Doit être: ${validNiveaux.join(', ')}`,
      });
    }

    const circonscriptions = await Circonscription.listByNiveau(
      niveau,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      niveau,
      count: circonscriptions.length,
      data: circonscriptions,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/circonscriptions/search?q=terme
 * Chercher circonscriptions par nom
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, limit = 50, offset = 0 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Terme de recherche doit avoir minimum 2 caractères',
      });
    }

    const circonscriptions = await Circonscription.search(
      q,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      searchTerm: q,
      count: circonscriptions.length,
      data: circonscriptions,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/circonscriptions/stats
 * Obtenir statistiques
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Circonscription.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
