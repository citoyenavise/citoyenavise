/**
 * Routes pour les élus (Députés, Sénateurs, Maires, Conseillers)
 * Endpoints publics — Pas d'authentification requise
 */

import express from 'express';
import { Elu, EluContact, EluSocialMedia } from '../models/Elu.js';

const router = express.Router();

/**
 * GET /api/v1/elus
 * Lister élus avec filtres
 * Query params: niveau, région, titre, search, limit, offset
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      niveau,
      région,
      titre,
      search,
      limit = 50,
      offset = 0
    } = req.query;

    const filters = {
      niveau,
      région,
      titre,
      searchTerm: search
    };

    const elus = await Elu.list(
      filters,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      count: elus.length,
      data: elus
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id
 * Obtenir détail élu avec contacts et réseaux sociaux
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const elu = await Elu.findByIdWithContacts(parseInt(id));

    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé'
      });
    }

    res.json({
      success: true,
      data: elu
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/niveau/:niveau
 * Lister élus par niveau (fédéral, provincial, municipal)
 */
router.get('/niveau/:niveau', async (req, res, next) => {
  try {
    const { niveau } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const validNiveaux = ['fédéral', 'provincial', 'municipal'];
    if (!validNiveaux.includes(niveau)) {
      return res.status(400).json({
        success: false,
        error: `Niveau invalide. Doit être: ${validNiveaux.join(', ')}`
      });
    }

    const elus = await Elu.listByNiveau(
      niveau,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      niveau,
      count: elus.length,
      data: elus
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/région/:région
 * Lister élus par région
 */
router.get('/région/:région', async (req, res, next) => {
  try {
    const { région } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const elus = await Elu.listByRégion(
      région,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      région,
      count: elus.length,
      data: elus
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/titre/:titre
 * Lister élus par titre
 */
router.get('/titre/:titre', async (req, res, next) => {
  try {
    const { titre } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const elus = await Elu.listByTitre(
      titre,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      titre,
      count: elus.length,
      data: elus
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/search?q=terme
 * Chercher élus par nom
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, limit = 50, offset = 0 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Terme de recherche doit avoir minimum 2 caractères'
      });
    }

    const elus = await Elu.search(
      q,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      searchTerm: q,
      count: elus.length,
      data: elus
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/stats
 * Obtenir statistiques élus
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Elu.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
});

export default router;
