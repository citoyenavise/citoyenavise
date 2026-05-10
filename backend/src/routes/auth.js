/**
 * Routes pour l'authentification (Magic Link)
 * Endpoints : register/login → email magic link → verify → JWT
 */

import express from 'express';
import { AuthService } from '../services/AuthService.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

/**
 * POST /api/v1/auth/request-login
 * Demander magic link (register ou login)
 * Body: { email }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Email de connexion envoyé. Vérifiez votre boîte email.",
 *   "userId": 1,
 *   "email": "user@example.com"
 * }
 */
router.post('/request-login', async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Email valide requis'
      });
    }

    const result = await AuthService.requestLogin(email);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/verify?token=xyz
 * Vérifier magic link et créer session JWT
 * Query: { token }
 *
 * Response:
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": {
 *     "id": 1,
 *     "email": "user@example.com",
 *     "nom_complet": null,
 *     "verified_at": "2026-05-09T..."
 *   }
 * }
 */
router.get('/verify', async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token manquant'
      });
    }

    const result = await AuthService.verifyMagicLink(token);

    res.json(result);
  } catch (err) {
    res.status(401).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/v1/auth/complete-profile
 * Compléter profil après vérification (optionnel)
 * Requires: JWT token
 * Body: { nomComplet, province, codePostal }
 *
 * Response:
 * {
 *   "success": true,
 *   "user": { id, email, nom_complet, ... }
 * }
 */
router.post('/complete-profile', authMiddleware, async (req, res, next) => {
  try {
    const { nomComplet, province, codePostal } = req.body;

    if (!nomComplet) {
      return res.status(400).json({
        success: false,
        error: 'nom_complet est requis'
      });
    }

    const result = await AuthService.completeProfile(req.user.userId, {
      nomComplet,
      province,
      codePostal
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/me
 * Obtenir utilisateur actuel (via JWT)
 * Requires: JWT token
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "email": "user@example.com",
 *     "nom_complet": "John Doe",
 *     "province": "QC",
 *     "code_postal": "H2X 1A1",
 *     "verified_at": "2026-05-09T..."
 *   }
 * }
 */
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await AuthService.getCurrentUser(req.user.userId);

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout (optionnel, client-side mainly)
 * Requires: JWT token (just for validation)
 */
router.post('/logout', authMiddleware, async (req, res) => {
  // JWT logout est côté client (delete token du storage)
  // On peut ici implémenter token blacklist si nécessaire

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
