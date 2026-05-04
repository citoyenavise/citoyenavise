/**
 * Handler: CommentCreatedHandler
 * Réagit quand un commentaire est créé
 * - Met à jour le compteur de commentaires de l'auteur du post
 * - Log l'interaction
 */

const { query } = require('../core/services/database');
const logger = require('../core/utils/logger');

/**
 * Gérer l'événement comment.created
 */
async function handleCommentCreated(data) {
  const { commentId, postId, userId, postOwnerId, timestamp } = data;

  try {
    // Ne pas notifier si c'est un auto-commentaire
    if (userId === postOwnerId) {
      logger.debug('CommentCreatedHandler: skipping self-comment', { commentId });
      return;
    }

    // Mettre à jour le timestamp de mise à jour de l'auteur du post
    const userResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [postOwnerId]
    );

    if (!userResult.rows[0]) {
      logger.warn('CommentCreatedHandler: post owner not found', { postOwnerId });
      return;
    }

    await query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [postOwnerId]
    );

    logger.info('CommentCreatedHandler: post owner notification timestamp updated', {
      meta: { commentId, postId, postOwnerId },
    });
  } catch (err) {
    logger.error('CommentCreatedHandler: error processing comment', {
      meta: { commentId, error: err.message },
    });
    // Don't rethrow - let eventBus handle it
  }
}

module.exports = {
  handleCommentCreated,
  eventName: 'comment.created',
};
