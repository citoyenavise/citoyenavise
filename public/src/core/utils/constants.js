/**
 * Constants - Constantes globales
 */

module.exports = {
  // Catégories de posts
  POST_CATEGORIES: [
    'élections',
    'gouvernement',
    'droits',
    'services',
    'santé',
    'éducation',
    'environnement',
    'économie',
    'impôts',
    'sécurité',
    'logement',
    'transport',
    'immigration',
    'justice',
    'accessibilité',
    'autochtones',
    'budget',
    'autre',
  ],

  // Types de posts
  POST_TYPES: ['idea', 'proposal', 'question', 'discussion'],

  // Statuts de posts
  POST_STATUS: ['draft', 'published', 'flagged', 'archived'],

  // Rôles utilisateur
  USER_ROLES: ['citizen', 'moderator', 'admin', 'super_admin'],

  // Provinces canadiennes
  PROVINCES: [
    { code: 'AB', name: 'Alberta' },
    { code: 'BC', name: 'Colombie-Britannique' },
    { code: 'MB', name: 'Manitoba' },
    { code: 'NB', name: 'Nouveau-Brunswick' },
    { code: 'NL', name: 'Terre-Neuve-et-Labrador' },
    { code: 'NS', name: 'Nouvelle-Écosse' },
    { code: 'ON', name: 'Ontario' },
    { code: 'PE', name: 'Île-du-Prince-Édouard' },
    { code: 'QC', name: 'Québec' },
    { code: 'SK', name: 'Saskatchewan' },
  ],

  // Limites
  LIMITS: {
    POST_TITLE_MAX: 255,
    POST_CONTENT_MAX: 5000,
    COMMENT_MAX: 1000,
    BIO_MAX: 500,
    USERNAME_MAX: 50,
    USERNAME_MIN: 3,
  },

  // URLs
  URLS: {
    API: process.env.API_URL || 'http://localhost:5000/api/v1',
    APP: process.env.APP_URL || 'http://localhost:3000',
  },

  // Timeouts
  TIMEOUTS: {
    API_TIMEOUT: 10000,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24h
  },

  // Messages
  MESSAGES: {
    SUCCESS: 'Opération réussie',
    ERROR: 'Une erreur s\'est produite',
    LOADING: 'Chargement...',
    NO_DATA: 'Aucune donnée',
  },
};
