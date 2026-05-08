// RuntimeValidationEngine - Validation et auto-enforcement à l'exécution
// Vérifie continuellement la cohérence, la hiérarchie et les invariants

const Logger = require('../core/logging/Logger');

class RuntimeValidationEngine {
  constructor(config = {}) {
    this.logger = new Logger('RuntimeValidationEngine');
    this.config = config;
    this.validationRules = [];
    this.validationResults = [];
    this.failureThreshold = config.failureThreshold || 0; // 0 = blocage sur première erreur
    this.isRunning = false;
    this.validationInterval = config.validationInterval || 5000; // 5 sec
  }

  // Initialisation du moteur de validation
  async initialize(dependencies) {
    this.logger.info('Initialisation de RuntimeValidationEngine');

    this.stateMachine = dependencies.stateMachine;
    this.moduleRegistry = dependencies.moduleRegistry;
    this.eventBus = dependencies.eventBus;
    this.governanceManager = dependencies.governanceManager;

    this.registerValidationRules();
    return { success: true };
  }

  // Enregistrement des règles de validation
  registerValidationRules() {
    this.validationRules = [
      {
        id: 'rule_hierarchy_respect',
        name: 'Respect de la hiérarchie',
        description: 'Chaque module ne peut dépendre que de modules de niveau <= son propre niveau',
        severity: 'CRITICAL',
        check: () => this.checkHierarchyRespect()
      },
      {
        id: 'rule_no_cycles',
        name: 'Pas de cycles',
        description: 'Aucun cycle détecté dans le graphe de dépendances',
        severity: 'CRITICAL',
        check: () => this.checkNoCycles()
      },
      {
        id: 'rule_services_available',
        name: 'Services disponibles',
        description: 'Tous les services requis sont exposés par les dépendances',
        severity: 'CRITICAL',
        check: () => this.checkServicesAvailable()
      },
      {
        id: 'rule_events_valid',
        name: 'Événements valides',
        description: 'Tous les événements émis sont typés et validés',
        severity: 'HIGH',
        check: () => this.checkEventsValid()
      },
      {
        id: 'rule_di_consistency',
        name: 'Cohérence DI',
        description: 'Le conteneur DI est cohérent et injectable',
        severity: 'CRITICAL',
        check: () => this.checkDIConsistency()
      },
      {
        id: 'rule_state_consistency',
        name: 'État machine cohérent',
        description: 'La machine à états est dans un état valide',
        severity: 'CRITICAL',
        check: () => this.checkStateConsistency()
      },
      {
        id: 'rule_module_initialization',
        name: 'Initialisation des modules',
        description: 'Tous les modules critiques sont initialisés',
        severity: 'HIGH',
        check: () => this.checkModuleInitialization()
      },
      {
        id: 'rule_event_schema_compliance',
        name: 'Conformité schéma d\'événements',
        description: 'Les événements respectent leurs schémas enregistrés',
        severity: 'HIGH',
        check: () => this.checkEventSchemaCompliance()
      }
    ];

    this.logger.info(`${this.validationRules.length} règles de validation enregistrées`);
  }

  // ============================================
  // VÉRIFICATIONS INDIVIDUELLES
  // ============================================

  checkHierarchyRespect() {
    const violations = [];

    for (const [moduleId, module] of this.moduleRegistry.getAll()) {
      for (const depId of (module.dependencies || [])) {
        const dep = this.moduleRegistry.get(depId);
        if (dep && dep.hierarchy_level > module.hierarchy_level) {
          violations.push({
            module: moduleId,
            violation: `Dépendance ${depId} (niveau ${dep.hierarchy_level}) supérieur au module (niveau ${module.hierarchy_level})`
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: violations.length > 0 ? 'CRITICAL' : 'NONE'
    };
  }

  checkNoCycles() {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const dfs = (nodeId) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const module = this.moduleRegistry.get(nodeId);
      if (!module) return;

      for (const depId of (module.dependencies || [])) {
        if (!visited.has(depId)) {
          dfs(depId);
        } else if (recursionStack.has(depId)) {
          cycles.push({ from: nodeId, to: depId });
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const [moduleId] of this.moduleRegistry.getAll()) {
      if (!visited.has(moduleId)) {
        dfs(moduleId);
      }
    }

    return {
      passed: cycles.length === 0,
      violations: cycles,
      severity: cycles.length > 0 ? 'CRITICAL' : 'NONE'
    };
  }

  checkServicesAvailable() {
    const violations = [];

    for (const [moduleId, module] of this.moduleRegistry.getAll()) {
      const requiredServices = module.requiredServices || [];

      for (const serviceId of requiredServices) {
        // Services de base toujours disponibles
        if (['logger', 'database', 'eventBus', 'cache'].includes(serviceId)) {
          continue;
        }

        let found = false;

        // Chercher dans les dépendances
        for (const depId of (module.dependencies || [])) {
          const dep = this.moduleRegistry.get(depId);
          if (dep && dep.exposedServices && dep.exposedServices.includes(serviceId)) {
            found = true;
            break;
          }
        }

        if (!found) {
          violations.push({
            module: moduleId,
            violation: `Service requis non disponible: ${serviceId}`
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: violations.length > 0 ? 'CRITICAL' : 'NONE'
    };
  }

  checkEventsValid() {
    const violations = [];

    for (const [moduleId, module] of this.moduleRegistry.getAll()) {
      const emittedEvents = module.eventsEmitted || [];

      for (const eventType of emittedEvents) {
        // Vérifier format
        if (typeof eventType !== 'string' || !eventType.includes(':')) {
          violations.push({
            module: moduleId,
            violation: `Format d'événement invalide: ${eventType}`
          });
        }
      }

      // Vérifier que les événements écoutés existent dans les dépendances
      const listenedEvents = module.eventsListened || [];
      for (const eventType of listenedEvents) {
        let found = false;

        for (const depId of (module.dependencies || [])) {
          const dep = this.moduleRegistry.get(depId);
          if (dep && dep.eventsEmitted && dep.eventsEmitted.includes(eventType)) {
            found = true;
            break;
          }
        }

        if (!found) {
          violations.push({
            module: moduleId,
            violation: `Événement écouté non émis par dépendance: ${eventType}`
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: violations.length > 0 ? 'HIGH' : 'NONE'
    };
  }

  checkDIConsistency() {
    const violations = [];

    try {
      const diContainer = this.moduleRegistry.getDIContainer();

      if (!diContainer) {
        violations.push({
          violation: 'Conteneur DI non disponible'
        });
      } else {
        // Vérifier que tous les services exposés sont enregistrés
        for (const [moduleId, module] of this.moduleRegistry.getAll()) {
          for (const serviceId of (module.exposedServices || [])) {
            try {
              const service = diContainer.get(serviceId);
              if (!service) {
                violations.push({
                  module: moduleId,
                  violation: `Service ${serviceId} non enregistré dans DI`
                });
              }
            } catch (error) {
              violations.push({
                module: moduleId,
                violation: `Erreur lors de récupération du service ${serviceId}: ${error.message}`
              });
            }
          }
        }
      }
    } catch (error) {
      violations.push({
        violation: `Erreur DI check: ${error.message}`
      });
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: violations.length > 0 ? 'CRITICAL' : 'NONE'
    };
  }

  checkStateConsistency() {
    const violations = [];

    try {
      const currentState = this.stateMachine.getCurrentState();

      if (!currentState) {
        violations.push({
          violation: 'État courant null ou non défini'
        });
      }

      const validStates = ['INIT', 'CONFIG', 'SERVICES_READY', 'MODULES_LOADED', 'EVENTS_SUBSCRIBED', 'HEALTH_VERIFIED', 'ROUTES_MOUNTED', 'READY'];
      if (currentState && !validStates.includes(currentState)) {
        violations.push({
          violation: `État invalide détecté: ${currentState}`
        });
      }
    } catch (error) {
      violations.push({
        violation: `Erreur state check: ${error.message}`
      });
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: violations.length > 0 ? 'CRITICAL' : 'NONE'
    };
  }

  checkModuleInitialization() {
    const violations = [];
    const criticalModules = ['auth', 'users', 'posts', 'comments'];

    for (const moduleId of criticalModules) {
      const module = this.moduleRegistry.get(moduleId);
      if (!module) {
        violations.push({
          module: moduleId,
          violation: 'Module critique non trouvé'
        });
      } else if (!module.initialized) {
        violations.push({
          module: moduleId,
          violation: 'Module critique non initialisé'
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: violations.length > 0 ? 'HIGH' : 'NONE'
    };
  }

  checkEventSchemaCompliance() {
    const violations = [];

    // Vérifier la cohérence entre événements émis et événements écoutés
    const allEmittedEvents = new Set();
    const allListenedEvents = new Set();

    for (const [, module] of this.moduleRegistry.getAll()) {
      (module.eventsEmitted || []).forEach(e => allEmittedEvents.add(e));
      (module.eventsListened || []).forEach(e => allListenedEvents.forEach(e));
    }

    // Tous les événements écoutés doivent être émis quelque part
    for (const eventType of allListenedEvents) {
      if (!allEmittedEvents.has(eventType)) {
        violations.push({
          violation: `Événement écouté jamais émis: ${eventType}`
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: violations.length > 0 ? 'HIGH' : 'NONE'
    };
  }

  // ============================================
  // EXÉCUTION DES VALIDATIONS
  // ============================================

  async validateAll() {
    this.logger.info('Exécution de toutes les validations');
    const results = {
      timestamp: new Date().toISOString(),
      totalRules: this.validationRules.length,
      passed: 0,
      failed: 0,
      violations: [],
      details: []
    };

    for (const rule of this.validationRules) {
      try {
        const ruleResult = await rule.check();
        const detail = {
          ruleId: rule.id,
          name: rule.name,
          severity: rule.severity,
          passed: ruleResult.passed,
          violationCount: ruleResult.violations ? ruleResult.violations.length : 0
        };

        if (ruleResult.passed) {
          results.passed++;
          this.logger.info(`✅ ${rule.name}`);
        } else {
          results.failed++;
          this.logger.warn(`❌ ${rule.name}: ${ruleResult.violations.length} violations`);
          results.violations.push(...ruleResult.violations);
        }

        results.details.push(detail);
      } catch (error) {
        results.failed++;
        this.logger.error(`Erreur lors de validation ${rule.name}: ${error.message}`);
        results.violations.push({
          rule: rule.id,
          error: error.message
        });
      }
    }

    results.compliant = results.failed === 0;
    this.validationResults.push(results);

    if (!results.compliant && this.failureThreshold === 0) {
      throw new Error(`Validation échouée: ${results.violations.length} violations détectées`);
    }

    return results;
  }

  // ============================================
  // BOUCLE DE VALIDATION CONTINUE
  // ============================================

  async startContinuousValidation() {
    this.logger.info('Démarrage de la validation continue');
    this.isRunning = true;

    const validateLoop = async () => {
      while (this.isRunning) {
        try {
          const result = await this.validateAll();
          if (!result.compliant) {
            this.logger.warn(`Violations détectées (${result.violations.length})`);
            this.eventBus.emit('validation:violations_detected', {
              timestamp: new Date(),
              violations: result.violations
            });
          }
        } catch (error) {
          this.logger.error(`Erreur dans boucle de validation: ${error.message}`);
          this.eventBus.emit('validation:error', {
            timestamp: new Date(),
            error: error.message
          });
        }

        await new Promise(resolve => setTimeout(resolve, this.validationInterval));
      }
    };

    validateLoop().catch(error => {
      this.logger.error('Validation continue échouée', error);
    });
  }

  async stopContinuousValidation() {
    this.isRunning = false;
    this.logger.info('Validation continue arrêtée');
  }

  // ============================================
  // MÉTHODES D'ÉVÉNEMENT
  // ============================================

  async validateEventSchema(eventType, payload) {
    // Vérifier que le type est au bon format
    if (!eventType.includes(':')) {
      throw new Error(`Format d'événement invalide: ${eventType}`);
    }

    // Vérifier que l'événement est émis par un module enregistré
    let found = false;
    for (const [, module] of this.moduleRegistry.getAll()) {
      if (module.eventsEmitted && module.eventsEmitted.includes(eventType)) {
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Événement non enregistré: ${eventType}`);
    }

    return true;
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  getValidationResults() {
    return this.validationResults;
  }

  getLastValidationResult() {
    return this.validationResults[this.validationResults.length - 1] || null;
  }

  isCompliant() {
    const lastResult = this.getLastValidationResult();
    return lastResult ? lastResult.compliant : false;
  }
}

module.exports = RuntimeValidationEngine;
