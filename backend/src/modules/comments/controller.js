/**
 * Comments Controller — Version corrigée & stabilisée
 */

const service = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');
const { createCommentSchema, updateCommentSchema, getCommentsSchema } = require('./validation');

module.exports = {
  /**
   * POST /api/v1/posts/:postId/comments
   */
  createComment: async (req, res) => {
    const { postId } = req.params;

    const validation = createCommentSchema.safeParse({
      postId,
      content: req.body.content,
    });

    if (!validation.success) {
      throw new AppError('Validation échouée', 400);
    }

    const { content } = validation.data;
    const comment = await service.createComment(postId, req.user.userId, content);

    res.status(201).json(comment);
  },

  /**
   * GET /api/v1/posts/:postId/comments
   */
  getCommentsByPost: async (req, res) => {
    const { postId } = req.params;
    const { limit = 20, page = 1, sort = 'latest' } = req.query;

    const validation = getCommentsSchema.safeParse({
      postId,
      limit,
      page,
      sort,
    });

    if (!validation.success) {
      throw new AppError('Validation échouée', 400);
    }

    const comments = await service.getCommentsByPost(
      postId,
      validation.data.limit,
      validation.data.page,
      validation.data.sort
    );

    res.json(comments);
  },

  /**
   * GET /api/v1/comments/:commentId
   */
  getComment: async (req, res) => {
    const { commentId } = req.params;
    const comment = await service.getCommentById(commentId);
    res.json(comment);
  },

  /**
   * PUT /api/v1/comments/:commentId
   */
  updateComment: async (req, res) => {
    const { commentId } = req.params;

    const validation = updateCommentSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError('Validation échouée', 400);
    }

    const updated = await service.updateComment(
      commentId,
      req.user.userId,
      validation.data.content
    );

    res.json(updated);
  },

  /**
   * DELETE /api/v1/comments/:commentId
   */
  deleteComment: async (req, res) => {
    const { commentId } = req.params;

    await service.deleteComment(commentId, req.user.userId);
    res.status(204).send();
  },
};
