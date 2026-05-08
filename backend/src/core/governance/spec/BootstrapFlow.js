/**
 * BootstrapFlow
 * PHASE 7.0.1 — Canonical Bootstrap Sequence
 *
 * Documents the deterministic order of system initialization.
 * No execution logic - pure specification.
 */

const BootstrapFlow = {
  // Ordered steps from runtime start to ready state
  steps: [
    'runtime_init',
    'event_bus_bootstrap',
    'metrics_init',
    'audit_init',
    'topology_init',
    'orchestrator_init',
    'health_check',
    'ready_state'
  ],

  // Explicit dependencies between steps
  dependencies: {
    runtime_init: [],
    event_bus_bootstrap: ['runtime_init'],
    metrics_init: ['event_bus_bootstrap'],
    audit_init: ['event_bus_bootstrap'],
    topology_init: ['event_bus_bootstrap'],
    orchestrator_init: ['topology_init', 'metrics_init', 'audit_init'],
    health_check: ['orchestrator_init'],
    ready_state: ['health_check']
  },

  // Description of each step
  descriptions: {
    runtime_init: 'Initialize runtime environment and configuration',
    event_bus_bootstrap: 'Bootstrap the HardenedEventBus core transport',
    metrics_init: 'Initialize EventMetricsCollector for observability',
    audit_init: 'Initialize AuditTrail for event logging',
    topology_init: 'Initialize DistributedEventTopology for multi-node support',
    orchestrator_init: 'Initialize SelfHealing and Recovery orchestrators',
    health_check: 'Run system health validation checks',
    ready_state: 'System ready for event processing'
  },

  // Timeout per step (ms)
  timeouts: {
    runtime_init: 1000,
    event_bus_bootstrap: 2000,
    metrics_init: 500,
    audit_init: 500,
    topology_init: 1000,
    orchestrator_init: 2000,
    health_check: 3000,
    ready_state: 1000
  }
};

module.exports = BootstrapFlow;
