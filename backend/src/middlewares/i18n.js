/**
 * Middleware i18n
 * Extrait la langue de la requête et la rend disponible via req.lang
 */

export const i18nMiddleware = (req, res, next) => {
  // Ordre de priorité pour déterminer la langue
  req.lang =
    // 1. Query parameter: ?lang=en
    req.query.lang ||
    // 2. Header Accept-Language
    req.headers['accept-language']?.split('-')[0] ||
    // 3. Préférence utilisateur (si authentifié)
    (req.user?.preferredLanguage) ||
    // 4. Défaut: français
    'fr';

  // Valider que la langue est supportée
  if (!['fr', 'en'].includes(req.lang)) {
    req.lang = 'fr';
  }

  next();
};

export default i18nMiddleware;
