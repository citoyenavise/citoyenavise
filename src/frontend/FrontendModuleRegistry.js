/**
 * FrontendModuleRegistry.js
 * Phase 4 — Registry des modules UI
 * Déclare tous les modules frontend et valide la compatibilité avec le backend
 */

class FrontendModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.dependencies = new Map();
    this.initializationOrder = null;
    this.metadata = {
      created: new Date().toISOString(),
      version: '4.0.0',
      phase: 'Phase 4 — Frontend',
      totalModules: 0,
    };
  }

  async load() {
    // Déclaration des 15 modules frontend correspondant au backend
    const modulesDecl = [
      // Level 1: Standalone
      {
        id: 'auth',
        displayName: 'Module Authentification',
        version: '1.0.0',
        hierarchy_level: 1,
        description: 'Composants de login, register, token management',
        dependencies: [],
        requiredServices: ['authService', 'storageService'],
        exposedServices: ['authUIService'],
        eventsEmitted: ['frontend:auth:login_attempt', 'frontend:auth:logout'],
        eventsListened: ['auth:success', 'auth:failure', 'auth:token_expired'],
        components: ['LoginForm', 'RegisterForm', 'LogoutButton', 'AuthGuard'],
      },
      {
        id: 'education',
        displayName: 'Module Éducation UI',
        version: '1.0.0',
        hierarchy_level: 1,
        description: 'Composants pour ressources éducatives et guides civiques',
        dependencies: [],
        requiredServices: ['educationService'],
        exposedServices: ['educationUIService'],
        eventsEmitted: ['frontend:education:content_viewed'],
        eventsListened: ['education:content_viewed', 'education:quiz_completed'],
        components: ['EducationDashboard', 'QuizComponent', 'GuideViewer'],
      },
      {
        id: 'analytics',
        displayName: 'Module Analytics Frontend',
        version: '1.0.0',
        hierarchy_level: 1,
        description: 'Tracking des événements frontend et envoi vers backend',
        dependencies: [],
        requiredServices: ['analyticsService'],
        exposedServices: ['analyticsUIService'],
        eventsEmitted: ['frontend:analytics:event_tracked'],
        eventsListened: ['analytics:event_tracked'],
        components: ['AnalyticsTracker'],
      },

      // Level 2: Domain
      {
        id: 'users',
        displayName: 'Module Utilisateurs UI',
        version: '1.0.0',
        hierarchy_level: 2,
        description: 'Composants pour profils et gestion utilisateurs',
        dependencies: ['auth'],
        requiredServices: ['userService', 'authService'],
        exposedServices: ['userUIService'],
        eventsEmitted: ['frontend:users:profile_loaded'],
        eventsListened: ['user:created', 'user:updated'],
        components: ['UserProfile', 'UserList', 'UserCard'],
      },
      {
        id: 'profiles',
        displayName: 'Module Profils UI',
        version: '1.0.0',
        hierarchy_level: 2,
        description: 'Affichage et édition des profils publics',
        dependencies: ['auth', 'users'],
        requiredServices: ['profileService', 'userService'],
        exposedServices: ['profileUIService'],
        eventsEmitted: ['frontend:profiles:view_count_increased'],
        eventsListened: ['profile:updated', 'user:updated'],
        components: ['ProfileViewer', 'ProfileEditor', 'ProfileStats'],
      },
      {
        id: 'posts',
        displayName: 'Module Posts UI',
        version: '1.0.0',
        hierarchy_level: 2,
        description: 'Composants pour créer et afficher les publications',
        dependencies: ['auth', 'users'],
        requiredServices: ['postService', 'userService'],
        exposedServices: ['postUIService'],
        eventsEmitted: ['frontend:posts:created', 'frontend:posts:deleted'],
        eventsListened: ['post:created', 'post:updated', 'post:deleted'],
        components: ['PostFeed', 'PostCreator', 'PostDetail', 'PostCard'],
      },
      {
        id: 'ideas',
        displayName: 'Module Idées UI',
        version: '1.0.0',
        hierarchy_level: 2,
        description: 'Composants pour idées et propositions civiques',
        dependencies: ['auth', 'users'],
        requiredServices: ['ideaService', 'userService'],
        exposedServices: ['ideaUIService'],
        eventsEmitted: ['frontend:ideas:created', 'frontend:ideas:voted'],
        eventsListened: ['idea:created', 'idea:updated', 'idea:approved'],
        components: ['IdeaBoard', 'IdeaCreator', 'IdeaDetail', 'IdeaCard'],
      },
      {
        id: 'map',
        displayName: 'Module Carte UI',
        version: '1.0.0',
        hierarchy_level: 2,
        description: 'Visualisation géographique des idées et utilisateurs',
        dependencies: ['users', 'ideas'],
        requiredServices: ['mapService', 'ideaService', 'userService'],
        exposedServices: ['mapUIService'],
        eventsEmitted: ['frontend:map:cluster_selected'],
        eventsListened: ['map:nodes_updated', 'idea:created'],
        components: ['MapViewer', 'MapCluster', 'LocationMarker'],
      },
      {
        id: 'initiatives',
        displayName: 'Module Initiatives UI',
        version: '1.0.0',
        hierarchy_level: 2,
        description: 'Composants pour initiatives communautaires',
        dependencies: ['auth', 'users'],
        requiredServices: ['initiativeService', 'userService'],
        exposedServices: ['initiativeUIService'],
        eventsEmitted: ['frontend:initiatives:joined', 'frontend:initiatives:participated'],
        eventsListened: ['initiative:created', 'initiative:updated'],
        components: ['InitiativeDashboard', 'InitiativeCard', 'InitiativeJoiner'],
      },
      {
        id: 'admin',
        displayName: 'Module Admin UI',
        version: '1.0.0',
        hierarchy_level: 2,
        description: 'Panneaux d\'administration et modération',
        dependencies: ['auth'],
        requiredServices: ['adminService', 'authService'],
        exposedServices: ['adminUIService'],
        eventsEmitted: ['frontend:admin:action_logged'],
        eventsListened: ['admin:action_logged', 'admin:user_banned'],
        components: ['AdminDashboard', 'UserModerator', 'ContentModeration'],
      },
      {
        id: 'reports',
        displayName: 'Module Rapports UI',
        version: '1.0.0',
        hierarchy_level: 2,
        description: 'Signalement et gestion des abus',
        dependencies: ['auth', 'users'],
        requiredServices: ['reportService', 'userService'],
        exposedServices: ['reportUIService'],
        eventsEmitted: ['frontend:reports:created'],
        eventsListened: ['report:created', 'report:reviewed'],
        components: ['ReportForm', 'ReportList', 'ReportDetail'],
      },

      // Level 3: Derived
      {
        id: 'likes',
        displayName: 'Module Likes UI',
        version: '1.0.0',
        hierarchy_level: 3,
        description: 'Système de j\'aime pour posts et idées',
        dependencies: ['auth', 'users', 'posts', 'ideas'],
        requiredServices: ['likeService', 'userService'],
        exposedServices: ['likeUIService'],
        eventsEmitted: ['frontend:likes:added', 'frontend:likes:removed'],
        eventsListened: ['like:added', 'like:removed'],
        components: ['LikeButton', 'LikeCounter'],
      },
      {
        id: 'comments',
        displayName: 'Module Commentaires UI',
        version: '1.0.0',
        hierarchy_level: 3,
        description: 'Système de commentaires pour posts et idées',
        dependencies: ['auth', 'users', 'posts', 'ideas'],
        requiredServices: ['commentService', 'userService'],
        exposedServices: ['commentUIService'],
        eventsEmitted: ['frontend:comments:added', 'frontend:comments:replied'],
        eventsListened: ['comment:created', 'comment:updated'],
        components: ['CommentSection', 'CommentForm', 'CommentThread'],
      },
      {
        id: 'popular_system',
        displayName: 'Module Popular System UI',
        version: '1.0.0',
        hierarchy_level: 3,
        description: 'Affichage du système de popularité et trending',
        dependencies: ['posts', 'likes', 'comments'],
        requiredServices: ['popularService'],
        exposedServices: ['popularUIService'],
        eventsEmitted: ['frontend:popular:trending_viewed'],
        eventsListened: ['popular:ranked', 'popular:trending_updated'],
        components: ['TrendingBoard', 'PopularCard', 'TopContent'],
      },
      {
        id: 'search',
        displayName: 'Module Recherche UI',
        version: '1.0.0',
        hierarchy_level: 3,
        description: 'Composants de recherche globale',
        dependencies: ['posts', 'ideas', 'users'],
        requiredServices: ['searchService'],
        exposedServices: ['searchUIService'],
        eventsEmitted: ['frontend:search:query_executed'],
        eventsListened: ['search:indexed'],
        components: ['SearchBar', 'SearchResults', 'AdvancedSearch'],
      },
    ];

    // Charger et valider les modules
    for (const moduleDecl of modulesDecl) {
      this.modules.set(moduleDecl.id, {
        ...moduleDecl,
        loadedAt: new Date().toISOString(),
        valid: true,
      });
      this.dependencies.set(moduleDecl.id, moduleDecl.dependencies);
    }

    this.metadata.totalModules = this.modules.size;
    console.log(`[FrontendModuleRegistry] ${this.modules.size} modules chargés`);
  }

  validateDependencies() {
    const errors = [];
    const allModuleIds = Array.from(this.modules.keys());

    for (const [moduleId, deps] of this.dependencies.entries()) {
      for (const dep of deps) {
        if (!allModuleIds.includes(dep)) {
          errors.push(`Module ${moduleId}: dépendance '${dep}' introuvable`);
        }
      }
    }

    return errors;
  }

  detectCycles() {
    const visited = new Set();
    const recStack = new Set();

    const hasCycle = (moduleId) => {
      visited.add(moduleId);
      recStack.add(moduleId);

      const deps = this.dependencies.get(moduleId) || [];
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) return true;
        } else if (recStack.has(dep)) {
          return true;
        }
      }

      recStack.delete(moduleId);
      return false;
    };

    for (const moduleId of this.modules.keys()) {
      if (!visited.has(moduleId)) {
        if (hasCycle(moduleId)) {
          return true;
        }
      }
    }

    return false;
  }

  resolveInitializationOrder() {
    if (this.initializationOrder) return this.initializationOrder;

    const inDegree = new Map();
    const adjList = new Map();

    for (const moduleId of this.modules.keys()) {
      inDegree.set(moduleId, 0);
      adjList.set(moduleId, []);
    }

    for (const [moduleId, deps] of this.dependencies.entries()) {
      for (const dep of deps) {
        if (this.modules.has(dep)) {
          adjList.get(dep).push(moduleId);
          inDegree.set(moduleId, (inDegree.get(moduleId) || 0) + 1);
        }
      }
    }

    const queue = [];
    for (const [moduleId, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(moduleId);
    }

    const order = [];
    while (queue.length > 0) {
      queue.sort();
      const moduleId = queue.shift();
      order.push(moduleId);

      for (const dependent of adjList.get(moduleId)) {
        inDegree.set(dependent, inDegree.get(dependent) - 1);
        if (inDegree.get(dependent) === 0) {
          queue.push(dependent);
        }
      }
    }

    this.initializationOrder = order;
    return order;
  }

  getModule(moduleId) {
    return this.modules.get(moduleId);
  }

  getMetadata() {
    return this.metadata;
  }
}

module.exports = FrontendModuleRegistry;
