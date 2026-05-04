/**
 * Likes Service
 * Logique métier des likes
 * Avec support du cache invalidation + event-driven reactions
 */

const { query, transaction } = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');
const cache = require('../../core/services/cache');
const logger = require('../../core/utils/logger');
const eventBus = require('../../core/eventBus');
const LikeAdded = require('../../events/LikeAdded');
const { v4: uuidv4 } = require('uuid');

/**
 * Liker un post
 */
async function likePost(postId, userId) {
  // Vérifier que le post existe ET récupérer le propriétaire
  const postResult = await query('SELECT id, user_id, likes_count FROM posts WHERE id = $1 AND deleted_at IS NULL', [postId]);
  if (!postResult.rows[0]) {
    throw new AppError('Post non trouvé', 404);
  }

  const postOwnerId = postResult.rows[0].user_id;
  let likeId = null;

  try {
    await transaction(async (client) => {
      // Ajouter le like (ignore si existe déjà - UPSERT)
      const likeResult = await client.query(`
        INSERT INTO likes (user_id, post_id, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id, post_id) DO NOTHING
        RETURNING id
      `, [userId, postId]);

      // Si le like a été inséré, incrémenter le compteur
      if (likeResult.rows.length > 0) {
        likeId = likeResult.rows[0].id;

        await client.query(`
          UPDATE posts SET likes_count = likes_count + 1
          WHERE id = $1
        `, [postId]);

        logger.info('Post aimé', { postId, userId });

        // Invalider les caches populaires
        await cache.invalidatePattern('popular:*');

        // Broadcaster via WebSocket
        if (global.wsServer) {
          global.wsServer.broadcast(postId, {
            type: 'like_update',
            data: { postId, userId, action: 'liked' },
          });
        }
      }
    });

    // EMIT EVENT : Like a été créé avec succès
    // Handlers réagiront asynchronously
    if (likeId) {
      const likeAddedEvent = new LikeAdded({
        likeId,
        postId,
        userId,
        postOwnerId,
        timestamp: new Date().toISOString(),
      });

      // Emit asynchronously (fire and forget)
      // Failures in handlers won't break the main flow
      eventBus.emit('like.added', likeAddedEvent.toJSON()).catch((err) => {
        logger.warn('Event emission completed with errors (handlers failed gracefully)', {
          meta: { likeId, postId, error: err.message },
        });
      });
    }

    return { postId, userId, liked: true };
  } catch (error) {
    logger.error('Erreur lors du like', { error: error.message, postId, userId });
    throw error;
  }
}

/**
 * Retirer un like
 */
async function unlikePost(postId, userId) {
  const postResult = await query('SELECT id FROM posts WHERE id = $1', [postId]);
  if (!postResult.rows[0]) {
    throw new AppError('Post non trouvé', 404);
  }

  try {
    await transaction(async (client) => {
      // Supprimer le like
      const deleteResult = await client.query(
        'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
        [userId, postId]
      );

      // Décrémenter le compteur si le like existait
      if (deleteResult.rowCount > 0) {
        await client.query(`
          UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0)
          WHERE id = $1
        `, [postId]);

        logger.info('Like retiré', { postId, userId });

        // Invalider les caches populaires
        await cache.invalidatePattern('popular:*');

        // Broadcaster via WebSocket
        if (global.wsServer) {
          global.wsServer.broadcast(postId, {
            type: 'like_update',
            data: { postId, userId, action: 'unliked' },
          });
        }
      }
    });
  } catch (error) {
    logger.error('Erreur lors du unlike', { error: error.message });
    throw error;
  }
}

/**
 * Obtenir les utilisateurs qui ont aimé un post
 */
async function getPostLikes(postId, limit = 20) {
  const maxLimit = Math.min(limit, 100);

  const result = await query(`
    SELECT u.id, u.username, pr.avatar_url, l.created_at
    FROM likes l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE l.post_id = $1 AND u.deleted_at IS NULL
    ORDER BY l.created_at DESC
    LIMIT $2
  `, [postId, maxLimit]);

  return result.rows;
}

/**
 * Vérifier si l'utilisateur a aimé un post
 */
async function checkLike(postId, userId) {
  if (!userId) return false;

  const result = await query(
    'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );

  return result.rows.length > 0;
}

/**
 * Obtenir les statistiques de likes d'un post
 */
async function getPostLikeStats(postId) {
  const result = await query(`
    SELECT
      COUNT(*) as total_likes,
      COUNT(DISTINCT user_id) as unique_likers
    FROM likes
    WHERE post_id = $1
  `, [postId]);

  return {
    totalLikes: parseInt(result.rows[0].total_likes),
    uniqueLikers: parseInt(result.rows[0].unique_likers),
  };
}

module.exports = {
  likePost,
  unlikePost,
  getPostLikes,
  checkLike,
  getPostLikeStats,
};
