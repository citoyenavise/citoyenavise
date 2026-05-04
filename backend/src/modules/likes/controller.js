/**
 * Likes Controller — Version corrigée
 */

const service = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');
const { likeSchema, unlikeSchema } = require('./schema');

module.exports = {
  /**
   * POST /api/v1/posts/:postId/like
   */
  likePost: async (req, res) => {
    const validation = likeSchema.safeParse(req.params);
    if (!validation.success) throw new AppError('Validation échouée', 400);

    const { postId } = validation.data;
    const result = await service.likePost(postId, req.user.userId);

    res.status(201).json(result);
  },

  /**
   * DELETE /api/v1/posts/:postId/like
   */
  unlikePost: async (req, res) => {
    const validation = unlikeSchema.safeParse(req.params);
    if (!validation.success) throw new AppError('Validation échouée', 400);

    const { postId } = validation.data;
    await service.unlikePost(postId, req.user.userId);

    res.status(204).send();
  },

  /**
   * GET /api/v1/posts/:postId/likes
   */
  getPostLikes: async (req, res) => {
    const { postId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const likes = await service.getPostLikes(postId, limit);
    res.json(likes);
  },

  /**
   * GET /api/v1/posts/:postId/likes/check
   */
  checkLike: async (req, res) => {
    const { postId } = req.params;
    const isLiked = await service.checkLike(postId, req.user.userId);

    res.json({ isLiked });
  },
};
