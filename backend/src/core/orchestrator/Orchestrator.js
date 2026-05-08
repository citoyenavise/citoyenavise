// Orchestrateur Central - Gestion centralisée du flux système

const { EventEmitter } = require('events');
const StateMachine = require('../state-machine/StateMachine');
const Logger = require('../logging/Logger');

class Orchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    this.version = '1.0.0';
    this.config = config;
    this.logger = new Logger('Orchestrator');
    this.stateMachine = null;
    this.context = {};
    this.modules = new Map();
    this.invariants = [];
    this.middleware = [];
    this.isInitialized = false;
  }

  // Initialisation du système
  async initialize(contextData = {}) {
    this.logger.info('Orchestrateur en cours d\'initialisation', { version: this.version });

    try {
      this.context = contextData;
      this.stateMachine = new StateMachine(this.config.stateMachineConfig);

      await this.stateMachine.initialize();

      this.isInitialized = true;
      this.emit('orchestrator:initialized', { timestamp: new Date() });
      this.logger.info('Orchestrateur initialisé avec succès');

      return { success: true, version: this.version };
    } catch (error) {
      this.logger.error('Erreur lors de l\'initialisation', error);
      throw error;
    }
  }

  // Enregistrement d'un module
  registerModule(moduleId, module) {
    if (this.modules.has(moduleId)) {
      throw new Error(`Module ${moduleId} déjà enregistré`);
    }

    this.modules.set(moduleId, module);
    this.logger.debug(`Module enregistré: ${moduleId}`);
    this.emit('module:registered', { moduleId, version: module.version });
  }

  // Ajout d'un invariant
  addInvariant(invariant) {
    this.invariants.push(invariant);
    this.logger.debug('Invariant ajouté', { id: invariant.id });
  }

  // Vérification des invariants
  validateInvariants() {
    const violations = [];

    for (const invariant of this.invariants) {
      if (!invariant.check(this.context)) {
        violations.push({
          invariantId: invariant.id,
          message: invariant.message,
        });
      }
    }

    return { valid: violations.length === 0, violations };
  }

  // Transition d'état
  async transition(event, payload = {}) {
    const validation = this.validateInvariants();
    if (!validation.valid) {
      this.logger.error('Invariants violés', validation.violations);
      throw new Error('Invariants violés: impossible de transitionner');
    }

    try {
      const result = await this.stateMachine.handleEvent(event, payload);
      this.context = { ...this.context, ...result.context };

      this.emit('orchestrator:transition', {
        event,
        previousState: result.previousState,
        currentState: result.currentState,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      this.logger.error('Erreur lors de la transition', error);
      throw error;
    }
  }

  // Ajout de middleware
  use(middleware) {
    this.middleware.push(middleware);
  }

  // Exécution des middlewares
  async executeMiddleware(context) {
    for (const mw of this.middleware) {
      context = await mw(context);
    }
    return context;
  }

  // Récupération de l'état courant
  getCurrentState() {
    return this.stateMachine.getCurrentState();
  }

  // Récupération du contexte
  getContext() {
    return { ...this.context };
  }

  // Arrêt de l'orchestrateur
  async shutdown() {
    this.logger.info('Arrêt de l\'orchestrateur');
    this.removeAllListeners();
    this.modules.clear();
  }
}

module.exports = Orchestrator;
