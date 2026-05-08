/**
 * Service posts — refactored for standardization
 */

const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../../../core/services/database');
const { AppError } = require('../../../core/middleware/errorHandler');
const logger = require('../../../core/utils/logger');
const eventBus = require('../../../core/eventBus');

const VALID_TYPES = ['idea', 'proposal', 'question', 'discussion'];
const VALID_CATEGORIES = ['élections', 'gouvernement', 'droits', 'services', 'santé', 'éducation', 'environnement', 'économie', 'autres'];

function validateTypeCategory(type, category) {
  if (!VALID_TYPES.includes(type)) {
    throw new AppError(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`, 400);
  }
  if (!VALID_CATEGORIES.includes(category)) {
    throw new AppError(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`, 400);
  }
}

async function listPosts({ limit = 20, page = 1, category = null, type = null, sort = 'latest', userId = null }) {
  const offset = (page - 1) * limit;
  const maxLimit = Math.min(limit, 100);

  let sql = `
    SELECT p.id, p.user_id, p.title, p.content, p.type, p.category, p.likes_count, p.views_count, p.is_pinned, p.created_at,
           u.username, pr.avatar_url, pr.location
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE p.status = 'published' AND p.deleted_at IS NULL AND u.deleted_at IS NULL
  `;
  const params = [];
  let paramIndex = 1;

  if (category) {
    validateTypeCategory('idea', category);
    sql += ` AND p.category = $${paramIndex}`;
    params.push(category);
    paramIndex += 1;
  }

  if (type) {
    validateTypeCategory(type, 'autres');
    sql += ` AND p.type = $${paramIndex}`;
    params.push(type);
    paramIndex += 1;
  }

  if (sort === 'popular') {
    sql += ` ORDER BY p.likes_count DESC, p.created_at DESC`;
  } else {
    sql += ` ORDER BY p.created_at DESC`;
  }

  sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(maxLimit, offset);

  const result = await query(sql, params);

  const countSql = `SELECT COUNT(*) as total FROM posts p WHERE p.status = 'published' AND p.deleted_at IS NULL`;
  const countResult = await query(countSql);

  return {
    data: result.rows,
    meta: {
      total: parseInt(countResult.rows[0].total),
      page,
      limit: maxLimit,
    },
  };
}

async function getPost(postId) {
  const result = await query(
    `SELECT p.*, u.username, pr.avatar_url
     FROM posts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN profiles pr ON u.id = pr.user_id
     WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [postId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Post not found', 404);
  }

  return result.rows[0];
}

async function createPost({ title, content, type, category }, userId) {
  validateTypeCategory(type, category);

  const postId = uuidv4();
  const result = await query(
    `INSERT INTO posts (id, user_id, title, content, type, category, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'published')
     RETURNING *`,
    [postId, userId, title, content, type, category]
  );

  logger.info('Post created', { meta: { postId, userId } });
  return result.rows[0];
}

async function updatePost(postId, { title, content, category }, userId) {
  const existing = await query('SELECT user_id FROM posts WHERE id = $1', [postId]);

  if (existing.rows.length === 0) {
    throw new AppError('Post not found', 404);
  }

  if (existing.rows[0].user_id !== userId) {
    throw new AppError('Cannot update another user post', 403);
  }

  const updates = [];
  const params = [postId];
  let paramIndex = 2;

  if (title) {
    updates.push(`title = $${paramIndex}`);
    params.push(title);
    paramIndex += 1;
  }

  if (content) {
    updates.push(`content = $${paramIndex}`);
    params.push(content);
    paramIndex += 1;
  }

  if (category) {
    updates.push(`category = $${paramIndex}`);
    params.push(category);
    paramIndex += 1;
  }

  if (updates.length === 0) {
    return getPost(postId);
  }

  updates.push('updated_at = NOW()');
  const sql = `UPDATE posts SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;

  await query(sql, params);
  logger.info('Post updated', { meta: { postId, userId } });

  return getPost(postId);
}

async function deletePost(postId, userId) {
  const existing = await query('SELECT user_id FROM posts WHERE id = $1', [postId]);

  if (existing.rows.length === 0) {
    throw new AppError('Post not found', 404);
  }

  if (existing.rows[0].user_id !== userId) {
    throw new AppError('Cannot delete another user post', 403);
  }

  await query('UPDATE posts SET deleted_at = NOW() WHERE id = $1', [postId]);
  logger.info('Post deleted', { meta: { postId, userId } });
}

module.exports = {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
};
