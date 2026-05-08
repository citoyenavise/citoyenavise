const { z } = require('zod');

const VALID_TYPES = ['idea', 'proposal', 'question', 'discussion'];
const VALID_CATEGORIES = ['élections', 'gouvernement', 'droits', 'services', 'santé', 'éducation', 'environnement', 'économie', 'autres'];

const createPostRules = {
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(5000),
  type: z.enum(VALID_TYPES),
  category: z.enum(VALID_CATEGORIES),
};

const updatePostRules = {
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).max(5000).optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
};

const listRules = {
  limit: z.number().min(1).max(100).optional(),
  page: z.number().min(1).optional(),
  category: z.string().optional(),
  type: z.enum(VALID_TYPES).optional(),
  sort: z.string().optional(),
};

module.exports = {
  createPostRules,
  updatePostRules,
  listRules,
};
