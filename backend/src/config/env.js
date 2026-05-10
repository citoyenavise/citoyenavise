/**
 * Gestion centralisée des variables d'environnement
 * Valide et expose la configuration pour toute l'app
 */

const requiredEnvVars = [];

const envConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  API_VERSION: '1.0.0',
  SERVICE_NAME: 'citoyenavise-backend',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_min_32_chars_change_in_prod_abc123def456',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_min_32_chars_abc123def456',
  JWT_EXPIRY_ACCESS: process.env.JWT_EXPIRY_ACCESS || '7d',
  JWT_EXPIRY_REFRESH: process.env.JWT_EXPIRY_REFRESH || '30d',

  // URLs
  API_URL: process.env.API_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  DATABASE_URL: process.env.DATABASE_URL,
};

/**
 * Valide que toutes les variables d'env requises sont présentes
 */
function validateEnv() {
  const missing = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missing.length > 0) {
    console.error(
      `❌ Variables d'environnement manquantes: ${missing.join(', ')}`
    );
    process.exit(1);
  }
}

/**
 * Retourne la configuration validée
 */
export function getConfig() {
  // Valider au premier appel
  if (!global.__configValidated) {
    validateEnv();
    global.__configValidated = true;
  }

  return envConfig;
}

/**
 * Retourne true si on est en production
 */
export function isProduction() {
  return envConfig.NODE_ENV === 'production';
}

/**
 * Retourne true si on est en développement
 */
export function isDevelopment() {
  return envConfig.NODE_ENV === 'development';
}
