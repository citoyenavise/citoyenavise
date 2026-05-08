/**
 * EventRegistry
 * PHASE 7.0.1 — Canonical Event Types
 *
 * Documents all valid event types in the system.
 */

const EventRegistry = {
  // Transport-level events
  VIOLATION: {
    version: 1,
    source: 'RuntimeValidationEngine',
    schema: ['message', 'validator', 'severity', 'timestamp'],
    severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  },

  // Healing events
  HEALING: {
    version: 1,
    source: 'SelfHealingOrchestrator',
    schema: ['violationId', 'action', 'result', 'timestamp'],
    actions: ['CORRECT', 'ESCALATE', 'TIMEOUT']
  },

  // Recovery events
  RECOVERY: {
    version: 1,
    source: 'RecoveryOrchestrator',
    schema: ['errorId', 'strategy', 'status', 'timestamp'],
    statuses: ['ATTEMPTING', 'SUCCEEDED', 'FAILED', 'TIMEOUT']
  },

  // Alert events
  ALERT: {
    version: 1,
    source: 'EventAlertEngine',
    schema: ['ruleId', 'condition', 'message', 'timestamp'],
    levels: ['INFO', 'WARNING', 'CRITICAL']
  },

  // Distributed events
  TOPOLOGY_CHANGE: {
    version: 1,
    source: 'DistributedEventTopology',
    schema: ['changeType', 'nodeId', 'timestamp'],
    changeTypes: ['NODE_ADDED', 'NODE_REMOVED', 'SHARD_MOVED']
  },

  REPLICATION: {
    version: 1,
    source: 'DistributedReplicationManager',
    schema: ['eventId', 'status', 'replicas', 'timestamp'],
    statuses: ['PENDING', 'REPLICATED', 'CONFIRMED']
  },

  // Validation: ensure all events have required fields
  validate(eventType, event) {
    const definition = EventRegistry[eventType];
    if (!definition) {
      return { valid: false, error: `Unknown event type: ${eventType}` };
    }

    for (const field of definition.schema) {
      if (!(field in event)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    return { valid: true };
  }
};

module.exports = EventRegistry;
