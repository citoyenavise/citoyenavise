/**
 * Routes pour les pétitions
 * Endpoints publics pour lister/voir + endpoints protégés pour créer/signer
 */

import express from 'express';
import { z } from 'zod';
import Petition from '../models/Petition.js';
import Signature from '../models/Signature.js';
import User from '../models/User.js';
import Elu from '../models/Elu.js';
import { authMiddleware, checkOwnership } from '../middlewares/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Schémas de validation Zod
const idSchema = z.object({
  id: z.coerce.number().int().positive('ID doit être un entier positif'),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const createPetitionSchema = z.object({
  titre: z.string()
    .min(5, 'Titre doit avoir minimum 5 caractères')
    .max(255, 'Titre ne doit pas dépasser 255 caractères'),
  description: z.string()
    .min(20, 'Description doit avoir minimum 20 caractères')
    .max(5000, 'Description ne doit pas dépasser 5000 caractères'),
  eluId: z.number().int().positive().optional(),
  deadline: z.string().datetime().optional(),
});

/**
 * GET /api/v1/petitions
 * Lister les pétitions publiées avec pagination
 * Query: { limit, offset, eluId, search }
 */
router.get('/', async (req, res, next) => {
  try {
    const paginationValidation = paginationSchema.safeParse(req.query);

    if (!paginationValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres invalides',
        details: paginationValidation.error.errors,
      });
    }

    const { limit, offset } = paginationValidation.data;
    const { eluId, search } = req.query;

    // Construire les filtres
    const where = { status: 'published' };

    if (eluId) {
      const eluIdNum = parseInt(eluId, 10);
      if (!isNaN(eluIdNum)) {
        where.eluId = eluIdNum;
      }
    }

    // Recherche full-text (simple LIKE pour maintenant)
    if (search && search.length >= 2) {
      where[Op.or] = [
        { titre: { [Op.iLike]: \%\%\ } },
        { description: { [Op.iLike]: \%\%\ } },
      ];
    }

    // Récupérer pétitions avec relations
    const { count, rows } = await Petition.findAndCountAll({
      where,
      attributes: ['id', 'titre', 'description', 'status', 'signaturesCount', 'deadline', 'createdAt'],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email'],
        },
        {
          model: Elu,
          as: 'elu',
          attributes: ['id', 'nom', 'titre', 'region'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      count: rows.length,
      total: count,
      limit,
      offset,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/petitions/:id
 * Obtenir le détail d'une pétition
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

    const petition = await Petition.findByPk(id, {
      attributes: ['id', 'titre', 'description', 'status', 'signaturesCount', 'deadline', 'createdAt', 'updatedAt'],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'nomComplet'],
        },
        {
          model: Elu,
          as: 'elu',
          attributes: ['id', 'nom', 'titre', 'region', 'email'],
        },
      ],
    });

    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée',
      });
    }

    res.json({
      success: true,
      data: petition,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/petitions
 * Créer une nouvelle pétition (protégée)
 * Body: { titre, description, eluId?, deadline? }
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const validation = createPetitionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validation.error.errors,
      });
    }

    const { titre, description, eluId, deadline } = validation.data;

    // Vérifier que l'élu existe (si fourni)
    if (eluId) {
      const elu = await Elu.findByPk(eluId);
      if (!elu) {
        return res.status(404).json({
          success: false,
          error: 'Élu non trouvé',
        });
      }
    }

    // Créer la pétition en status "draft"
    const petition = await Petition.create({
      titre,
      description,
      citoyenId: req.user.userId,
      eluId: eluId || null,
      status: 'draft',
      signaturesCount: 0,
      deadline: deadline ? new Date(deadline) : null,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Pétition créée',
      data: {
        id: petition.id,
        titre: petition.titre,
        status: petition.status,
        citoyenId: petition.citoyenId,
        createdAt: petition.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/petitions/:id/sign
 * Signer une pétition (protégée, idempotent)
 * Erreur 409 si déjà signé (UNIQUE constraint)
 */
router.post('/:id/sign', authMiddleware, async (req, res, next) => {
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

    // Vérifier que la pétition existe et est publiée
    const petition = await Petition.findByPk(id);

    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée',
      });
    }

    if (petition.status !== 'published') {
      return res.status(400).json({
        success: false,
        error: 'Cette pétition n\'est pas publiée',
      });
    }

    // Essayer de créer la signature
    try {
      const signature = await Signature.create({
        petitionId: id,
        citoyenId: req.user.userId,
        createdAt: new Date(),
      });

      // Augmenter le compteur de signatures
      petition.signaturesCount += 1;
      await petition.save();

      res.status(201).json({
        success: true,
        message: 'Pétition signée',
        data: {
          petitionId: id,
          citoyenId: req.user.userId,
          createdAt: signature.createdAt,
        },
      });
    } catch (signatureErr) {
      // Vérifier si c'est une violation de contrainte UNIQUE
      if (signatureErr.name === 'SequelizeUniqueConstraintError' ||
          signatureErr.name === 'UniqueConstraintError') {
        return res.status(409).json({
          success: false,
          error: 'Vous avez déjà signé cette pétition',
          code: 'DUPLICATE_SIGNATURE',
        });
      }
      throw signatureErr;
    }
  } catch (err) {
    next(err);
  }
});

export default router;
