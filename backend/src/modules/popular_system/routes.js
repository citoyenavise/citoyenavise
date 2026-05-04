/**
 * Routes — Popular System
 * API pour les contenus populaires avec scoring temporal
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authOptional } = require('../../core/middleware/auth');
const PopularController = require('./controller');

const router = express.Router();

/**
 * GET /api/v1/popular — Posts populaires avec scoring temporal
 * Params: range (daily|weekly|monthly|all), sort (score|likes|comments), page, limit
 */
router.get(
  '/',
  authOptional,
  asyncHandler(PopularController.getPopular)
);

module.exports = router;
