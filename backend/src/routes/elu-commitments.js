/**
 * Routes pour les engagements des élus
 * Endpoints : GET list, GET/:id, POST track (protected), DELETE track (protected)
 */

import express from 'express';
import { EluCommitment, CommitmentUpdate, CommitmentTracking } from '../models/EluCommitment.js';
import { authMiddleware, authOptional } from '../middlewares/auth.js';

const router = express.Router();

/**
 * GET /api/v1/elu-commitments
 * Lister tous les engagements avec filtres optionnels
 * Query: { elu_id, status, search, limit, offset }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "elu_id": 1,
 *       "titre": "Augmenter le financement des écoles",
 *       "description": "...",
 *       "status": "en cours",
 *       "deadline": "2026-12-31T...",
 *       "created_at": "...",
 *       "completed_at": null,
 *       "track_count": 42
 *     }
 *   ]
 * }
 */
router.get('/', async (req, res, next) => {
  try {
    const { elu_id, status, search, limit = 20, offset = 0 } = req.query;

    const commitments = await EluCommitment.list({
      elu_id: elu_id ? parseInt(elu_id, 10) : undefined,
      status,
      search,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: commitments
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elu-commitments/:id
 * Obtenir un engagement spécifique
 *
 * Response:
 * {
 *   "success": true,
 *   "data": { id, elu_id, titre, ..., track_count },
 *   "updates": [ { id, contenu, status_change, author_id, created_at }, ... ],
 *   "tracking": [ { id, citoyen_id, email, nom_complet, tracked_at }, ... ]
 * }
 */
router.get('/:id', authOptional, async (req, res, next) => {
  try {
    const { id } = req.params;

    const commitment = await EluCommitment.findById(id);

    if (!commitment) {
      return res.status(404).json({
        success: false,
        error: 'Engagement non trouvé'
      });
    }

    const updates = await CommitmentUpdate.getUpdates(id);
    const tracking = await CommitmentTracking.getTracking(id);

    let isTracking = false;
    if (req.user) {
      isTracking = await CommitmentTracking.isTracking(id, req.user.userId);
    }

    res.json({
      success: true,
      data: commitment,
      updates,
      tracking,
      isTracking
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elu-commitments/elu/:eluId
 * Lister les engagements d'un élu spécifique
 * Query: { status, search, limit, offset }
 */
router.get('/elu/:eluId', async (req, res, next) => {
  try {
    const { eluId } = req.params;
    const { status, search, limit = 20, offset = 0 } = req.query;

    const commitments = await EluCommitment.findByElu(parseInt(eluId, 10), {
      status,
      search,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: commitments
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elu-commitments/status/:status
 * Filtrer les engagements par statut
 * Query: { limit, offset }
 */
router.get('/status/:status', async (req, res, next) => {
  try {
    const { status } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const commitments = await EluCommitment.list({
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: commitments
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elu-commitments/search
 * Rechercher des engagements
 * Query: { q (search term), limit, offset }
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Au moins 2 caractères requis'
      });
    }

    const commitments = await EluCommitment.search(q, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: commitments
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elu-commitments/stats
 * Obtenir statistiques sur les engagements
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await EluCommitment.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/elu-commitments/:id/track
 * Suivre un engagement (citoyen s'abonne)
 * Requires: JWT token
 */
router.post('/:id/track', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const commitmentId = parseInt(id, 10);

    const commitment = await EluCommitment.findById(commitmentId);

    if (!commitment) {
      return res.status(404).json({
        success: false,
        error: 'Engagement non trouvé'
      });
    }

    const tracking = await CommitmentTracking.track(commitmentId, req.user.userId);

    if (tracking.error) {
      return res.status(409).json({
        success: false,
        error: 'Vous suivez déjà cet engagement'
      });
    }

    res.status(201).json({
      success: true,
      data: tracking
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/elu-commitments/:id/track
 * Arrêter de suivre un engagement
 * Requires: JWT token
 */
router.delete('/:id/track', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await CommitmentTracking.untrack(id, req.user.userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Vous ne suiviez pas cet engagement'
      });
    }

    res.json({
      success: true,
      message: 'Vous ne suivez plus cet engagement'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
