/**
 * Civic Tutorials Routes (Tutoriels Civiques Interactifs)
 * Routes pour l'apprentissage Ã©ducatif + actions civiques rÃ©elles
 * GET    /api/v1/tutorials
 * GET    /api/v1/tutorials/:id
 * GET    /api/v1/tutorials/:id/steps (Protected)
 * POST   /api/v1/tutorials/:id/start (Protected)
 * POST   /api/v1/tutorials/:tutorialId/steps/:stepId/complete (Protected)
 * POST   /api/v1/tutorials/:id/complete (Protected)
 * POST   /api/v1/tutorials/:id/civic-action (Protected)
 * GET    /api/v1/tutorials/dashboard (Protected)
 */

import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { CivicTutorialService } from '../services/CivicTutorialService.js';
import { logger } from '../middlewares/logger.js';

const router = express.Router();

/**
 * GET /api/v1/tutorials
 * Get all available tutorials
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    const tutorials = await CivicTutorialService.getAllTutorials(category);

    res.json({
      success: true,
      data: tutorials.map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.titleFr,
        description: t.descriptionFr,
        category: t.category,
        difficulty: t.difficultyLevel,
        estimatedDuration: t.estimatedDurationMinutes,
        icon: t.iconUrl,
        stats: t.stats,
      })),
    });
  } catch (err) {
    logger.error('Error fetching tutorials', {
      meta: { error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/tutorials/:id
 * Get tutorial detail with all steps and resources
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const tutorial = await CivicTutorialService.getTutorialDetail(id);

    // Check access if authenticated
    let canAccess = true;
    if (userId) {
      canAccess = await CivicTutorialService.canAccessTutorial(userId, id);
    }

    res.json({
      success: true,
      data: {
        ...tutorial.toJSON(),
        canAccess,
      },
    });
  } catch (err) {
    logger.error('Error fetching tutorial detail', {
      meta: { tutorialId: req.params.id, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/tutorials/:id/start
 * Start a tutorial
 * Protected endpoint
 */
router.post('/:id/start', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check access
    const canAccess = await CivicTutorialService.canAccessTutorial(userId, id);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Prerequisites not completed',
      });
    }

    const progress = await CivicTutorialService.startTutorial(userId, id);

    res.status(201).json({
      success: true,
      data: {
        id: progress.id,
        status: progress.status,
        startedAt: progress.startedAt,
        currentStep: progress.currentStepNumber,
      },
    });
  } catch (err) {
    logger.error('Error starting tutorial', {
      meta: {
        userId: req.user.id,
        tutorialId: req.params.id,
        error: err.message,
      },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/tutorials/:id/progress
 * Get user's progress on tutorial
 * Protected endpoint
 */
router.get('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const progress = await CivicTutorialService.getUserTutorialProgress(
      userId,
      id
    );

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'No progress found',
      });
    }

    res.json({
      success: true,
      data: {
        status: progress.status,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
        currentStep: progress.currentStepNumber,
        stepsCompleted: progress.stepProgress?.length || 0,
      },
    });
  } catch (err) {
    logger.error('Error fetching tutorial progress', {
      meta: {
        userId: req.user.id,
        tutorialId: req.params.id,
        error: err.message,
      },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/tutorials/:tutorialId/steps/:stepId/complete
 * Complete a tutorial step
 * Protected endpoint
 */
router.post(
  '/:tutorialId/steps/:stepId/complete',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { tutorialId, stepId } = req.params;
      const { userResponse } = req.body;

      const stepProgress = await CivicTutorialService.completeStep(
        userId,
        tutorialId,
        stepId,
        userResponse
      );

      res.json({
        success: true,
        data: {
          id: stepProgress.id,
          status: stepProgress.status,
          completedAt: stepProgress.completedAt,
        },
      });
    } catch (err) {
      logger.error('Error completing step', {
        meta: {
          userId: req.user.id,
          tutorialId: req.params.tutorialId,
          stepId: req.params.stepId,
          error: err.message,
        },
      });
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/**
 * POST /api/v1/tutorials/:id/complete
 * Complete entire tutorial
 * Protected endpoint
 */
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await CivicTutorialService.completeTutorial(userId, id);

    res.json({
      success: true,
      data: {
        completed: result.completed,
        xpEarned: result.xpEarned,
        newBadges: result.newBadges.map((b) => ({
          id: b.id,
          name: b.nameFr,
          icon: b.iconUrl,
        })),
      },
    });
  } catch (err) {
    logger.error('Error completing tutorial', {
      meta: {
        userId: req.user.id,
        tutorialId: req.params.id,
        error: err.message,
      },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/tutorials/:id/civic-action
 * Record a civic action (real-world action taken)
 * Protected endpoint
 */
router.post('/:id/civic-action', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const tutorialId = req.params.id;
    const { actionType, actionData } = req.body;

    if (!actionType) {
      return res.status(400).json({
        success: false,
        error: 'actionType is required',
      });
    }

    const result = await CivicTutorialService.recordCivicAction(
      userId,
      tutorialId,
      actionType,
      actionData || {}
    );

    res.status(201).json({
      success: true,
      data: {
        civicActionId: result.civicAction.id,
        actionType: result.civicAction.actionType,
        recordedAt: result.civicAction.confirmationDate,
        newBadges: result.newBadges,
      },
    });
  } catch (err) {
    logger.error('Error recording civic action', {
      meta: {
        userId: req.user.id,
        tutorialId: req.params.id,
        error: err.message,
      },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/tutorials/dashboard
 * Get user's tutorial progress dashboard
 * Protected endpoint
 */
router.get('/dashboard/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const dashboard =
      await CivicTutorialService.getUserTutorialDashboard(userId);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (err) {
    logger.error('Error fetching tutorial dashboard', {
      meta: { userId: req.user.id, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/tutorials/civic-actions/user
 * Get user's civic actions
 * Protected endpoint
 */
router.get('/civic-actions/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const actions = await CivicTutorialService.getUserCivicActions(
      userId,
      limit
    );

    res.json({
      success: true,
      data: actions.map((a) => ({
        id: a.id,
        actionType: a.actionType,
        tutorialSlug: a.tutorial?.slug,
        recordedAt: a.createdAt,
      })),
    });
  } catch (err) {
    logger.error('Error fetching civic actions', {
      meta: { userId: req.user.id, error: err.message },
    });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
