/**
 * Cache Service — Redis Integration
 * Gère le caching distribué pour données populaires, trending, etc.
 */

const redis = require('redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.ttls = {
      // Temps en secondes
      POPULAR_IDEAS: 10 * 60,      // 10 minutes
      POPULAR_POSTS: 10 * 60,       // 10 minutes
      TRENDING_POSTS: 1 * 60,        // 1 minute (données fraîches)
      HOMEPAGE_DATA: 5 * 60,         // 5 minutes
      USER_PROFILE: 30 * 60,         // 30 minutes
      GLOBAL_STATS: 60 * 60,         // 1 heure
    };
  }

  /**
   * Initialiser la connexion Redis
   */
  async connect() {
    try {
      if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
        logger.warn('Redis non configuré - cache désactivé');
        this.isConnected = false;
        return;
      }

      const redisUrl = process.env.REDIS_URL ||
                       `redis://${process.env.REDIS_USER || 'default'}:${process.env.REDIS_PASSWORD || ''}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis error', { meta: { error: err.message } });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (err) {
      logger.warn('Redis connexion échouée - cache désactivé', { meta: { error: err.message } });
      this.isConnected = false;
    }
  }

  /**
   * Récupérer une clé du cache
   */
  async get(key) {
    if (!this.isConnected || !this.client) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (err) {
      logger.error('Cache get error', { meta: { key, error: err.message } });
      return null;
    }
  }

  /**
   * Sauvegarder une clé avec TTL
   */
  async set(key, value, ttl = null) {
    if (!this.isConnected || !this.client) return false;

    try {
      const ttlSeconds = ttl || this.ttls.HOMEPAGE_DATA;
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (err) {
      logger.error('Cache set error', { meta: { key, error: err.message } });
      return false;
    }
  }

  /**
   * Supprimer une clé
   */
  async del(key) {
    if (!this.isConnected || !this.client) return false;

    try {
      await this.client.del(key);
      logger.debug(`Cache DEL: ${key}`);
      return true;
    } catch (err) {
      logger.error('Cache del error', { meta: { key, error: err.message } });
      return false;
    }
  }

  /**
   * Invalider un pattern (ex: "popular:*") — SCAN non-blocking
   * Utilise SCAN au lieu de KEYS pour ne pas blocker Redis
   */
  async invalidatePattern(pattern) {
    if (!this.isConnected || !this.client) return 0;

    try {
      const keysToDelete = [];
      let cursor = '0';

      // Itérer avec SCAN (non-blocking)
      do {
        const result = await this.client.scan(
          parseInt(cursor),
          { MATCH: pattern, COUNT: 100 }  // COUNT hint
        );

        cursor = result.cursor;

        if (result.keys && result.keys.length > 0) {
          keysToDelete.push(...result.keys);
        }
      } while (cursor !== '0');

      // Supprimer toutes les clés trouvées
      if (keysToDelete.length > 0) {
        // Batch deletion (chunk by 100 to avoid huge payloads)
        const chunkSize = 100;
        for (let i = 0; i < keysToDelete.length; i += chunkSize) {
          const chunk = keysToDelete.slice(i, i + chunkSize);
          await this.client.del(chunk);
        }

        logger.debug(`Cache INVALIDATE: ${pattern} (${keysToDelete.length} keys)`);
      }

      return keysToDelete.length;
    } catch (err) {
      logger.error('Cache invalidatePattern error', { meta: { pattern, error: err.message } });
      return 0;
    }
  }

  /**
   * Vider tout le cache
   */
  async flush() {
    if (!this.isConnected || !this.client) return false;

    try {
      await this.client.flushDb();
      logger.info('Cache flushed');
      return true;
    } catch (err) {
      logger.error('Cache flush error', { meta: { error: err.message } });
      return false;
    }
  }

  /**
   * Fermer la connexion
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis disconnected');
      this.isConnected = false;
    }
  }

  /**
   * Générer une clé de cache standardisée
   */
  key(...parts) {
    return parts.filter(p => p !== null && p !== undefined).join(':');
  }

  /**
   * Clés standardisées pour popular system
   */
  keys = {
    popularIdeas: (timeframe = '7d', category = null) =>
      this.key('popular:ideas', timeframe, category || 'all'),

    popularPosts: (sort = 'likes') =>
      this.key('popular:posts', sort),

    trendingPosts: () =>
      this.key('popular:trending'),

    homepageData: () =>
      this.key('popular:homepage'),

    userStats: (userId) =>
      this.key('user:stats', userId),

    profileData: (userId) =>
      this.key('profile:data', userId),
  };
}

// Singleton
const cache = new CacheService();

module.exports = cache;
