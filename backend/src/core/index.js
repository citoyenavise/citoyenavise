// Index Core - Phase 1
// Exports centralisés de tous les composants du système

const { Orchestrator, OrchestratorEvents, OrchestratorContext } = require('./orchestrator');
const { StateMachine, State, Transition, Guard, SideEffect } = require('./state-machine');
const { EventTypes, EventSchema, EventValidator } = require('./events');
const Logger = require('./logging/Logger');
const Invariant = require('./invariants/Invariant');
const Conventions = require('./conventions/Conventions');
const VersionManager = require('./versioning/VersionManager');

module.exports = {
  // Orchestrator
  Orchestrator,
  OrchestratorEvents,
  OrchestratorContext,

  // State Machine
  StateMachine,
  State,
  Transition,
  Guard,
  SideEffect,

  // Events
  EventTypes,
  EventSchema,
  EventValidator,

  // Logging
  Logger,

  // Invariants
  Invariant,

  // Conventions
  Conventions,

  // Versioning
  VersionManager,

  // Factory functions
  createOrchestrator(config) {
    return new Orchestrator(config);
  },

  createStateMachine(config) {
    return new StateMachine(config);
  },

  createLogger(context, config) {
    return new Logger(context, config);
  },

  createInvariant(id, checkFunction, config) {
    return new Invariant(id, checkFunction, config);
  },

  createVersionManager(config) {
    return new VersionManager(config);
  },

  createEventValidator() {
    return new EventValidator();
  },
};
