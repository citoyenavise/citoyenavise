/**
 * Authentication Middleware
 * Vérifie JWT et protège les routes
 */

import { verifyJWT } from '../services/auth.js';
import { getConfig } from '../config/env.js';

const config = getConfig();

/**
 * Vérifier et décoder token JWT
 * Extrait le token du header Authorization
 * @param {string} token - JWT token
 * @returns {object|null} Payload décidé ou null si erreur
 */
export function verifyToken(token) {
  if (!token) {
    return null;
  }

  try {
    const decoded = verifyJWT(token);
    return decoded;
  } catch (err) {
    return null;
  }
}

/**
 * Middleware pour routes protégées
 * Extrait et valide JWT du header Authorization: Bearer <token>
 * Ajoute user info dans req.user
 *
 * Erreurs:
 * - 401: Token manquant
 * - 401: Token expiré
 * - 403: Signature invalide
 */
export const authMiddleware = (req, res, next) => {
  try {
    // Extraire header Authorization
    const authHeader = req.headers.authorization;

    // Vérifier présence du header et format "Bearer XXX"
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant',
        message: 'Utilisez: Authorization: Bearer <token>',
        code: 'MISSING_TOKEN',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Format d\'authentification invalide',
        message: 'Format attendu: Authorization: Bearer <token>',
        code: 'INVALID_FORMAT',
      });
    }

    // Extraire token (enlever "Bearer ")
    const token = authHeader.substring(7);

    if (!token || token.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Token vide',
        code: 'EMPTY_TOKEN',
      });
    }

    // Vérifier le JWT
    let decoded;
    try {
      decoded = verifyJWT(token);
    } catch (jwtErr) {
      // Déterminer le type d'erreur JWT
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expiré',
          message: `Le token a expiré le ${new Date(jwtErr.expiredAt).toISOString()}`,
          code: 'TOKEN_EXPIRED',
          expiredAt: jwtErr.expiredAt,
        });
      }

      if (jwtErr.name === 'JsonWebTokenError' || jwtErr.name === 'SyntaxError') {
        return res.status(403).json({
          success: false,
          error: 'Signature invalide',
          message: 'Le token n\'est pas valide',
          code: 'INVALID_SIGNATURE',
        });
      }

      // Erreur JWT générique
      return res.status(401).json({
        success: false,
        error: 'Vérification du token échouée',
        message: jwtErr.message,
        code: 'TOKEN_VERIFICATION_FAILED',
      });
    }

    if (!decoded) {
      return res.status(403).json({
        success: false,
        error: 'Signature invalide',
        message: 'Impossible de décoder le token',
        code: 'INVALID_SIGNATURE',
      });
    }

    // Vérifier que le userId est présent
    if (!decoded.userId) {
      return res.status(403).json({
        success: false,
        error: 'Token malformé',
        message: 'Le token ne contient pas d\'userId',
        code: 'MALFORMED_TOKEN',
      });
    }

    // Attacher user info dans req
    req.user = {
      userId: decoded.userId,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    // Optionnel: ajouter email si disponible dans token
    if (decoded.email) {
      req.user.email = decoded.email;
    }

    next();
  } catch (err) {
    // Erreur serveur inattendue
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la vérification',
      message: config.NODE_ENV === 'development' ? err.message : undefined,
      code: 'SERVER_ERROR',
    });
  }
};

/**
 * Middleware optionnel : authentification facultative
 * Si token valide, ajoute user info dans req.user
 * Sinon, continue sans erreur
 * Utile pour les routes public/private (données partielles selon auth)
 */
export const authOptional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Si pas de header, continuer sans user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    // Essayer de décoder le token
    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    // Si valide, attacher user info
    if (decoded && decoded.userId) {
      req.user = {
        userId: decoded.userId,
        iat: decoded.iat,
        exp: decoded.exp,
        email: decoded.email || null,
      };
    }

    // Continuer en tous cas (même si token invalide)
    next();
  } catch (err) {
    // Erreur non-bloquante, continuer sans user
    next();
  }
};

/**
 * Helper: vérifier que l'utilisateur est propriétaire d'une ressource
 * Lève une erreur si l'utilisateur n'est pas autorisé
 *
 * @param {object} req - Express request
 * @param {number} resourceOwnerId - ID du propriétaire de la ressource
 * @returns {boolean} true si propriétaire
 * @throws {Error} Si pas authentifié ou pas propriétaire
 */
export const checkOwnership = (req, resourceOwnerId) => {
  if (!req.user) {
    const err = new Error('Not authenticated');
    err.status = 401;
    throw err;
  }

  if (req.user.userId !== resourceOwnerId) {
    const err = new Error('Not authorized to modify this resource');
    err.status = 403;
    throw err;
  }

  return true;
};

/**
 * Helper: vérifier que l'utilisateur a un rôle spécifique
 * Utile pour l'autorisation basée sur les rôles (admin, modérateur, etc.)
 *
 * @param {object} req - Express request
 * @param {string|string[]} requiredRoles - Rôle(s) requis
 * @returns {boolean} true si utilisateur a le rôle
 * @throws {Error} Si pas authentifié ou pas le bon rôle
 */
export const checkRole = (req, requiredRoles) => {
  if (!req.user) {
    const err = new Error('Not authenticated');
    err.status = 401;
    throw err;
  }

  // Permettre les rôles comme tableau ou string unique
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  if (!req.user.role || !roles.includes(req.user.role)) {
    const err = new Error(`Required role: ${roles.join(' or ')}`);
    err.status = 403;
    throw err;
  }

  return true;
};

export default {
  verifyToken,
  authMiddleware,
  authOptional,
  checkOwnership,
  checkRole,
};
