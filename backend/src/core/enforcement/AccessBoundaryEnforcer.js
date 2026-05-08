/**
 * AccessBoundaryEnforcer.js - Enforce access boundaries and permissions
 * PHASE 1.4: Enforcement Layer
 *
 * Responsibility: Enforce access control and module boundaries
 * - Verify permission for operations
 * - Enforce module isolation
 * - Check service injection authorization
 * - Validate access boundaries
 */

class AccessBoundaryEnforcer {
  constructor(constitutionManager) {
    this.constitutionManager = constitutionManager;
    this.manifest = constitutionManager.getModuleManifestLoader();
    this.identity = constitutionManager.getIdentityRegistryLoader();
    this.permissions = new Map();
    this._initializePermissions();
  }

  /**
   * Initialize permissions from constitution
   */
  _initializePermissions() {
    // Load permissions from identity and policies
    const policies = this.constitutionManager.getGovernancePoliciesLoader();
    const allPolicies = policies.getAllPolicies();

    for (const policy of allPolicies) {
      if (policy.id.includes('permission') || policy.id.includes('access')) {
        this.permissions.set(policy.id, policy);
      }
    }
  }

  /**
   * Enforce operation
   */
  enforce(operation) {
    // Check access-related operations
    if (operation.type === 'service_access') {
      return this._enforceServiceAccess(operation);
    }

    if (operation.type === 'module_access') {
      return this._enforceModuleAccess(operation);
    }

    if (operation.type === 'permission_check') {
      return this._enforcePermissionCheck(operation);
    }

    if (operation.type === 'resource_access') {
      return this._enforceResourceAccess(operation);
    }

    // Default allow for unknown operations
    return { allowed: true, reason: 'unknown_operation_type' };
  }

  /**
   * Enforce service access
   */
  _enforceServiceAccess(operation) {
    const { service, requesterModule, action = 'use' } = operation;

    // Check requester module exists
    if (!this.manifest.moduleExists(requesterModule)) {
      return {
        allowed: false,
        reason: 'requester_module_not_found',
        severity: 'CRITICAL',
        message: `Requester module ${requesterModule} not found`,
        requesterModule,
        service
      };
    }

    const requester = this.manifest.getModule(requesterModule);

    // Check if service is required by the module
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

    // Find service provider
    const provider = this._findServiceProvider(service);
    if (!provider) {
      return {
        allowed: false,
        reason: 'service_provider_not_found',
        severity: 'CRITICAL',
        message: `Service ${service} not provided by any module`,
        service
      };
    }

    // Check if access is permitted
    if (!this._isAccessPermitted(requesterModule, provider, action)) {
      return {
        allowed: false,
        reason: 'access_denied',
        severity: 'HIGH',
        message: `Access to ${service} (provided by ${provider}) denied for ${requesterModule}`,
        requesterModule,
        service,
        provider,
        action
      };
    }

    return {
      allowed: true,
      reason: 'service_access_permitted',
      requesterModule,
      service,
      provider,
      action
    };
  }

  /**
   * Enforce module access
   */
  _enforceModuleAccess(operation) {
    const { sourceModule, targetModule, operation: opType = 'access' } = operation;

    // Check both modules exist
    if (!this.manifest.moduleExists(sourceModule)) {
      return {
        allowed: false,
        reason: 'source_module_not_found',
        severity: 'CRITICAL',
        message: `Source module ${sourceModule} not found`,
        sourceModule
      };
    }

    if (!this.manifest.moduleExists(targetModule)) {
      return {
        allowed: false,
        reason: 'target_module_not_found',
        severity: 'CRITICAL',
        message: `Target module ${targetModule} not found`,
        targetModule
      };
    }

    const source = this.manifest.getModule(sourceModule);
    const target = this.manifest.getModule(targetModule);

    // Check if target is in allowed dependencies
    if (!source.dependencies || !source.dependencies.includes(targetModule)) {
      return {
        allowed: false,
        reason: 'module_not_in_dependencies',
        severity: 'HIGH',
        message: `${sourceModule} does not have ${targetModule} as a dependency`,
        sourceModule,
        targetModule
      };
    }

    // Check hierarchy
    if (source.hierarchy_level < target.hierarchy_level) {
      return {
        allowed: false,
        reason: 'hierarchy_violation',
        severity: 'HIGH',
        message: `Lower hierarchy module ${sourceModule} cannot access higher hierarchy module ${targetModule}`,
        sourceModule,
        targetModule,
        sourceLevel: source.hierarchy_level,
        targetLevel: target.hierarchy_level
      };
    }

    return {
      allowed: true,
      reason: 'module_access_permitted',
      sourceModule,
      targetModule,
      operation: opType
    };
  }

  /**
   * Enforce permission check
   */
  _enforcePermissionCheck(operation) {
    const { resource, action, principal } = operation;

    // Check if principal (user, module, service) exists
    if (!principal) {
      return {
        allowed: false,
        reason: 'principal_not_specified',
        severity: 'HIGH',
        message: 'Principal (user/module/service) not specified',
        resource,
        action
      };
    }

    // Check if permission is granted
    const permitted = this._checkPermission(principal, resource, action);
    if (!permitted) {
      return {
        allowed: false,
        reason: 'permission_denied',
        severity: 'HIGH',
        message: `${principal} not permitted to ${action} ${resource}`,
        principal,
        resource,
        action
      };
    }

    return {
      allowed: true,
      reason: 'permission_granted',
      principal,
      resource,
      action
    };
  }

  /**
   * Enforce resource access
   */
  _enforceResourceAccess(operation) {
    const { resource, requester, accessType = 'read' } = operation;

    // Validate requester
    if (!requester) {
      return {
        allowed: false,
        reason: 'requester_not_specified',
        severity: 'HIGH',
        message: 'Requester not specified',
        resource
      };
    }

    // Check if access type is valid
    const validAccessTypes = ['read', 'write', 'delete', 'execute'];
    if (!validAccessTypes.includes(accessType)) {
      return {
        allowed: false,
        reason: 'invalid_access_type',
        severity: 'MEDIUM',
        message: `Invalid access type: ${accessType}`,
        resource,
        accessType
      };
    }

    // Check if requester is permitted
    if (!this._checkResourceAccess(requester, resource, accessType)) {
      return {
        allowed: false,
        reason: 'resource_access_denied',
        severity: 'HIGH',
        message: `${requester} not permitted ${accessType} access to ${resource}`,
        requester,
        resource,
        accessType
      };
    }

    return {
      allowed: true,
      reason: 'resource_access_granted',
      requester,
      resource,
      accessType
    };
  }

  /**
   * Verify service injection
   */
  async verifyServiceInjection(serviceName, requesterModule) {
    if (!this.manifest.moduleExists(requesterModule)) {
      return {
        valid: false,
        reason: 'module_not_found'
      };
    }

    const requester = this.manifest.getModule(requesterModule);
    const requires = requester.required_services || [];

    if (!requires.includes(serviceName)) {
      return {
        valid: false,
        reason: 'service_not_required'
      };
    }

    const provider = this._findServiceProvider(serviceName);
    if (!provider) {
      return {
        valid: false,
        reason: 'service_provider_not_found'
      };
    }

    return {
      valid: true,
      service: serviceName,
      requester: requesterModule,
      provider
    };
  }

  /**
   * Verify permission
   */
  async verifyPermission(resource, action, principal) {
    const permitted = this._checkPermission(principal, resource, action);
    return {
      permitted,
      resource,
      action,
      principal
    };
  }

  /**
   * Find service provider
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

  /**
   * Check if access is permitted
   */
  _isAccessPermitted(requester, provider, action) {
    // In real implementation, would check ACLs
    // For now, allow if provider is in requester's dependencies
    const requesterModule = this.manifest.getModule(requester);
    if (!requesterModule) return false;

    return requesterModule.dependencies && requesterModule.dependencies.includes(provider);
  }

  /**
   * Check permission
   */
  _checkPermission(principal, resource, action) {
    // In real implementation, would check permission policies
    // For now, return true (implementation would use identity and policy registries)
    return true;
  }

  /**
   * Check resource access
   */
  _checkResourceAccess(requester, resource, accessType) {
    // In real implementation, would check resource ACLs
    // For now, allow access
    return true;
  }

  /**
   * Get module isolation info
   */
  getModuleIsolationInfo(moduleName) {
    if (!this.manifest.moduleExists(moduleName)) {
      return null;
    }

    const module = this.manifest.getModule(moduleName);
    return {
      name: moduleName,
      canAccess: module.dependencies || [],
      canBeAccessedBy: this._getModulesThatCanAccess(moduleName),
      exposedServices: module.exposed_services || [],
      requiredServices: module.required_services || []
    };
  }

  /**
   * Get modules that can access given module
   */
  _getModulesThatCanAccess(moduleName) {
    const accessors = [];
    const modules = this.manifest.getAllModules();

    for (const module of modules) {
      if (module.dependencies && module.dependencies.includes(moduleName)) {
        accessors.push(module.name);
      }
    }

    return accessors;
  }
}

module.exports = AccessBoundaryEnforcer;
