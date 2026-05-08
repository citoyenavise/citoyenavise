// Machine à États - Gestion des états et transitions

const { EventEmitter } = require('events');
const Logger = require('../logging/Logger');

class StateMachine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.logger = new Logger('StateMachine');
    this.states = new Map();
    this.transitions = new Map();
    this.currentState = null;
    this.previousState = null;
    this.guards = [];
    this.sideEffects = [];
    this.history = [];
    this.config = config;
    this.isInitialized = false;
  }

  // Initialisation de la machine à états
  async initialize() {
    this.logger.info('Initialisation de la machine à états');

    try {
      if (this.config.initialState) {
        this.currentState = this.config.initialState;
        this.history.push({
          state: this.currentState,
          timestamp: new Date(),
          event: 'INIT',
        });
      }

      this.isInitialized = true;
      this.emit('state-machine:initialized');
      return { success: true };
    } catch (error) {
      this.logger.error('Erreur lors de l\'initialisation de la machine à états', error);
      throw error;
    }
  }

  // Enregistrement d'un état
  registerState(stateId, state) {
    if (this.states.has(stateId)) {
      throw new Error(`État ${stateId} déjà enregistré`);
    }

    this.states.set(stateId, state);
    this.logger.debug(`État enregistré: ${stateId}`);
  }

  // Enregistrement d'une transition
  registerTransition(fromState, toState, event, config = {}) {
    const key = `${fromState}:${event}`;

    this.transitions.set(key, {
      fromState,
      toState,
      event,
      guards: config.guards || [],
      sideEffects: config.sideEffects || [],
      condition: config.condition,
    });

    this.logger.debug(`Transition enregistrée: ${fromState} -> ${toState} via ${event}`);
  }

  // Vérification si une transition est possible
  canTransition(event, context = {}) {
    const key = `${this.currentState}:${event}`;
    const transition = this.transitions.get(key);

    if (!transition) {
      return { possible: false, reason: 'Transition non définie' };
    }

    for (const guard of transition.guards) {
      if (!guard.check(context)) {
        return { possible: false, reason: `Garde échouée: ${guard.id}` };
      }
    }

    return { possible: true };
  }

  // Gestion d'un événement et transition
  async handleEvent(event, context = {}) {
    const key = `${this.currentState}:${event}`;
    const transition = this.transitions.get(key);

    if (!transition) {
      this.logger.warn(`Transition non définie: ${this.currentState} -> ? via ${event}`);
      return {
        success: false,
        error: 'Transition non définie',
        currentState: this.currentState,
      };
    }

    const canTransition = this.canTransition(event, context);
    if (!canTransition.possible) {
      this.logger.warn(`Transition impossible: ${canTransition.reason}`);
      this.emit('state:guard-failed', {
        fromState: this.currentState,
        event,
        reason: canTransition.reason,
      });

      return {
        success: false,
        error: canTransition.reason,
        currentState: this.currentState,
      };
    }

    // Exécution des side-effects
    for (const sideEffect of transition.sideEffects) {
      try {
        await sideEffect.execute(context);
      } catch (error) {
        this.logger.error('Erreur lors de l\'exécution du side-effect', error);
        throw error;
      }
    }

    // Transition d'état
    const previousState = this.currentState;
    this.currentState = transition.toState;

    this.history.push({
      fromState: previousState,
      toState: this.currentState,
      event,
      timestamp: new Date(),
      context,
    });

    this.emit('state:transition', {
      previousState,
      currentState: this.currentState,
      event,
      timestamp: new Date(),
    });

    this.logger.info(`Transition: ${previousState} -> ${this.currentState} via ${event}`);

    return {
      success: true,
      previousState,
      currentState: this.currentState,
      event,
      context,
    };
  }

  // Obtenir l'état courant
  getCurrentState() {
    return this.currentState;
  }

  // Obtenir l'historique des états
  getHistory(limit = null) {
    if (limit) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }

  // Vérifier si une transition est définie
  hasTransition(fromState, event) {
    return this.transitions.has(`${fromState}:${event}`);
  }

  // Obtenir les transitions possibles depuis l'état courant
  getPossibleTransitions(context = {}) {
    const possible = [];

    for (const [key, transition] of this.transitions) {
      if (key.startsWith(`${this.currentState}:`)) {
        const canTransition = this.canTransition(transition.event, context);
        if (canTransition.possible) {
          possible.push({
            event: transition.event,
            toState: transition.toState,
          });
        }
      }
    }

    return possible;
  }

  // Réinitialiser la machine à états
  reset() {
    this.currentState = this.config.initialState || null;
    this.previousState = null;
    this.history = [];
    this.logger.info('Machine à états réinitialisée');
  }
}

module.exports = StateMachine;
