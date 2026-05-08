/**
 * Contrôleur posts — standardisé
 */

const postsService = require('../services/posts.service');
const { AppError } = require('../../../core/middleware/errorHandler');
const {
  createPostSchema,
  updatePostSchema,
  listSchema,
} = require('../schema');

async function listPosts(req, res) {
  const validated = listSchema.safeParse(req.query);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      422,
      'Invalid query parameters',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const result = await postsService.listPosts(validated.data);
  if (result.data && Array.isArray(result.data)) {
    res.apiPaginated(result.data, result.meta.total, result.meta.page, result.meta.limit);
  } else {
    res.apiSuccess(result);
  }
}

async function getPost(req, res) {
  const { id } = req.params;
  const post = await postsService.getPost(id);

  if (!post) {
    throw new AppError('NOT_FOUND', 404, 'Post not found');
  }

  res.apiSuccess(post);
}

async function createPost(req, res) {
  const validated = createPostSchema.safeParse(req.body);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      422,
      'Invalid request body',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const post = await postsService.createPost(validated.data, req.user.userId);
  res.apiCreated(post);
}

async function updatePost(req, res) {
  const { id } = req.params;
  const validated = updatePostSchema.safeParse(req.body);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      422,
      'Invalid request body',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const post = await postsService.updatePost(id, validated.data, req.user.userId);
  res.apiUpdated(post);
}

async function deletePost(req, res) {
  const { id } = req.params;
  await postsService.deletePost(id, req.user.userId);
  res.apiDeleted(id);
}

module.exports = {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
};
