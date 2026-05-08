/**
 * CapabilityValidator.js - Validate system capabilities and limits
 * PHASE 1.3: Validation Layer
 *
 * Responsibility: Validate system capabilities and resource limits
 * - Check scalability limits are not exceeded
 * - Verify performance targets are met
 * - Validate capability declarations
 * - Monitor resource usage against limits
 */

class CapabilityValidator {
  constructor(constitutionManager) {
    this.constitutionManager = constitutionManager;
  }

  /**
   * Run capability validation
   */
  async validate() {
    const violations = [];
    const capRegistry = this.constitutionManager.getCapabilityRegistryLoader();
    const manifest = this.constitutionManager.getModuleManifestLoader();

    try {
      // Check scalability limits
      const limitsResult = this._checkScalabilityLimits(manifest, capRegistry);
      if (!limitsResult.valid) {
        violations.push(...limitsResult.violations);
      }

      // Check capability declarations
      const capabilityResult = this._checkCapabilities(capRegistry);
      if (!capabilityResult.valid) {
        violations.push(...capabilityResult.violations);
      }

      // Check performance target requirements
      const targetResult = this._checkPerformanceTargets(capRegistry);
      if (!targetResult.valid) {
        violations.push(...targetResult.violations);
      }

      // Check system configuration
      const configResult = this._checkSystemConfiguration(capRegistry);
      if (!configResult.valid) {
        violations.push(...configResult.violations);
      }

      return {
        valid: violations.length === 0,
        validatorName: 'CapabilityValidator',
        capabilitiesChecked: capRegistry.getCapabilityCount(),
        violations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        valid: false,
        validatorName: 'CapabilityValidator',
        violations: [{
          capability: 'UNEXPECTED',
          severity: 'CRITICAL',
          message: `Unexpected error in capability validation: ${error.message}`
        }],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check scalability limits
   */
  _checkScalabilityLimits(manifest, capRegistry) {
    const violations = [];
    const limits = capRegistry.getAllScalabilityLimits();

    // Get current system state
    const moduleCount = manifest.getModuleCount();
    const allModules = manifest.getAllModules();

    // Check max_modules limit
    if (limits.max_modules) {
      const result = capRegistry.withinLimit('max_modules', moduleCount);
      if (!result.within) {
        violations.push({
          limit: 'max_modules',
          severity: 'CRITICAL',
          message: `Module count (${moduleCount}) exceeds limit (${result.limit})`,
          current: result.current,
          limit: result.limit,
          exceeded: true
        });
      }
    }

    // Count total services
    const totalServices = allModules.reduce((sum, m) => sum + (m.exposed_services?.length || 0), 0);
    if (limits.max_services) {
      const result = capRegistry.withinLimit('max_services', totalServices);
      if (!result.within) {
        violations.push({
          limit: 'max_services',
          severity: 'CRITICAL',
          message: `Service count (${totalServices}) exceeds limit (${result.limit})`,
          current: result.current,
          limit: result.limit,
          exceeded: true
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Check capability declarations
   */
  _checkCapabilities(capRegistry) {
    const violations = [];
    const capabilities = capRegistry.getAllCapabilities();
    const requiredCapabilities = [
      'bootstrap_determinism',
      'module_isolation',
      'injectability'
    ];

    // Check that required capabilities are declared
    const declaredCapNames = capabilities.map(c => c.name);
    for (const required of requiredCapabilities) {
      if (!declaredCapNames.includes(required)) {
        violations.push({
          capability: required,
          severity: 'HIGH',
          message: `Required capability ${required} not declared`,
          issue: 'missing_required_capability'
        });
      }
    }

    // Check that enabled capabilities are actually enabled
    for (const capability of capabilities) {
      if (capability.status !== 'ENABLED' && capability.status !== 'DISABLED') {
        violations.push({
          capability: capability.name,
          severity: 'MEDIUM',
          message: `Capability ${capability.name} has invalid status: ${capability.status}`,
          issue: 'invalid_capability_status'
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Check performance targets
   */
  _checkPerformanceTargets(capRegistry) {
    const violations = [];
    const targets = capRegistry.getAllPerformanceTargets();

    const requiredTargets = [
      'bootstrap_target_ms',
      'api_latency_p95_target_ms',
      'eventbus_throughput_target_per_sec'
    ];

    // Check required targets are defined
    for (const target of requiredTargets) {
      if (!(target in targets)) {
        violations.push({
          target,
          severity: 'MEDIUM',
          message: `Performance target ${target} not defined`,
          issue: 'missing_performance_target'
        });
      }
    }

    // Check target values are reasonable
    if (targets.bootstrap_target_ms && targets.bootstrap_target_ms < 100) {
      violations.push({
        target: 'bootstrap_target_ms',
        severity: 'LOW',
        message: `Bootstrap target (${targets.bootstrap_target_ms}ms) is very aggressive`,
        value: targets.bootstrap_target_ms
      });
    }

    if (targets.api_latency_p95_target_ms && targets.api_latency_p95_target_ms < 50) {
      violations.push({
        target: 'api_latency_p95_target_ms',
        severity: 'LOW',
        message: `API latency target (${targets.api_latency_p95_target_ms}ms) is very aggressive`,
        value: targets.api_latency_p95_target_ms
      });
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Check system configuration
   */
  _checkSystemConfiguration(capRegistry) {
    const violations = [];

    // Check that fault tolerance is enabled
    const ftCapability = capRegistry.getCapability('fault_tolerance');
    if (!ftCapability || ftCapability.status !== 'ENABLED') {
      violations.push({
        config: 'fault_tolerance',
        severity: 'HIGH',
        message: 'Fault tolerance capability must be enabled',
        issue: 'fault_tolerance_disabled'
      });
    }

    // Check that observability is configured
    const obsCapability = capRegistry.getCapability('observability');
    if (!obsCapability || obsCapability.status !== 'ENABLED') {
      violations.push({
        config: 'observability',
        severity: 'HIGH',
        message: 'Observability capability must be enabled',
        issue: 'observability_disabled'
      });
    }

    // Check that auto recovery is enabled
    const recoveryCapability = capRegistry.getCapability('auto_recovery');
    if (!recoveryCapability || recoveryCapability.status !== 'ENABLED') {
      violations.push({
        config: 'auto_recovery',
        severity: 'MEDIUM',
        message: 'Auto recovery capability is not enabled',
        issue: 'auto_recovery_disabled'
      });
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }
}

module.exports = CapabilityValidator;
