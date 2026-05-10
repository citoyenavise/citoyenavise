/**
 * Routes pour les pétitions
 * Endpoints publics pour lister/voir + endpoints protégés pour créer/signer
 */

import express from 'express';
import { Petition, PetitionSignature, PetitionUpdate, PetitionComment } from '../models/Petition.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

/**
 * GET /api/v1/petitions
 * Lister pétitions (publiques seulement, par défaut)
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      status = 'published',
      eluId,
      search,
      orderBy = 'created_at',
      limit = 50,
      offset = 0
    } = req.query;

    const filters = {
      status,
      eluId: eluId ? parseInt(eluId) : null,
      searchTerm: search,
      orderBy
    };

    const petitions = await Petition.list(
      filters,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      count: petitions.length,
      data: petitions
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/petitions/:id
 * Obtenir détail pétition
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const petition = await Petition.findById(parseInt(id));

    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée'
      });
    }

    res.json({
      success: true,
      data: petition
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/petitions/:id/signatures
 * Obtenir signataires d'une pétition
 */
router.get('/:id/signatures', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Vérifier que la pétition existe
    const petition = await Petition.findById(parseInt(id));
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée'
      });
    }

    const signatures = await PetitionSignature.getSignatures(
      parseInt(id),
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      count: signatures.length,
      total: petition.signatures_count,
      data: signatures
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/petitions/:id/updates
 * Obtenir mises à jour d'une pétition
 */
router.get('/:id/updates', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const updates = await PetitionUpdate.getUpdates(
      parseInt(id),
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      count: updates.length,
      data: updates
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/petitions/:id/comments
 * Obtenir commentaires d'une pétition
 */
router.get('/:id/comments', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const comments = await PetitionComment.getComments(
      parseInt(id),
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/petitions/top/signed
 * Obtenir pétitions les plus signées
 */
router.get('/top/signed', async (req, res, next) => {
  try {
    const petitions = await Petition.getTopSigned(10);

    res.json({
      success: true,
      count: petitions.length,
      data: petitions
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/petitions/stats
 * Obtenir statistiques pétitions
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Petition.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/petitions/search?q=terme
 * Chercher pétitions
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, limit = 50, offset = 0 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Terme de recherche doit avoir minimum 2 caractères'
      });
    }

    const petitions = await Petition.search(
      q,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      searchTerm: q,
      count: petitions.length,
      data: petitions
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/petitions
 * Créer nouvelle pétition (PROTECTED)
 * Body: { titre, description, eluId (optional), deadline (optional) }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": { id, titre, description, citoyen_id, elu_id, status, signatures_count, ... }
 * }
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { titre, description, eluId, deadline } = req.body;
    const citoyenId = req.user.userId;

    if (!titre || !description) {
      return res.status(400).json({
        success: false,
        error: 'Titre et description sont requis'
      });
    }

    const petition = await Petition.create({
      titre,
      description,
      citoyenId,
      eluId: eluId ? parseInt(eluId) : null,
      deadline
    });

    res.status(201).json({
      success: true,
      data: petition
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/petitions/:id
 * Mettre à jour pétition (PROTECTED - owner only)
 * Only draft petitions can be edited
 */
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const citoyenId = req.user.userId;

    const petition = await Petition.findById(parseInt(id));
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée'
      });
    }

    if (petition.citoyen_id !== citoyenId) {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez pas modifier cette pétition'
      });
    }

    if (petition.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Seules les brouillons peuvent être modifiés'
      });
    }

    const updated = await Petition.update(parseInt(id), req.body);

    res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/petitions/:id/publish
 * Publier pétition (PROTECTED - owner only)
 */
router.post('/:id/publish', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const citoyenId = req.user.userId;

    const petition = await Petition.findById(parseInt(id));
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée'
      });
    }

    if (petition.citoyen_id !== citoyenId) {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez pas publier cette pétition'
      });
    }

    const published = await Petition.publish(parseInt(id));

    res.json({
      success: true,
      data: published
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/petitions/:id/sign
 * Signer une pétition (PROTECTED)
 */
router.post('/:id/sign', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const citoyenId = req.user.userId;

    const petition = await Petition.findById(parseInt(id));
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée'
      });
    }

    if (petition.status !== 'published') {
      return res.status(400).json({
        success: false,
        error: 'Cette pétition n\'est pas active'
      });
    }

    const signature = await PetitionSignature.sign(parseInt(id), citoyenId);

    res.status(201).json({
      success: true,
      message: 'Pétition signée avec succès',
      data: signature
    });
  } catch (err) {
    if (err.message === 'Already signed this petition') {
      return res.status(409).json({
        success: false,
        error: 'Vous avez déjà signé cette pétition'
      });
    }
    next(err);
  }
});

/**
 * DELETE /api/v1/petitions/:id/sign
 * Retirer signature (PROTECTED)
 */
router.delete('/:id/sign', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const citoyenId = req.user.userId;

    const success = await PetitionSignature.unsign(parseInt(id), citoyenId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Vous n\'aviez pas signé cette pétition'
      });
    }

    res.json({
      success: true,
      message: 'Signature retirée'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/petitions/:id/updates
 * Ajouter mise à jour (PROTECTED - owner only)
 * Body: { contenu }
 */
router.post('/:id/updates', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contenu } = req.body;
    const authorId = req.user.userId;

    if (!contenu) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu est requis'
      });
    }

    const petition = await Petition.findById(parseInt(id));
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée'
      });
    }

    if (petition.citoyen_id !== authorId) {
      return res.status(403).json({
        success: false,
        error: 'Seul le créateur peut ajouter des mises à jour'
      });
    }

    const update = await PetitionUpdate.add(parseInt(id), { authorId, contenu });

    res.status(201).json({
      success: true,
      data: update
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/petitions/:id/updates/:updateId
 * Supprimer mise à jour (PROTECTED - owner only)
 */
router.delete('/:id/updates/:updateId', authMiddleware, async (req, res, next) => {
  try {
    const { id, updateId } = req.params;
    const authorId = req.user.userId;

    const petition = await Petition.findById(parseInt(id));
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée'
      });
    }

    if (petition.citoyen_id !== authorId) {
      return res.status(403).json({
        success: false,
        error: 'Seul le créateur peut supprimer des mises à jour'
      });
    }

    const success = await PetitionUpdate.delete(parseInt(updateId));
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Mise à jour non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Mise à jour supprimée'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/petitions/:id/comments
 * Ajouter commentaire (PROTECTED)
 * Body: { contenu }
 */
router.post('/:id/comments', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contenu } = req.body;
    const authorId = req.user.userId;

    if (!contenu) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu est requis'
      });
    }

    const petition = await Petition.findById(parseInt(id));
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée'
      });
    }

    const comment = await PetitionComment.add(parseInt(id), { authorId, contenu });

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/petitions/:id/comments/:commentId
 * Supprimer commentaire (PROTECTED - owner only)
 */
router.delete('/:id/comments/:commentId', authMiddleware, async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const authorId = req.user.userId;

    const petition = await Petition.findById(parseInt(id));
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: 'Pétition non trouvée'
      });
    }

    const success = await PetitionComment.delete(parseInt(commentId), authorId);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Commentaire non trouvé ou non autorisé'
      });
    }

    res.json({
      success: true,
      message: 'Commentaire supprimé'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
