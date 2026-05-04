/**
 * Popular System Service
 * Logique métier pour les contenus populaires
 */

const { query } = require('../../core/services/database');
const logger = require('../../core/utils/logger');

/**
 * Calcul du timeframe en SQL
 */
function getTimeframeSQL(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case '1d': return new Date(now - 24 * 60 * 60 * 1000).toISOString();
    case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    default: return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
}

/**
 * Idées populaires (filtrées par timeframe et catégorie)
 */
async function getPopularIdeas({ limit = 10, category = null, timeframe = '7d' }) {
  const maxLimit = Math.min(limit, 50);
  const sinceDate = getTimeframeSQL(timeframe);

  let sql = `
    SELECT p.id, p.user_id, p.title, p.content, p.category, p.likes_count, p.views_count, p.created_at,
           u.username, pr.avatar_url
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE p.type = 'idea' AND p.status = 'published' AND p.deleted_at IS NULL AND p.created_at >= $1
  `;

  const params = [sinceDate];
  let paramIndex = 2;

  if (category) {
    sql += ` AND p.category = $${paramIndex}`;
    params.push(category);
    paramIndex += 1;
  }

  sql += ` ORDER BY p.likes_count DESC, p.created_at DESC LIMIT $${paramIndex}`;
  params.push(maxLimit);

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Posts populaires (tous types)
 */
async function getPopularPosts({ limit = 10, sort = 'likes' }) {
  const maxLimit = Math.min(limit, 50);

  const sql = `
    SELECT p.id, p.user_id, p.title, p.content, p.type, p.category, p.likes_count, p.views_count, p.created_at,
           u.username, pr.avatar_url
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE p.status = 'published' AND p.deleted_at IS NULL AND u.deleted_at IS NULL
    ORDER BY ${sort === 'trending' ? 'p.created_at DESC, p.likes_count DESC' : 'p.likes_count DESC, p.created_at DESC'}
    LIMIT $1
  `;

  const result = await query(sql, [maxLimit]);
  return result.rows;
}

/**
 * Trending (popularité depuis 24h)
 */
async function getTrending({ limit = 5 }) {
  const maxLimit = Math.min(limit, 20);
  const since24h = new Date(new Date() - 24 * 60 * 60 * 1000).toISOString();

  const result = await query(`
    SELECT p.id, p.user_id, p.title, p.content, p.type, p.likes_count, p.created_at,
           u.username, pr.avatar_url,
           COUNT(l.id) FILTER (WHERE l.created_at >= $1) as recent_likes
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    LEFT JOIN likes l ON p.id = l.post_id
    WHERE p.status = 'published' AND p.deleted_at IS NULL AND u.deleted_at IS NULL
    GROUP BY p.id, u.username, pr.avatar_url
    ORDER BY recent_likes DESC, p.created_at DESC
    LIMIT $2
  `, [since24h, maxLimit]);

  return result.rows;
}

/**
 * Données pour homepage complète
 */
async function getHomepageData() {
  try {
    const [popularIdeas, trendingPosts, topUsers] = await Promise.all([
      getPopularIdeas({ limit: 6, timeframe: '7d' }),
      getTrending({ limit: 5 }),
      getTopUsers({ limit: 5 }),
    ]);

    return {
      popularIdeas,
      trendingPosts,
      topUsers,
      stats: {
        totalIdeas: await getTotalCount('posts', "type='idea'"),
        totalPosts: await getTotalCount('posts', "type IN ('proposal','question','discussion')"),
        totalUsers: await getTotalCount('users', null),
      },
    };
  } catch (error) {
    logger.error('Erreur lors de la récupération des données homepage', { error: error.message });
    throw error;
  }
}

/**
 * Utilisateurs actifs
 */
async function getTopUsers({ limit = 5 }) {
  const maxLimit = Math.min(limit, 20);

  const result = await query(`
    SELECT u.id, u.username, pr.avatar_url, pr.location, pr.bio,
           pr.followers_count, pr.posts_count
    FROM users u
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE u.deleted_at IS NULL AND pr.followers_count > 0
    ORDER BY pr.followers_count DESC, pr.posts_count DESC
    LIMIT $1
  `, [maxLimit]);

  return result.rows;
}

/**
 * Compter les éléments
 */
async function getTotalCount(table, whereClause = null) {
  const sql = whereClause
    ? `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`
    : `SELECT COUNT(*) as count FROM ${table}`;

  const result = await query(sql);
  return parseInt(result.rows[0].count);
}

module.exports = {
  getPopularIdeas,
  getPopularPosts,
  getTrending,
  getHomepageData,
  getTopUsers,
};
