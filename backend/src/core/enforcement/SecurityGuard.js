/**
 * SecurityGuard.js - Internal plugin for RuntimeEnforcementEngine
 * PHASE 1.7: Security & Access Governance
 *
 * Responsibility: Enforce security policies based on AccessRules
 * - Validate access rights against capability bindings
 * - Check module isolation boundaries
 * - Verify identity propagation
 * - Block unauthorized operations
 * - Track access violations
 *
 * NOTE: This is a PLUGIN, not an engine. Integrated into RuntimeEnforcementEngine.
 */

class SecurityGuard {
  constructor(constitutionManager) {
    if (!constitutionManager) {
      throw new Error('constitutionManager required');
    }

    this.constitutionManager = constitutionManager;
    this.accessRules = null;
    this.systemCapabilities = null;
    this.violations = [];
    this.accessLog = [];

    this._loadAccessRulesConstitution();
  }

  /**
   * Load AccessRules from constitution (immutable)
   */
  _loadAccessRulesConstitution() {
    try {
      const loaders = this.constitutionManager.getAllLoaders();

      for (const [name, loader] of Object.entries(loaders)) {
        if (name.includes('AccessRule')) {
          this.accessRules = loader.getData();
          break;
        }
      }

      if (!this.accessRules) {
        console.warn('[SecurityGuard] AccessRules not found in constitution, using defaults');
        this.accessRules = { moduleAccessPolicies: {}, capabilityBindings: {} };
      }

      const capabilities = this.constitutionManager.getCapabilitiesLoader?.();
      if (capabilities) {
        this.systemCapabilities = capabilities.getData();
      }
    } catch (error) {
      console.error('[SecurityGuard] Failed to load AccessRules:', error.message);
      this.accessRules = { moduleAccessPolicies: {}, capabilityBindings: {} };
    }
  }

  /**
   * Enforce operation based on security rules
   */
  enforce(operation) {
    const { type, requester, capability, resource, action, identity } = operation;

    // Access denied by default
    let result = {
      allowed: false,
      reason: 'unknown_operation'
    };

    switch (type) {
      case 'capability_usage':
        result = this._enforceCapabilityUsage(operation);
        break;

      case 'module_access':
        result = this._enforceModuleAccess(operation);
        break;

      case 'identity_verification':
        result = this._enforceIdentityVerification(operation);
        break;

      case 'resource_access':
        result = this._enforceResourceAccess(operation);
        break;

      default:
        // Allow unknown operation types for backward compatibility
        return { allowed: true, reason: 'unknown_operation_type' };
    }

    // Log access (allowed and denied)
    this._logAccess(operation, result);

    // Track violations
    if (!result.allowed) {
      this._recordViolation(operation, result);
    }

    return result;
  }

  /**
   * Enforce capability usage
   */
  _enforceCapabilityUsage(operation) {
    const { requester, capability, identity, severity = 'MEDIUM' } = operation;

    if (!requester) {
      return {
        allowed: false,
        reason: 'requester_not_specified',
        severity: 'HIGH',
        message: 'Requester (module) not specified'
      };
    }

    if (!capability) {
      return {
        allowed: false,
        reason: 'capability_not_specified',
        severity: 'HIGH',
        message: 'Capability not specified'
      };
    }

    // Check capability binding
    const binding = this.accessRules.capabilityBindings?.[capability];
    if (!binding) {
      return {
        allowed: false,
        reason: 'capability_unknown',
        severity: 'HIGH',
        message: `Capability ${capability} not found in AccessRules`,
        capability
      };
    }

    // Check module has access to capability
    const modulePolicy = this.accessRules.moduleAccessPolicies?.[requester];
    if (!modulePolicy) {
      return {
        allowed: false,
        reason: 'module_unknown',
        severity: 'HIGH',
        message: `Module ${requester} not found in AccessRules`,
        requester
      };
    }

    if (!modulePolicy.allowedCapabilities?.includes(capability)) {
      return {
        allowed: false,
        reason: 'capability_denied',
        severity: binding.requiresApproval ? 'CRITICAL' : 'HIGH',
        message: `Module ${requester} not allowed to use ${capability}`,
        capability,
        requester
      };
    }

    // Check identity requirements
    if (binding.requiresIdentity && !identity) {
      return {
        allowed: false,
        reason: 'identity_required',
        severity: 'HIGH',
        message: `Capability ${capability} requires identity`,
        capability
      };
    }

    // Check approval requirements
    if (binding.requiresApproval) {
      return {
        allowed: false,
        reason: 'approval_required',
        severity: 'CRITICAL',
        message: `Capability ${capability} requires approval`,
        capability,
        escalation: true
      };
    }

    return {
      allowed: true,
      reason: 'capability_granted',
      capability,
      requester,
      auditTrail: binding.auditTrail
    };
  }

  /**
   * Enforce module access
   */
  _enforceModuleAccess(operation) {
    const { source, target } = operation;

    if (!source || !target) {
      return {
        allowed: false,
        reason: 'source_or_target_not_specified',
        severity: 'HIGH',
        message: 'Source and target modules required'
      };
    }

    const sourcePolicy = this.accessRules.moduleAccessPolicies?.[source];
    if (!sourcePolicy) {
      return {
        allowed: false,
        reason: 'source_module_unknown',
        severity: 'HIGH',
        message: `Source module ${source} not found`,
        source
      };
    }

    const targetPolicy = this.accessRules.moduleAccessPolicies?.[target];
    if (!targetPolicy) {
      return {
        allowed: false,
        reason: 'target_module_unknown',
        severity: 'HIGH',
        message: `Target module ${target} not found`,
        target
      };
    }

    // Check if target is in accessible modules
    if (!sourcePolicy.accessibleBy?.includes(source) &&
        !(sourcePolicy.accessibleBy === 'ALL_MODULES')) {
      if (!sourcePolicy.accessibleBy?.includes(target)) {
        return {
          allowed: false,
          reason: 'module_not_accessible',
          severity: 'HIGH',
          message: `Module ${source} cannot access ${target}`,
          source,
          target
        };
      }
    }

    // Check isolation level constraints
    if (sourcePolicy.isolationLevel > targetPolicy.isolationLevel) {
      return {
        allowed: false,
        reason: 'isolation_level_violation',
        severity: 'HIGH',
        message: `Lower isolation module ${source} cannot access higher isolation module ${target}`,
        source,
        target,
        sourceLevel: sourcePolicy.isolationLevel,
        targetLevel: targetPolicy.isolationLevel
      };
    }

    return {
      allowed: true,
      reason: 'module_access_permitted',
      source,
      target
    };
  }

  /**
   * Enforce identity verification
   */
  _enforceIdentityVerification(operation) {
    const { identity, requiredLevel = 'authenticated' } = operation;

    if (!identity) {
      return {
        allowed: false,
        reason: 'identity_not_provided',
        severity: 'HIGH',
        message: 'Identity verification required'
      };
    }

    const { subject, issuer, timestamp, signature } = identity;

    if (!subject) {
      return {
        allowed: false,
        reason: 'identity_invalid',
        severity: 'HIGH',
        message: 'Identity subject missing',
        identity
      };
    }

    // Check identity age (basic check)
    if (timestamp) {
      const identityAge = Date.now() - new Date(timestamp).getTime();
      const maxAge = 3600000; // 1 hour

      if (identityAge > maxAge) {
        return {
          allowed: false,
          reason: 'identity_expired',
          severity: 'MEDIUM',
          message: 'Identity token expired',
          identity,
          age_ms: identityAge
        };
      }
    }

    return {
      allowed: true,
      reason: 'identity_verified',
      subject,
      issuer
    };
  }

  /**
   * Enforce resource access
   */
  _enforceResourceAccess(operation) {
    const { resource, action, requester, accessLevel = 'read' } = operation;

    if (!resource || !action || !requester) {
      return {
        allowed: false,
        reason: 'resource_access_params_missing',
        severity: 'HIGH',
        message: 'Resource, action, and requester required'
      };
    }

    // Validate access level
    const validAccessLevels = ['read', 'write', 'delete', 'admin'];
    if (!validAccessLevels.includes(accessLevel)) {
      return {
        allowed: false,
        reason: 'invalid_access_level',
        severity: 'MEDIUM',
        message: `Invalid access level: ${accessLevel}`,
        accessLevel
      };
    }

    // Check module restrictions
    const modulePolicy = this.accessRules.moduleAccessPolicies?.[requester];
    if (!modulePolicy) {
      return {
        allowed: false,
        reason: 'module_unknown',
        severity: 'HIGH',
        message: `Module ${requester} not found`,
        requester
      };
    }

    // Enforce restriction level based on module policy
    const restrictionLevel = modulePolicy.restrictionLevel;

    if (restrictionLevel === 'ADMIN_ONLY' && accessLevel !== 'admin') {
      return {
        allowed: false,
        reason: 'admin_only_resource',
        severity: 'HIGH',
        message: `Resource ${resource} is admin-only`,
        resource,
        requester
      };
    }

    if (restrictionLevel === 'OWNER_OR_ADMIN' && !['owner', 'admin'].includes(accessLevel)) {
      return {
        allowed: false,
        reason: 'owner_or_admin_required',
        severity: 'MEDIUM',
        message: `Resource ${resource} requires owner or admin`,
        resource,
        requester
      };
    }

    return {
      allowed: true,
      reason: 'resource_access_granted',
      resource,
      action,
      requester,
      accessLevel
    };
  }

  /**
   * Log access attempt
   */
  _logAccess(operation, result) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation: operation.type,
      requester: operation.requester,
      allowed: result.allowed,
      reason: result.reason,
      severity: result.severity,
      details: {
        capability: operation.capability,
        resource: operation.resource,
        action: operation.action
      }
    };

    this.accessLog.push(logEntry);

    // Keep only last 5000 access logs
    if (this.accessLog.length > 5000) {
      this.accessLog.shift();
    }
  }

  /**
   * Record security violation
   */
  _recordViolation(operation, result) {
    const violation = {
      id: `sec_violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      operation: operation.type,
      requester: operation.requester,
      reason: result.reason,
      severity: result.severity || 'MEDIUM',
      message: result.message,
      details: operation,
      escalation: result.escalation || false
    };

    this.violations.push(violation);

    // Keep only last 1000 violations
    if (this.violations.length > 1000) {
      this.violations.shift();
    }

    // Log violation
    console.warn(`[SecurityGuard] VIOLATION: ${violation.reason} (${violation.severity})`);
  }

  /**
   * Get access control report
   */
  getAccessControlReport() {
    return {
      timestamp: new Date().toISOString(),
      accessLogSize: this.accessLog.length,
      violationCount: this.violations.length,
      recentViolations: this.violations.slice(-10),
      rulesLoaded: !!this.accessRules,
      capabilitiesLoaded: !!this.systemCapabilities
    };
  }

  /**
   * Get violations
   */
  getViolations(limit = 50) {
    return this.violations.slice(-limit);
  }

  /**
   * Get access log
   */
  getAccessLog(limit = 50) {
    return this.accessLog.slice(-limit);
  }

  /**
   * Reset logs (for testing)
   */
  resetLogs() {
    this.accessLog = [];
    this.violations = [];
    return { timestamp: new Date().toISOString(), cleared: true };
  }
}

module.exports = SecurityGuard;
