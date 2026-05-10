/**
 * Routes pour les pétitions
 * Endpoints publics : lister, voir, signatures
 * Endpoints protégés : créer, éditer, supprimer
 */

import express from 'express';
import { z } from 'zod';
import Petition from '../models/Petition.js';
import Signature from '../models/Signature.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import Elu from '../models/Elu.js';
import { authMiddleware, checkOwnership } from '../middlewares/auth.js';
import { signatureLimiter } from '../middlewares/rateLimiter.js';
import { Op } from 'sequelize';

const router = express.Router();

// Schémas de validation Zod
const idSchema = z.object({
  id: z.coerce.number().int().positive('ID doit être un entier positif'),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const statsQuerySchema = z.object({
  goal: z.coerce.number().int().positive().optional(),
});

const listPetitionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['draft', 'published', 'closed', 'won']).optional(),
  elu_id: z.coerce.number().int().positive().optional(),
  search: z.string().min(2).optional(),
  sort: z.enum(['signatures_count', 'created_at']).default('created_at'),
});

const createPetitionSchema = z.object({
  titre: z.string()
    .min(10, 'Titre doit avoir minimum 10 caractères')
    .max(200, 'Titre ne doit pas dépasser 200 caractères'),
  description: z.string()
    .min(20, 'Description doit avoir minimum 20 caractères')
    .max(2000, 'Description ne doit pas dépasser 2000 caractères'),
  eluId: z.number().int().positive().optional(),
  status: z.enum(['draft', 'published', 'closed', 'won']).default('draft'),
});

const updatePetitionSchema = z.object({
  titre: z.string()
    .min(10, 'Titre doit avoir minimum 10 caractères')
    .max(200, 'Titre ne doit pas dépasser 200 caractères')
    .optional(),
  description: z.string()
    .min(20, 'Description doit avoir minimum 20 caractères')
    .max(2000, 'Description ne doit pas dépasser 2000 caractères')
    .optional(),
  eluId: z.number().int().positive().optional().nullable(),
  status: z.enum(['draft', 'published', 'closed', 'won']).optional(),
});

/**
 * GET /api/v1/petitions
 * Lister les pétitions avec filtres, recherche et tri
 * Query: { page, limit, status, elu_id, search, sort }
 */
router.get('/', async (req, res, next) => {
  try {
    const queryValidation = listPetitionsQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres de requête invalides',
        details: queryValidation.error.errors,
      });
    }

    const { page, limit, status, elu_id, search, sort } = queryValidation.data;
    const offset = (page - 1) * limit;

    // Construire les filtres
    const where = {};

    // Filtre status (optionnel)
    if (status) {
      where.status = status;
    }

    // Filtre elu_id (optionnel)
    if (elu_id) {
      where.eluId = elu_id;
    }

    // Recherche full-text sur titre + description
    if (search) {
      where[Op.or] = [
        { titre: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Déterminer l'ordre de tri
    let order = [['createdAt', 'DESC']]; // défaut
    if (sort === 'signatures_count') {
      order = [['signaturesCount', 'DESC'], ['createdAt', 'DESC']];
    } else if (sort === 'created_at') {
      order = [['createdAt', 'DESC']];
    }

    // Récupérer pétitions avec relations
    const { count, rows } = await Petition.findAndCountAll({
      where,
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
          attributes: ['id', 'nom', 'titre', 'region'],
        },
      ],
      order,
      limit,
      offset,
    });

    res.json({
      success: true,
      count: rows.length,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      sort,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/petitions/:id
 * Obtenir le détail d'une pétition avec signature count
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
      attributes: ['id', 'titre', 'description', 'status', 'signaturesCount', 'deadline', 'createdAt', 'updatedAt', 'citoyenId', 'eluId'],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'nomComplet'],
        },
        {
          model: Elu,
          as: 'elu',
          attributes: ['id', 'nom', 'titre', 'region', 'email', 'siteWeb'],
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
 * GET /api/v1/petitions/:id/stats
 * Obtenir les statistiques d'une pétition (public)
 * Query: { goal? } — goal optionnel pour calculer percentageToGoal
 *
 * Retour: {
 *   totalSignatures: 123,
 *   totalComments: 45,
 *   createdAt: "2026-05-09",
 *   creator: { id, nomComplet },
 *   targetElu: { id, nom },
 *   percentageToGoal: 75 (ou null si pas goal)
 * }
 */
router.get('/:id/stats', async (req, res, next) => {
  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. Validation petition_id
    // ═══════════════════════════════════════════════════════════════
    const idValidation = idSchema.safeParse({ id: req.params.id });

    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'petition_id invalide',
        details: idValidation.error.errors,
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. Validation query params (goal optionnel)
    // ═══════════════════════════════════════════════════════════════
    const queryValidation = statsQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres invalides',
        details: queryValidation.error.errors,
      });
    }

    const petitionId = idValidation.data.id;
    const { goal } = queryValidation.data;

    // ═══════════════════════════════════════════════════════════════
    // 3. Récupérer la pétition avec relations
    // ═══════════════════════════════════════════════════════════════
    const petition = await Petition.findByPk(petitionId, {
      attributes: ['id', 'createdAt', 'signaturesCount', 'citoyenId', 'eluId'],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nomComplet'],
        },
        {
          model: Elu,
          as: 'elu',
          attributes: ['id', 'nom'],
        },
      ],
    });

    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée',
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. Compter les commentaires
    // ═══════════════════════════════════════════════════════════════
    const commentCount = await Comment.count({
      where: { petitionId },
    });

    // ═══════════════════════════════════════════════════════════════
    // 5. Calculer percentageToGoal si goal fourni
    // ═══════════════════════════════════════════════════════════════
    let percentageToGoal = null;

    if (goal && goal > 0) {
      percentageToGoal = Math.round(
        (petition.signaturesCount / goal) * 100
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. Retourner les statistiques
    // ═══════════════════════════════════════════════════════════════
    res.json({
      success: true,
      data: {
        totalSignatures: petition.signaturesCount || 0,
        totalComments: commentCount,
        createdAt: petition.createdAt.toISOString().split('T')[0],
        creator: petition.creator ? {
          id: petition.creator.id,
          nomComplet: petition.creator.nomComplet,
        } : null,
        targetElu: petition.elu ? {
          id: petition.elu.id,
          nom: petition.elu.nom,
        } : null,
        percentageToGoal,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/petitions
 * Créer une nouvelle pétition (protégée)
 * Body: { titre, description, eluId?, status? }
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

    const { titre, description, eluId, status } = validation.data;

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

    // Créer la pétition
    const petition = await Petition.create({
      titre,
      description,
      citoyenId: req.user.userId,
      eluId: eluId || null,
      status: status || 'draft',
      signaturesCount: 0,
    });

    const createdPetition = await Petition.findByPk(petition.id, {
      attributes: ['id', 'titre', 'description', 'status', 'signaturesCount', 'createdAt', 'citoyenId', 'eluId'],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'nomComplet'],
        },
        {
          model: Elu,
          as: 'elu',
          attributes: ['id', 'nom', 'titre', 'region'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Pétition créée',
      data: createdPetition,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/petitions/:id
 * Éditer une pétition (protégée, créateur uniquement)
 * Body: { titre?, description?, eluId?, status? }
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

    const { id } = idValidation.data;

    // Récupérer la pétition
    const petition = await Petition.findByPk(id);

    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée',
      });
    }

    // Vérifier que l'utilisateur est le créateur
    if (petition.citoyenId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé à modifier cette pétition',
        code: 'FORBIDDEN_EDIT',
      });
    }

    // Valider les données
    const validation = updatePetitionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validation.error.errors,
      });
    }

    const { titre, description, eluId, status } = validation.data;

    // Vérifier que le nouvel élu existe (si fourni)
    if (eluId !== undefined) {
      if (eluId !== null) {
        const elu = await Elu.findByPk(eluId);
        if (!elu) {
          return res.status(404).json({
            success: false,
            error: 'Élu non trouvé',
          });
        }
      }
      petition.eluId = eluId;
    }

    // Mettre à jour les champs
    if (titre !== undefined) petition.titre = titre;
    if (description !== undefined) petition.description = description;
    if (status !== undefined) petition.status = status;

    await petition.save();

    // Récupérer la pétition mise à jour avec relations
    const updatedPetition = await Petition.findByPk(id, {
      attributes: ['id', 'titre', 'description', 'status', 'signaturesCount', 'createdAt', 'updatedAt', 'citoyenId', 'eluId'],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'nomComplet'],
        },
        {
          model: Elu,
          as: 'elu',
          attributes: ['id', 'nom', 'titre', 'region'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Pétition mise à jour',
      data: updatedPetition,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/petitions/:id
 * Supprimer une pétition (protégée, créateur uniquement)
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const idValidation = idSchema.safeParse({ id: req.params.id });

    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: idValidation.error.errors,
      });
    }

    const { id } = idValidation.data;

    // Récupérer la pétition
    const petition = await Petition.findByPk(id);

    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée',
      });
    }

    // Vérifier que l'utilisateur est le créateur
    if (petition.citoyenId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé à supprimer cette pétition',
        code: 'FORBIDDEN_DELETE',
      });
    }

    // Supprimer les signatures associées en cascade (ou laisser la DB gérer via CASCADE)
    await Signature.destroy({
      where: { petitionId: id },
    });

    // Supprimer la pétition
    await petition.destroy();

    res.json({
      success: true,
      message: 'Pétition supprimée',
      data: {
        id,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/petitions/:id/signatures
 * Lister les signataires d'une pétition avec pagination
 * Query: { page, limit }
 */
router.get('/:id/signatures', async (req, res, next) => {
  try {
    const idValidation = idSchema.safeParse({ id: req.params.id });

    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        details: idValidation.error.errors,
      });
    }

    const paginationValidation = paginationSchema.safeParse(req.query);

    if (!paginationValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres de pagination invalides',
        details: paginationValidation.error.errors,
      });
    }

    const { id } = idValidation.data;
    const { page, limit } = paginationValidation.data;
    const offset = (page - 1) * limit;

    // Vérifier que la pétition existe
    const petition = await Petition.findByPk(id);

    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée',
      });
    }

    // Récupérer les signatures avec pagination
    const { count, rows } = await Signature.findAndCountAll({
      where: { petitionId: id },
      include: [
        {
          model: User,
          as: 'signer',
          attributes: ['id', 'email', 'nomComplet'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      petitionId: id,
      count: rows.length,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows.map(sig => ({
        id: sig.id,
        signer: sig.signer,
        createdAt: sig.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/petitions/:id/sign
 * Signer une pétition (protégée, JWT required)
 * Rate limited: 1 signature par minute par utilisateur
 *
 * Validations:
 * - petition_id (integer positif) ✓ Zod
 * - citoyen_id du token ✓ authMiddleware
 * - Pétition existe ✓ findByPk
 *
 * Réponse succès: { signed: true, totalSignatures: 123 }
 * Erreur doublon: 409 { signed: false, message: "Vous avez déjà signé cette pétition" }
 */
router.post('/:id/sign', authMiddleware, signatureLimiter, async (req, res, next) => {
  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. Validation Zod : petition_id
    // ═══════════════════════════════════════════════════════════════
    const validation = idSchema.safeParse({ id: req.params.id });

    if (!validation.success) {
      return res.status(400).json({
        signed: false,
        message: 'petition_id invalide',
        details: validation.error.errors,
      });
    }

    const petitionId = validation.data.id;

    // ═══════════════════════════════════════════════════════════════
    // 2. Vérifier que la pétition existe
    // ═══════════════════════════════════════════════════════════════
    const petition = await Petition.findByPk(petitionId);

    if (!petition) {
      return res.status(404).json({
        signed: false,
        message: 'Pétition non trouvée',
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. Vérifier que la pétition est publiée
    // ═══════════════════════════════════════════════════════════════
    if (petition.status !== 'published') {
      return res.status(400).json({
        signed: false,
        message: 'Cette pétition n\'est pas publiée',
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. Vérifier que l'utilisateur n'a pas déjà signé (UNIQUE violation)
    // ═══════════════════════════════════════════════════════════════
    const existingSignature = await Signature.findOne({
      where: {
        petitionId,
        citoyenId: req.user.userId,
      },
    });

    if (existingSignature) {
      return res.status(409).json({
        signed: false,
        message: 'Vous avez déjà signé cette pétition',
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. INSERT signature (petition_id, citoyen_id)
    // ═══════════════════════════════════════════════════════════════
    try {
      await Signature.create({
        petitionId,
        citoyenId: req.user.userId,
      });
    } catch (err) {
      // Capturer UNIQUE violation au cas où
      if (err.name === 'SequelizeUniqueConstraintError' ||
          err.name === 'UniqueConstraintError') {
        return res.status(409).json({
          signed: false,
          message: 'Vous avez déjà signé cette pétition',
        });
      }
      throw err;
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. Incrémenter signatures_count sur petition
    // ═══════════════════════════════════════════════════════════════
    petition.signaturesCount += 1;
    await petition.save();

    // ═══════════════════════════════════════════════════════════════
    // 7. Retourner { signed: true, totalSignatures: 123 }
    // ═══════════════════════════════════════════════════════════════
    res.status(201).json({
      signed: true,
      totalSignatures: petition.signaturesCount,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/petitions/:id/sign
 * Retirer sa signature d'une pétition (protégée, JWT required)
 *
 * Validations:
 * - petition_id (integer positif) ✓ Zod
 * - citoyen_id du token ✓ authMiddleware
 * - Pétition existe ✓ findByPk
 * - Signature existe ✓ findOne
 *
 * Réponse succès: { unsigned: true, totalSignatures: 122 }
 * Erreur signature inexistante: 404 { unsigned: false, message: "..." }
 */
router.delete('/:id/sign', authMiddleware, async (req, res, next) => {
  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. Validation Zod : petition_id
    // ═══════════════════════════════════════════════════════════════
    const validation = idSchema.safeParse({ id: req.params.id });

    if (!validation.success) {
      return res.status(400).json({
        unsigned: false,
        message: 'petition_id invalide',
        details: validation.error.errors,
      });
    }

    const petitionId = validation.data.id;

    // ═══════════════════════════════════════════════════════════════
    // 2. Vérifier que la pétition existe
    // ═══════════════════════════════════════════════════════════════
    const petition = await Petition.findByPk(petitionId);

    if (!petition) {
      return res.status(404).json({
        unsigned: false,
        message: 'Pétition non trouvée',
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. DELETE signature WHERE petition_id = :id AND citoyen_id
    // ═══════════════════════════════════════════════════════════════
    const signature = await Signature.findOne({
      where: {
        petitionId,
        citoyenId: req.user.userId,
      },
    });

    // Signature n'existe pas : return 404
    if (!signature) {
      return res.status(404).json({
        unsigned: false,
        message: 'Vous n\'aviez pas signé cette pétition',
      });
    }

    // Supprimer la signature
    await signature.destroy();

    // ═══════════════════════════════════════════════════════════════
    // 4. Décrémenter signatures_count
    // ═══════════════════════════════════════════════════════════════
    if (petition.signaturesCount > 0) {
      petition.signaturesCount -= 1;
      await petition.save();
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. Return { unsigned: true, totalSignatures: 122 }
    // ═══════════════════════════════════════════════════════════════
    res.json({
      unsigned: true,
      totalSignatures: petition.signaturesCount,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
