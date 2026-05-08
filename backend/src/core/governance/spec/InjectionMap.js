/**
 * InjectionMap
 * PHASE 7.0.1 — Dependency Injection Configuration
 *
 * Documents which services are injected into which modules.
 */

const InjectionMap = {
  // Module → Injected services
  modules: {
    RuntimeValidationEngine: ['eventBus'],

    SelfHealingOrchestrator: ['eventBus', 'metrics', 'audit'],

    RecoveryOrchestrator: ['eventBus', 'audit'],

    EventMetricsCollector: ['eventBus'],

    EventAlertEngine: ['metrics'],

    EventMonitoringDashboard: ['metrics', 'audit', 'alerts'],

    AuditTrail: ['eventBus'],

    // Distributed
    DistributedEventTopology: [],

    DistributedGovernanceCoordinator: ['eventBus', 'topology'],

    DistributedShardRouter: ['topology'],

    DistributedReplicationManager: ['topology', 'eventBus'],

    DistributedChaosValidator: ['eventBus', 'coordinator']
  },

  // Service → Injected into modules
  services: {
    eventBus: [
      'RuntimeValidationEngine',
      'SelfHealingOrchestrator',
      'RecoveryOrchestrator',
      'EventMetricsCollector',
      'AuditTrail',
      'DistributedGovernanceCoordinator',
      'DistributedReplicationManager'
    ],

    metrics: [
      'SelfHealingOrchestrator',
      'EventAlertEngine',
      'EventMonitoringDashboard'
    ],

    audit: [
      'SelfHealingOrchestrator',
      'RecoveryOrchestrator',
      'EventMonitoringDashboard'
    ],

    topology: [
      'DistributedGovernanceCoordinator',
      'DistributedShardRouter',
      'DistributedReplicationManager'
    ]
  },

  // Validate injection consistency
  validate() {
    const errors = [];

    // Check bidirectional consistency
    for (const [module, services] of Object.entries(this.modules)) {
      for (const service of services) {
        const reverseList = this.services[service] || [];
        if (!reverseList.includes(module)) {
          errors.push(`Injection mismatch: ${module} → ${service} not reflected in reverse map`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

module.exports = InjectionMap;
