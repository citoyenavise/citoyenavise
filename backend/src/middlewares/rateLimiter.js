/**
 * Rate Limiter Middleware
 * Protège l'API contre les abus de requêtes
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Limiteur global : 100 requêtes par IP, toutes les 15 minutes
 * S'applique à toutes les routes
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite: 100 requêtes par IP
  message: 'Trop de requêtes depuis cette adresse IP, réessayez plus tard.',
  statusCode: 429,
  skip: (req) => req.path === '/health', // Ne pas limiter les health checks
});

/**
 * Limiteur d'authentification : 5 tentatives par IP, toutes les 15 minutes
 * S'applique aux endpoints d'authentification sensibles
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite: 5 tentatives par IP
  message: 'Trop de tentatives de connexion, réessayez dans 15 minutes.',
  statusCode: 429,
  skipSuccessfulRequests: true, // Ne compte que les requêtes échouées
});

/**
 * Limiteur de signature : 1 signature par minute par utilisateur
 * S'applique aux endpoints de signature de pétition
 * Utilise l'ID utilisateur comme clé, pas l'IP
 */
export const signatureLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // Limite: 1 signature par minute
  message:
    'Vous avez déjà signé cette pétition. Attendez avant de signer à nouveau.',
  statusCode: 429,
  keyGenerator: (req) =>
    // Utiliser l'ID utilisateur comme clé (si authentifié)
    // Sinon, utiliser l'adresse IP avec support IPv6
    req.user?.id || ipKeyGenerator(req),
  skip: (req) => !req.user, // Ne pas limiter si non authentifié (l'auth middleware bloquera)
});

/**
 * Limiteur pour les créations d'actualités : 10 par jour par utilisateur
 * Prévient le spam de contenu
 */
export const createActualiteLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 heures
  max: 10, // Limite: 10 actualités par jour
  message: 'Limite quotidienne de créations atteinte. Réessayez demain.',
  statusCode: 429,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  skip: (req) => !req.user,
});

export default {
  globalLimiter,
  authLimiter,
  signatureLimiter,
  createActualiteLimiter,
};
