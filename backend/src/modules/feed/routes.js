/**
 * Feed Routes
 */

const express = require('express');
const router = express.Router();

const { authOptional } = require('../../core/middleware/auth');
const FeedController = require('./controllers/feed.controller');

/**
 * GET /api/v1/feed — Smart feed with temporal scoring
 */
const { asyncHandler } = require('../../core/middleware/errorHandler');

router.get('/', authOptional, asyncHandler(FeedController.getFeed));

module.exports = router;
