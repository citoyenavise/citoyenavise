/**
 * Authentication Middleware
 * Middleware pour valider JWT et protéger les routes
 */

import { AuthService } from '../services/AuthService.js';

/**
 * Middleware pour routes protégées
 * Extrait et valide le JWT du header Authorization
 * Ajoute user info dans req.user
 */
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant. Utilisez: Authorization: Bearer <token>'
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier le JWT
    const decoded = AuthService.verifyJWT(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    // Ajouter user info dans req
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed: ' + err.message
    });
  }
};

/**
 * Middleware optionnel : auth facultatif
 * Si token valide, ajoute user info
 * Sinon, continue quand même
 */
export const authOptional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = AuthService.verifyJWT(token);

      if (decoded) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email
        };
      }
    }

    next();
  } catch (err) {
    // Non-blocking error, continue
    next();
  }
};

/**
 * Helper: vérifier ownership (pour PUT/DELETE)
 * Utilisation: checkOwnership(req, ownerUserId)
 */
export const checkOwnership = (req, ownerUserId) => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  if (req.user.userId !== ownerUserId) {
    throw new Error('Not authorized to modify this resource');
  }

  return true;
};
