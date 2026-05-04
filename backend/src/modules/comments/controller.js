/**
 * Comments Controller
 * Gestion des commentaires sur les posts
 */

const service = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');
const { createCommentSchema, updateCommentSchema, getCommentsSchema } = require('./validation');

module.exports = {
  /**
   * Créer un commentaire
   * POST /api/v1/comments
   */
  createComment: async (req, res) => {
    const validation = createCommentSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError('Validation échouée', 400);
    }

    const { postId, content } = validation.data;
    const comment = await service.createComment(postId, req.userId, content);

    res.status(201).json({
      success: true,
      data: comment,
      error: null,
    });
  },

  /**
   * Récupérer les commentaires d'un post
   * GET /api/v1/posts/:postId/comments
   */
  getCommentsByPost: async (req, res) => {
    const { postId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const validation = getCommentsSchema.safeParse({ postId, limit, offset });
    if (!validation.success) {
      throw new AppError('Validation échouée', 400);
    }

    const comments = await service.getCommentsByPost(
      postId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: comments,
      error: null,
    });
  },

  /**
   * Récupérer un commentaire
   * GET /api/v1/comments/:commentId
   */
  getComment: async (req, res) => {
    const { commentId } = req.params;
    const comment = await service.getCommentById(commentId);

    res.json({
      success: true,
      data: comment,
      error: null,
    });
  },

  /**
   * Mettre à jour un commentaire
   * PATCH /api/v1/comments/:commentId
   */
  updateComment: async (req, res) => {
    const { commentId } = req.params;
    const validation = updateCommentSchema.safeParse(req.body);

    if (!validation.success) {
      throw new AppError('Validation échouée', 400);
    }

    const { content } = validation.data;
    const comment = await service.updateComment(commentId, req.userId, content);

    res.json({
      success: true,
      data: comment,
      error: null,
    });
  },

  /**
   * Supprimer un commentaire
   * DELETE /api/v1/comments/:commentId
   */
  deleteComment: async (req, res) => {
    const { commentId } = req.params;
    await service.deleteComment(commentId, req.userId);

    res.status(204).send();
  },
};
