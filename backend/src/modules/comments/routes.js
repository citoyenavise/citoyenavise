/**
 * Routes — Comments
 * API pour les commentaires sur posts
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired } = require('../../core/middleware/auth');
const controller = require('./controller');

const router = express.Router();

/**
 * POST /api/v1/comments — Créer un commentaire
 * Body: { postId, content }
 */
router.post(
  '/',
  authRequired,
  asyncHandler(controller.createComment)
);

/**
 * GET /api/v1/posts/:postId/comments — Lister les commentaires
 */
router.get(
  '/posts/:postId/comments',
  asyncHandler(controller.getCommentsByPost)
);

/**
 * GET /api/v1/comments/:commentId — Récupérer un commentaire
 */
router.get(
  '/:commentId',
  asyncHandler(controller.getComment)
);

/**
 * PATCH /api/v1/comments/:commentId — Mettre à jour un commentaire
 */
router.patch(
  '/:commentId',
  authRequired,
  asyncHandler(controller.updateComment)
);

/**
 * DELETE /api/v1/comments/:commentId — Supprimer un commentaire
 */
router.delete(
  '/:commentId',
  authRequired,
  asyncHandler(controller.deleteComment)
);

module.exports = router;
