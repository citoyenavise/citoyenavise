/**
 * Contrôleur feed
 */

const feedService = require('../services/feed.service');
const { AppError } = require('../../../core/middleware/errorHandler');

async function getFeed(req, res) {
  const { limit = 20, page = 1 } = req.query;

  const result = await feedService.getFeed(req.user?.userId || null, {
    limit: Math.min(parseInt(limit), 100),
    page: Math.max(1, parseInt(page)),
  });

  if (result.data && Array.isArray(result.data)) {
    res.apiPaginated(result.data, result.meta.total, result.meta.page, result.meta.limit);
  } else {
    res.apiSuccess(result);
  }
}

module.exports = {
  getFeed,
};
