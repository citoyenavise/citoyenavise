/**
 * Service de recherche — Full-text search PostgreSQL
 */

const { query } = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');
const logger = require('../../core/utils/logger');

/**
 * Chercher dans les posts (par titre + contenu)
 */
async function searchPosts(searchText, filters = {}) {
  const { category, sort = 'relevance', page = 1, limit = 20 } = filters;

  const offset = (page - 1) * limit;

  let queryText = `
    SELECT p.id, p.title, p.content, p.category, p.user_id, p.likes_count,
           p.created_at, u.username,
           ts_rank(p.search_vector, plainto_tsquery('french', $1)) as rank
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.search_vector @@ plainto_tsquery('french', $1)
    AND p.deleted_at IS NULL
  `;

  const params = [searchText];

  if (category) {
    queryText += ` AND p.category = $${params.length + 1}`;
    params.push(category);
  }

  // Sorting
  if (sort === 'relevance') {
    queryText += ` ORDER BY rank DESC, p.created_at DESC`;
  } else if (sort === 'recent') {
    queryText += ` ORDER BY p.created_at DESC`;
  } else if (sort === 'popular') {
    queryText += ` ORDER BY p.likes_count DESC, p.created_at DESC`;
  }

  queryText += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await query(queryText, params);

  // Obtenir le total
  let countQuery = `
    SELECT COUNT(*) as total
    FROM posts p
    WHERE p.search_vector @@ plainto_tsquery('french', $1)
    AND p.deleted_at IS NULL
  `;
  const countParams = [searchText];

  if (category) {
    countQuery += ` AND p.category = $${countParams.length + 1}`;
    countParams.push(category);
  }

  const countResult = await query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].total, 10);

  logger.info('Search posts', { meta: { searchText, results: result.rows.length, total } });

  return {
    data: result.rows,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Chercher des utilisateurs (par username + bio)
 */
async function searchUsers(searchText, filters = {}) {
  const { page = 1, limit = 20 } = filters;

  const offset = (page - 1) * limit;

  const queryText = `
    SELECT u.id, u.username, u.email, u.role, u.is_verified, u.created_at,
           p.id as profile_id, p.bio, p.avatar_url, p.location, p.followers_count,
           (u.search_vector @@ plainto_tsquery('french', $1) OR
            p.search_vector @@ plainto_tsquery('french', $1)) as matches
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE (u.search_vector @@ plainto_tsquery('french', $1)
           OR p.search_vector @@ plainto_tsquery('french', $1))
    AND u.deleted_at IS NULL
    ORDER BY u.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await query(queryText, [searchText, limit, offset]);

  // Count
  const countQuery = `
    SELECT COUNT(DISTINCT u.id) as total
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE (u.search_vector @@ plainto_tsquery('french', $1)
           OR p.search_vector @@ plainto_tsquery('french', $1))
    AND u.deleted_at IS NULL
  `;

  const countResult = await query(countQuery, [searchText]);
  const total = parseInt(countResult.rows[0].total, 10);

  logger.info('Search users', { meta: { searchText, results: result.rows.length, total } });

  return {
    data: result.rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      isVerified: row.is_verified,
      profile: {
        id: row.profile_id,
        bio: row.bio,
        avatarUrl: row.avatar_url,
        location: row.location,
        followersCount: row.followers_count,
      },
      createdAt: row.created_at,
    })),
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Recherche multi-type (posts + users)
 */
async function searchAll(searchText, filters = {}) {
  const postsResult = await searchPosts(searchText, { ...filters, limit: 10 });
  const usersResult = await searchUsers(searchText, { ...filters, limit: 10 });

  return {
    posts: postsResult,
    users: usersResult,
  };
}

module.exports = {
  searchPosts,
  searchUsers,
  searchAll,
};
