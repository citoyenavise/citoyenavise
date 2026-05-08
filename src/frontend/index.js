/**
 * Frontend Application Entry Point
 * Phase 4 — Développement Frontend Modulaire
 * Initialisation des modules UI, DI layer, EventBus frontend
 */

const FrontendModuleRegistry = require('./FrontendModuleRegistry');
const FrontendEventBus = require('./core/FrontendEventBus');
const FrontendDIContainer = require('./core/FrontendDIContainer');

class FrontendApplication {
  constructor() {
    this.moduleRegistry = null;
    this.eventBus = null;
    this.diContainer = null;
    this.modules = new Map();
    this.initialized = false;
    this.startTime = null;
  }

  async initialize() {
    this.startTime = Date.now();
    console.log('[Frontend] Initialisation de l\'application frontend');

    try {
      // Étape 1: Initialiser le DI Container
      this.diContainer = new FrontendDIContainer();
      console.log('[Frontend] ✓ DI Container initialisé');

      // Étape 2: Initialiser EventBus frontend
      this.eventBus = new FrontendEventBus();
      console.log('[Frontend] ✓ EventBus frontend initialisé');

      // Étape 3: Charger la registry des modules
      this.moduleRegistry = new FrontendModuleRegistry();
      await this.moduleRegistry.load();
      console.log('[Frontend] ✓ Module Registry chargée (15 modules)');

      // Étape 4: Enregistrer les modules UI dans le DI container
      for (const [moduleId, moduleDecl] of this.moduleRegistry.modules.entries()) {
        this.diContainer.register(moduleId, {
          metadata: moduleDecl,
          component: require(`./modules/${moduleId}`),
        });
      }
      console.log('[Frontend] ✓ Tous les modules enregistrés dans DI');

      // Étape 5: Valider les dépendances inter-modules
      const validationErrors = this.moduleRegistry.validateDependencies();
      if (validationErrors.length > 0) {
        console.error('[Frontend] ✗ Erreurs de dépendances:', validationErrors);
        throw new Error('Validation des dépendances échouée');
      }
      console.log('[Frontend] ✓ Dépendances validées (0 erreurs)');

      // Étape 6: Initialiser les modules UI dans le bon ordre
      const initOrder = this.moduleRegistry.resolveInitializationOrder();
      for (const moduleId of initOrder) {
        const module = this.modules.get(moduleId);
        if (module && module.initialize) {
          await module.initialize();
          console.log(`[Frontend] ✓ Module ${moduleId} initialisé`);
        }
      }

      // Étape 7: Connecter les listeners d'événements frontend
      this.connectEventListeners();
      console.log('[Frontend] ✓ Event listeners frontend connectés');

      this.initialized = true;
      const duration = Date.now() - this.startTime;
      console.log(`[Frontend] ✓ Application frontend prête en ${duration}ms`);

      // Émettre événement de readiness
      this.eventBus.emit('frontend:ready', {
        timestamp: new Date().toISOString(),
        modules: this.moduleRegistry.modules.size,
        duration,
      });
    } catch (error) {
      console.error('[Frontend] Erreur d\'initialisation:', error);
      throw error;
    }
  }

  connectEventListeners() {
    // Connecter les listeners déclarés dans chaque module
    for (const [moduleId, moduleDecl] of this.moduleRegistry.modules.entries()) {
      if (moduleDecl.eventsListened && moduleDecl.eventsListened.length > 0) {
        for (const eventType of moduleDecl.eventsListened) {
          this.eventBus.on(eventType, (payload) => {
            console.log(`[Frontend:${moduleId}] Reçu ${eventType}`, payload);
          });
        }
      }
    }
  }

  registerModule(moduleId, moduleInstance) {
    this.modules.set(moduleId, moduleInstance);
  }

  getModule(moduleId) {
    return this.modules.get(moduleId);
  }

  getEventBus() {
    return this.eventBus;
  }

  getDIContainer() {
    return this.diContainer;
  }

  getModuleRegistry() {
    return this.moduleRegistry;
  }

  getInitializationStatus() {
    return {
      initialized: this.initialized,
      startTime: this.startTime,
      duration: this.initialized ? Date.now() - this.startTime : null,
      modules: Array.from(this.modules.keys()),
      totalModules: this.moduleRegistry ? this.moduleRegistry.modules.size : 0,
    };
  }
}

module.exports = FrontendApplication;
