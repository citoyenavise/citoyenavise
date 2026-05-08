/**
 * APIRouter.js
 * Phase 5 — API Gateway / Router centralisé
 * Route tous les endpoints avec validation, auth, et traçabilité
 */

const APIContractRegistry = require('./APIContractRegistry.json');

class APIRouter {
  constructor(app, eventBus, diContainer) {
    this.app = app;
    this.eventBus = eventBus;
    this.diContainer = diContainer;
    this.handlers = new Map();
    this.metrics = {
      requestsTotal: 0,
      requestsSuccess: 0,
      requestsError: 0,
      avgResponseTime: 0,
    };
    this.requestLog = [];
  }

  async initialize() {
    console.log('[APIRouter] Initialisation du router API centralisé');

    // Enregistrer les middlewares globaux
    this.registerGlobalMiddlewares();

    // Charger la registry des endpoints
    const endpoints = APIContractRegistry.endpoints || [];
    console.log(`[APIRouter] ${endpoints.length} endpoints chargés`);

    // Enregistrer chaque endpoint
    for (const endpoint of endpoints) {
      this.registerEndpoint(endpoint);
    }

    console.log('[APIRouter] Tous les endpoints enregistrés');
    await this.eventBus.emit('api:router:ready', {
      endpointCount: endpoints.length,
      timestamp: new Date().toISOString(),
    });
  }

  registerGlobalMiddlewares() {
    // Middleware de logging
    this.app.use((req, res, next) => {
      const requestId = this.generateRequestId();
      const startTime = Date.now();

      req.requestId = requestId;
      req.startTime = startTime;

      console.log(`[API] ${requestId} ${req.method} ${req.path}`);

      // Capture de la réponse
      const originalSend = res.send;
      res.send = function (data) {
        const duration = Date.now() - startTime;
        console.log(
          `[API] ${requestId} ${res.statusCode} (${duration}ms)`
        );
        return originalSend.call(this, data);
      };

      next();
    });

    // Middleware d'authentification optionnel
    this.app.use((req, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        req.token = token;
        req.isAuthenticated = true;
      }
      next();
    });
  }

  registerEndpoint(endpoint) {
    const handler = this.createHandler(endpoint);
    const route = endpoint.path.replace(/:(\w+)/g, ':$1');

    const method = endpoint.method.toLowerCase();
    if (!this.app[method]) {
      console.error(`[APIRouter] Méthode HTTP non supportée: ${method}`);
      return;
    }

    this.app[method](route, handler);
    this.handlers.set(endpoint.id, handler);

    console.log(`[APIRouter] Endpoint enregistré: ${method.toUpperCase()} ${route}`);
  }

  createHandler(endpoint) {
    return async (req, res) => {
      const requestId = req.requestId;
      const startTime = Date.now();

      try {
        // Validation des permissions
        const permissionCheck = this.checkPermissions(endpoint, req);
        if (!permissionCheck.allowed) {
          console.warn(`[API] ${requestId} Permission denied: ${permissionCheck.reason}`);
          return res.status(403).json({
            error: 'Forbidden',
            message: permissionCheck.reason,
          });
        }

        // Validation du schema de requête
        const validationError = this.validateRequest(endpoint, req);
        if (validationError) {
          console.warn(`[API] ${requestId} Validation error: ${validationError}`);
          return res.status(400).json({
            error: 'Validation Error',
            message: validationError,
          });
        }

        // Récupérer le service/module correspondant
        const module = endpoint.module;
        const moduleInstance = this.diContainer.resolve(module);

        if (!moduleInstance) {
          console.error(`[API] ${requestId} Module not found: ${module}`);
          return res.status(500).json({
            error: 'Module Error',
            message: 'Internal module error',
          });
        }

        // Exécuter la logique métier
        const result = await this.executeHandler(
          endpoint,
          moduleInstance,
          req,
          res
        );

        // Émettre les événements déclarés
        for (const eventType of endpoint.eventsEmitted || []) {
          await this.eventBus.emit(eventType, {
            ...result,
            requestId,
            endpoint: endpoint.id,
            timestamp: new Date().toISOString(),
          });
        }

        // Logger le succès
        const duration = Date.now() - startTime;
        this.metrics.requestsSuccess++;
        this.metrics.requestsTotal++;
        console.log(
          `[API] ${requestId} ${endpoint.id} SUCCESS (${duration}ms)`
        );

        this.logRequest({
          requestId,
          endpoint: endpoint.id,
          status: 200,
          duration,
        });

        // Répondre avec succès
        return res.status(endpoint.method === 'POST' ? 201 : 200).json({
          success: true,
          ...result,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        this.metrics.requestsError++;
        this.metrics.requestsTotal++;

        console.error(
          `[API] ${requestId} ${endpoint.id} ERROR: ${error.message}`
        );

        this.logRequest({
          requestId,
          endpoint: endpoint.id,
          status: 500,
          duration,
          error: error.message,
        });

        await this.eventBus.emit('api:error', {
          requestId,
          endpoint: endpoint.id,
          error: error.message,
          timestamp: new Date().toISOString(),
        });

        return res.status(500).json({
          error: 'Internal Server Error',
          message: error.message,
          requestId,
        });
      }
    };
  }

  async executeHandler(endpoint, moduleInstance, req, res) {
    const { id, method, path } = endpoint;

    // Mapper les paramètres de la requête
    const params = {
      ...req.query,
      ...req.params,
      ...req.body,
      userId: req.userId, // Si extrait de l'authentification
    };

    // Exécuter la fonction correspondante sur le module
    // Format: auth:login → login()
    const actionName = id.split(':')[1];
    const handler = moduleInstance[actionName];

    if (typeof handler !== 'function') {
      throw new Error(`Handler not found: ${actionName}`);
    }

    // Appeler le handler avec les paramètres
    const result = await handler.call(moduleInstance, params);
    return result;
  }

  checkPermissions(endpoint, req) {
    const permissions = endpoint.permissions || [];

    for (const perm of permissions) {
      if (perm === 'public') {
        return { allowed: true };
      }

      if (perm === 'authenticated') {
        if (req.isAuthenticated && req.token) {
          return { allowed: true };
        }
      }

      if (perm.startsWith('authenticated:')) {
        if (!req.isAuthenticated) {
          return { allowed: false, reason: 'Not authenticated' };
        }

        const subperm = perm.split(':')[1];
        if (subperm === 'owner') {
          // Vérifier que c'est le propriétaire
          const resourceId = req.params.id;
          const userId = req.userId;
          if (userId === resourceId) {
            return { allowed: true };
          }
          return { allowed: false, reason: 'Not owner' };
        }

        if (subperm === 'owner_or_admin') {
          // Vérifier que c'est le propriétaire ou admin
          const resourceId = req.params.id;
          const userId = req.userId;
          const userRole = req.userRole;
          if (userId === resourceId || userRole === 'admin') {
            return { allowed: true };
          }
          return { allowed: false, reason: 'Not owner or admin' };
        }

        if (subperm === 'admin') {
          if (req.userRole === 'admin') {
            return { allowed: true };
          }
          return { allowed: false, reason: 'Not admin' };
        }
      }
    }

    return { allowed: false, reason: 'Insufficient permissions' };
  }

  validateRequest(endpoint, req) {
    const requestSchema = endpoint.request;
    if (!requestSchema) return null;

    const required = requestSchema.required || [];
    const properties = requestSchema.properties || {};

    // Vérifier les champs requis
    for (const field of required) {
      const value = req.body?.[field] || req.query?.[field] || req.params?.[field];
      if (!value) {
        return `Field required: ${field}`;
      }
    }

    // Valider les types
    for (const [field, schema] of Object.entries(properties)) {
      const value = req.body?.[field] || req.query?.[field];
      if (value !== undefined && schema.type) {
        const actualType = typeof value;
        if (actualType !== schema.type) {
          return `Invalid type for ${field}: expected ${schema.type}, got ${actualType}`;
        }

        // Valider les constraints
        if (schema.minLength && value.length < schema.minLength) {
          return `${field} is too short (min: ${schema.minLength})`;
        }
        if (schema.maxLength && value.length > schema.maxLength) {
          return `${field} is too long (max: ${schema.maxLength})`;
        }
      }
    }

    return null;
  }

  logRequest(entry) {
    this.requestLog.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });

    // Garder seulement les 1000 derniers
    if (this.requestLog.length > 1000) {
      this.requestLog.shift();
    }
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getMetrics() {
    return {
      ...this.metrics,
      requestCount: this.requestLog.length,
      successRate: this.metrics.requestsTotal > 0
        ? ((this.metrics.requestsSuccess / this.metrics.requestsTotal) * 100).toFixed(2)
        : 'N/A',
    };
  }

  getRequestLog(filter = {}) {
    let log = this.requestLog;

    if (filter.endpoint) {
      log = log.filter(r => r.endpoint === filter.endpoint);
    }
    if (filter.status) {
      log = log.filter(r => r.status === filter.status);
    }
    if (filter.limit) {
      log = log.slice(-filter.limit);
    }

    return log;
  }
}

module.exports = APIRouter;
