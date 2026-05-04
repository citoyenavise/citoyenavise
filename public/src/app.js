/**
 * Application Frontend — Point d'entrée principal
 * Architecture modulaire pour 28 modules
 */

const { router, store, helpers } = require('./core');
const layouts = require('./shared/layouts');

// Registrations de routes
const routes = {
  // Auth
  '/login': () => require('./modules/auth/js/module'),
  '/register': () => require('./modules/auth/js/module'),

  // Core
  '/': () => require('./modules/homepage/js/module'),
  '/feed': () => require('./modules/posts/js/module'),
  '/ideas': () => require('./modules/ideas/js/module'),
  '/map': () => require('./modules/map/js/module'),
  '/profile': () => require('./modules/profiles/js/module'),
  '/profiles/:id': () => require('./modules/profiles/js/module'),

  // Pages dynamiques
  '/groups': () => require('./modules/groups/js/module'),
  '/search': () => require('./modules/search/js/module'),
  '/admin': () => require('./modules/admin/js/module'),
  '/dashboard': () => require('./modules/public_dashboard/js/module'),

  // À ajouter selon implémentation des modules
};

/**
 * Initialiser l'application
 */
async function init() {
  console.log('🚀 Initialisation Citoyen Avisé...');

  // Layout par défaut
  if (helpers.isAuthenticated()) {
    layouts.AppLayout.init();
  } else {
    layouts.AuthLayout.init();
  }

  // Charge la première page
  const path = window.location.pathname;
  await loadPage(path);

  // Gestionnaire popstate (boutons back/forward)
  window.addEventListener('popstate', () => {
    loadPage(window.location.pathname);
  });

  // Gestionnaire de clics sur les liens
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('/')) {
      e.preventDefault();
      const href = e.target.getAttribute('href');
      navigate(href);
    }
  });

  console.log('✅ Application prête');
}

/**
 * Charger une page
 */
async function loadPage(path) {
  try {
    // Chercher la route
    let handler = routes[path];
    if (!handler) {
      // Chercher une route dynamique
      for (const [pattern, moduleHandler] of Object.entries(routes)) {
        if (router.matchRoute(pattern, path)) {
          handler = moduleHandler;
          break;
        }
      }
    }

    if (!handler) {
      console.warn(`Route non trouvée: ${path}`);
      navigate('/');
      return;
    }

    // Charger le module
    const module = handler();
    if (module && module.init) {
      await module.init(path);
    }

    // Update store
    store.setState({ currentPath: path });
  } catch (error) {
    console.error('Erreur lors du chargement de la page:', error);
    navigate('/');
  }
}

/**
 * Naviguer vers une page
 */
function navigate(path) {
  window.history.pushState({}, '', path);
  loadPage(path);
}

// Exposer globalement pour les liens
window.navigate = navigate;

// Démarrer l'app au chargement du DOM
document.addEventListener('DOMContentLoaded', init);

module.exports = { init, loadPage, navigate };
