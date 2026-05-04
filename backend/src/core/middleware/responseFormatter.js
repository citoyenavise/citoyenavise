/**
 * Response Formatter Middleware
 * Standardize ALL API responses to consistent format
 */

const logger = require('../utils/logger');

/**
 * Réponse standard pour tous les endpoints
 * Format:
 * {
 *   success: boolean,
 *   data: any,
 *   meta: { page, limit, total, version, timestamp },
 *   error: null | { code, message }
 * }
 */
class ResponseFormatter {
  static SUCCESS(data, meta = {}) {
    return {
      success: true,
      data: data || null,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        ...meta,
      },
      error: null,
    };
  }

  static ERROR(message, code = 'UNKNOWN_ERROR', statusCode = 500, details = null) {
    return {
      success: false,
      data: null,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
      error: {
        code,
        message,
        ...(details && { details }),
      },
    };
  }

  static PAGINATED(data, total, page = 1, limit = 20) {
    return this.SUCCESS(data, {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  }

  static CREATED(data, meta = {}) {
    return this.SUCCESS(data, {
      created: true,
      ...meta,
    });
  }

  static UPDATED(data, meta = {}) {
    return this.SUCCESS(data, {
      updated: true,
      ...meta,
    });
  }

  static DELETED(id, meta = {}) {
    return this.SUCCESS(
      { id, deleted: true },
      { action: 'DELETE', ...meta }
    );
  }
}

/**
 * Middleware pour formater les réponses
 * Ajoute helpers au res object
 */
function responseFormatter(req, res, next) {
  // Ajouter helpers
  res.apiSuccess = (data, meta = {}) => {
    const response = ResponseFormatter.SUCCESS(data, meta);
    res.status(200).json(response);
  };

  res.apiCreated = (data, meta = {}) => {
    const response = ResponseFormatter.CREATED(data, meta);
    res.status(201).json(response);
  };

  res.apiUpdated = (data, meta = {}) => {
    const response = ResponseFormatter.UPDATED(data, meta);
    res.status(200).json(response);
  };

  res.apiDeleted = (id, meta = {}) => {
    const response = ResponseFormatter.DELETED(id, meta);
    res.status(200).json(response);
  };

  res.apiPaginated = (data, total, page = 1, limit = 20) => {
    const response = ResponseFormatter.PAGINATED(data, total, page, limit);
    res.status(200).json(response);
  };

  res.apiBadRequest = (message, code = 'BAD_REQUEST', details = null) => {
    const response = ResponseFormatter.ERROR(message, code, 400, details);
    res.status(400).json(response);
  };

  res.apiUnauthorized = (message = 'Unauthorized') => {
    const response = ResponseFormatter.ERROR(message, 'UNAUTHORIZED', 401);
    res.status(401).json(response);
  };

  res.apiForbidden = (message = 'Forbidden') => {
    const response = ResponseFormatter.ERROR(message, 'FORBIDDEN', 403);
    res.status(403).json(response);
  };

  res.apiNotFound = (message = 'Not found') => {
    const response = ResponseFormatter.ERROR(message, 'NOT_FOUND', 404);
    res.status(404).json(response);
  };

  res.apiError = (message, code = 'SERVER_ERROR', statusCode = 500, details = null) => {
    const response = ResponseFormatter.ERROR(message, code, statusCode, details);
    res.status(statusCode).json(response);
  };

  next();
}

module.exports = {
  ResponseFormatter,
  responseFormatter,
};
