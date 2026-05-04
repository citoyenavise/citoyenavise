/**
 * Popular System Service — Version officielle
 * Logique métier pour les contenus populaires avec scoring temporal
 */

const { query } = require('../../core/services/database');
const redis = require('../../core/services/redis');
const logger = require('../../core/utils/logger');

const RANGE_MAP = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  all: 3650,
};

/**
 * Calcul du score avec décroissance temporelle
 */
function computeScore(post) {
  const ageHours = (Date.now() - new Date(post.created_at).getTime()) / 3600000;
  const timePenalty = Math.max(0.2, 1 - ageHours / 240); // décroissance sur 10 jours

  return (
    post.likes_count * 2 +
    post.comments_count * 1.5
  ) * timePenalty;
}

/**
 * Posts populaires avec scoring
 */
async function getPopular({ range = 'daily', page = 1, limit = 10, sort = 'score' }) {
  const cacheKey = `popular:${range}:${page}:${limit}:${sort}`;

  // Vérifier le cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit', { meta: { cacheKey } });
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.warn('Redis get failed, continuing', { meta: { error: err.message } });
  }

  const days = RANGE_MAP[range] || 7;
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  const result = await query(`
    SELECT p.id, p.user_id, p.title, p.content, p.type, p.category,
           p.likes_count, p.views_count, p.created_at,
           u.username, u.id as author_id, pr.avatar_url,
           (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) as comments_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE p.status = 'published' AND p.deleted_at IS NULL AND u.deleted_at IS NULL AND p.created_at >= $1
    ORDER BY p.created_at DESC
  `, [since]);

  const posts = result.rows;

  // Calcul du score pour chaque post
  const scored = posts.map((p) => ({
    id: p.id,
    userId: p.user_id,
    title: p.title,
    content: p.content,
    type: p.type,
    category: p.category,
    likesCount: p.likes_count,
    viewsCount: p.views_count,
    commentsCount: parseInt(p.comments_count, 10),
    createdAt: p.created_at,
    author: {
      id: p.author_id,
      username: p.username,
      avatarUrl: p.avatar_url,
    },
    score: computeScore(p),
  }));

  // Tri selon le paramètre
  let sorted = scored;
  if (sort === 'likes') {
    sorted = scored.sort((a, b) => b.likesCount - a.likesCount);
  } else if (sort === 'comments') {
    sorted = scored.sort((a, b) => b.commentsCount - a.commentsCount);
  } else {
    sorted = scored.sort((a, b) => b.score - a.score);
  }

  // Pagination
  const start = (page - 1) * limit;
  const paginated = sorted.slice(start, start + Math.min(limit, 50));

  // Cacher le résultat
  try {
    await redis.setex(cacheKey, 60, JSON.stringify(paginated));
    logger.debug('Cache set', { meta: { cacheKey, ttl: 60 } });
  } catch (err) {
    logger.warn('Redis set failed', { meta: { error: err.message } });
  }

  return paginated;
}

/**
 * Invalider tout le cache popular
 */
async function invalidateAll() {
  try {
    const keys = await redis.keys('popular:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info('Invalidated popular cache', { meta: { count: keys.length } });
    }
  } catch (err) {
    logger.warn('Redis invalidation failed', { meta: { error: err.message } });
  }
}

module.exports = {
  getPopular,
  invalidateAll,
};
