/**
 * CapabilityEnforcer.js - Enforce capability limits and constraints
 * PHASE 1.4: Enforcement Layer
 *
 * Responsibility: Enforce system capabilities and resource limits
 * - Block operations exceeding resource limits
 * - Enforce scalability constraints
 * - Check performance targets
 * - Verify capability availability
 */

class CapabilityEnforcer {
  constructor(constitutionManager) {
    this.constitutionManager = constitutionManager;
    this.capRegistry = constitutionManager.getCapabilityRegistryLoader();
    this.limits = this.capRegistry.getAllScalabilityLimits();
    this.targets = this.capRegistry.getAllPerformanceTargets();
    this.currentUsage = {
      modules: 0,
      services: 0,
      eventTypes: 0,
      eventThroughputPerSec: 0
    };
  }

  /**
   * Enforce operation
   */
  enforce(operation) {
    // Check capability-related operations
    if (operation.type === 'resource_allocation') {
      return this._enforceResourceAllocation(operation);
    }

    if (operation.type === 'event_emission') {
      return this._enforceEventEmission(operation);
    }

    if (operation.type === 'module_load') {
      return this._enforceModuleLoad(operation);
    }

    // Default allow for unknown operations
    return { allowed: true, reason: 'unknown_operation_type' };
  }

  /**
   * Enforce resource allocation
   */
  _enforceResourceAllocation(operation) {
    const { resourceType, quantity } = operation;

    // Check if limit exists
    const limit = this.limits[`max_${resourceType}`];
    if (!limit) {
      return {
        allowed: false,
        reason: 'unknown_resource_type',
        severity: 'MEDIUM',
        message: `Unknown resource type: ${resourceType}`,
        resourceType
      };
    }

    // Check current usage + new allocation doesn't exceed limit
    const currentUsage = this.currentUsage[resourceType] || 0;
    if (currentUsage + quantity > limit) {
      return {
        allowed: false,
        reason: 'resource_limit_exceeded',
        severity: 'HIGH',
        message: `${resourceType} limit exceeded (${currentUsage + quantity} > ${limit})`,
        resourceType,
        quantity,
        currentUsage,
        limit,
        available: limit - currentUsage
      };
    }

    return {
      allowed: true,
      reason: 'resource_available',
      resourceType,
      quantity,
      available: limit - currentUsage - quantity
    };
  }

  /**
   * Enforce event emission
   */
  _enforceEventEmission(operation) {
    const { eventType, count = 1 } = operation;

    // Check if event type is known
    const eventLimit = this.limits.max_event_types;
    if (!eventLimit) {
      return {
        allowed: false,
        reason: 'event_limit_not_defined',
        severity: 'MEDIUM',
        message: 'Event throughput limit not defined',
        eventType
      };
    }

    // Check throughput limit
    const throughputLimit = this.limits.max_event_throughput_per_sec || 10000;
    const currentThroughput = this.currentUsage.eventThroughputPerSec || 0;

    if (currentThroughput + count > throughputLimit) {
      return {
        allowed: false,
        reason: 'throughput_limit_exceeded',
        severity: 'HIGH',
        message: `Event throughput exceeded (${currentThroughput + count} > ${throughputLimit}/sec)`,
        eventType,
        count,
        currentThroughput,
        limit: throughputLimit,
        available: throughputLimit - currentThroughput
      };
    }

    return {
      allowed: true,
      reason: 'throughput_available',
      eventType,
      count,
      available: throughputLimit - currentThroughput - count
    };
  }

  /**
   * Enforce module load
   */
  _enforceModuleLoad(operation) {
    const { moduleName } = operation;
    const moduleLimit = this.limits.max_modules;

    if (!moduleLimit) {
      return {
        allowed: false,
        reason: 'module_limit_not_defined',
        severity: 'MEDIUM',
        message: 'Module limit not defined',
        moduleName
      };
    }

    // Check if adding module exceeds limit
    if (this.currentUsage.modules >= moduleLimit) {
      return {
        allowed: false,
        reason: 'module_limit_exceeded',
        severity: 'HIGH',
        message: `Module limit exceeded (${this.currentUsage.modules} >= ${moduleLimit})`,
        moduleName,
        currentCount: this.currentUsage.modules,
        limit: moduleLimit
      };
    }

    return {
      allowed: true,
      reason: 'module_load_allowed',
      moduleName,
      currentCount: this.currentUsage.modules,
      available: moduleLimit - this.currentUsage.modules - 1
    };
  }

  /**
   * Verify resource limits
   */
  async verifyResourceLimits(resourceType, quantity) {
    const limit = this.limits[`max_${resourceType}`];
    if (!limit) {
      return {
        valid: false,
        reason: 'unknown_resource_type'
      };
    }

    const current = this.currentUsage[resourceType] || 0;
    return {
      valid: current + quantity <= limit,
      resourceType,
      quantity,
      current,
      limit,
      available: limit - current
    };
  }

  /**
   * Update resource usage
   */
  updateResourceUsage(resourceType, delta) {
    if (this.currentUsage.hasOwnProperty(resourceType)) {
      this.currentUsage[resourceType] = Math.max(0, this.currentUsage[resourceType] + delta);
    }

    return {
      resourceType,
      usage: this.currentUsage[resourceType],
      limit: this.limits[`max_${resourceType}`] || 'N/A'
    };
  }

  /**
   * Get resource usage report
   */
  getResourceUsageReport() {
    const report = {};

    for (const [resource, usage] of Object.entries(this.currentUsage)) {
      const limit = this.limits[`max_${resource}`];
      const percentage = limit ? (usage / limit * 100).toFixed(2) : 'N/A';

      report[resource] = {
        current: usage,
        limit: limit || 'Unlimited',
        percentage: percentage,
        available: limit ? limit - usage : 'Unlimited'
      };
    }

    return report;
  }

  /**
   * Check if near resource limit
   */
  isNearLimit(resourceType, threshold = 80) {
    const usage = this.currentUsage[resourceType] || 0;
    const limit = this.limits[`max_${resourceType}`];

    if (!limit) return false;

    const percentage = (usage / limit) * 100;
    return percentage >= threshold;
  }

  /**
   * Get performance compliance
   */
  getPerformanceCompliance() {
    const compliance = {};

    for (const [target, value] of Object.entries(this.targets)) {
      // In real implementation, would measure actual performance
      // For now, assume compliance if target is defined
      compliance[target] = {
        target: value,
        current: value, // Placeholder
        compliant: true // Placeholder
      };
    }

    return compliance;
  }
}

module.exports = CapabilityEnforcer;
