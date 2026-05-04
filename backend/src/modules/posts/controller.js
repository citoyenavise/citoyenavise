/**
 * Contrôleur posts & idées — version corrigée
 */

const { z } = require('zod');
const postsService = require('./service');

// Validation stricte des types et catégories
const VALID_TYPES = ['idea', 'proposal', 'question', 'discussion'];
const VALID_CATEGORIES = ['élections', 'gouvernement', 'droits', 'services', 'santé', 'éducation', 'environnement', 'économie', 'autres'];

// Création
const createPostSchema = z.object({
  title: z.string().min(5).max(255),
  content: z.string().min(20).max(5000),
  type: z.enum(VALID_TYPES),
  category: z.enum(VALID_CATEGORIES),
});

// Mise à jour
const updatePostSchema = z.object({
  title: z.string().min(5).max(255).optional(),
  content: z.string().min(20).max(5000).optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
});

// Pagination + filtres
const listSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
  category: z.enum(VALID_CATEGORIES).optional(),
  type: z.enum(VALID_TYPES).optional(),
  sort: z.enum(['latest', 'popular']).default('latest'),
  userId: z.string().uuid().optional(),
});

// Flag
const flagSchema = z.object({
  reason: z.string().min(5).max(500),
});

async function listPosts(req, res) {
  const validated = listSchema.parse(req.query);
  const result = await postsService.listPosts(validated);
  res.json(result);
}

async function getPost(req, res) {
  const { id } = req.params;
  const post = await postsService.getPost(id);
  res.json(post);
}

async function createPost(req, res) {
  const validated = createPostSchema.parse(req.body);
  const post = await postsService.createPost(req.user.userId, validated);
  res.status(201).json(post);
}

async function updatePost(req, res) {
  const { id } = req.params;
  const validated = updatePostSchema.parse(req.body);
  const post = await postsService.updatePost(id, validated, req.user.userId);
  res.json(post);
}

async function deletePost(req, res) {
  const { id } = req.params;
  await postsService.deletePost(id, req.user.userId);
  res.status(204).send();
}

async function flagPost(req, res) {
  const validated = flagSchema.parse(req.body);
  const { id } = req.params;

  await postsService.flagPost(id, validated.reason, req.user.userId);
  res.json({ message: 'Post flagged' });
}

async function likePost(req, res) {
  const { id } = req.params;
  await postsService.likePost(id, req.user.userId);
  res.status(201).json({ message: 'Post liked' });
}

async function unlikePost(req, res) {
  const { id } = req.params;
  await postsService.unlikePost(id, req.user.userId);
  res.status(204).send();
}

module.exports = {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  flagPost,
  likePost,
  unlikePost,
};
