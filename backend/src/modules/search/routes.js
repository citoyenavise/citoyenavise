/**
 * Routes de recherche
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const controller = require('./controller');

const router = express.Router();

/**
 * @openapi
 * /api/v1/search:
 *   get:
 *     summary: Search across all types
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (minimum 2 characters)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [posts, users, all]
 *         default: all
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, recent, popular]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Validation error
 */
router.get('/', asyncHandler(controller.search));

/**
 * @openapi
 * /api/v1/search/posts:
 *   get:
 *     summary: Search posts only
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, recent, popular]
 *     responses:
 *       200:
 *         description: Post search results
 */
router.get('/posts', asyncHandler(controller.searchPostsOnly));

/**
 * @openapi
 * /api/v1/search/users:
 *   get:
 *     summary: Search users only
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User search results
 */
router.get('/users', asyncHandler(controller.searchUsersOnly));

module.exports = router;
