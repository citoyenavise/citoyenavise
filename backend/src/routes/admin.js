/**
 * Admin Routes
 * Routes protÃ©gÃ©es pour l'administration de la plateforme
 * Gestion des missions, badges, utilisateurs, modÃ©ration
 * GET    /api/v1/admin/stats
 * GET    /api/v1/admin/users
 * POST   /api/v1/admin/missions
 * PUT    /api/v1/admin/missions/:id
 * DELETE /api/v1/admin/missions/:id
 * POST   /api/v1/admin/badges
 * PUT    /api/v1/admin/badges/:id
 * DELETE /api/v1/admin/badges/:id
 * POST   /api/v1/admin/users/:id/role
 */

import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { checkAdmin } from '../middlewares/admin.js';
import {
  User,
  Mission,
  Badge,
  UserProgression,
  UserAction,
  UserMissionProgress,
  Elu,
  Promise as PromiseModel,
} from '../models/index.js';
import { Sequelize } from 'sequelize';
import { logger } from '../middlewares/logger.js'
import { calculateDetailedTransparencyScore, getTransparencyRating } from '../services/transparencyScore.js';

const router = express.Router();

// Apply auth + admin check to all routes
router.use(authMiddleware, checkAdmin);

/**
 * GET /api/v1/admin/stats
 * Get platform statistics including transparency scores
 */
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalAdmins = await User.count({ where: { role: 'admin' } });
    const totalActions = await UserAction.count();
    const totalMissions = await Mission.count();
    const totalBadges = await Badge.count();

    const avgUserLevel = await UserProgression.findOne({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('level')), 'avgLevel'],
        [Sequelize.fn('MAX', Sequelize.col('level')), 'maxLevel'],
        [Sequelize.fn('AVG', Sequelize.col('totalXp')), 'avgXp'],
      ],
    });

    const missionsCompleted = await UserMissionProgress.count({
      where: { status: 'completed' },
    });

    // Promises and transparency stats
    const totalPromises = await PromiseModel.count();
    const promisesCompleted = await PromiseModel.count({ where: { status: 'completee' } });
    const promisesInProgress = await PromiseModel.count({ where: { status: 'en_cours' } });
    const promisesAbandoned = await PromiseModel.count({ where: { status: 'abandonnee' } });

    // Calculate average transparency score
    const elus = await Elu.findAll({
      include: [{ model: PromiseModel, as: 'Promises', attributes: ['status'], required: false }],
    });

    let avgTransparencyScore = 0;
    if (elus.length > 0) {
      const transparencyScores = elus.map(elu => {
        const transparency = calculateDetailedTransparencyScore(elu);
        return transparency.overall;
      });
      avgTransparencyScore = Math.round(
        transparencyScores.reduce((a, b) => a + b, 0) / transparencyScores.length
      );
    }

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
          citizens: totalUsers - totalAdmins,
        },
        platform: {
          totalActions,
          totalMissions,
          totalBadges,
          missionsCompleted,
        },
        promises: {
          total: totalPromises,
          completed: promisesCompleted,
          inProgress: promisesInProgress,
          abandoned: promisesAbandoned,
          completionRate: totalPromises > 0 ? Math.round((promisesCompleted / totalPromises) * 100) : 0,
        },
        transparency: {
          averageScore: avgTransparencyScore,
          totalElus: elus.length,
        },
        progression: {
          avgLevel: Math.round(avgUserLevel?.dataValues?.avgLevel || 1),
          maxLevel: avgUserLevel?.dataValues?.maxLevel || 1,
          avgXp: Math.round(avgUserLevel?.dataValues?.avgXp || 0),
        },
      },
    });
  } catch (err) {
    logger.error('Error fetching admin stats', {
      meta: { error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/admin/users
 * List all users with optional filters
 */
router.get('/users', async (req, res) => {
  try {
    const { role, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (role) where.role = role;

    const users = await User.findAll({
      where,
      attributes: ['id', 'email', 'nomComplet', 'role', 'createdAt'],
      limit: Math.min(parseInt(limit) || 50, 100),
      offset: parseInt(offset) || 0,
      order: [['createdAt', 'DESC']],
    });

    const total = await User.count({ where });

    res.json({
      success: true,
      data: users,
      total,
      limit,
      offset,
    });
  } catch (err) {
    logger.error('Error fetching users', {
      meta: { error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/admin/users/:id/role
 * Change user role
 */
router.post('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['citizen', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be citizen or admin',
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const oldRole = user.role;
    await user.update({ role });

    logger.info(`User role changed by admin`, {
      meta: { userId: id, oldRole, newRole: role, adminId: req.user.id },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        oldRole,
        newRole: user.role,
      },
    });
  } catch (err) {
    logger.error('Error updating user role', {
      meta: { userId: req.params.id, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/admin/missions
 * Create a new mission
 */
router.post('/missions', async (req, res) => {
  try {
    const {
      missionKey,
      titleFr,
      descriptionFr,
      category,
      frequency,
      xpReward,
      completionCriteria,
      displayOrder,
    } = req.body;

    // Validation
    if (!missionKey || !titleFr || !category || !frequency || !xpReward) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const mission = await Mission.create({
      missionKey,
      titleFr,
      descriptionFr,
      category,
      frequency,
      xpReward,
      completionCriteria: completionCriteria || {},
      displayOrder,
    });

    logger.info(`Mission created by admin`, {
      meta: { missionId: mission.id, adminId: req.user.id },
    });

    res.status(201).json({
      success: true,
      data: mission,
    });
  } catch (err) {
    logger.error('Error creating mission', {
      meta: { error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * PUT /api/v1/admin/missions/:id
 * Update a mission
 */
router.put('/missions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const mission = await Mission.findByPk(id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found',
      });
    }

    await mission.update(updates);

    logger.info(`Mission updated by admin`, {
      meta: { missionId: id, adminId: req.user.id },
    });

    res.json({
      success: true,
      data: mission,
    });
  } catch (err) {
    logger.error('Error updating mission', {
      meta: { missionId: req.params.id, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * DELETE /api/v1/admin/missions/:id
 * Delete a mission
 */
router.delete('/missions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const mission = await Mission.findByPk(id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found',
      });
    }

    await mission.destroy();

    logger.info(`Mission deleted by admin`, {
      meta: { missionId: id, adminId: req.user.id },
    });

    res.json({
      success: true,
      message: 'Mission deleted successfully',
    });
  } catch (err) {
    logger.error('Error deleting mission', {
      meta: { missionId: req.params.id, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/admin/badges
 * Create a new badge
 */
router.post('/badges', async (req, res) => {
  try {
    const {
      badgeKey,
      nameFr,
      descriptionFr,
      category,
      iconUrl,
      rarity,
      unlockCriteria,
    } = req.body;

    if (!badgeKey || !nameFr || !category || !unlockCriteria) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const badge = await Badge.create({
      badgeKey,
      nameFr,
      descriptionFr,
      category,
      iconUrl,
      rarity: rarity || 'common',
      unlockCriteria,
    });

    logger.info(`Badge created by admin`, {
      meta: { badgeId: badge.id, adminId: req.user.id },
    });

    res.status(201).json({
      success: true,
      data: badge,
    });
  } catch (err) {
    logger.error('Error creating badge', {
      meta: { error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * PUT /api/v1/admin/badges/:id
 * Update a badge
 */
router.put('/badges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const badge = await Badge.findByPk(id);

    if (!badge) {
      return res.status(404).json({
        success: false,
        error: 'Badge not found',
      });
    }

    await badge.update(updates);

    logger.info(`Badge updated by admin`, {
      meta: { badgeId: id, adminId: req.user.id },
    });

    res.json({
      success: true,
      data: badge,
    });
  } catch (err) {
    logger.error('Error updating badge', {
      meta: { badgeId: req.params.id, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * DELETE /api/v1/admin/badges/:id
 * Delete a badge
 */
router.delete('/badges/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const badge = await Badge.findByPk(id);

    if (!badge) {
      return res.status(404).json({
        success: false,
        error: 'Badge not found',
      });
    }

    await badge.destroy();

    logger.info(`Badge deleted by admin`, {
      meta: { badgeId: id, adminId: req.user.id },
    });

    res.json({
      success: true,
      message: 'Badge deleted successfully',
    });
  } catch (err) {
    logger.error('Error deleting badge', {
      meta: { badgeId: req.params.id, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;

