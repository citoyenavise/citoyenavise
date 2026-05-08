/**
 * Self-Healing Governance Module — Index & Exports
 * PHASE 1.3 — Self-Healing Governance
 *
 * Central exports for the Self-Healing Governance system.
 * Provides component classes, factory functions, and integrated healing orchestrator.
 */

const ViolationPatternAnalyzer = require('./ViolationPatternAnalyzer');
const AutoCorrectionEngine = require('./AutoCorrectionEngine');
const DegradationMonitor = require('./DegradationMonitor');
const SelfHealingAuditTrail = require('./SelfHealingAuditTrail');
const SelfHealingOrchestrator = require('./SelfHealingOrchestrator');

/**
 * Factory: Create pattern analyzer
 */
function createPatternAnalyzer(options = {}) {
  return new ViolationPatternAnalyzer(options);
}

/**
 * Factory: Create correction engine
 */
function createCorrectionEngine(options = {}) {
  return new AutoCorrectionEngine(options);
}

/**
 * Factory: Create degradation monitor
 */
function createDegradationMonitor(options = {}) {
  return new DegradationMonitor(options);
}

/**
 * Factory: Create audit trail
 */
function createAuditTrail(options = {}) {
  return new SelfHealingAuditTrail(options);
}

/**
 * Factory: Create orchestrator
 */
function createOrchestrator(options = {}) {
  return new SelfHealingOrchestrator(options);
}

/**
 * Integrated layer factory — creates and wires all components
 */
function createSelfHealingLayer(options = {}) {
  const orchestrator = new SelfHealingOrchestrator(options);

  return {
    orchestrator,
    patternAnalyzer: orchestrator.patternAnalyzer,
    correctionEngine: orchestrator.correctionEngine,
    degradationMonitor: orchestrator.degradationMonitor,
    auditTrail: orchestrator.auditTrail,

    // Convenience methods
    async process(violation) {
      return orchestrator.processViolation(violation);
    },

    async runCycle(violations) {
      return orchestrator.runHealingCycle(violations);
    },

    start(healthDataProvider) {
      return orchestrator.startMonitoring(healthDataProvider);
    },

    stop() {
      return orchestrator.stopMonitoring();
    },

    getStatus() {
      return orchestrator.getStatus();
    },

    getReport() {
      return orchestrator.getHealingReport();
    },

    getDegradation() {
      return orchestrator.getDegradationStatus();
    },

    reset() {
      return orchestrator.reset();
    }
  };
}

module.exports = {
  ViolationPatternAnalyzer,
  AutoCorrectionEngine,
  DegradationMonitor,
  SelfHealingAuditTrail,
  SelfHealingOrchestrator,

  createPatternAnalyzer,
  createCorrectionEngine,
  createDegradationMonitor,
  createAuditTrail,
  createOrchestrator,
  createSelfHealingLayer,

  version: '1.0.0',
  phase: '1.3-healing',
  name: 'Self-Healing Governance'
};
