/**
 * Validation Schemas — Comments
 */

const { z } = require('zod');

const createCommentSchema = z.object({
  postId: z.string().uuid('postId doit être un UUID valide'),
  content: z.string()
    .min(1, 'Le contenu ne peut pas être vide')
    .max(5000, 'Le contenu ne peut pas dépasser 5000 caractères'),
});

const updateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Le contenu ne peut pas être vide')
    .max(5000, 'Le contenu ne peut pas dépasser 5000 caractères'),
});

const getCommentsSchema = z.object({
  postId: z.string().uuid('postId doit être un UUID valide'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

module.exports = {
  createCommentSchema,
  updateCommentSchema,
  getCommentsSchema,
};
