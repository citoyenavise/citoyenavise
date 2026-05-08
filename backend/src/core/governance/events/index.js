/**
 * Event-Driven Governance Backbone — Exports
 * PHASE 5.2 — Event-Driven Governance (base backbone)
 * PHASE 5.3 — Event Schema Registry & Validation (hardening layer)
 * PHASE 5.4 — Event Monitoring & Alerting (observability layer)
 *
 * Central exports for all event system components.
 */

// Phase 5.2 — Base backbone
const GovernanceEvent = require('./GovernanceEvent');
const GovernanceEventBus = require('./GovernanceEventBus');
const EventClassifier = require('./EventClassifier');
const EventRouter = require('./EventRouter');
const EventStreamProcessor = require('./EventStreamProcessor');
const EventBridge = require('./EventBridge');

// Phase 5.3 — Hardening layer
const EventValidationEngine = require('./EventValidationEngine');
const EventVersionResolver = require('./EventVersionResolver');
const EventAuditTrail = require('./EventAuditTrail');
const HardenedEventBus = require('./HardenedEventBus');

// Phase 5.4 — Observability layer
const EventMetricsCollector = require('./EventMetricsCollector');
const EventAlertEngine = require('./EventAlertEngine');
const EventAlertDispatcher = require('./EventAlertDispatcher');
const EventMonitoringDashboard = require('./EventMonitoringDashboard');

module.exports = {
  // Phase 5.2 components
  GovernanceEvent,
  GovernanceEventBus,
  EventClassifier,
  EventRouter,
  EventStreamProcessor,
  EventBridge,

  // Phase 5.3 components
  EventValidationEngine,
  EventVersionResolver,
  EventAuditTrail,
  HardenedEventBus,

  // Phase 5.4 components
  EventMetricsCollector,
  EventAlertEngine,
  EventAlertDispatcher,
  EventMonitoringDashboard,

  // Convenience factories
  createEventBridge(options = {}) {
    return new EventBridge(options);
  },

  createHardenedEventBus(options = {}) {
    return new HardenedEventBus(options);
  },

  createMonitoringStack(options = {}) {
    const metricsCollector = new EventMetricsCollector(options);
    const alertEngine = new EventAlertEngine(options);
    const alertDispatcher = new EventAlertDispatcher(options);
    const dashboard = new EventMonitoringDashboard({
      metricsCollector,
      alertEngine,
      alertDispatcher,
      auditTrail: options.auditTrail || null,
      ...options
    });

    return {
      metricsCollector,
      alertEngine,
      alertDispatcher,
      dashboard
    };
  },

  // Version info
  version: '3.0.0',
  phase: '5.4-monitored',
  name: 'Event-Driven Governance with Full Monitoring & Alerting'
};
