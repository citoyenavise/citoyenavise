/**
 * Ideas Controller
 * Gestion des idées civiques (créer, lister, liker, popularité)
 */

const { z } = require('zod');
const service = require('./service');
const { AppError, asyncHandler } = require('../../core/middleware/errorHandler');

// Schémas de validation
const createIdeaSchema = z.object({
  title: z.string().min(5).max(255),
  content: z.string().min(20).max(5000),
  category: z.string().min(2).max(50),
});

const listSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
  category: z.string().optional(),
  sort: z.enum(['latest', 'popular', 'trending']).default('latest'),
});

module.exports = {
  /**
   * Lister les idées
   * GET /api/v1/ideas?limit=20&page=1&category=elections&sort=latest
   */
  listIdeas: async (req, res) => {
    const params = listSchema.parse(req.query);
    const userId = req.userId || null;

    const ideas = await service.listIdeas({
      ...params,
      userId,
    });

    res.json(ideas);
  },

  /**
   * Obtenir une idée spécifique
   * GET /api/v1/ideas/:id
   */
  getIdea: async (req, res) => {
    const idea = await service.getIdea(req.params.id, req.userId);
    if (!idea) {
      throw new AppError('Idée non trouvée', 404);
    }
    res.json(idea);
  },

  /**
   * Créer une idée
   * POST /api/v1/ideas
   */
  createIdea: async (req, res) => {
    const validated = createIdeaSchema.parse(req.body);

    const idea = await service.createIdea({
      ...validated,
      userId: req.userId,
    });

    res.status(201).json(idea);
  },

  /**
   * Modifier une idée
   * PUT /api/v1/ideas/:id
   */
  updateIdea: async (req, res) => {
    const validated = createIdeaSchema.partial().parse(req.body);

    const idea = await service.updateIdea(req.params.id, validated, req.userId);
    if (!idea) {
      throw new AppError('Idée non trouvée', 404);
    }

    res.json(idea);
  },

  /**
   * Supprimer une idée
   * DELETE /api/v1/ideas/:id
   */
  deleteIdea: async (req, res) => {
    await service.deleteIdea(req.params.id, req.userId);
    res.status(204).send();
  },

  /**
   * Liker une idée
   * POST /api/v1/ideas/:id/like
   */
  likeIdea: async (req, res) => {
    const idea = await service.likeIdea(req.params.id, req.userId);
    res.json(idea);
  },

  /**
   * Retirer un like
   * DELETE /api/v1/ideas/:id/like
   */
  unlikeIdea: async (req, res) => {
    const idea = await service.unlikeIdea(req.params.id, req.userId);
    res.json(idea);
  },

  /**
   * Idées populaires
   * GET /api/v1/ideas/popular?limit=10&category=elections
   */
  getPopular: async (req, res) => {
    const { limit = 10, category } = req.query;

    const ideas = await service.getPopularIdeas({
      limit: Math.min(parseInt(limit), 50),
      category: category || null,
    });

    res.json(ideas);
  },
};
