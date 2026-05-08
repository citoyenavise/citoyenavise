/**
 * SharedServicesRegistry
 * PHASE 7.0.1 — Centralized Service Instances
 *
 * Documents which singleton services are globally accessible.
 */

const SharedServicesRegistry = {
  // Core transport service
  eventBus: {
    serviceId: 'HardenedEventBus',
    singleton: true,
    lifecycle: 'bootstrap → shutdown'
  },

  // Observability services
  metrics: {
    serviceId: 'EventMetricsCollector',
    singleton: true,
    lifecycle: 'init → flush on shutdown'
  },

  alerts: {
    serviceId: 'EventAlertEngine',
    singleton: true,
    lifecycle: 'init → active throughout'
  },

  audit: {
    serviceId: 'AuditTrail',
    singleton: true,
    lifecycle: 'init → persist on shutdown'
  },

  dashboard: {
    serviceId: 'EventMonitoringDashboard',
    singleton: true,
    lifecycle: 'init → active throughout'
  },

  // Distributed services
  topology: {
    serviceId: 'DistributedEventTopology',
    singleton: true,
    lifecycle: 'init → snapshot on changes'
  },

  coordinator: {
    serviceId: 'DistributedGovernanceCoordinator',
    singleton: true,
    lifecycle: 'init → cleanup on shutdown'
  },

  // Lookup service
  getService(serviceId) {
    for (const [key, service] of Object.entries(this)) {
      if (service.serviceId === serviceId) {
        return service;
      }
    }
    return null;
  },

  // Validate all services are singletons
  validateSingletonConstraint() {
    const errors = [];
    for (const [key, service] of Object.entries(this)) {
      if (service.singleton === false) {
        errors.push(`Service ${service.serviceId} must be singleton`);
      }
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
};

module.exports = SharedServicesRegistry;
