/**
 * DependencyGraph
 * PHASE 7.0.1 — Module Dependencies
 *
 * Documents which modules depend on which.
 * Enables dependency cycle detection and validation.
 */

const DependencyGraph = {
  // Module → List of module dependencies
  modules: {
    // Core Transport
    HardenedEventBus: [],

    // Business Logic (Orchestrators)
    RuntimeValidationEngine: ['HardenedEventBus'],
    SelfHealingOrchestrator: ['HardenedEventBus', 'EventMetricsCollector'],
    RecoveryOrchestrator: ['HardenedEventBus', 'AuditTrail'],

    // Observability
    EventMetricsCollector: ['HardenedEventBus'],
    EventAlertEngine: ['EventMetricsCollector'],
    EventMonitoringDashboard: ['EventMetricsCollector', 'AuditTrail'],
    AuditTrail: ['HardenedEventBus'],

    // Distributed (PHASE 7+)
    DistributedEventTopology: ['HardenedEventBus'],
    DistributedGovernanceCoordinator: ['HardenedEventBus', 'DistributedEventTopology'],
    DistributedShardRouter: ['DistributedEventTopology'],
    DistributedReplicationManager: ['DistributedShardRouter', 'HardenedEventBus'],

    // Chaos/Testing
    DistributedChaosValidator: ['DistributedGovernanceCoordinator']
  },

  // Validate that graph is acyclic
  isAcyclic() {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (node, visited, stack) => {
      visited.add(node);
      stack.add(node);

      const deps = DependencyGraph.modules[node] || [];
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (hasCycle(dep, visited, stack)) {
            return true;
          }
        } else if (stack.has(dep)) {
          return true; // Cycle detected
        }
      }

      stack.delete(node);
      return false;
    };

    for (const node of Object.keys(this.modules)) {
      if (!visited.has(node)) {
        if (hasCycle(node, visited, new Set())) {
          return false;
        }
      }
    }
    return true;
  },

  // Get dependency order (topological sort)
  getTopologicalOrder() {
    const order = [];
    const visited = new Set();

    const visit = (node) => {
      if (visited.has(node)) return;
      visited.add(node);

      const deps = this.modules[node] || [];
      for (const dep of deps) {
        visit(dep);
      }

      order.push(node);
    };

    for (const node of Object.keys(this.modules)) {
      visit(node);
    }

    return order;
  }
};

module.exports = DependencyGraph;
