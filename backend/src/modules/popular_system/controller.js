/**
 * Popular System Controller
 * Gestion des idées/posts populaires pour la homepage
 * Avec support du caching Redis
 */

const service = require('./service');
const cache = require('../../core/services/cache');
const { AppError } = require('../../core/middleware/errorHandler');

module.exports = {
  /**
   * Idées populaires (top 10 par défaut)
   * GET /api/v1/popular/ideas?limit=10&category=elections&timeframe=7d
   * Cache: 10 minutes
   */
  getPopularIdeas: async (req, res) => {
    const { limit = 10, category, timeframe = '7d' } = req.query;

    // Clé de cache
    const cacheKey = cache.keys.popularIdeas(timeframe, category);

    // Vérifier le cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Récupérer depuis DB
    const ideas = await service.getPopularIdeas({
      limit: Math.min(parseInt(limit), 50),
      category: category || null,
      timeframe,
    });

    // Cacher la réponse
    await cache.set(cacheKey, ideas, cache.ttls.POPULAR_IDEAS);

    res.set('X-Cache', 'MISS');
    res.json(ideas);
  },

  /**
   * Posts populaires (tous types)
   * GET /api/v1/popular/posts?limit=10&sort=likes|trending
   * Cache: 10 minutes
   */
  getPopularPosts: async (req, res) => {
    const { limit = 10, sort = 'likes' } = req.query;

    // Clé de cache
    const cacheKey = cache.keys.popularPosts(sort);

    // Vérifier le cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Récupérer depuis DB
    const posts = await service.getPopularPosts({
      limit: Math.min(parseInt(limit), 50),
      sort,
    });

    // Cacher la réponse
    await cache.set(cacheKey, posts, cache.ttls.POPULAR_POSTS);

    res.set('X-Cache', 'MISS');
    res.json(posts);
  },

  /**
   * Trending (populaire depuis 24h)
   * GET /api/v1/popular/trending?limit=5
   * Cache: 1 minute (données fraîches)
   */
  getTrending: async (req, res) => {
    const { limit = 5 } = req.query;

    // Clé de cache
    const cacheKey = cache.keys.trendingPosts();

    // Vérifier le cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Récupérer depuis DB
    const trending = await service.getTrending({
      limit: Math.min(parseInt(limit), 20),
    });

    // Cacher la réponse (cache court pour données fraîches)
    await cache.set(cacheKey, trending, cache.ttls.TRENDING_POSTS);

    res.set('X-Cache', 'MISS');
    res.json(trending);
  },

  /**
   * Données pour homepage (idées + posts + trending)
   * GET /api/v1/popular/homepage
   * Cache: 5 minutes
   */
  getHomepageData: async (req, res) => {
    // Clé de cache
    const cacheKey = cache.keys.homepageData();

    // Vérifier le cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Récupérer depuis DB
    const data = await service.getHomepageData();

    // Cacher la réponse
    await cache.set(cacheKey, data, cache.ttls.HOMEPAGE_DATA);

    res.set('X-Cache', 'MISS');
    res.json(data);
  },
};
