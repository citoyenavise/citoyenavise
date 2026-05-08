/**
 * recovery/index.js - Export all PHASE 1.6 Recovery Components
 * PHASE 1.6: Recovery Layer
 *
 * Central export point for all recovery components
 */

const RuntimeRecoveryEngine = require('./RuntimeRecoveryEngine');
const FailureIsolationManager = require('./FailureIsolationManager');
const RetryPolicyExecutor = require('./RetryPolicyExecutor');
const GracefulShutdownManager = require('./GracefulShutdownManager');
const RecoveryOrchestrator = require('./RecoveryOrchestrator');

module.exports = {
  // Individual recovery components
  RuntimeRecoveryEngine,
  FailureIsolationManager,
  RetryPolicyExecutor,
  GracefulShutdownManager,
  RecoveryOrchestrator,

  // Factory functions
  createRecoveryEngine(options) {
    return new RuntimeRecoveryEngine(options);
  },

  createIsolationManager(options) {
    return new FailureIsolationManager(options);
  },

  createRetryExecutor(options) {
    return new RetryPolicyExecutor(options);
  },

  createShutdownManager(options) {
    return new GracefulShutdownManager(options);
  },

  createOrchestrator(options) {
    return new RecoveryOrchestrator(options);
  },

  // Integrated factory for complete recovery layer
  createRecoveryLayer(options = {}) {
    const isolationManager = new FailureIsolationManager(options);
    const retryExecutor = new RetryPolicyExecutor(options);
    const shutdownManager = new GracefulShutdownManager(options);
    const orchestrator = new RecoveryOrchestrator({
      ...options,
      failureIsolationManager: isolationManager,
      retryPolicyExecutor: retryExecutor,
      gracefulShutdownManager: shutdownManager
    });
    const recoveryEngine = new RuntimeRecoveryEngine({
      ...options,
      failureIsolationManager: isolationManager,
      retryPolicyExecutor: retryExecutor,
      gracefulShutdownManager: shutdownManager,
      recoveryOrchestrator: orchestrator
    });

    return {
      engine: recoveryEngine,
      isolation: isolationManager,
      retry: retryExecutor,
      shutdown: shutdownManager,
      orchestrator,

      // Integrated methods
      async recover(failureData) {
        return recoveryEngine.detectAndRecover(failureData);
      },

      async shutdown(reason) {
        return shutdownManager.initiateGracefulShutdown(reason);
      },

      getStatus() {
        return {
          engine: recoveryEngine.getRecoveryStatus(),
          isolation: isolationManager.getIsolationStatus(),
          retry: retryExecutor.getRetryMetrics(),
          shutdown: shutdownManager.getShutdownStatus(),
          orchestrator: orchestrator.getMetrics()
        };
      },

      generateReport() {
        return {
          timestamp: new Date().toISOString(),
          engine: recoveryEngine.generateRecoveryReport(),
          isolation: isolationManager.getIsolationMetrics(),
          retry: retryExecutor.generateRetryReport(),
          shutdown: shutdownManager.generateRecoveryReport(),
          orchestrator: orchestrator.generateReport()
        };
      }
    };
  },

  // Version info
  version: '1.0.0',
  phase: '1.6',
  name: 'Recovery Layer'
};
