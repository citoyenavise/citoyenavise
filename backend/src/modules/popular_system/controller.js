/**
 * Popular System Controller — Version officielle
 * Gestion des contenus populaires avec scoring temporal
 */

const service = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');
const { PopularQuerySchema } = require('./schema');

module.exports = {
  /**
   * Posts populaires avec scoring temporal et caching Redis
   * GET /api/v1/popular?range=daily&page=1&limit=10&sort=score
   */
  getPopular: async (req, res) => {
    const validated = PopularQuerySchema.parse(req.query);
    const result = await service.getPopular(validated);
    res.json(result);
  },
};
