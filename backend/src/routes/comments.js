/**
 * Routes pour les commentaires des pétitions
 * Endpoints publics : lister les commentaires
 * Endpoints protégés : créer, supprimer
 */

import express from 'express';
import { z } from 'zod';
import Comment from '../models/Comment.js';
import Petition from '../models/Petition.js';
import User from '../models/User.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// Schémas de validation Zod
const idSchema = z.object({
  id: z.coerce.number().int().positive('ID doit être un entier positif'),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createCommentSchema = z.object({
  contenu: z.string()
    .min(5, 'Contenu doit avoir minimum 5 caractères')
    .max(1000, 'Contenu ne doit pas dépasser 1000 caractères'),
});

/**
 * GET /api/v1/petitions/:id/comments
 * Lister les commentaires d'une pétition (public)
 * Query: { page, limit }
 */
router.get('/petitions/:petitionId/comments', async (req, res, next) => {
  try {
    // Valider petitionId
    const petitionValidation = idSchema.safeParse({ id: req.params.petitionId });

    if (!petitionValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'petition_id invalide',
        details: petitionValidation.error.errors,
      });
    }

    // Valider pagination
    const paginationValidation = paginationSchema.safeParse(req.query);

    if (!paginationValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres de pagination invalides',
        details: paginationValidation.error.errors,
      });
    }

    const petitionId = petitionValidation.data.id;
    const { page, limit } = paginationValidation.data;
    const offset = (page - 1) * limit;

    // Vérifier que la pétition existe
    const petition = await Petition.findByPk(petitionId);

    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée',
      });
    }

    // Récupérer les commentaires
    const { count, rows } = await Comment.findAndCountAll({
      where: { petitionId },
      attributes: ['id', 'contenu', 'createdAt', 'updatedAt', 'citoyenId'],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email', 'nomComplet'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      petitionId,
      count: rows.length,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/petitions/:id/comments
 * Créer un commentaire (protégé, JWT required)
 * Body: { contenu }
 */
router.post('/petitions/:petitionId/comments', authMiddleware, async (req, res, next) => {
  try {
    // Valider petitionId
    const petitionValidation = idSchema.safeParse({ id: req.params.petitionId });

    if (!petitionValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'petition_id invalide',
        details: petitionValidation.error.errors,
      });
    }

    // Valider contenu
    const validation = createCommentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validation.error.errors,
      });
    }

    const petitionId = petitionValidation.data.id;
    const { contenu } = validation.data;

    // Vérifier que la pétition existe
    const petition = await Petition.findByPk(petitionId);

    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée',
      });
    }

    // Créer le commentaire
    const comment = await Comment.create({
      petitionId,
      citoyenId: req.user.userId,
      contenu,
    });

    // Récupérer le commentaire avec relations
    const createdComment = await Comment.findByPk(comment.id, {
      attributes: ['id', 'contenu', 'createdAt', 'updatedAt', 'citoyenId', 'petitionId'],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email', 'nomComplet'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Commentaire créé',
      data: createdComment,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/comments/:id
 * Supprimer un commentaire (protégé, créateur seul)
 */
router.delete('/:commentId', authMiddleware, async (req, res, next) => {
  try {
    // Valider commentId
    const validation = idSchema.safeParse({ id: req.params.commentId });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'comment_id invalide',
        details: validation.error.errors,
      });
    }

    const commentId = validation.data.id;

    // Récupérer le commentaire
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Commentaire non trouvé',
      });
    }

    // Vérifier que l'utilisateur est le créateur
    if (comment.citoyenId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé à supprimer ce commentaire',
        code: 'FORBIDDEN_DELETE',
      });
    }

    // Supprimer le commentaire
    await comment.destroy();

    res.json({
      success: true,
      message: 'Commentaire supprimé',
      data: {
        id: commentId,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
