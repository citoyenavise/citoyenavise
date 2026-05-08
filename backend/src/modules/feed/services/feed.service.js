/**
 * Service feed
 */

const { query } = require('../../../core/services/database');
const logger = require('../../../core/utils/logger');

async function getFeed(userId, { limit = 20, page = 1 }) {
  const offset = (page - 1) * limit;
  const maxLimit = Math.min(limit, 100);

  const result = await query(
    `SELECT p.id, p.user_id, p.title, p.content, p.type, p.likes_count, p.views_count, p.created_at,
            u.username
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.status = 'published' AND p.deleted_at IS NULL AND u.deleted_at IS NULL
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    [maxLimit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) as total FROM posts p
     WHERE p.status = 'published' AND p.deleted_at IS NULL`
  );

  logger.info('Feed fetched', { meta: { userId, itemCount: result.rows.length } });

  return {
    data: result.rows,
    meta: {
      total: parseInt(countResult.rows[0].total),
      page,
      limit: maxLimit,
    },
  };
}

module.exports = {
  getFeed,
};
