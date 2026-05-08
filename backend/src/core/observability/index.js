/**
 * observability/index.js - Export all PHASE 1.5 Observability Components
 * PHASE 1.5: Observability Layer
 *
 * Central export point for all observability components
 */

const GovernanceAuditLogger = require('./GovernanceAuditLogger');
const RuntimeTraceCollector = require('./RuntimeTraceCollector');
const ValidationMetricsCollector = require('./ValidationMetricsCollector');
const BootstrapTraceReporter = require('./BootstrapTraceReporter');
const InvariantViolationReporter = require('./InvariantViolationReporter');

module.exports = {
  // Individual observability components
  GovernanceAuditLogger,
  RuntimeTraceCollector,
  ValidationMetricsCollector,
  BootstrapTraceReporter,
  InvariantViolationReporter,

  // Factory functions
  createAuditLogger(constitutionManager) {
    return new GovernanceAuditLogger(constitutionManager);
  },

  createTraceCollector(constitutionManager) {
    return new RuntimeTraceCollector(constitutionManager);
  },

  createMetricsCollector(validationEngine) {
    return new ValidationMetricsCollector(validationEngine);
  },

  createBootstrapReporter() {
    return new BootstrapTraceReporter();
  },

  createViolationReporter() {
    return new InvariantViolationReporter();
  },

  // Version info
  version: '1.0.0',
  phase: '1.5',
  name: 'Observability Layer'
};
