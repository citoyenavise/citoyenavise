/**
 * Middleware global de gestion d'erreurs
 */

const z = require('zod');
const logger = require('../utils/logger');

/**
 * Classe d'erreur applicative
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de gestion d'erreurs
 */
function errorHandler(err, req, res, next) {
  // Gérer les erreurs de validation Zod
  if (err instanceof z.ZodError) {
    const statusCode = 400;
    const message = 'Validation failed';

    logger.warn('Validation error', {
      meta: {
        statusCode,
        path: req.path,
        issues: err.issues,
      },
    });

    return res.status(statusCode).json({
      error: message,
      issues: err.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log COMPLET en interne (avec contexte sensible)
  if (statusCode >= 500) {
    logger.error('Server error', {
      meta: {
        statusCode,
        message,
        path: req.path,
        method: req.method,
        userId: req.user?.userId,
        stack: err.stack,  // Détails complets en logs seulement
        requestId: req.requestId,
      },
    });
  } else {
    logger.warn('Client error', {
      meta: {
        statusCode,
        message,
        path: req.path,
        userId: req.user?.userId,
        requestId: req.requestId,
      },
    });
  }

  // Réponse au client — MESSAGES GÉNÉRIQUES en prod
  const isProduction = process.env.NODE_ENV === 'production';

  let clientError = {
    error: isProduction && statusCode >= 500
      ? 'An error occurred. Please try again later.'
      : message,
  };

  // Ajouter requestId pour debug client (sans révéler détails)
  if (req.requestId) {
    clientError.requestId = req.requestId;
  }

  // JAMAIS exposer les détails en production
  if (!isProduction && statusCode >= 500) {
    clientError.details = err.details || {};
  }

  res.status(statusCode).json(clientError);
}

/**
 * Middleware pour 404
 */
function notFound(req, res) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
  });
}

/**
 * Wrapper pour les routes async (gère les erreurs automatiquement)
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  errorHandler,
  notFound,
  asyncHandler,
};
