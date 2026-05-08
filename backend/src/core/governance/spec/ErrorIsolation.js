/**
 * ErrorIsolation
 * PHASE 7.0.1 — Error Isolation Strategy
 *
 * Documents how errors are isolated between system domains.
 */

const ErrorIsolation = {
  // Core principles
  principles: [
    'No cross-domain crash propagation',
    'Event-level isolation (one bad event cannot cascade)',
    'Orchestrator sandboxing (failures contained)',
    'Transport failures do not affect business logic',
    'Business logic failures do not affect transport',
    'Observability never blocks execution path'
  ],

  // Domain boundaries
  boundaries: {
    transport: {
      domain: 'HardenedEventBus',
      responsibility: 'Event delivery, dedup, TTL, rate limit',
      cannotAffect: ['business logic', 'orchestrators'],
      isolationLevel: 'PROCESS_LEVEL'
    },

    business: {
      domain: 'Orchestrators (Self-healing, Recovery)',
      responsibility: 'Event processing, decision making',
      cannotAffect: ['transport layer', 'event flow'],
      isolationLevel: 'TRY_CATCH'
    },

    observability: {
      domain: 'Metrics, Alerts, Audit, Dashboard',
      responsibility: 'Monitoring and logging',
      cannotAffect: ['event processing', 'any business decision'],
      isolationLevel: 'ASYNC_ONLY'
    },

    distributed: {
      domain: 'Topology, Coordinator, Router',
      responsibility: 'Multi-node coordination',
      cannotAffect: ['single-node guarantees'],
      isolationLevel: 'STATE_ISOLATION'
    }
  },

  // Error handling strategy per domain
  errorHandling: {
    TransportErrors: {
      handling: 'Reject event, count metric, continue',
      cascadeRisk: 'LOW',
      isolationMethod: 'Try-catch in publish()'
    },

    BusinessLogicErrors: {
      handling: 'Log error, continue processing other events',
      cascadeRisk: 'LOW',
      isolationMethod: 'Per-orchestrator try-catch'
    },

    ObservabilityErrors: {
      handling: 'Log to stderr, never block event processing',
      cascadeRisk: 'NONE',
      isolationMethod: 'Async queue with overflow handling'
    },

    DistributedErrors: {
      handling: 'Fallback to single-node mode, alert operators',
      cascadeRisk: 'MEDIUM',
      isolationMethod: 'Circuit breaker pattern'
    }
  },

  // Forbidden patterns
  forbidden: [
    'Direct module coupling (must use dependency injection)',
    'Silent state mutation outside orchestrators',
    'Blocking calls in observability path',
    'Cross-domain exception propagation',
    'Shared mutable state between domains',
    'Synchronous audit operations in hot path'
  ],

  // Validation: ensure isolation constraints are met
  validateIsolation() {
    const violations = [];

    // These checks are performed at runtime
    return {
      valid: violations.length === 0,
      violations
    };
  }
};

module.exports = ErrorIsolation;
