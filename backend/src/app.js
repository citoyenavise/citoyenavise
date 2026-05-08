/**
 * Application Express
 * PHASE 2.1 — Intégration du SystemBootstrap (11 étapes orchestrées)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const SystemBootstrap = require('./SystemBootstrap');
const logger = require('./core/utils/logger');

// Valider la configuration au startup
const config = require('./config');
try {
  config.validate();
} catch (err) {
  logger.error('Configuration validation failed', { meta: { error: err.message } });
  process.exit(1);
}

const { errorHandler, notFound, asyncHandler } = require('./core/middleware/errorHandler');
const { authOptional } = require('./core/middleware/auth');
const { healthCheck } = require('./core/services/database');
const swaggerSpecs = require('./core/swagger');
const requestLogger = require('./core/middleware/requestLogger');
const { getGlobalLimiter, getAuthLimiter } = require('./core/middleware/rateLimit');
const moduleLoader = require('./moduleLoader');
const migrationRunner = require('./database/migrationRunner');

// PHASE 2.1 — Bootstrap global
let bootstrap = null;

// Initialize Sentry (if configured)
let Sentry = null;
if (config.SENTRY_DSN) {
  Sentry = require('@sentry/node');
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express.default({
        request: true,
        serverName: true,
        transaction: 'handler',
        user: ['id', 'email', 'username'],
        ip: true,
      }),
    ],
  });
}

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Sentry request handler (MUST be early)
if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
}

// Security Headers — Helm + additional headers
const securityHeaders = require('./core/middleware/securityHeaders');

const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", config.API_URL],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: config.isProduction(),
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  noSniff: true,
};

if (config.isProduction()) {
  helmetConfig.contentSecurityPolicy.directives.upgradeInsecureRequests = [];
}

app.use(helmet(helmetConfig));

// Security headers additionnels
app.use(securityHeaders);

// CORS — Configuration stricte
const corsOrigins = Array.isArray(config.CORS_ORIGIN)
  ? config.CORS_ORIGIN
  : [config.CORS_ORIGIN];

// Valider que pas de wildcard avec credentials
if (corsOrigins.includes('*') && corsOrigins.some(o => o !== '*')) {
  logger.error('CORS: Invalid config - wildcard with credentials');
  process.exit(1);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }

    // Vérifier whitelist stricte
    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn('CORS: Origin not allowed', { meta: { origin } });
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,  // 24 hours
}));

// Compression
app.use(compression());

// Body parsing — limites strictes
app.use(express.json({ limit: '1mb' }));  // Réduit de 10mb
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Request logging (ajoute requestId)
app.use(requestLogger);

// Response formatter — standardized API responses
const { responseFormatter } = require('./core/middleware/responseFormatter');
app.use(responseFormatter);

// Request timeout — prévient infinite hangs
const { readTimeout } = require('./core/middleware/timeout');
app.use(readTimeout);  // 10s timeout par défaut

// Auth optional (pour les routes publiques)
app.use(authOptional);

// Rate limiting — par endpoint sensible
const { getRateLimiter, getUserRateLimiter } = require('./core/middleware/rateLimit');

// Rate limit global: 100 req/15min par IP
app.use('/api/', getGlobalLimiter());

// Auth endpoints: 5 tentatives/15min (skip succès)
app.use('/api/v1/auth/register', getAuthLimiter());
app.use('/api/v1/auth/login', getAuthLimiter());
app.use('/api/v1/auth/refresh', getRateLimiter(10, '15min', { keyPrefix: 'rl:auth:refresh:' }));

// User creation: limiter après inscription
app.use('/api/v1/users', getRateLimiter(20, '1hour', { keyPrefix: 'rl:users:create:' }));

// Post creation: limiter spam (par user si authentifié, par IP sinon)
app.use('/api/v1/posts', getUserRateLimiter(30, '1hour', { keyPrefix: 'rl:posts:create:' }));

// Follow actions: limiter follow spam (par user si authentifié)
app.use('/api/v1/profiles/:id/follow', getUserRateLimiter(60, '1hour', { keyPrefix: 'rl:profiles:follow:' }));

// Search/Map: limiter data exfiltration
app.use('/api/v1/map/nodes', getRateLimiter(100, '15min', { keyPrefix: 'rl:map:nodes:' }));
app.use('/api/v1/search', getRateLimiter(50, '15min', { keyPrefix: 'rl:search:' }));

// Swagger documentation
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Citoyen Avisé API',
}));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecs);
});

// Health check (liveness probe)
app.get('/health', asyncHandler(async (req, res) => {
  const health = await healthCheck();
  res.json({
    status: health.ok ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    ...(health.ok && { db: 'connected' }),
    ...(health.error && { db_error: health.error }),
  });
}));

// Readiness check (readiness probe — vérifie tous les services critiques)
app.get('/ready', asyncHandler(async (req, res) => {
  const cache = require('./core/services/cache');
  const dbHealth = await healthCheck();
  const cacheConnected = cache.isConnected;

  const ready = dbHealth.ok && cacheConnected;
  const statusCode = ready ? 200 : 503;

  res.status(statusCode).json({
    ready,
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealth.ok,
      cache: cacheConnected,
    },
  });
}));

// Charger les routes des modules dynamiquement
const moduleStats = moduleLoader.loadRoutes(app);

// Endpoint de monitoring des modules (internal use)
app.get('/api/internal/modules', asyncHandler(async (req, res) => {
  res.json({
    status: moduleStats.missing.length === 0 && moduleStats.incomplete.length === 0 ? 'ready' : 'degraded',
    modules: moduleLoader.getModuleStatus(),
    loadStats: {
      coreLoaded: moduleStats.loaded.length,
      coreTotal: 15,
      standbyDisabled: moduleStats.standby,
      incomplete: moduleStats.incomplete.length,
      missing: moduleStats.missing.length,
    },
    timestamp: new Date().toISOString(),
  });
}));

// Serve frontend dist (production local mode)
const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(distPath)) {
  // Serve static files from dist/
  app.use(express.static(distPath));

  // SPA fallback: route all non-API requests to index.html
  app.get('*', (req, res) => {
    // Skip API routes
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health') && !req.path.startsWith('/ready')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });

  logger.info('Frontend dist served at /', { meta: { distPath } });
} else {
  logger.debug('Frontend dist not found (development mode)', { meta: { distPath } });
}

// 404
app.use(notFound);

// Sentry error handler (MUST be before global error handler)
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}

// Error handler (MUST be last)
app.use(errorHandler);

// Initialize and start server
// PHASE 2.1 — Intégration du SystemBootstrap (11 étapes)
async function startServer() {
  try {
    // ═══════════════════════════════════════════════════════════════════
    // PHASE 2.1 — ÉTAPES 1-8 : Bootstrap du Système
    // ═══════════════════════════════════════════════════════════════════

    console.log('\n' + '═'.repeat(70));
    console.log('🚀 PHASE 2.1 — BOOTSTRAP SYSTÈME');
    console.log('═'.repeat(70) + '\n');

    // Initialiser le bootstrap (étapes 1-8)
    bootstrap = new SystemBootstrap({ sessionId: null });
    const bootstrapReport = await bootstrap.initialize();

    // Vérifier qu'il n'y a pas eu de violations d'invariants
    if (bootstrapReport.invariants.violations > 0) {
      logger.error('❌ Bootstrap échoué : invariants violés', {
        meta: { violations: bootstrapReport.invariants.details },
      });
      process.exit(1);
    }

    logger.info(`✅ Bootstrap complété (${bootstrapReport.duration}ms)`, {
      meta: {
        modules: bootstrapReport.modules.total,
        services: bootstrapReport.services.total,
        phase: bootstrapReport.phase,
      },
    });

    // ═══════════════════════════════════════════════════════════════════
    // DATABASE MIGRATIONS (avant route mounting)
    // ═══════════════════════════════════════════════════════════════════

    logger.info('🔄 Running database migrations...');
    await migrationRunner.runPendingMigrations();
    logger.info('✅ Migrations complete');

    // ═══════════════════════════════════════════════════════════════════
    // ÉTAPE 9 : Route Mounting (via moduleLoader)
    // ═══════════════════════════════════════════════════════════════════

    logger.info('📡 Mounting module routes...');
    const moduleStats = moduleLoader.loadRoutes(app);

    if (moduleStats.missing.length > 0 || moduleStats.incomplete.length > 0) {
      logger.warn('⚠️  Module loading had issues', {
        meta: {
          missing: moduleStats.missing,
          incomplete: moduleStats.incomplete,
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // ÉTAPE 11 : Start Server
    // ═══════════════════════════════════════════════════════════════════

    const PORT = config.PORT;
    const server = app.listen(PORT, () => {
      logger.info(`\n✅ Backend API ready on http://localhost:${PORT}`, {
        meta: {
          port: PORT,
          env: process.env.NODE_ENV,
          bootstrapTime: bootstrapReport.duration,
        },
      });

      console.log('\n' + '═'.repeat(70));
      console.log('✅ SYSTÈME PRÊT (PHASE READY)');
      console.log('═'.repeat(70) + '\n');
    });

    // ═══════════════════════════════════════════════════════════════════
    // CAAGS — Autonomous Governance Loop (event-driven, non-blocking)
    // PHASE 5.5: Event-driven architecture with HardenedEventBus
    // ═══════════════════════════════════════════════════════════════════
    let caags = null;
    let eventBus = null;
    setImmediate(async () => {
      try {
        // Create HardenedEventBus for event-driven governance
        const {
          createHardenedEventBus,
          createMonitoringStack
        } = require('./core/governance/events');

        // Initialize hardened event bus with schema validation
        eventBus = createHardenedEventBus({});
        logger.info('✅ HardenedEventBus initialized', {
          meta: { phase: 'PHASE 5.5', mode: 'event-driven' }
        });

        // Initialize monitoring stack (metrics, alerts, dashboard)
        const monitoring = createMonitoringStack({
          auditTrail: eventBus.auditTrail
        });
        logger.info('✅ Event Monitoring Stack initialized', {
          meta: { components: ['MetricsCollector', 'AlertEngine', 'AlertDispatcher', 'Dashboard'] }
        });

        // Initialize CAAGS with event bus
        const AutonomousGovernanceOrchestrator = require('./core/AutonomousGovernanceOrchestrator');
        caags = new AutonomousGovernanceOrchestrator({});
        await caags.initialize({ eventBus });

        // Start CAAGS in event-driven mode
        caags.start(eventBus);

        logger.info('✅ CAAGS Governance Loop active (event-driven mode, no polling)', {
          meta: { phase: 'CAAGS', mode: 'event-driven', pollingDisabled: true }
        });
      } catch (err) {
        logger.warn('⚠️  CAAGS startup failed (non-fatal, governance disabled)', {
          meta: { error: err.message }
        });
      }
    });

    // ═══════════════════════════════════════════════════════════════════
    // Graceful Shutdown
    // ═══════════════════════════════════════════════════════════════════

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully...');

      // Stop CAAGS first
      if (caags) {
        try {
          caags.stop();
        } catch (err) {
          logger.warn('Error stopping CAAGS', { meta: { error: err.message } });
        }
      }

      // Stop event bus (flushes audit trail, stops monitoring)
      if (eventBus) {
        try {
          if (eventBus.stop) {
            eventBus.stop();
          }
        } catch (err) {
          logger.warn('Error stopping eventBus', { meta: { error: err.message } });
        }
      }

      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (err) {
    logger.error('❌ Server startup failed', {
      meta: {
        error: err.message,
        phase: bootstrap ? bootstrap.state.phase : 'INIT',
        stack: err.stack,
      },
    });
    process.exit(1);
  }
}

// Start if this is the main module
if (require.main === module) {
  startServer().catch((err) => {
    logger.error('Failed to start server', { meta: { error: err.message } });
    process.exit(1);
  });
}

module.exports = app;
