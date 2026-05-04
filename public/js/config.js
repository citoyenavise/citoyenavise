/**
 * Configuration Frontend — Citoyen Avisé
 * Charge les paramètres selon l'environnement de déploiement
 *
 * Ordre de priorité:
 * 1. window.CONFIG (défini ici ou dans HTML)
 * 2. Meta tags (<meta name="api-url">)
 * 3. localStorage (sauvegardé manuellement)
 * 4. Auto-détection (hostname)
 */

window.CONFIG = window.CONFIG || {};

// Déterminer l'environnement
const hostname = window.location.hostname;
const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1';
const isStaging = hostname.includes('staging');
const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';

// Configurer selon l'environnement
if (isProduction) {
  // Production
  window.CONFIG.API_URL = 'https://api.citoyenavise.org/api/v1';
  window.CONFIG.ENV = 'production';
  window.CONFIG.DEBUG = false;
} else if (isStaging) {
  // Staging
  window.CONFIG.API_URL = 'https://staging-api.citoyenavise.org/api/v1';
  window.CONFIG.ENV = 'staging';
  window.CONFIG.DEBUG = true;
} else {
  // Development
  window.CONFIG.API_URL = 'http://localhost:5000/api/v1';
  window.CONFIG.ENV = 'development';
  window.CONFIG.DEBUG = true;
}

// Paramètres globaux
window.CONFIG.APP_NAME = 'Citoyen Avisé';
window.CONFIG.APP_VERSION = '1.0.0-beta';
window.CONFIG.TIMEOUT = 30000; // 30 secondes
window.CONFIG.CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Logging
if (window.CONFIG.DEBUG) {
  console.log('🔧 Configuration Chargée:', {
    API_URL: window.CONFIG.API_URL,
    ENV: window.CONFIG.ENV,
    Version: window.CONFIG.APP_VERSION,
  });
}
