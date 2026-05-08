/**
 * ModuleContracts
 * PHASE 7.0.1 — Module Input/Output Contracts
 *
 * Documents what each module accepts and guarantees.
 */

const ModuleContracts = {
  HardenedEventBus: {
    name: 'HardenedEventBus',
    input: {
      type: 'GovernanceEvent',
      required: ['eventId', 'type', 'timestamp']
    },
    output: {
      type: 'EventPublicationResult',
      fields: ['published', 'reason', 'timestamp']
    },
    guarantees: [
      'deduplication (eventId window)',
      'TTL enforcement',
      'rate limiting',
      'causal ordering per traceId',
      'loop detection'
    ]
  },

  SelfHealingOrchestrator: {
    name: 'SelfHealingOrchestrator',
    input: {
      type: 'VIOLATION_EVENT',
      required: ['severity', 'validator', 'message']
    },
    output: {
      type: 'HEALING_RESULT',
      fields: ['status', 'action', 'timestamp']
    },
    guarantees: [
      'idempotency (10sec window)',
      'no double execution',
      'escalation timeout (5sec)',
      'cooldown enforcement (2sec)'
    ]
  },

  RecoveryOrchestrator: {
    name: 'RecoveryOrchestrator',
    input: {
      type: 'CRITICAL_EVENT',
      required: ['error', 'context']
    },
    output: {
      type: 'RECOVERY_RESULT',
      fields: ['status', 'recovered', 'timestamp']
    },
    guarantees: [
      'timeout enforcement (30sec)',
      'single execution',
      'concurrency cap (3)',
      'no cascading failures'
    ]
  },

  EventMetricsCollector: {
    name: 'EventMetricsCollector',
    input: {
      type: 'GovernanceEvent',
      fields: ['eventId', 'type', 'severity']
    },
    output: {
      type: 'MetricSnapshot',
      fields: ['timestamp', 'counts', 'latencies']
    },
    guarantees: [
      'post-execution only',
      'no business logic influence',
      'bounded memory',
      'non-blocking'
    ]
  },

  EventAlertEngine: {
    name: 'EventAlertEngine',
    input: {
      type: 'MetricEvent',
      required: ['type', 'severity']
    },
    output: {
      type: 'AlertNotification',
      fields: ['ruleId', 'message', 'timestamp']
    },
    guarantees: [
      'per-rule cooldown',
      'no alert spam',
      'deterministic rules'
    ]
  },

  DistributedEventTopology: {
    name: 'DistributedEventTopology',
    input: {
      type: 'NodeOperation | ShardOperation',
      operations: ['registerNode', 'assignShard', 'removeDeadNodes']
    },
    output: {
      type: 'TopologySnapshot',
      fields: ['version', 'nodes', 'shards', 'routing']
    },
    guarantees: [
      'deterministic routing',
      'no orphan shards',
      'acyclic topology',
      'reproducible state'
    ]
  },

  DistributedGovernanceCoordinator: {
    name: 'DistributedGovernanceCoordinator',
    input: {
      type: 'GovernanceEvent',
      required: ['eventId', 'traceId', 'timestamp']
    },
    output: {
      type: 'DistributionResult',
      fields: ['distributed', 'reason']
    },
    guarantees: [
      'global deduplication',
      'replay prevention',
      'causal ordering',
      'trace depth protection'
    ]
  }
};

module.exports = ModuleContracts;
