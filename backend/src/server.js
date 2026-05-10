import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { getConfig } from './config/env.js';
import { logger } from './middlewares/logger.js';
import routes from './routes/index.js';
import { setupSwagger } from './swagger/setup.js';
import sequelize, { testConnection } from './db/sequelize.js';
import './models/index.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const config = getConfig();

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
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// ═══════════════════════════════════════════════════════════════
// Middlewares globaux
// ═══════════════════════════════════════════════════════════════
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

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

    // Synchroniser les modèles (développement uniquement)
    if (config.NODE_ENV === 'development') {
      console.log('🔄 Synchronisation des modèles avec la base de données...');
      await sequelize.sync({ alter: false });
      console.log('✅ Modèles synchronisés');
    }

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
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    process.exit(1);
  }
}

// Lancer l'application
initializeApp();

export default app;
