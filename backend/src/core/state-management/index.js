/**
 * state-management/index.js - Export all State Management Components
 * State Management Layer
 *
 * Central export point for all state management components
 */

const RuntimeStateOrchestrator = require('./RuntimeStateOrchestrator');
const BootstrapStateController = require('./BootstrapStateController');
const TransitionInvariantGuard = require('./TransitionInvariantGuard');
const RuntimeReadinessManager = require('./RuntimeReadinessManager');

module.exports = {
  // Individual state management components
  RuntimeStateOrchestrator,
  BootstrapStateController,
  TransitionInvariantGuard,
  RuntimeReadinessManager,

  // Factory functions
  createStateOrchestrator(options) {
    return new RuntimeStateOrchestrator(options);
  },

  createBootstrapController(options) {
    return new BootstrapStateController(options);
  },

  createTransitionGuard(options) {
    return new TransitionInvariantGuard(options);
  },

  createReadinessManager(options) {
    return new RuntimeReadinessManager(options);
  },

  // Integrated factory for complete state management layer
  createStateManagementLayer(options = {}) {
    const stateOrchestrator = new RuntimeStateOrchestrator(options);
    const bootstrapController = new BootstrapStateController(options);
    const transitionGuard = new TransitionInvariantGuard(options);
    const readinessManager = new RuntimeReadinessManager(options);

    return {
      orchestrator: stateOrchestrator,
      bootstrap: bootstrapController,
      guard: transitionGuard,
      readiness: readinessManager,

      // Integrated methods
      async registerEntity(entityId, entityType, initialState) {
        return stateOrchestrator.registerEntity(entityId, entityType, initialState);
      },

      async requestTransition(entityId, targetState, context) {
        // First validate with guard
        const validation = transitionGuard.validateTransition(
          entityId,
          stateOrchestrator.getEntityState(entityId)?.currentState,
          targetState,
          context
        );

        if (!validation.success) {
          return validation;
        }

        // Execute transition
        return stateOrchestrator.requestStateTransition(entityId, targetState, context);
      },

      async startBootstrap() {
        return bootstrapController.startBootstrap();
      },

      async transitionToPhase(phaseName) {
        return bootstrapController.transitionToPhase(phaseName);
      },

      async completePhase(phaseName, metadata) {
        return bootstrapController.completePhase(phaseName, metadata);
      },

      async completeBootstrap() {
        const result = bootstrapController.completeBootstrap();
        if (result.success) {
          readinessManager.reportConditionMet('BOOTSTRAP_COMPLETE');
        }
        return result;
      },

      async checkReadiness() {
        const status = readinessManager.getReadinessStatus();
        return {
          ready: readinessManager.isReady(),
          canAcceptTraffic: readinessManager.canAcceptTraffic(),
          status
        };
      },

      getCompleteStatus() {
        return {
          timestamp: new Date().toISOString(),
          state: stateOrchestrator.getSystemStateOverview(),
          bootstrap: bootstrapController.getBootstrapStatus(),
          readiness: readinessManager.getReadinessSummary(),
          invariants: transitionGuard.getMetrics()
        };
      },

      generateCompleteReport() {
        return {
          timestamp: new Date().toISOString(),
          state: stateOrchestrator.generateStateReport(),
          bootstrap: bootstrapController.generateBootstrapReport(),
          readiness: readinessManager.generateReadinessReport(),
          invariants: transitionGuard.generateReport()
        };
      },

      reset() {
        stateOrchestrator.reset();
        bootstrapController.reset();
        transitionGuard.reset();
        readinessManager.reset();
        return { reset: true };
      }
    };
  },

  // Version info
  version: '1.0.0',
  name: 'State Management Layer'
};
