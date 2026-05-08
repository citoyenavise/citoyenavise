/**
 * HealthSystem
 * PHASE 7.0.1 — System Health Checks
 *
 * Documents what constitutes a healthy system.
 */

const HealthSystem = {
  // Health checks to perform
  checks: [
    {
      name: 'eventBusAlive',
      frequency: '5s',
      timeout: '2s',
      criticality: 'CRITICAL',
      description: 'EventBus can accept and process events'
    },
    {
      name: 'metricsFlowActive',
      frequency: '10s',
      timeout: '5s',
      criticality: 'WARNING',
      description: 'Metrics are flowing and being collected'
    },
    {
      name: 'auditIntegrity',
      frequency: '30s',
      timeout: '5s',
      criticality: 'CRITICAL',
      description: 'Audit trail is append-only and consistent'
    },
    {
      name: 'topologyConsistency',
      frequency: '15s',
      timeout: '5s',
      criticality: 'WARNING',
      description: 'Topology is acyclic and complete'
    },
    {
      name: 'orchestratorResponsive',
      frequency: '10s',
      timeout: '3s',
      criticality: 'CRITICAL',
      description: 'Orchestrators can execute actions'
    },
    {
      name: 'memoryWithinBounds',
      frequency: '30s',
      timeout: '1s',
      criticality: 'WARNING',
      description: 'Memory usage within configured limits'
    }
  ],

  // Failure modes and their severity
  failureModes: {
    eventBusFailure: {
      severity: 'CRITICAL',
      actionRequired: 'Immediate system halt',
      recoveryTime: 'Requires restart'
    },

    metricsLag: {
      severity: 'WARNING',
      actionRequired: 'Alert operators, monitor recovery',
      recoveryTime: '< 60 seconds expected'
    },

    auditCorruption: {
      severity: 'CRITICAL',
      actionRequired: 'Immediate shutdown, preserve audit file',
      recoveryTime: 'Data recovery required'
    },

    topologyInconsistency: {
      severity: 'CRITICAL',
      actionRequired: 'Trigger topology rebuild',
      recoveryTime: 'Variable depending on cluster size'
    },

    orchestratorTimeout: {
      severity: 'WARNING',
      actionRequired: 'Log failure, continue with next event',
      recoveryTime: 'Event will retry'
    },

    memoryExhaustion: {
      severity: 'CRITICAL',
      actionRequired: 'Trigger garbage collection, if persistent halt',
      recoveryTime: 'Requires process restart'
    }
  },

  // Health status levels
  statusLevels: {
    HEALTHY: {
      value: 0,
      meaning: 'All checks passing, no issues',
      actionRequired: false
    },
    DEGRADED: {
      value: 1,
      meaning: 'Some checks failing, still operational',
      actionRequired: 'Monitor and attempt recovery'
    },
    CRITICAL: {
      value: 2,
      meaning: 'Critical system failure detected',
      actionRequired: 'Immediate operator intervention'
    },
    OFFLINE: {
      value: 3,
      meaning: 'System not operational',
      actionRequired: 'Restart required'
    }
  },

  // Aggregate health: if any CRITICAL check fails → CRITICAL status
  // If any WARNING check fails → DEGRADED status
  // If all checks pass → HEALTHY status
  getHealthStatus(checkResults) {
    const statuses = checkResults.map((check) => check.status);

    if (statuses.includes('CRITICAL')) {
      return this.statusLevels.CRITICAL;
    }
    if (statuses.includes('WARNING')) {
      return this.statusLevels.DEGRADED;
    }
    return this.statusLevels.HEALTHY;
  }
};

module.exports = HealthSystem;
