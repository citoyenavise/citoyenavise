/**
 * Likes Controller
 * Gestion des likes sur les posts/idées
 */

const service = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');

module.exports = {
  /**
   * Liker un post/idée
   * POST /api/v1/likes
   */
  likePost: async (req, res) => {
    const { postId } = req.body;
    if (!postId) {
      throw new AppError('postId requis', 400);
    }

    const like = await service.likePost(postId, req.userId);
    res.status(201).json(like);
  },

  /**
   * Retirer un like
   * DELETE /api/v1/likes/:postId
   */
  unlikePost: async (req, res) => {
    const { postId } = req.params;
    await service.unlikePost(postId, req.userId);
    res.status(204).send();
  },

  /**
   * Obtenir les utilisateurs qui ont aimé un post
   * GET /api/v1/posts/:postId/likes
   */
  getPostLikes: async (req, res) => {
    const { postId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const likes = await service.getPostLikes(postId, limit);
    res.json(likes);
  },

  /**
   * Vérifier si l'utilisateur a aimé un post
   * GET /api/v1/posts/:postId/likes/check
   */
  checkLike: async (req, res) => {
    const { postId } = req.params;
    const isLiked = await service.checkLike(postId, req.userId);
    res.json({ isLiked });
  },
};
