/**
 * Application Frontend — Citoyen Avisé
 * Router simple et gestion globale
 */

const ROUTES = {
  '/': '/pages/index.html',
  '/login': '/pages/login.html',
  '/register': '/pages/register.html',
  '/profile': '/pages/profile.html',
  '/feed': '/pages/feed.html',
  '/ideas': '/pages/ideas.html',
};

/**
 * Global error handling — unhandledrejection
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  const errorMsg = event.reason?.message || 'Une erreur inattendue est survenue';
  showToast(errorMsg, 'error', 5000);
  event.preventDefault();
});

/**
 * Listen for unauthorized events from API
 */
document.addEventListener('unauthorized', (event) => {
  console.warn('User unauthorized:', event.detail.error);
  showToast('Votre session a expiré. Veuillez vous reconnecter.', 'error', 3000);
});

/**
 * Charger et afficher une page
 */
async function loadPage(path) {
  // Trouver la route
  let route = ROUTES[path];

  // Vérifier les routes dynamiques
  if (!route) {
    // /profiles/:id
    if (path.startsWith('/profiles/')) {
      route = '/pages/profile.html';
    }
    // /posts/create
    else if (path.startsWith('/posts/')) {
      route = '/pages/feed.html';
    }
    // Default
    else {
      route = '/pages/index.html';
    }
  }

  try {
    const response = await fetch(route);
    if (!response.ok) throw new Error('Page not found');

    const html = await response.text();

    // Créer un conteneur temporaire
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Extraire le contenu du body
    const newBody = temp.querySelector('body');
    if (newBody) {
      // Remplacer le contenu du body actuel (garder le header)
      const main = document.querySelector('main') || document.body;

      // Si c'est une page complète (avec html, head, body), on reload
      if (html.includes('<html') || html.includes('<!DOCTYPE')) {
        document.documentElement.innerHTML = html;
        initializePage();
      }
    }
  } catch (err) {
    console.error('Erreur chargement page', err);
    document.body.innerHTML = `
      <div style="padding:40px;text-align:center;">
        <h1>❌ Page non trouvée</h1>
        <p><a href="/">Retour à l'accueil</a></p>
      </div>
    `;
  }
}

/**
 * Router simple
 */
function router() {
  const path = window.location.pathname || '/';
  loadPage(path);
}

/**
 * Initialisation à chaque chargement de page
 */
function initializePage() {
  // Les scripts de chaque page s'exécutent automatiquement via DOMContentLoaded
  // Ici on peut ajouter de l'init globale si nécessaire
}

/**
 * Redéfinir navigate() pour utiliser notre router
 */
const originalNavigate = navigate;
window.navigate = (path) => {
  window.history.pushState({}, '', path);
  router();
};

/**
 * Écouter les changements d'URL
 */
window.addEventListener('popstate', router);

/**
 * Initialiser au démarrage
 */
document.addEventListener('DOMContentLoaded', () => {
  router();
});

/**
 * Styles globaux (injecter si nécessaire)
 */
if (!document.querySelector('#global-styles')) {
  const style = document.createElement('style');
  style.id = 'global-styles';
  style.textContent = `
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: white;
      color: var(--noir-doux);
    }

    :root {
      --rouge: #C1272D;
      --rouge-fonce: #A01E23;
      --rouge-clair: #FDEAEA;
      --blanc: #FFFFFF;
      --gris-pale: #F8F9FA;
      --gris-clair: #E9ECEF;
      --gris: #ADB5BD;
      --gris-texte: #495057;
      --noir-doux: #1A1A2E;
      --ombre: 0 4px 20px rgba(0,0,0,0.10);
      --ombre-carte: 0 2px 12px rgba(0,0,0,0.08);
    }

    html {
      scroll-behavior: smooth;
    }

    * {
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);
}
