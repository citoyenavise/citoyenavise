/**
 * Gamification Routes
 * Endpoints for user progression, missions, badges, and achievements
 * GET  /api/v1/gamification/progression
 * GET  /api/v1/gamification/leaderboard
 * GET  /api/v1/gamification/missions
 * GET  /api/v1/gamification/badges
 * POST /api/v1/gamification/missions/:missionId/start (protected)
 * POST /api/v1/gamification/missions/:missionId/complete (protected)
 */

import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { ActionLoggerService } from '../services/ActionLoggerService.js';
import { MissionEngineService } from '../services/MissionEngineService.js';
import { BadgeService } from '../services/BadgeService.js';
import { Mission, Badge } from '../models/index.js';
import { logger } from '../middlewares/logger.js'

const router = express.Router();

/**
 * GET /api/v1/gamification/progression
 * Get user's progression, level, XP, badges, and stats
 * Protected - requires authentication
 */
router.get('/progression', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const progression = await ActionLoggerService.getProgressionSummary(userId);
    const badges = await BadgeService.getUserBadges(userId);
    const badgeStats = await BadgeService.getBadgeStats(userId);
    const missionStats = await MissionEngineService.getUserMissionStats(userId);

    res.json({
      success: true,
      data: {
        progression,
        badges: badges.map(b => ({
          id: b.badge.id,
          name: b.badge.nameFr,
          category: b.badge.category,
          icon: b.badge.iconUrl,
          rarity: b.badge.rarity,
          unlockedAt: b.unlockedAt,
        })),
        stats: {
          badges: badgeStats,
          missions: missionStats,
        },
      },
    });
  } catch (err) {
    logger.error('Error fetching progression', {
      meta: { userId: req.user.id, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/gamification/leaderboard
 * Get global leaderboard (top 50 users by XP)
 * Public endpoint
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const leaderboard = await ActionLoggerService.getLeaderboard(
      Math.min(parseInt(limit) || 50, 100)
    );

    res.json({
      success: true,
      data: leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        userName: entry.user?.nom || 'Anonymous',
        level: entry.level,
        totalXp: entry.totalXp,
        totalActions: entry.totalActions,
        totalBadgesEarned: entry.totalBadgesEarned,
      })),
    });
  } catch (err) {
    logger.error('Error fetching leaderboard', {
      meta: { error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/gamification/missions
 * Get all active missions for user
 * Query params: frequency (daily/weekly/monthly)
 * Protected endpoint
 */
router.get('/missions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { frequency } = req.query;

    const missions = await MissionEngineService.getActiveMissions(
      userId,
      frequency
    );

    res.json({
      success: true,
      data: missions.map(m => ({
        id: m.id,
        title: m.titleFr,
        description: m.descriptionFr,
        category: m.category,
        frequency: m.frequency,
        xpReward: m.xpReward,
        criteria: m.completionCriteria,
        progress: m.userProgress,
      })),
    });
  } catch (err) {
    logger.error('Error fetching missions', {
      meta: { userId: req.user.id, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/gamification/missions/completed
 * Get user's completed missions
 * Protected endpoint
 */
router.get('/missions/completed', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const { data, total } = await MissionEngineService.getCompletedMissions(
      userId,
      parseInt(limit) || 20,
      parseInt(offset) || 0
    );

    res.json({
      success: true,
      data: data.map(m => ({
        id: m.id,
        title: m.mission.titleFr,
        category: m.mission.category,
        xpReward: m.mission.xpReward,
        completedAt: m.completedAt,
      })),
      total,
    });
  } catch (err) {
    logger.error('Error fetching completed missions', {
      meta: { userId: req.user.id, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/gamification/missions/:missionId/start
 * Start a mission
 * Protected endpoint
 */
router.post('/missions/:missionId/start', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { missionId } = req.params;

    const progress = await MissionEngineService.startMission(userId, missionId);

    res.status(201).json({
      success: true,
      data: {
        id: progress.id,
        status: progress.status,
        startedAt: progress.startedAt,
      },
    });
  } catch (err) {
    logger.error('Error starting mission', {
      meta: { userId: req.user.id, missionId: req.params.missionId, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/gamification/missions/:missionId/complete
 * Complete a mission
 * Protected endpoint
 */
router.post('/missions/:missionId/complete', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { missionId } = req.params;

    // Find user mission progress
    const progress = await MissionEngineService.getActiveMissions(userId);
    const userProgress = progress.find(m => m.id === parseInt(missionId))?.userProgress;

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found in user progress',
      });
    }

    // Complete the mission
    const completed = await MissionEngineService.completeMission(userProgress.id);

    // Check for new badge unlocks
    const newBadges = await BadgeService.checkAndUnlockBadges(userId);

    res.json({
      success: true,
      data: {
        mission: {
          id: completed.id,
          status: completed.status,
          completedAt: completed.completedAt,
        },
        newBadges: newBadges.map(b => ({
          id: b.id,
          name: b.nameFr,
          icon: b.iconUrl,
          rarity: b.rarity,
        })),
      },
    });
  } catch (err) {
    logger.error('Error completing mission', {
      meta: { userId: req.user.id, missionId: req.params.missionId, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/gamification/badges
 * Get all badges and user's progress toward them
 * Protected endpoint
 */
router.get('/badges', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;

    const badgeProgress = await BadgeService.getBadgeProgress(userId);
    const filtered = category
      ? badgeProgress.filter(b => b.category === category)
      : badgeProgress;

    res.json({
      success: true,
      data: filtered.map(b => ({
        id: b.id,
        name: b.nameFr,
        description: b.descriptionFr,
        category: b.category,
        icon: b.iconUrl,
        rarity: b.rarity,
        unlocked: b.unlocked,
        progress: b.progress,
        criteria: b.unlockCriteria,
      })),
    });
  } catch (err) {
    logger.error('Error fetching badges', {
      meta: { userId: req.user.id, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/gamification/badges/:badgeId
 * Get single badge details
 * Public endpoint
 */
router.get('/badges/:badgeId', async (req, res) => {
  try {
    const { badgeId } = req.params;

    const badge = await Badge.findByPk(badgeId);

    if (!badge) {
      return res.status(404).json({
        success: false,
        error: 'Badge not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: badge.id,
        name: badge.nameFr,
        description: badge.descriptionFr,
        category: badge.category,
        icon: badge.iconUrl,
        rarity: badge.rarity,
        criteria: badge.unlockCriteria,
      },
    });
  } catch (err) {
    logger.error('Error fetching badge', {
      meta: { badgeId: req.params.badgeId, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;

