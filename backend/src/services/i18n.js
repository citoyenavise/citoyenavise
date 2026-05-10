/**
 * Service i18n - Traductions côté backend
 * Fournit les messages d'erreur et de succès multilingues
 */

const translations = {
  fr: {
    // Pétitions
    'petition.created': 'Pétition créée avec succès',
    'petition.updated': 'Pétition mise à jour',
    'petition.published': 'Pétition publiée',
    'petition.signed': 'Merci de votre signature',
    'petition.alreadySigned': 'Vous avez déjà signé cette pétition',
    'petition.unsigned': 'Signature retirée',
    'petition.deleted': 'Pétition supprimée',

    // Élus et promesses
    'promise.created': 'Promesse créée avec succès',
    'promise.updated': 'Promesse mise à jour',
    'promise.deleted': 'Promesse supprimée',
    'promise.statusUpdated': 'Statut de la promesse mis à jour',

    // Authentification
    'auth.loginRequested': 'Lien de connexion envoyé à {{email}}',
    'auth.tokenExpired': 'Le lien a expiré',
    'auth.invalidToken': 'Lien invalide',
    'auth.logoutSuccess': 'Déconnexion réussie',

    // Utilisateur
    'user.profileUpdated': 'Profil mis à jour',
    'user.alreadyExists': 'Cet email existe déjà',
    'user.notFound': 'Utilisateur non trouvé',
    'user.passwordUpdated': 'Mot de passe changé',

    // Erreurs
    'error.notFound': 'Non trouvé',
    'error.unauthorized': 'Non autorisé',
    'error.forbidden': 'Accès refusé',
    'error.conflict': 'Conflit : {{message}}',
    'error.validation': 'Erreur de validation',
    'error.serverError': 'Erreur serveur',
    'error.badRequest': 'Requête invalide',
    'error.duplicate': 'Cet élément existe déjà',

    // Admin
    'admin.userRoleUpdated': 'Rôle utilisateur modifié',
    'admin.missionCreated': 'Mission créée',
    'admin.badgeCreated': 'Badge créé',
  },

  en: {
    // Petitions
    'petition.created': 'Petition created successfully',
    'petition.updated': 'Petition updated',
    'petition.published': 'Petition published',
    'petition.signed': 'Thank you for signing',
    'petition.alreadySigned': 'You already signed this petition',
    'petition.unsigned': 'Signature removed',
    'petition.deleted': 'Petition deleted',

    // Elus and promises
    'promise.created': 'Promise created successfully',
    'promise.updated': 'Promise updated',
    'promise.deleted': 'Promise deleted',
    'promise.statusUpdated': 'Promise status updated',

    // Authentication
    'auth.loginRequested': 'Sign in link sent to {{email}}',
    'auth.tokenExpired': 'Link expired',
    'auth.invalidToken': 'Invalid link',
    'auth.logoutSuccess': 'Logged out successfully',

    // User
    'user.profileUpdated': 'Profile updated',
    'user.alreadyExists': 'This email already exists',
    'user.notFound': 'User not found',
    'user.passwordUpdated': 'Password changed',

    // Errors
    'error.notFound': 'Not found',
    'error.unauthorized': 'Unauthorized',
    'error.forbidden': 'Access denied',
    'error.conflict': 'Conflict: {{message}}',
    'error.validation': 'Validation error',
    'error.serverError': 'Server error',
    'error.badRequest': 'Bad request',
    'error.duplicate': 'This item already exists',

    // Admin
    'admin.userRoleUpdated': 'User role updated',
    'admin.missionCreated': 'Mission created',
    'admin.badgeCreated': 'Badge created',
  },
};

/**
 * Traduire une clé avec interpolation
 * @param {string} key - Clé de traduction (ex: 'petition.signed')
 * @param {string} lang - Langue ('fr' ou 'en') - défaut: 'fr'
 * @param {object} params - Paramètres pour interpolation (ex: {email: 'user@example.com'})
 * @returns {string} Texte traduit
 */
export const translate = (key, lang = 'fr', params = {}) => {
  let text = translations[lang]?.[key] || translations.fr[key] || key;

  // Interpolation des paramètres
  Object.keys(params).forEach((param) => {
    text = text.replace(`{{${param}}}`, String(params[param]));
  });

  return text;
};

/**
 * Obtenir toutes les traductions pour une langue
 * @param {string} lang - Langue ('fr' ou 'en')
 * @returns {object} Objet de traductions
 */
export const getTranslations = (lang = 'fr') =>
  translations[lang] || translations.fr;

/**
 * Ajouter une nouvelle traduction
 * @param {string} key - Clé
 * @param {string} frText - Texte français
 * @param {string} enText - Texte anglais
 */
export const addTranslation = (key, frText, enText) => {
  if (!translations.fr[key]) {
    translations.fr[key] = frText;
    translations.en[key] = enText;
  }
};

export default {
  translate,
  getTranslations,
  addTranslation,
};
