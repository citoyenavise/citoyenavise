/**
 * Routes — Likes
 * API pour les likes sur posts/idées
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired, authOptional } = require('../../core/middleware/auth');
const controller = require('./controller');

const router = express.Router();

/**
 * POST /api/v1/likes — Liker un post
 * Body: { postId }
 */
router.post(
  '/',
  authRequired,
  asyncHandler(controller.likePost)
);

/**
 * DELETE /api/v1/likes/:postId — Retirer un like
 */
router.delete(
  '/:postId',
  authRequired,
  asyncHandler(controller.unlikePost)
);

/**
 * GET /api/v1/posts/:postId/likes — Lister les utilisateurs qui ont aimé
 */
router.get(
  '/posts/:postId/likes',
  authOptional,
  asyncHandler(controller.getPostLikes)
);

/**
 * GET /api/v1/posts/:postId/likes/check — Vérifier si l'utilisateur a aimé
 */
router.get(
  '/posts/:postId/likes/check',
  authRequired,
  asyncHandler(controller.checkLike)
);

module.exports = router;
