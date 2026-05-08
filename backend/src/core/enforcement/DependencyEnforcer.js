/**
 * DependencyEnforcer.js - Enforce dependency constraints
 * PHASE 1.4: Enforcement Layer
 *
 * Responsibility: Enforce dependency rules at runtime
 * - Block unauthorized dependencies
 * - Prevent circular dependencies
 * - Enforce hierarchy constraints
 * - Validate service availability
 */

class DependencyEnforcer {
  constructor(constitutionManager) {
    this.constitutionManager = constitutionManager;
    this.depRules = constitutionManager.getDependencyRulesLoader();
    this.manifest = constitutionManager.getModuleManifestLoader();
  }

  /**
   * Enforce operation
   */
  enforce(operation) {
    // Check if operation involves dependencies
    if (operation.type === 'module_init') {
      return this._enforceModuleInitialization(operation);
    }

    if (operation.type === 'service_injection') {
      return this._enforceServiceInjection(operation);
    }

    if (operation.type === 'module_dependency') {
      return this._enforceDependencyRequest(operation);
    }

    // Default allow for unknown operations
    return { allowed: true, reason: 'unknown_operation_type' };
  }

  /**
   * Enforce module initialization
   */
  _enforceModuleInitialization(operation) {
    const moduleName = operation.module;

    // Check module exists
    if (!this.manifest.moduleExists(moduleName)) {
      return {
        allowed: false,
        reason: 'module_not_found',
        severity: 'CRITICAL',
        message: `Module ${moduleName} not found in manifest`,
        module: moduleName
      };
    }

    // Check all dependencies exist
    const module = this.manifest.getModule(moduleName);
    for (const dep of module.dependencies || []) {
      if (!this.manifest.moduleExists(dep)) {
        return {
          allowed: false,
          reason: 'dependency_not_found',
          severity: 'CRITICAL',
          message: `Dependency ${dep} required by ${moduleName} not found`,
          module: moduleName,
          dependency: dep
        };
      }
    }

    // Check all exposed services are declared
    for (const service of module.exposed_services || []) {
      if (!service || service.length === 0) {
        return {
          allowed: false,
          reason: 'invalid_service',
          severity: 'HIGH',
          message: `Module ${moduleName} declares invalid service`,
          module: moduleName
        };
      }
    }

    return {
      allowed: true,
      reason: 'module_valid',
      module: moduleName
    };
  }

  /**
   * Enforce service injection
   */
  _enforceServiceInjection(operation) {
    const { service, requesterModule } = operation;

    // Check requester module exists
    if (!this.manifest.moduleExists(requesterModule)) {
      return {
        allowed: false,
        reason: 'requester_not_found',
        severity: 'CRITICAL',
        message: `Requester module ${requesterModule} not found`,
        requesterModule,
        service
      };
    }

    const requester = this.manifest.getModule(requesterModule);

    // Check if service is required
    if (!requester.required_services || !requester.required_services.includes(service)) {
      return {
        allowed: false,
        reason: 'service_not_required',
        severity: 'HIGH',
        message: `Module ${requesterModule} does not require service ${service}`,
        requesterModule,
        service
      };
    }

    // Check if service is exposed by any module
    const serviceProvider = this._findServiceProvider(service);
    if (!serviceProvider) {
      return {
        allowed: false,
        reason: 'service_not_provided',
        severity: 'CRITICAL',
        message: `Service ${service} not provided by any module`,
        service
      };
    }

    // Check if dependency is allowed
    const allowed = this.depRules.isDependencyAllowed(requesterModule, serviceProvider);
    if (!allowed.allowed) {
      return {
        allowed: false,
        reason: 'dependency_not_allowed',
        severity: 'CRITICAL',
        message: `${requesterModule} not allowed to depend on ${serviceProvider}: ${allowed.reason}`,
        requesterModule,
        serviceProvider,
        service
      };
    }

    return {
      allowed: true,
      reason: 'service_injection_valid',
      requesterModule,
      service,
      provider: serviceProvider
    };
  }

  /**
   * Enforce dependency request
   */
  _enforceDependencyRequest(operation) {
    const { from, to } = operation;

    // Check both modules exist
    if (!this.manifest.moduleExists(from)) {
      return {
        allowed: false,
        reason: 'source_not_found',
        severity: 'CRITICAL',
        message: `Source module ${from} not found`,
        from
      };
    }

    if (!this.manifest.moduleExists(to)) {
      return {
        allowed: false,
        reason: 'target_not_found',
        severity: 'CRITICAL',
        message: `Target module ${to} not found`,
        to
      };
    }

    // Check hierarchy
    const fromModule = this.manifest.getModule(from);
    const toModule = this.manifest.getModule(to);

    if (fromModule.hierarchy_level < toModule.hierarchy_level) {
      return {
        allowed: false,
        reason: 'hierarchy_violation',
        severity: 'HIGH',
        message: `Module ${from} (level ${fromModule.hierarchy_level}) cannot depend on ${to} (level ${toModule.hierarchy_level})`,
        from,
        to,
        fromLevel: fromModule.hierarchy_level,
        toLevel: toModule.hierarchy_level
      };
    }

    // Check dependency is allowed
    const allowed = this.depRules.isDependencyAllowed(from, to);
    if (!allowed.allowed) {
      return {
        allowed: false,
        reason: 'dependency_not_allowed',
        severity: 'CRITICAL',
        message: `${from} not allowed to depend on ${to}: ${allowed.reason}`,
        from,
        to
      };
    }

    return {
      allowed: true,
      reason: 'dependency_allowed',
      from,
      to
    };
  }

  /**
   * Find which module provides a service
   */
  _findServiceProvider(service) {
    const modules = this.manifest.getAllModules();
    for (const module of modules) {
      if (module.exposed_services && module.exposed_services.includes(service)) {
        return module.name;
      }
    }
    return null;
  }
}

module.exports = DependencyEnforcer;
