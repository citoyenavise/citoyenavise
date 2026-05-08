/**
 * Lifecycle
 * PHASE 7.0.1 — System Lifecycle Stages
 *
 * Documents the system state transitions from init to shutdown.
 */

const Lifecycle = {
  // Initialization phase: Core runtime startup
  INIT: {
    duration: '< 15 seconds',
    steps: [
      'runtime_init',
      'event_bus_bootstrap',
      'metrics_init',
      'audit_init'
    ],
    services: {
      active: ['eventBus', 'metrics', 'audit'],
      pending: ['topology', 'orchestrators']
    }
  },

  // Ready phase: Orchestrators online, accepting events
  READY: {
    duration: 'until shutdown',
    steps: [
      'topology_init',
      'orchestrator_init',
      'health_check'
    ],
    services: {
      active: ['eventBus', 'metrics', 'audit', 'topology', 'orchestrators'],
      monitoring: ['dashboard', 'alerts']
    }
  },

  // Degraded phase: Issues detected but still operating
  DEGRADED: {
    triggers: [
      'metrics lag > threshold',
      'audit write slow',
      'topology inconsistency'
    ],
    actions: [
      'alert operators',
      'throttle new events',
      'attempt recovery'
    ],
    duration: 'variable'
  },

  // Shutdown phase: Graceful termination
  SHUTDOWN: {
    duration: '< 30 seconds',
    steps: [
      'stop_accepting_events',
      'flush_in_flight',
      'persist_audit',
      'flush_metrics',
      'save_topology_snapshot',
      'shutdown_complete'
    ],
    guarantees: [
      'no in-flight events lost',
      'audit trail consistent',
      'metrics persisted'
    ]
  },

  // State transitions
  transitions: {
    'INIT → READY': 'health_check passes',
    'READY → DEGRADED': 'metrics lag or audit lag detected',
    'DEGRADED → READY': 'recovery succeeds',
    'READY → SHUTDOWN': 'shutdown signal',
    'DEGRADED → SHUTDOWN': 'shutdown signal',
    'INIT → SHUTDOWN': 'init fails critically'
  },

  // Current state (runtime)
  currentState: 'UNDEFINED', // Set by runtime
  lastStateChange: 0
};

module.exports = Lifecycle;
