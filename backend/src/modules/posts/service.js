/**
 * Service posts & idées
 */

const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');
const logger = require('../../core/utils/logger');

const VALID_TYPES = ['idea', 'proposal', 'question', 'discussion'];
const VALID_CATEGORIES = ['élections', 'gouvernement', 'droits', 'services', 'santé', 'éducation', 'environnement', 'économie', 'autres'];

/**
 * Valider type et catégorie
 */
function validateTypeCategory(type, category) {
  if (!VALID_TYPES.includes(type)) {
    throw new AppError(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`, 400);
  }
  if (!VALID_CATEGORIES.includes(category)) {
    throw new AppError(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`, 400);
  }
}

/**
 * Lister posts (feed)
 */
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
    sql += ` AND p.category = $${paramIndex}`;
    params.push(category);
    paramIndex += 1;
  }

  if (type) {
    sql += ` AND p.type = $${paramIndex}`;
    params.push(type);
    paramIndex += 1;
  }

  if (userId) {
    sql += ` AND p.user_id = $${paramIndex}`;
    params.push(userId);
    paramIndex += 1;
  }

  // Tri
  if (sort === 'popular') {
    sql += ' ORDER BY p.likes_count DESC, p.created_at DESC';
  } else {
    sql += ' ORDER BY p.created_at DESC';
  }

  sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(maxLimit, offset);

  const result = await query(sql, params);

  // Compteur total
  let countSql = 'SELECT COUNT(*) FROM posts p JOIN users u ON p.user_id = u.id WHERE p.status = $1 AND p.deleted_at IS NULL AND u.deleted_at IS NULL';
  const countParams = ['published'];
  let countParamIndex = 2;

  if (category) {
    countSql += ` AND p.category = $${countParamIndex}`;
    countParams.push(category);
    countParamIndex += 1;
  }
  if (type) {
    countSql += ` AND p.type = $${countParamIndex}`;
    countParams.push(type);
    countParamIndex += 1;
  }
  if (userId) {
    countSql += ` AND p.user_id = $${countParamIndex}`;
    countParams.push(userId);
  }

  const countResult = await query(countSql, countParams);
  const total = parseInt(countResult.rows[0].count, 10);

  return {
    data: result.rows.map(p => ({
      id: p.id,
      userId: p.user_id,
      title: p.title,
      content: p.content,
      type: p.type,
      category: p.category,
      likesCount: p.likes_count,
      viewsCount: p.views_count,
      isPinned: p.is_pinned,
      creator: {
        username: p.username,
        avatarUrl: p.avatar_url,
        location: p.location,
      },
      createdAt: p.created_at,
    })),
    meta: {
      total,
      page,
      limit: maxLimit,
      pages: Math.ceil(total / maxLimit),
    },
  };
}

/**
 * Récupérer post
 */
async function getPost(postId) {
  const result = await query(
    `SELECT p.id, p.user_id, p.title, p.content, p.type, p.category, p.likes_count, p.views_count, p.is_pinned, p.created_at, p.updated_at,
            u.username, pr.avatar_url, pr.location
     FROM posts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN profiles pr ON u.id = pr.user_id
     WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [postId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Post not found', 404);
  }

  const p = result.rows[0];
  return {
    id: p.id,
    userId: p.user_id,
    title: p.title,
    content: p.content,
    type: p.type,
    category: p.category,
    likesCount: p.likes_count,
    viewsCount: p.views_count,
    isPinned: p.is_pinned,
    creator: {
      username: p.username,
      avatarUrl: p.avatar_url,
      location: p.location,
    },
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

/**
 * Créer post
 */
async function createPost(userId, { title, content, type, category }) {
  validateTypeCategory(type, category);

  const postId = uuidv4();
  const result = await query(
    `INSERT INTO posts (id, user_id, title, content, type, category, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'published')
     RETURNING id, user_id, title, content, type, category, likes_count, created_at`,
    [postId, userId, title, content, type, category]
  );

  logger.info('Post created', { meta: { postId, userId, category } });

  return result.rows[0];
}

/**
 * Mettre à jour post
 */
async function updatePost(postId, data, requestingUserId) {
  const result = await query('SELECT user_id FROM posts WHERE id = $1', [postId]);

  if (result.rows.length === 0) {
    throw new AppError('Post not found', 404);
  }

  if (result.rows[0].user_id !== requestingUserId) {
    throw new AppError('Cannot update another post', 403);
  }

  const updates = [];
  const params = [postId];
  let paramIndex = 2;

  if (data.title) {
    updates.push(`title = $${paramIndex}`);
    params.push(data.title);
    paramIndex += 1;
  }

  if (data.content) {
    updates.push(`content = $${paramIndex}`);
    params.push(data.content);
    paramIndex += 1;
  }

  if (data.category) {
    validateTypeCategory(data.type || 'idea', data.category);
    updates.push(`category = $${paramIndex}`);
    params.push(data.category);
    paramIndex += 1;
  }

  if (updates.length === 0) {
    return getPost(postId);
  }

  updates.push('updated_at = NOW()');
  await query(`UPDATE posts SET ${updates.join(', ')} WHERE id = $1`, params);

  logger.info('Post updated', { meta: { postId } });
  return getPost(postId);
}

/**
 * Supprimer post (soft delete)
 */
async function deletePost(postId, requestingUserId) {
  const result = await query('SELECT user_id FROM posts WHERE id = $1', [postId]);

  if (result.rows.length === 0) {
    throw new AppError('Post not found', 404);
  }

  if (result.rows[0].user_id !== requestingUserId) {
    throw new AppError('Cannot delete another post', 403);
  }

  await query('UPDATE posts SET deleted_at = NOW() WHERE id = $1', [postId]);
  logger.info('Post deleted', { meta: { postId } });
}

/**
 * Signaler post
 */
async function flagPost(postId, reason, userId) {
  await query(
    'UPDATE posts SET status = $1, is_flagged = true, flag_reason = $2 WHERE id = $3',
    ['flagged', reason || 'No reason provided', postId]
  );

  logger.warn('Post flagged', { meta: { postId, userId, reason } });
}

/**
 * Liker un post (transactionnel)
 */
async function likePost(postId, userId) {
  // Vérifier l'existence du post
  const postCheck = await query('SELECT id FROM posts WHERE id = $1', [postId]);
  if (postCheck.rows.length === 0) {
    throw new AppError('Post not found', 404);
  }

  // Transaction atomique: INSERT + UPDATE conditionnel
  await transaction(async (client) => {
    // Essayer d'insérer le like
    const insertResult = await client.query(
      `INSERT INTO likes (user_id, post_id) VALUES ($1, $2)
       ON CONFLICT (user_id, post_id) DO NOTHING
       RETURNING id`,
      [userId, postId]
    );

    // Incrémenter le compteur SEULEMENT si l'insertion a réussi
    if (insertResult.rows.length > 0) {
      await client.query(
        'UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1',
        [postId]
      );
      logger.debug('Post liked', { meta: { postId, userId } });
    } else {
      logger.debug('Post already liked', { meta: { postId, userId } });
    }
  });
}

/**
 * Unliker un post (transactionnel)
 */
async function unlikePost(postId, userId) {
  // Transaction atomique: DELETE + UPDATE conditionnel
  await transaction(async (client) => {
    const deleteResult = await client.query(
      'DELETE FROM likes WHERE post_id = $1 AND user_id = $2 RETURNING id',
      [postId, userId]
    );

    // Décrémenter le compteur SEULEMENT si le like existait
    if (deleteResult.rows.length > 0) {
      await client.query(
        'UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1',
        [postId]
      );
      logger.debug('Post unliked', { meta: { postId, userId } });
    } else {
      logger.debug('Post not liked', { meta: { postId, userId } });
    }
  });
}

/**
 * Récupérer les idées populaires
 */
async function getPopularIdeas({ limit = 5, category = null }) {
  const maxLimit = Math.min(limit, 20);
  const params = ['idea', 'published'];
  let paramIndex = 3;

  let sql = `
    SELECT p.id, p.user_id, p.title, p.content, p.type, p.category, p.likes_count, p.views_count, p.is_pinned, p.created_at,
           u.username, pr.avatar_url, pr.location
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE p.type = $1 AND p.status = $2 AND p.deleted_at IS NULL AND u.deleted_at IS NULL
  `;

  if (category) {
    sql += ` AND p.category = $${paramIndex}`;
    params.push(category);
    paramIndex += 1;
  }

  sql += ` ORDER BY p.likes_count DESC, p.created_at DESC LIMIT $${paramIndex}`;
  params.push(maxLimit);

  const result = await query(sql, params);

  return {
    data: result.rows.map(p => ({
      id: p.id,
      userId: p.user_id,
      title: p.title,
      content: p.content,
      type: p.type,
      category: p.category,
      likesCount: p.likes_count,
      viewsCount: p.views_count,
      isPinned: p.is_pinned,
      creator: {
        username: p.username,
        avatarUrl: p.avatar_url,
        location: p.location,
      },
      createdAt: p.created_at,
    })),
  };
}

module.exports = {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  flagPost,
  likePost,
  unlikePost,
  getPopularIdeas,
};
