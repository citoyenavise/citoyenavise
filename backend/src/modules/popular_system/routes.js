/**
 * Routes — Popular System
 * API pour les contenus populaires et trending
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authOptional } = require('../../core/middleware/auth');
const controller = require('./controller');

const router = express.Router();

/**
 * GET /api/v1/popular/ideas — Idées populaires
 */
router.get(
  '/ideas',
  authOptional,
  asyncHandler(controller.getPopularIdeas)
);

/**
 * GET /api/v1/popular/posts — Posts populaires
 */
router.get(
  '/posts',
  authOptional,
  asyncHandler(controller.getPopularPosts)
);

/**
 * GET /api/v1/popular/trending — Trending (24h)
 */
router.get(
  '/trending',
  authOptional,
  asyncHandler(controller.getTrending)
);

/**
 * GET /api/v1/popular/homepage — Données pour homepage
 */
router.get(
  '/homepage',
  authOptional,
  asyncHandler(controller.getHomepageData)
);

module.exports = router;
