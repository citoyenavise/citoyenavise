/**
 * Routes pour les Promesses Ã‰lectorales
 * GET  /api/v1/promises
 * GET  /api/v1/promises/:id
 * GET  /api/v1/elus/:eluId/promises
 * POST /api/v1/elus/:eluId/promises (protected)
 * PUT  /api/v1/promises/:id (protected)
 * DELETE /api/v1/promises/:id (protected)
 */

import express from 'express';
import { Promise as PromiseModel, Elu } from '../models/index.js';
import { authMiddleware } from '../middlewares/auth.js';
import { logger } from '../middlewares/logger.js';
import {
  calculateDetailedTransparencyScore,
  getTransparencyRating,
} from '../services/transparencyScore.js';

const router = express.Router();

/**
 * GET /api/v1/promises
 * List all promises with transparency scores
 */
router.get('/', async (req, res) => {
  try {
    const { status, eluId, limit = 20, offset = 0 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (eluId) where.eluId = parseInt(eluId);

    const promises = await PromiseModel.findAll({
      where,
      include: [
        {
          model: Elu,
          as: 'elu',
          include: [
            {
              model: PromiseModel,
              as: 'Promises',
              attributes: ['status'],
              required: false,
            },
          ],
        },
      ],
      limit: Math.min(parseInt(limit) || 20, 100),
      offset: parseInt(offset) || 0,
      order: [['deadline', 'ASC']],
    });

    const total = await PromiseModel.count({ where });

    const promisesWithTransparency = promises.map((promise) => {
      const transparency = calculateDetailedTransparencyScore(promise.elu);
      const rating = getTransparencyRating(transparency.overall);

      return {
        ...promise.toJSON(),
        eluTransparency: {
          score: transparency.overall,
          rating: rating.rating,
          color: rating.color,
        },
      };
    });

    res.json({
      success: true,
      data: promisesWithTransparency,
      total,
      limit,
      offset,
    });
  } catch (err) {
    logger.error('Error fetching promises', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/promises/:id
 * Get promise detail with transparency score
 */
router.get('/:id', async (req, res) => {
  try {
    const promise = await PromiseModel.findByPk(req.params.id, {
      include: [
        {
          model: Elu,
          as: 'elu',
          include: [
            {
              model: PromiseModel,
              as: 'Promises',
              attributes: ['status'],
              required: false,
            },
          ],
        },
      ],
    });

    if (!promise) {
      return res.status(404).json({
        success: false,
        error: 'Promise not found',
      });
    }

    const transparency = calculateDetailedTransparencyScore(promise.elu);
    const rating = getTransparencyRating(transparency.overall);

    res.json({
      success: true,
      data: {
        ...promise.toJSON(),
        eluTransparency: {
          score: transparency.overall,
          rating: rating.rating,
          color: rating.color,
          details: transparency,
        },
      },
    });
  } catch (err) {
    logger.error('Error fetching promise', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/elus/:eluId/promises
 * Get all promises for an elected official with transparency score
 */
router.get('/elu/:eluId', async (req, res) => {
  try {
    const { eluId } = req.params;
    const { status } = req.query;

    const where = { eluId };
    if (status) where.status = status;

    const elu = await Elu.findByPk(eluId);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Elu not found',
      });
    }

    const promises = await PromiseModel.findAll({
      where,
      order: [['deadline', 'ASC']],
    });

    const transparency = calculateDetailedTransparencyScore({
      Promises: promises,
    });
    const rating = getTransparencyRating(transparency.overall);

    res.json({
      success: true,
      eluId,
      eluNom: elu.nom,
      transparency,
      rating,
      data: promises,
      count: promises.length,
    });
  } catch (err) {
    logger.error('Error fetching elu promises', {
      meta: { error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/elus/:eluId/promises
 * Create a new promise (protected - admin only)
 */
router.post('/:eluId/promises', authMiddleware, async (req, res) => {
  try {
    const { eluId } = req.params;
    const { titre, description, status, deadline } = req.body;

    // Validate required fields
    if (!titre) {
      return res.status(400).json({
        success: false,
        error: 'Titre is required',
      });
    }

    // Check if elu exists
    const elu = await Elu.findByPk(eluId);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Elu not found',
      });
    }

    // Create promise
    const promise = await PromiseModel.create({
      eluId,
      titre,
      description,
      status: status || 'engagee',
      deadline,
    });

    res.status(201).json({
      success: true,
      data: promise,
    });
  } catch (err) {
    logger.error('Error creating promise', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * PUT /api/v1/promises/:id
 * Update a promise (protected - admin only)
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { titre, description, status, deadline, completedAt } = req.body;

    const promise = await PromiseModel.findByPk(req.params.id);
    if (!promise) {
      return res.status(404).json({
        success: false,
        error: 'Promise not found',
      });
    }

    // Update fields
    if (titre) promise.titre = titre;
    if (description) promise.description = description;
    if (status) promise.status = status;
    if (deadline) promise.deadline = deadline;
    if (completedAt) promise.completedAt = completedAt;

    await promise.save();

    res.json({
      success: true,
      data: promise,
    });
  } catch (err) {
    logger.error('Error updating promise', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * PUT /api/v1/promises/:id/status
 * Update promise status (protected)
 */
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const validStatuses = ['engagee', 'en_cours', 'completee', 'abandonnee'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const promise = await PromiseModel.findByPk(req.params.id);
    if (!promise) {
      return res.status(404).json({
        success: false,
        error: 'Promise not found',
      });
    }

    promise.status = status;
    if (status === 'completee') {
      promise.completedAt = new Date();
    }

    await promise.save();

    res.json({
      success: true,
      data: promise,
    });
  } catch (err) {
    logger.error('Error updating promise status', {
      meta: { error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * DELETE /api/v1/promises/:id
 * Delete a promise (protected - admin only)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const promise = await PromiseModel.findByPk(req.params.id);
    if (!promise) {
      return res.status(404).json({
        success: false,
        error: 'Promise not found',
      });
    }

    await promise.destroy();

    res.json({
      success: true,
      message: 'Promise deleted successfully',
    });
  } catch (err) {
    logger.error('Error deleting promise', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
