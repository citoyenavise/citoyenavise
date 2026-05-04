/**
 * Controller de recherche
 */

const { z } = require('zod');
const service = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');

const searchSchema = z.object({
  q: z.string().min(2, 'Min 2 caractères'),
  type: z.enum(['posts', 'users', 'all']).default('all'),
  category: z.string().optional(),
  sort: z.enum(['relevance', 'recent', 'popular']).default('relevance'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * Recherche globale
 */
async function search(req, res) {
  const params = searchSchema.parse({ ...req.query, ...req.body });

  let result;
  const filters = {
    category: params.category,
    sort: params.sort,
    page: params.page,
    limit: params.limit,
  };

  switch (params.type) {
    case 'posts':
      result = await service.searchPosts(params.q, filters);
      break;
    case 'users':
      result = await service.searchUsers(params.q, filters);
      break;
    case 'all':
    default:
      result = await service.searchAll(params.q, filters);
      break;
  }

  res.json(result);
}

/**
 * Chercher seulement les posts
 */
async function searchPostsOnly(req, res) {
  const { q, category, sort, page, limit } = searchSchema.parse(req.query);

  const result = await service.searchPosts(q, {
    category,
    sort,
    page,
    limit,
  });

  res.json(result);
}

/**
 * Chercher seulement les users
 */
async function searchUsersOnly(req, res) {
  const { q, page, limit } = searchSchema.parse(req.query);

  const result = await service.searchUsers(q, { page, limit });

  res.json(result);
}

module.exports = {
  search,
  searchPostsOnly,
  searchUsersOnly,
};
