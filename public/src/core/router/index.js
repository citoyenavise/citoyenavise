/**
 * Router - Gestion du routing côté client
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentPath = '/';
    this.middlewares = [];
  }

  // Enregistrer une route
  register(path, handler, name = null) {
    this.routes.set(path, { handler, name });
  }

  // Enregistrer un middleware
  use(middleware) {
    this.middlewares.push(middleware);
  }

  // Naviguer vers une route
  async navigate(path) {
    // Exécuter les middlewares
    for (const middleware of this.middlewares) {
      await middleware(path);
    }

    // Trouver la route
    let route = this.routes.get(path);
    if (!route) {
      // Chercher une route dynamique
      for (const [pattern, handler] of this.routes) {
        if (this.matchRoute(pattern, path)) {
          route = { handler, name: pattern };
          break;
        }
      }
    }

    if (!route) {
      console.error(`Route non trouvée: ${path}`);
      return;
    }

    // Exécuter la route
    try {
      await route.handler(path);
      this.currentPath = path;
      window.history.pushState({}, '', path);
    } catch (error) {
      console.error('Erreur lors de la navigation:', error);
    }
  }

  // Vérifier si un pattern correspond à un chemin
  matchRoute(pattern, path) {
    // Exemple: /profiles/:id → /profiles/123
    const regex = pattern.replace(/:(\w+)/g, '([^/]+)');
    return new RegExp(`^${regex}$`).test(path);
  }

  // Extraire les paramètres d'une route dynamique
  getParams(pattern, path) {
    const keys = pattern.match(/:(\w+)/g) || [];
    const regex = pattern.replace(/:(\w+)/g, '([^/]+)');
    const values = new RegExp(`^${regex}$`).exec(path);

    const params = {};
    keys.forEach((key, index) => {
      params[key.substring(1)] = values[index + 1];
    });
    return params;
  }
}

// Export singleton
const router = new Router();
module.exports = router;
