/**
 * Routes pour les élus (Députés, Sénateurs, Maires, Conseillers)
 * Endpoints publics — Pas d'authentification requise
 */

import express from 'express';
import { z } from 'zod';
import Elu from '../models/Elu.js';
import Petition from '../models/Petition.js';

const router = express.Router();

const idSchema = z.object({
  id: z.coerce.number().int().positive('ID doit être un entier positif'),
});

/**
 * GET /api/v1/elus
 * Lister tous les élus
 */
router.get('/', async (req, res, next) => {
  try {
    const elus = await Elu.findAll({
      attributes: ['id', 'nom', 'titre', 'region', 'niveau', 'email', 'photoUrl', 'siteWeb'],
      order: [['nom', 'ASC']],
    });

    res.json({
      success: true,
      count: elus.length,
      data: elus,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id
 * Obtenir détail d'un élu
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
    const elu = await Elu.findByPk(id, {
      attributes: ['id', 'nom', 'titre', 'region', 'niveau', 'email', 'photoUrl', 'siteWeb', 'createdAt', 'updatedAt'],
    });

    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    res.json({
      success: true,
      data: elu,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/elus/:id/petitions
 * Lister pétitions adressées à cet élu
 */
router.get('/:id/petitions', async (req, res, next) => {
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

    const elu = await Elu.findByPk(id);
    if (!elu) {
      return res.status(404).json({
        success: false,
        error: 'Élu non trouvé',
      });
    }

    const petitions = await Petition.findAll({
      where: { eluId: id },
      attributes: ['id', 'titre', 'description', 'status', 'signaturesCount', 'deadline', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      eluId: id,
      eluNom: elu.nom,
      count: petitions.length,
      data: petitions,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
