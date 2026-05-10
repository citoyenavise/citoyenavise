/**
 * Routes pour les posts/idées citoyennes
 * Endpoints publics pour lister/voir + endpoints protégés pour créer/modifier
 */

import express from 'express';
import { Post, PostComment, PostLike, CommentLike, PostTag } from '../models/Post.js';
import { authMiddleware, authOptional } from '../middlewares/auth.js';

const router = express.Router();

/**
 * GET /api/v1/posts
 * Lister les posts avec filtres optionnels
 * Query: { statut, author_id, petition_id, elu_id, tag_id, search, limit, offset }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "titre": "Une super idée",
 *       "contenu": "...",
 *       "author_name": "Jean Dupont",
 *       "statut": "published",
 *       "likes_count": 42,
 *       "comments_count": 12,
 *       "tags": [{"id": 1, "nom": "éducation"}],
 *       "created_at": "..."
 *     }
 *   ]
 * }
 */
router.get('/', authOptional, async (req, res, next) => {
  try {
    const {
      statut = 'published',
      author_id,
      petition_id,
      elu_id,
      tag_id,
      search,
      limit = 20,
      offset = 0
    } = req.query;

    const posts = await Post.list({
      statut,
      author_id: author_id ? parseInt(author_id, 10) : undefined,
      petition_id: petition_id ? parseInt(petition_id, 10) : undefined,
      elu_id: elu_id ? parseInt(elu_id, 10) : undefined,
      tag_id: tag_id ? parseInt(tag_id, 10) : undefined,
      search,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: posts
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/posts/:id
 * Obtenir un post avec détails complets
 */
router.get('/:id', authOptional, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const post = await Post.findById(parseInt(id, 10), userId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post non trouvé'
      });
    }

    // Récupérer les commentaires
    const comments = await PostComment.getComments(parseInt(id, 10), 50, 0);

    res.json({
      success: true,
      data: post,
      comments
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/posts/:id/comments
 * Obtenir les commentaires d'un post
 */
router.get('/:id/comments', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const comments = await PostComment.getComments(
      parseInt(id, 10),
      parseInt(limit, 10),
      parseInt(offset, 10)
    );

    res.json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/posts/:id/comments/:commentId/replies
 * Obtenir les réponses à un commentaire
 */
router.get('/:id/comments/:commentId/replies', async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { limit = 20 } = req.query;

    const replies = await PostComment.getReplies(
      parseInt(commentId, 10),
      parseInt(limit, 10)
    );

    res.json({
      success: true,
      count: replies.length,
      data: replies
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/posts/:id/likes
 * Obtenir les utilisateurs qui ont liké le post
 */
router.get('/:id/likes', async (req, res, next) => {
  try {
    const { id } = req.params;

    const likes = await PostLike.getLikes(parseInt(id, 10));

    res.json({
      success: true,
      count: likes.length,
      data: likes
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/posts/top/liked
 * Obtenir les posts les plus likés
 */
router.get('/top/liked', async (req, res, next) => {
  try {
    const posts = await Post.getTopLiked(10);

    res.json({
      success: true,
      data: posts
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/posts/recent
 * Obtenir les posts récents
 */
router.get('/recent', async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const posts = await Post.getRecent(
      parseInt(limit, 10),
      parseInt(offset, 10)
    );

    res.json({
      success: true,
      data: posts
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/posts/search?q=terme
 * Chercher des posts
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Au moins 2 caractères requis'
      });
    }

    const posts = await Post.search(q, {
      statut: 'published',
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      searchTerm: q,
      count: posts.length,
      data: posts
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/posts/stats
 * Obtenir statistiques sur les posts
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Post.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tags
 * Lister tous les tags
 */
router.get('/api/tags', async (req, res, next) => {
  try {
    const tags = await PostTag.findAll();

    res.json({
      success: true,
      count: tags.length,
      data: tags
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tags/:slug
 * Obtenir posts par tag slug
 */
router.get('/api/tags/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const tag = await PostTag.findBySlug(slug);

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag non trouvé'
      });
    }

    const posts = await PostTag.getPostsByTag(
      tag.id,
      parseInt(limit, 10),
      parseInt(offset, 10)
    );

    res.json({
      success: true,
      tag,
      count: posts.length,
      data: posts
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════
// PROTECTED ROUTES (require authentication)
// ═══════════════════════════════════════════════════════════════════

/**
 * POST /api/v1/posts
 * Créer nouveau post (PROTECTED)
 * Body: { titre, contenu, petition_id, elu_id, tags }
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { titre, contenu, petition_id, elu_id, tags = [] } = req.body;
    const author_id = req.user.userId;

    if (!titre || !contenu) {
      return res.status(400).json({
        success: false,
        error: 'Titre et contenu sont requis'
      });
    }

    const post = await Post.create({
      titre,
      contenu,
      author_id,
      petition_id: petition_id ? parseInt(petition_id, 10) : null,
      elu_id: elu_id ? parseInt(elu_id, 10) : null,
      tags: Array.isArray(tags) ? tags.map(t => parseInt(t, 10)) : []
    });

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/posts/:id
 * Mettre à jour post (PROTECTED - owner only)
 */
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const updated = await Post.update(parseInt(id, 10), req.body, userId);

    if (!updated) {
      return res.status(403).json({
        success: false,
        error: 'Post non trouvé ou pas autorisé'
      });
    }

    res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/posts/:id/publish
 * Publier un post (PROTECTED - owner only)
 */
router.post('/:id/publish', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const published = await Post.publish(parseInt(id, 10), userId);

    if (!published) {
      return res.status(403).json({
        success: false,
        error: 'Post non trouvé, pas autorisé, ou déjà publié'
      });
    }

    res.json({
      success: true,
      data: published
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/posts/:id
 * Supprimer post (PROTECTED - owner only)
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const success = await Post.delete(parseInt(id, 10), userId);

    if (!success) {
      return res.status(403).json({
        success: false,
        error: 'Post non trouvé ou pas autorisé'
      });
    }

    res.json({
      success: true,
      message: 'Post supprimé'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/posts/:id/comments
 * Ajouter un commentaire (PROTECTED)
 */
router.post('/:id/comments', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contenu, parent_comment_id } = req.body;

    if (!contenu) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu du commentaire est requis'
      });
    }

    const comment = await PostComment.add(parseInt(id, 10), {
      author_id: req.user.userId,
      contenu,
      parent_comment_id: parent_comment_id ? parseInt(parent_comment_id, 10) : null
    });

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/posts/:id/comments/:commentId
 * Supprimer un commentaire (PROTECTED - owner only)
 */
router.delete('/:id/comments/:commentId', authMiddleware, async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const success = await PostComment.delete(
      parseInt(commentId, 10),
      req.user.userId
    );

    if (!success) {
      return res.status(403).json({
        success: false,
        error: 'Commentaire non trouvé ou pas autorisé'
      });
    }

    res.json({
      success: true,
      message: 'Commentaire supprimé'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/posts/:id/like
 * Liker un post (PROTECTED)
 */
router.post('/:id/like', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const like = await PostLike.like(parseInt(id, 10), req.user.userId);

    if (like.error) {
      return res.status(409).json({
        success: false,
        error: 'Vous avez déjà liké ce post'
      });
    }

    res.status(201).json({
      success: true,
      data: like
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/posts/:id/like
 * Retirer un like (PROTECTED)
 */
router.delete('/:id/like', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const success = await PostLike.unlike(parseInt(id, 10), req.user.userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Vous n\'aviez pas liké ce post'
      });
    }

    res.json({
      success: true,
      message: 'Like retiré'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/posts/:id/comments/:commentId/like
 * Liker un commentaire (PROTECTED)
 */
router.post('/:id/comments/:commentId/like', authMiddleware, async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const like = await CommentLike.like(
      parseInt(commentId, 10),
      req.user.userId
    );

    if (like.error) {
      return res.status(409).json({
        success: false,
        error: 'Vous avez déjà liké ce commentaire'
      });
    }

    res.status(201).json({
      success: true,
      data: like
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/posts/:id/comments/:commentId/like
 * Retirer un like de commentaire (PROTECTED)
 */
router.delete('/:id/comments/:commentId/like', authMiddleware, async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const success = await CommentLike.unlike(
      parseInt(commentId, 10),
      req.user.userId
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Vous n\'aviez pas liké ce commentaire'
      });
    }

    res.json({
      success: true,
      message: 'Like retiré'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
