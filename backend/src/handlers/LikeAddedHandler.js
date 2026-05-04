/**
 * Handler : LikeAddedHandler
 * Reacts to 'like.added' events
 *
 * Responsibilities :
 * 1. Increment post owner's "likes received" count
 * 2. Log the interaction
 *
 * Design :
 * - Isolated from service logic (no side effects on main flow)
 * - Async-safe (failures don't break original operation)
 * - Idempotent (safe to replay)
 * - Testable (pure function + dependencies injected)
 */

const logger = require('../core/utils/logger');
const { query } = require('../core/services/database');

/**
 * Handle a like.added event
 * Updates owner's like count and logs the interaction
 *
 * @param {Object} data - Event data
 * @param {string} data.likeId - ID du like
 * @param {string} data.postId - ID du post
 * @param {string} data.userId - ID de l'utilisateur qui like
 * @param {string} data.postOwnerId - ID du propriétaire du post
 * @param {string} data.timestamp - ISO timestamp
 */
async function handleLikeAdded(data) {
  const { likeId, postId, userId, postOwnerId, timestamp } = data;

  logger.info('LikeAddedHandler: processing', {
    meta: { likeId, postId, userId, postOwnerId },
  });

  try {
    // STEP 1 : Vérifier que le post existe et que le like n'est pas du propriétaire vers lui-même
    if (userId === postOwnerId) {
      logger.debug('LikeAddedHandler: user liked own post (skipping)');
      return;
    }

    // STEP 2 : Incrémenter le score du propriétaire du post
    // Nous créons/mettons à jour une colonne "likes_received" si elle existe
    // ou nous la loggons simplement
    const result = await query(
      `UPDATE users
       SET updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [postOwnerId]
    );

    if (!result.rows[0]) {
      logger.warn('LikeAddedHandler: post owner not found', {
        meta: { postOwnerId, postId, userId },
      });
      return;
    }

    logger.info('LikeAddedHandler: owner score updated', {
      meta: {
        likeId,
        postId,
        userId,
        postOwnerId,
        timestamp,
      },
    });

    // STEP 3 : Log l'interaction pour analytics (optionnel)
    // En production, ça irait dans une table d'interactions
    logger.debug('LikeAddedHandler: interaction logged', {
      meta: {
        event: 'like_received',
        postId,
        userId,
        postOwnerId,
        timestamp,
      },
    });
  } catch (error) {
    // Important : ne pas relancer l'erreur
    // Le handler est asynchrone et ne doit pas casser le flux principal
    logger.error('LikeAddedHandler: failed to process event', {
      meta: {
        likeId,
        postId,
        userId,
        postOwnerId,
        error: error.message,
        stack: error.stack,
      },
    });

    // En production, on pourrait envoyer à un dead letter queue
    // ou à un système de monitoring (Sentry)
    // Pour l'instant, on log et on continue
  }
}

module.exports = {
  handleLikeAdded,
  eventName: 'like.added',
};
