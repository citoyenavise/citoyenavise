/**
 * API Client — Single Source of Truth
 * ⚠️ IMPORTANT: Cette version est une référence pour la SPA future.
 *
 * Pour les pages statiques: Utilisez /js/utils/api.js directement
 *
 * Cette implémentation CommonJS + Module.exports n'est pas utilisée actuellement
 * car le frontend utilise des pages HTML statiques, pas une SPA bundlée.
 *
 * Quand la SPA sera implémentée:
 * - Configurer un bundler (Webpack/Vite/Parcel)
 * - Importer: import { api } from '@/core/api'
 * - Tous les endpoints seront disponibles
 */

// NOTE: Pour l'instant, le seul fichier API utilisé est:
// /public/js/utils/api.js

// Quand cette SPA sera activée, déplacer toute la logique d'api.js ici
// et mettre à jour les imports dans les modules

module.exports = {
  // À implémenter quand SPA sera active
  // import api from '/js/utils/api.js'
};
