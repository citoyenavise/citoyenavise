/**
 * Routes pour les actualités/posts citoyens
 * GET publiques, POST/PUT protégées (authentification JWT requise)
 */

import express from 'express';
import { z } from 'zod';
import Actualite from '../models/Actualite.js';
import User from '../models/User.js';
import { authMiddleware, checkOwnership } from '../middlewares/auth.js';

const router = express.Router();

// Schémas de validation Zod
const idSchema = z.object({
  id: z.coerce.number().int().positive('ID doit être un entier positif'),
});

const createActualiteSchema = z.object({
  titre: z.string()
    .min(3, 'Titre doit avoir minimum 3 caractères')
    .max(255, 'Titre ne doit pas dépasser 255 caractères'),
  contenu: z.string()
    .min(10, 'Contenu doit avoir minimum 10 caractères'),
});

const updateActualiteSchema = z.object({
  titre: z.string()
    .min(3, 'Titre doit avoir minimum 3 caractères')
    .max(255, 'Titre ne doit pas dépasser 255 caractères')
    .optional(),
  contenu: z.string()
    .min(10, 'Contenu doit avoir minimum 10 caractères')
    .optional(),
});

/**
 * GET /api/v1/actualites
 * Lister les actualités publiées avec informations de l'auteur
 */
router.get('/', async (req, res, next) => {
  try {
    const actualites = await Actualite.findAll({
      where: { status: 'published' },
      attributes: ['id', 'titre', 'contenu', 'status', 'likesCount', 'commentsCount', 'createdAt', 'publishedAt'],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email'],
        },
      ],
      order: [['publishedAt', 'DESC']],
    });

    res.json({
      success: true,
      count: actualites.length,
      data: actualites,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/actualites/:id
 * Obtenir le détail d'une actualité publiée
 */
router.get('/:id', async (req, res, next) => {
  try {
    const validation = idSchema.safeParse({ id: req.params.id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: validation.error.errors,
      });
    }

    const { id } = validation.data;

    const actualite = await Actualite.findByPk(id, {
      attributes: ['id', 'titre', 'contenu', 'status', 'likesCount', 'commentsCount', 'createdAt', 'publishedAt', 'updatedAt'],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email', 'nomComplet'],
        },
      ],
    });

    if (!actualite) {
      return res.status(404).json({
        success: false,
        error: 'Actualité non trouvée',
      });
    }

    if (actualite.status !== 'published') {
      return res.status(403).json({
        success: false,
        error: 'Cette actualité n\'est pas publiée',
      });
    }

    res.json({
      success: true,
      data: actualite,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/actualites
 * Créer une actualité (protégée - authentification requise)
 * Body: { titre, contenu }
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const validation = createActualiteSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validation.error.errors,
      });
    }

    const { titre, contenu } = validation.data;

    const actualite = await Actualite.create({
      titre,
      contenu,
      authorId: req.user.userId,
      status: 'draft',
      likesCount: 0,
      commentsCount: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Actualité créée',
      data: {
        id: actualite.id,
        titre: actualite.titre,
        contenu: actualite.contenu,
        status: actualite.status,
        authorId: actualite.authorId,
        createdAt: actualite.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/actualites/:id
 * Éditer une actualité (protégée - authentification requise)
 * Seul l'auteur peut éditer
 * Body: { titre?, contenu? }
 */
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const idValidation = idSchema.safeParse({ id: req.params.id });

    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: idValidation.error.errors,
      });
    }

    const dataValidation = updateActualiteSchema.safeParse(req.body);

    if (!dataValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: dataValidation.error.errors,
      });
    }

    const { id } = idValidation.data;
    const updateData = dataValidation.data;

    const actualite = await Actualite.findByPk(id);

    if (!actualite) {
      return res.status(404).json({
        success: false,
        error: 'Actualité non trouvée',
      });
    }

    // Vérifier que l'utilisateur est l'auteur
    try {
      checkOwnership(req, actualite.authorId);
    } catch (err) {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'êtes pas autorisé à modifier cette actualité',
      });
    }

    // Mettre à jour les champs fournis
    if (updateData.titre) {
      actualite.titre = updateData.titre;
    }
    if (updateData.contenu) {
      actualite.contenu = updateData.contenu;
    }

    await actualite.save();

    res.json({
      success: true,
      message: 'Actualité mise à jour',
      data: {
        id: actualite.id,
        titre: actualite.titre,
        contenu: actualite.contenu,
        status: actualite.status,
        updatedAt: actualite.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
