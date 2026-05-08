
const { query } = require('../../../core/services/database');
const logger = require('../../../core/utils/logger');

async function getComments(targetId, limit = 20, page = 1) {
  const offset = (page - 1) * limit;
  const result = await query(
    'SELECT * FROM comments WHERE target_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [targetId, limit, offset]
  );
  return result.rows;
}

async function createComment({ userId, targetId, content }) {
  const result = await query(
    'INSERT INTO comments (user_id, target_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
    [userId, targetId, content]
  );
  return result.rows[0];
}

module.exports = {
  getComments,
  createComment
};
