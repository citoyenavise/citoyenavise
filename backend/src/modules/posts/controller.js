/**
 * Contrôleur posts & idées — version corrigée
 */

const postsService = require('./service');
const {
  createPostSchema,
  updatePostSchema,
  listSchema,
  flagSchema,
  PopularQuerySchema,
} = require('./schema');

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

async function getPopularPosts(req, res) {
  const validated = PopularQuerySchema.parse(req.query);
  const result = await postsService.getPopularPosts(validated);
  res.json(result);
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
  getPopularPosts,
};
