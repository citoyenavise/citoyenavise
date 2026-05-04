/**
 * Comments Service
 * Logique métier des commentaires
 * Avec support du event-driven reactions (comment.created)
 */

const { query, transaction } = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');
const logger = require('../../core/utils/logger');
const eventBus = require('../../core/eventBus');
const CommentCreated = require('../../events/CommentCreated');
const { v4: uuidv4 } = require('uuid');

/**
 * Créer un commentaire
 */
async function createComment(postId, userId, content) {
  // Vérifier que le post existe
  const postResult = await query(
    'SELECT id, user_id FROM posts WHERE id = $1 AND deleted_at IS NULL',
    [postId]
  );
  if (!postResult.rows[0]) {
    throw new AppError('Post non trouvé', 404);
  }

  const postOwnerId = postResult.rows[0].user_id;
  let commentId = null;

  try {
    await transaction(async (client) => {
      // Insérer le commentaire
      const commentResult = await client.query(`
        INSERT INTO comments (post_id, user_id, content, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id
      `, [postId, userId, content]);

      commentId = commentResult.rows[0].id;

      // Incrémenter le compteur de réponses du post
      await client.query(`
        UPDATE posts SET replies_count = replies_count + 1
        WHERE id = $1
      `, [postId]);

      logger.info('Commentaire créé', { postId, userId });
    });

    // EMIT EVENT : Commentaire créé avec succès
    if (commentId) {
      const commentCreatedEvent = new CommentCreated({
        commentId,
        postId,
        userId,
        postOwnerId,
        timestamp: new Date().toISOString(),
      });

      eventBus.emit('comment.created', commentCreatedEvent.toJSON()).catch((err) => {
        logger.warn('Event emission completed with errors (handlers failed gracefully)', {
          meta: { commentId, postId, error: err.message },
        });
      });
    }

    return {
      id: commentId,
      postId,
      userId,
      content,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Erreur lors de la création du commentaire', {
      error: error.message,
      postId,
      userId,
    });
    throw error;
  }
}

/**
 * Récupérer les commentaires d'un post
 */
async function getCommentsByPost(postId, limit = 20, offset = 0) {
  const maxLimit = Math.min(limit, 100);

  const result = await query(`
    SELECT
      c.id,
      c.post_id AS "postId",
      c.user_id AS "userId",
      c.content,
      c.created_at AS "createdAt",
      c.updated_at AS "updatedAt",
      u.username,
      pr.avatar_url AS "avatarUrl"
    FROM comments c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE c.post_id = $1 AND c.deleted_at IS NULL AND c.status = 'published'
    ORDER BY c.created_at ASC
    LIMIT $2 OFFSET $3
  `, [postId, maxLimit, offset]);

  return result.rows;
}

/**
 * Obtenir un commentaire par ID
 */
async function getCommentById(commentId) {
  const result = await query(`
    SELECT
      c.id,
      c.post_id AS "postId",
      c.user_id AS "userId",
      c.content,
      c.status,
      c.created_at AS "createdAt",
      c.updated_at AS "updatedAt",
      u.username,
      pr.avatar_url AS "avatarUrl"
    FROM comments c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE c.id = $1 AND c.deleted_at IS NULL
  `, [commentId]);

  if (!result.rows[0]) {
    throw new AppError('Commentaire non trouvé', 404);
  }

  return result.rows[0];
}

/**
 * Supprimer un commentaire
 */
async function deleteComment(commentId, userId) {
  const commentResult = await query(
    'SELECT id, post_id, user_id FROM comments WHERE id = $1 AND deleted_at IS NULL',
    [commentId]
  );

  if (!commentResult.rows[0]) {
    throw new AppError('Commentaire non trouvé', 404);
  }

  const comment = commentResult.rows[0];

  // Vérifier que l'utilisateur est le propriétaire ou admin
  if (comment.user_id !== userId) {
    throw new AppError('Vous n\'avez pas le droit de supprimer ce commentaire', 403);
  }

  try {
    await transaction(async (client) => {
      // Marquer comme supprimé (soft delete)
      await client.query(
        'UPDATE comments SET deleted_at = NOW() WHERE id = $1',
        [commentId]
      );

      // Décrémenter le compteur de réponses
      await client.query(`
        UPDATE posts SET replies_count = GREATEST(replies_count - 1, 0)
        WHERE id = $1
      `, [comment.post_id]);

      logger.info('Commentaire supprimé', { commentId, userId });
    });
  } catch (error) {
    logger.error('Erreur lors de la suppression du commentaire', {
      error: error.message,
      commentId,
      userId,
    });
    throw error;
  }
}

/**
 * Mettre à jour un commentaire
 */
async function updateComment(commentId, userId, content) {
  const commentResult = await query(
    'SELECT id, user_id FROM comments WHERE id = $1 AND deleted_at IS NULL',
    [commentId]
  );

  if (!commentResult.rows[0]) {
    throw new AppError('Commentaire non trouvé', 404);
  }

  if (commentResult.rows[0].user_id !== userId) {
    throw new AppError('Vous n\'avez pas le droit de modifier ce commentaire', 403);
  }

  try {
    await query(
      'UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2',
      [content, commentId]
    );

    logger.info('Commentaire mis à jour', { commentId, userId });

    return await getCommentById(commentId);
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du commentaire', {
      error: error.message,
      commentId,
      userId,
    });
    throw error;
  }
}

/**
 * Obtenir les statistiques de commentaires d'un post
 */
async function getPostCommentStats(postId) {
  const result = await query(`
    SELECT
      COUNT(*) as total_comments,
      COUNT(DISTINCT user_id) as unique_commenters
    FROM comments
    WHERE post_id = $1 AND deleted_at IS NULL AND status = 'published'
  `, [postId]);

  return {
    totalComments: parseInt(result.rows[0].total_comments),
    uniqueCommenters: parseInt(result.rows[0].unique_commenters),
  };
}

module.exports = {
  createComment,
  getCommentsByPost,
  getCommentById,
  deleteComment,
  updateComment,
  getPostCommentStats,
};
