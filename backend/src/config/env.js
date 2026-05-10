/**
 * Gestion centralisée des variables d'environnement
 * Valide et expose la configuration pour toute l'app
 *
 * Chaque variable d'environnement doit être accédée via getConfig()
 * pour bénéficier de la validation et des defaults
 */

import dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env
dotenv.config();

/**
 * Variables d'environnement REQUISES (doivent être définies)
 * Le démarrage échouera si une variable requise manque
 */
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];

/**
 * Configuration centralisée de l'application
 * Tous les accès à process.env doivent passer par cette fonction
 */
const envConfig = {
  // 🔧 Environnement & Serveur
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  API_VERSION: '1.0.0',
  SERVICE_NAME: 'citoyenavise-backend',

  // 🗄️  Base de données
  DATABASE_URL: process.env.DATABASE_URL,

  // 🔐 Authentification & JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    'dev_refresh_secret_key_min_32_chars_change_in_prod',
  JWT_EXPIRY_ACCESS: process.env.JWT_EXPIRY_ACCESS || '7d',
  JWT_EXPIRY_REFRESH: process.env.JWT_EXPIRY_REFRESH || '30d',

  // 🌐 CORS - Origines autorisées (sécurisé par défaut)
  CORS_ORIGIN:
    process.env.CORS_ORIGIN || 'http://localhost:3001,http://localhost:3000',

  // 🔗 URLs
  API_URL: process.env.API_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',

  // 📧 Email (Magic Link)
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@citoyenavise.org',
  MAIL_SERVICE: process.env.MAIL_SERVICE || 'gmail',

  // 💾 Redis (Cache, optionnel)
  REDIS_URL: process.env.REDIS_URL || '',

  // 📊 Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // 📌 Sentry (Error tracking, optionnel)
  SENTRY_DSN: process.env.SENTRY_DSN || '',

  // 🔒 Sécurité (API Keys optionnelles pour CI/CD)
  SNYK_TOKEN: process.env.SNYK_TOKEN || '',
  SONARQUBE_TOKEN: process.env.SONARQUBE_TOKEN || '',
};

/**
 * Valide que toutes les variables d'env requises sont présentes
 * Appelée au démarrage de l'application
 *
 * @throws {Error} Si une variable requise est manquante
 */
function validateEnv() {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    const missingList = missing.join(', ');
    const errorMsg = `
╔════════════════════════════════════════════════════════════╗
║ ❌ ERREUR CONFIGURATION - Variables requises manquantes      ║
╠════════════════════════════════════════════════════════════╣
║ Variables: ${missingList}
║
║ Solution: Créer un fichier .env avec les variables requises
║ Voir: .env.example pour un modèle
╚════════════════════════════════════════════════════════════╝`;
    console.error(errorMsg);
    process.exit(1);
  }
}

/**
 * Retourne la configuration validée
 * La validation ne s'effectue qu'une seule fois au premier appel
 *
 * @returns {Object} Configuration complète de l'application
 */
export function getConfig() {
  // Valider au premier appel uniquement
  if (!global.__configValidated) {
    validateEnv();
    global.__configValidated = true;
    console.log(`✅ Configuration validée (${envConfig.NODE_ENV})`);
  }

  return envConfig;
}

/**
 * Helper: Vérifier si on est en production
 * @returns {boolean}
 */
export function isProduction() {
  return getConfig().NODE_ENV === 'production';
}

/**
 * Helper: Vérifier si on est en développement
 * @returns {boolean}
 */
export function isDevelopment() {
  return getConfig().NODE_ENV === 'development';
}

/**
 * Helper: Vérifier si on est en test
 * @returns {boolean}
 */
export function isTest() {
  return getConfig().NODE_ENV === 'test';
}

export default envConfig;
