import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { getConfig } from './config/env.js';
import { logger } from './middlewares/logger.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import { i18nMiddleware } from './middlewares/i18n.js';
import routes from './routes/index.js';
import { setupSwagger } from './swagger/setup.js';
import sequelize, { testConnection } from './db/sequelize.js';
import './models/index.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const config = getConfig();

// ═══════════════════════════════════════════════════════════════
// Trust Proxy — Render / Neon / reverse proxy (Bug #30)
// ═══════════════════════════════════════════════════════════════
// Render et autres reverse proxies injectent l'IP client via X-Forwarded-For.
// Sans ce réglage : express-rate-limit calcule le rate limit sur l'IP du proxy
// (mêmes valeurs pour tous les clients) → mitigation IP non opérante + warning
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR dans les logs.
// Valeur 1 = faire confiance au premier proxy en amont (Render).
app.set('trust proxy', 1);

// ═══════════════════════════════════════════════════════════════
// Sécurité - Helmet pour les headers HTTP
// ═══════════════════════════════════════════════════════════════
// Helmet aide à sécuriser l'application Express en configurant divers headers HTTP
// Headers inclus par défaut:
// - Content-Security-Policy (CSP)
// - X-Frame-Options: DENY
// - X-Content-Type-Options: nosniff
// - Strict-Transport-Security (HSTS)
// - X-XSS-Protection
app.use(helmet());

// Custom security headers supplémentaires
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer Policy - Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions Policy - Control which features the browser can use
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
  next();
});

// ═══════════════════════════════════════════════════════════════
// CORS - Cross-Origin Resource Sharing
// ═══════════════════════════════════════════════════════════════
// Configuration sécurisée CORS pour contrôler les origines autorisées
// Prévient les attaques CSRF et contrôle l'accès aux ressources
const corsOptions = {
  // Autoriser uniquement les origines spécifiées
  origin: config.CORS_ORIGIN
    ? config.CORS_ORIGIN.split(',').map((url) => url.trim())
    : 'http://localhost:3001',
  // Autoriser les credentials (cookies, authorization headers)
  credentials: true,
  // Options success status (certains navigateurs legacy)
  optionsSuccessStatus: 200,
  // Méthodes HTTP autorisées
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // Headers autorisés
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  // Headers exposés au client
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  // Cache les résultats des preflight requests (en secondes)
  maxAge: 86400, // 24 heures
};

app.use(cors(corsOptions));

// Preflight requests handling
// Les navigateurs envoient une requête OPTIONS avant les requêtes complexes
app.options('*', cors(corsOptions));

// ═══════════════════════════════════════════════════════════════
// Rate Limiting - Protection contre les abus
// ═══════════════════════════════════════════════════════════════
// Limiteur global : 100 requêtes par IP / 15 minutes
app.use(globalLimiter);

// ═══════════════════════════════════════════════════════════════
// Middlewares globaux
// ═══════════════════════════════════════════════════════════════
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ═══════════════════════════════════════════════════════════════
// Internationalisation (i18n) - Détection de la langue
// ═══════════════════════════════════════════════════════════════
// Extrait la langue de la requête (query param > Accept-Language > préférence utilisateur > 'fr')
// Disponible via req.lang dans les routes
app.use(i18nMiddleware);

// Swagger Documentation
setupSwagger(app);

// Routes
app.use('/', routes);

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
    method: req.method,
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur',
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Initialiser la base de données et démarrer le serveur
async function initializeApp() {
  try {
    // Tester la connexion Sequelize
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Impossible de se connecter à la base de données');
    }

    // Synchroniser les modèles à chaque démarrage
    // alter contrôlé par variable d'env SYNC_ALTER (false par défaut, true pour réalignement ponctuel)
    const syncAlter = process.env.SYNC_ALTER === 'true';
    console.log(
      `🔄 Synchronisation des modèles avec la base de données (alter:${syncAlter})...`
    );
    await sequelize.sync({ alter: syncAlter });
    console.log('✅ Modèles synchronisés');

    // Démarrer le serveur
    const server = app.listen(config.PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  Citoyen Avisé - Backend API           ║
╠════════════════════════════════════════╣
║  Service: citoyenavise-backend         ║
║  Environnement: ${config.NODE_ENV.padEnd(27)}║
║  Port: ${String(config.PORT).padEnd(34)}║
║  URL: http://localhost:${config.PORT}${' '.repeat(26 - String(config.PORT).length)}║
╚════════════════════════════════════════╝
      `);
    });

    // Gestion graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM reçu, fermeture du serveur...');
      server.close(async () => {
        await sequelize.close();
        console.log('Serveur fermé');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error.message);
    process.exit(1);
  }
}

// Lancer l'application (sauf en environnement de test pour éviter process.exit)
if (process.env.NODE_ENV !== 'test') {
  initializeApp();
}

export default app;
