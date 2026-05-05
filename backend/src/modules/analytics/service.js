const { query } = require('../../core/database');
const { redis } = require('../../core/redis');
const AppError = require('../../core/errors/AppError');
const logger = require('../../core/utils/logger');

const RANGE = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  'all': 3650,
};

class AnalyticsService {
  async track({ type, targetId, metadata }) {
    try {
      const result = await query(
        `INSERT INTO analytics_events (type, target_id, metadata, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [type, targetId || null, metadata ? JSON.stringify(metadata) : null]
      );

      if (!result.rows[0]) {
        throw AppError.databaseError('Failed to track event');
      }

      // Invalidate cache
      try {
        await this.invalidateCache();
      } catch (err) {
        logger.warn('Failed to invalidate analytics cache', { meta: { error: err.message } });
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('AnalyticsService.track error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to track event');
    }
  }

  async getStats(range) {
    try {
      const cacheKey = `analytics:${range}`;

      // Try cache first
      if (redis) {
        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (err) {
          logger.warn('Failed to get cached analytics', { meta: { error: err.message } });
        }
      }

      // Calculate since date
      const days = RANGE[range] || 7;
      const since = new Date(Date.now() - days * 86400000);

      // Get all stats in parallel
      const [viewsResult, searchesResult, initiativesResult, videosResult, articlesResult] = await Promise.all([
        query(
          `SELECT COUNT(*) as count FROM analytics_events
           WHERE type = $1 AND created_at >= $2`,
          ['view', since.toISOString()]
        ),
        query(
          `SELECT COUNT(*) as count FROM analytics_events
           WHERE type = $1 AND created_at >= $2`,
          ['search', since.toISOString()]
        ),
        query(
          `SELECT COUNT(*) as count FROM analytics_events
           WHERE type = $1 AND created_at >= $2`,
          ['initiative_view', since.toISOString()]
        ),
        query(
          `SELECT COUNT(*) as count FROM analytics_events
           WHERE type = $1 AND created_at >= $2`,
          ['video_view', since.toISOString()]
        ),
        query(
          `SELECT COUNT(*) as count FROM analytics_events
           WHERE type = $1 AND created_at >= $2`,
          ['article_view', since.toISOString()]
        ),
      ]);

      const result = {
        views: parseInt(viewsResult.rows[0].count, 10),
        searches: parseInt(searchesResult.rows[0].count, 10),
        initiatives: parseInt(initiativesResult.rows[0].count, 10),
        videos: parseInt(videosResult.rows[0].count, 10),
        articles: parseInt(articlesResult.rows[0].count, 10),
      };

      // Cache result
      if (redis) {
        try {
          await redis.setex(cacheKey, 60, JSON.stringify(result));
        } catch (err) {
          logger.warn('Failed to cache analytics', { meta: { error: err.message } });
        }
      }

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('AnalyticsService.getStats error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to fetch analytics');
    }
  }

  async invalidateCache() {
    if (!redis) return;

    try {
      const keys = await redis.keys('analytics:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.warn('Failed to invalidate analytics cache', { meta: { error: error.message } });
    }
  }
}

module.exports = new AnalyticsService();
