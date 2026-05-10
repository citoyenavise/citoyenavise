/**
 * Routes d'authentification (Magic Link + JWT)
 * Endpoints: magic-link → verify → accessToken
 */

import express from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import EmailVerification from '../models/EmailVerification.js';
import { createJWT, generateMagicLink } from '../services/auth.js';
import { sendMagicLinkEmail } from '../services/email.js';
import { authMiddleware } from '../middlewares/auth.js';
import { getConfig } from '../config/env.js';

const router = express.Router();
const config = getConfig();

// Schémas de validation Zod
const emailSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .toLowerCase(),
});

const verifyTokenSchema = z.object({
  token: z.string()
    .min(1, 'Token requis')
    .regex(/^[a-f0-9]{64}$/, 'Format de token invalide'),
});

/**
 * POST /api/v1/auth/magic-link
 * Envoyer un lien magic link à l'email
 * Body: { email }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Lien de connexion envoyé à votre email",
 *   "email": "user@example.com",
 *   "expiresIn": 900
 * }
 */
router.post('/magic-link', async (req, res, next) => {
  try {
    const validation = emailSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Email invalide',
        details: validation.error.errors,
      });
    }

    const { email } = validation.data;

    // Vérifier si l'utilisateur existe, sinon créer
    let user = await User.findOne({ where: { email } });

    if (!user) {
      user = await User.create({
        email,
        createdAt: new Date(),
      });
    }

    // Générer magic link token
    const { token, expiresAt, magicLinkUrl } = generateMagicLink(email);

    // Stocker le token en BD
    await EmailVerification.create({
      userId: user.id,
      token,
      expiresAt,
      createdAt: new Date(),
    });

    // Envoyer email
    try {
      await sendMagicLinkEmail(email, magicLinkUrl);
    } catch (emailErr) {
      // Email non envoyé mais token créé - retourner success quand même pour dev
      if (config.NODE_ENV === 'development') {
        console.warn('Email envoi échoué (dev mode):', emailErr.message);
        return res.json({
          success: true,
          message: '[DEV] Lien magic link créé (email non envoyé)',
          email,
          expiresIn: 900,
          devMagicLink: magicLinkUrl,
        });
      }
      throw emailErr;
    }

    res.json({
      success: true,
      message: 'Lien de connexion envoyé à votre email',
      email,
      expiresIn: 900, // 15 minutes en secondes
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/verify?token=XXX
 * Vérifier magic link token et retourner JWT
 * Query: { token }
 *
 * Response:
 * {
 *   "success": true,
 *   "accessToken": "eyJhbGciOiJIUzI1NiIs...",
 *   "expiresIn": 604800,
 *   "user": {
 *     "id": 1,
 *     "email": "user@example.com"
 *   }
 * }
 */
router.get('/verify', async (req, res, next) => {
  try {
    const validation = verifyTokenSchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Token invalide ou manquant',
        details: validation.error.errors,
      });
    }

    const { token } = validation.data;

    // Chercher le token en BD
    const emailVerification = await EmailVerification.findOne({
      where: { token },
      include: {
        model: User,
        attributes: ['id', 'email'],
      },
    });

    if (!emailVerification) {
      return res.status(401).json({
        success: false,
        error: 'Token non trouvé ou invalide',
      });
    }

    // Vérifier l'expiration
    if (new Date() > new Date(emailVerification.expiresAt)) {
      return res.status(401).json({
        success: false,
        error: 'Lien de connexion expiré',
      });
    }

    // Vérifier que le token n'a pas déjà été utilisé
    if (emailVerification.usedAt) {
      return res.status(401).json({
        success: false,
        error: 'Ce lien a déjà été utilisé',
      });
    }

    // Marquer comme utilisé
    emailVerification.usedAt = new Date();
    await emailVerification.save();

    // Marquer l'utilisateur comme vérifié
    const user = emailVerification.User;
    if (!user.verifiedAt) {
      user.verifiedAt = new Date();
      await user.save();
    }

    // Créer JWT
    const accessToken = createJWT(user.id);

    // Retourner réponse structurée
    res.json({
      success: true,
      accessToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 jours en secondes
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/logout
 * Déconnexion (côté serveur: optionnel, principalement côté client)
 * Requires: JWT token (authentification)
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Déconnecté avec succès"
 * }
 */
router.post('/logout', authMiddleware, (req, res) => {
  // Logout JWT: principalement côté client (supprimer token du storage)
  // Côté serveur: on pourrait implémenter une blacklist si nécessaire
  // Pour maintenant, simple confirmation

  res.json({
    success: true,
    message: 'Déconnecté avec succès',
  });
});

export default router;
