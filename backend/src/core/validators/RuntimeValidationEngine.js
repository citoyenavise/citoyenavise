/**
 * RuntimeValidationEngine.js - Main validation orchestrator
 * PHASE 1.3: Validation Layer
 *
 * Responsibility: Orchestrate continuous validation against constitution
 * - Initialize all validators
 * - Run validation cycles (every 5 seconds)
 * - Collect validation results
 * - Report violations
 * - Track validation metrics
 */

const BootstrapInvariantValidator = require('./BootstrapInvariantValidator');
const DependencyValidator = require('./DependencyValidator');
const EventSchemaValidator = require('./EventSchemaValidator');
const CapabilityValidator = require('./CapabilityValidator');
const VersionCompatibilityValidator = require('./VersionCompatibilityValidator');

class RuntimeValidationEngine {
  constructor(constitutionManager, options = {}) {
    if (!constitutionManager) {
      throw new Error('constitutionManager required');
    }

    this.constitutionManager = constitutionManager;
    this.criticalViolationHandler = options.criticalViolationHandler || null;
    this.eventBus = options.eventBus || null; // HardenedEventBus for event-driven emission

    this.validators = {
      bootstrap: new BootstrapInvariantValidator(constitutionManager),
      dependency: new DependencyValidator(constitutionManager),
      eventSchema: new EventSchemaValidator(constitutionManager),
      capability: new CapabilityValidator(constitutionManager),
      versionCompatibility: new VersionCompatibilityValidator(constitutionManager)
    };

    this.validationResults = [];
    this.violations = [];
    this.running = false;
    this.validationCycleInterval = null;
    this.validationCycleTime = 5000; // 5 seconds
    this.startTime = null;
    this.cycleCount = 0;
  }

  /**
   * Start continuous validation cycles
   */
  startValidation() {
    if (this.running) {
      throw new Error('Validation already running');
    }

    this.running = true;
    this.startTime = Date.now();
    this.violations = [];
    this.validationResults = [];

    // Run first validation immediately
    this._runValidationCycle();

    // Schedule recurring validation
    this.validationCycleInterval = setInterval(() => {
      this._runValidationCycle();
    }, this.validationCycleTime);

    return {
      started: true,
      interval_ms: this.validationCycleTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Stop continuous validation
   */
  stopValidation() {
    if (!this.running) {
      throw new Error('Validation not running');
    }

    if (this.validationCycleInterval) {
      clearInterval(this.validationCycleInterval);
    }

    this.running = false;

    return {
      stopped: true,
      cyclesRun: this.cycleCount,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Run single validation cycle
   * PHASE 5.5: Emits events instead of storing violations
   */
  async _runValidationCycle() {
    this.cycleCount++;
    const cycleStartTime = Date.now();

    try {
      const results = await Promise.all([
        this.validators.bootstrap.validate(),
        this.validators.dependency.validate(),
        this.validators.eventSchema.validate(),
        this.validators.capability.validate(),
        this.validators.versionCompatibility.validate()
      ]);

      const cycleResult = {
        cycle: this.cycleCount,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - cycleStartTime,
        validators: {
          bootstrap: results[0],
          dependency: results[1],
          eventSchema: results[2],
          capability: results[3],
          versionCompatibility: results[4]
        },
        summary: this._summarizeResults(results)
      };

      this.validationResults.push(cycleResult);

      // Keep only last 100 cycles
      if (this.validationResults.length > 100) {
        this.validationResults.shift();
      }

      // Emit violation events via HardenedEventBus (PHASE 5.5)
      const allViolations = [];
      for (const result of results) {
        if (!result.valid) {
          allViolations.push(...(result.violations || []));
        }
      }

      // Emit each violation as a VIOLATION event
      for (const violation of allViolations) {
        this._emitViolationEvent(violation);
      }

      // Also store internally for backward compatibility
      this.violations = allViolations;

      // Check for critical violations
      if (this._hasCriticalViolations(results)) {
        const criticalViolations = this._extractCriticalViolations(results);
        if (this.criticalViolationHandler) {
          // Route to governance layer (CAAGS) — handler manages escalation
          await this.criticalViolationHandler(criticalViolations);
        } else {
          // Legacy behavior: log and exit
          console.error('❌ CRITICAL VALIDATION VIOLATIONS DETECTED');
          this._logViolations(results);
          process.exit(1);
        }
      }

    } catch (error) {
      console.error(`❌ Validation cycle ${this.cycleCount} failed:`, error);
      process.exit(1);
    }
  }

  /**
   * Summarize validation results
   */
  _summarizeResults(results) {
    const passed = results.filter(r => r.valid).length;
    const failed = results.filter(r => !r.valid).length;
    const totalViolations = results.reduce((sum, r) => sum + (r.violations?.length || 0), 0);

    return {
      validatorsRun: results.length,
      validatorsPassed: passed,
      validatorsFailed: failed,
      totalViolations: totalViolations,
      allValid: failed === 0
    };
  }

  /**
   * Check if critical violations exist
   */
  _hasCriticalViolations(results) {
    for (const result of results) {
      if (result.violations) {
        for (const violation of result.violations) {
          if (violation.severity === 'CRITICAL') {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Log all violations
   */
  _logViolations(results) {
    for (const result of results) {
      if (result.violations && result.violations.length > 0) {
        for (const violation of result.violations) {
          console.error(`[${violation.severity}] ${violation.message}`);
        }
      }
    }
  }

  /**
   * Extract critical violations from results
   */
  _extractCriticalViolations(results) {
    const criticals = [];
    for (const result of results) {
      if (result.violations && Array.isArray(result.violations)) {
        for (const violation of result.violations) {
          if (violation.severity === 'CRITICAL') {
            criticals.push(violation);
          }
        }
      }
    }
    return criticals;
  }

  /**
   * Run single validation check (blocking)
   */
  async validateOnce() {
    return Promise.all([
      this.validators.bootstrap.validate(),
      this.validators.dependency.validate(),
      this.validators.eventSchema.validate(),
      this.validators.capability.validate(),
      this.validators.versionCompatibility.validate()
    ]);
  }

  /**
   * Get latest validation results
   */
  getLatestResults() {
    if (this.validationResults.length === 0) {
      return null;
    }
    return this.validationResults[this.validationResults.length - 1];
  }

  /**
   * Get all validation results
   */
  getAllResults() {
    return [...this.validationResults];
  }

  /**
   * Get validation statistics
   */
  getStatistics() {
    if (this.validationResults.length === 0) {
      return {
        cyclesRun: 0,
        averageDuration_ms: 0,
        totalViolations: 0,
        criticalViolations: 0
      };
    }

    const durations = this.validationResults.map(r => r.duration_ms);
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    const criticalViolations = this.violations.filter(v => v.severity === 'CRITICAL').length;

    return {
      cyclesRun: this.cycleCount,
      averageDuration_ms: Math.round(averageDuration),
      totalViolations: this.violations.length,
      criticalViolations,
      uptime_ms: Date.now() - this.startTime
    };
  }

  /**
   * Get validation status
   */
  getStatus() {
    const latest = this.getLatestResults();
    const stats = this.getStatistics();

    return {
      running: this.running,
      cycleCount: this.cycleCount,
      latestValidation: latest?.timestamp,
      averageValidationTime_ms: stats.averageDuration_ms,
      totalViolations: stats.totalViolations,
      criticalViolations: stats.criticalViolations,
      isHealthy: stats.criticalViolations === 0,
      uptime_ms: stats.uptime_ms
    };
  }

  /**
   * Get detailed validation report
   */
  getDetailedReport() {
    const latest = this.getLatestResults();
    const stats = this.getStatistics();

    return {
      engine: {
        running: this.running,
        interval_ms: this.validationCycleTime,
        cycleCount: this.cycleCount
      },
      latestValidation: latest ? {
        cycle: latest.cycle,
        timestamp: latest.timestamp,
        duration_ms: latest.duration_ms,
        summary: latest.summary,
        details: latest.validators
      } : null,
      statistics: stats,
      violations: this.violations.slice(-50), // Last 50 violations
      health: {
        healthy: stats.criticalViolations === 0,
        criticalViolations: stats.criticalViolations,
        warnings: this.violations.filter(v => v.severity === 'HIGH').length
      }
    };
  }

  /**
   * Get validator by name
   */
  getValidator(name) {
    return this.validators[name];
  }

  /**
   * Get all validators
   */
  getAllValidators() {
    return this.validators;
  }

  /**
   * Set event bus for event-driven mode (PHASE 5.5)
   */
  setEventBus(eventBus) {
    this.eventBus = eventBus;
    return { eventBusSet: true };
  }

  /**
   * Emit violation event via HardenedEventBus (PHASE 5.5)
   */
  _emitViolationEvent(violation) {
    if (!this.eventBus) {
      return; // No event bus configured
    }

    try {
      // Import GovernanceEvent for factory method
      const GovernanceEvent = require('../governance/events/GovernanceEvent');

      // Create violation event with severity from violation
      const event = GovernanceEvent.violation(
        {
          message: violation.message,
          validator: violation.validator || 'unknown',
          cycleCount: this.cycleCount,
          ...violation
        },
        {
          severity: violation.severity || 'MEDIUM',
          source: 'RuntimeValidationEngine'
        }
      );

      // Publish via event bus (event bus handles validation, versioning, audit trail)
      this.eventBus.publish(event);
    } catch (error) {
      console.error('Failed to emit violation event:', error.message);
      // Non-fatal: validation continues even if event emission fails
    }
  }

  /**
   * Validate AccessRules (PHASE 1.7)
   */
  async validateAccessRules() {
    try {
      const accessRulesLoader = this.constitutionManager.getAccessRulesLoader?.();
      if (!accessRulesLoader) {
        return {
          valid: true,
          reason: 'access_rules_not_loaded',
          violations: []
        };
      }

      const accessRules = accessRulesLoader.getData();
      const violations = [];

      // Check moduleAccessPolicies structure
      if (!accessRules.moduleAccessPolicies) {
        violations.push({
          severity: 'CRITICAL',
          message: 'AccessRules missing moduleAccessPolicies'
        });
      }

      // Check capabilityBindings structure
      if (!accessRules.capabilityBindings) {
        violations.push({
          severity: 'CRITICAL',
          message: 'AccessRules missing capabilityBindings'
        });
      }

      // Validate each module policy
      if (accessRules.moduleAccessPolicies) {
        for (const [moduleName, policy] of Object.entries(accessRules.moduleAccessPolicies)) {
          if (!policy.isolationLevel !== undefined && policy.isolationLevel < 0 || policy.isolationLevel > 4) {
            violations.push({
              severity: 'HIGH',
              message: `Module ${moduleName} has invalid isolationLevel: ${policy.isolationLevel}`
            });
          }

          if (!policy.allowedCapabilities || !Array.isArray(policy.allowedCapabilities)) {
            violations.push({
              severity: 'MEDIUM',
              message: `Module ${moduleName} missing allowedCapabilities`
            });
          }
        }
      }

      return {
        valid: violations.length === 0,
        violations,
        rulesCount: accessRules.moduleAccessPolicies ? Object.keys(accessRules.moduleAccessPolicies).length : 0
      };
    } catch (error) {
      return {
        valid: false,
        violations: [{
          severity: 'CRITICAL',
          message: `AccessRules validation error: ${error.message}`
        }]
      };
    }
  }

  /**
   * Validate capability bindings (PHASE 1.7)
   */
  async validateCapabilityBindings() {
    try {
      const accessRulesLoader = this.constitutionManager.getAccessRulesLoader?.();
      if (!accessRulesLoader) {
        return {
          valid: true,
          reason: 'access_rules_not_loaded',
          violations: []
        };
      }

      const accessRules = accessRulesLoader.getData();
      const violations = [];
      let bindingsCount = 0;

      if (accessRules.capabilityBindings) {
        for (const [capId, binding] of Object.entries(accessRules.capabilityBindings)) {
          bindingsCount++;

          if (!binding.module) {
            violations.push({
              severity: 'HIGH',
              message: `Capability ${capId} missing module`
            });
          }

          if (!binding.type) {
            violations.push({
              severity: 'MEDIUM',
              message: `Capability ${capId} missing type`
            });
          }

          if (!binding.restrictionLevel) {
            violations.push({
              severity: 'MEDIUM',
              message: `Capability ${capId} missing restrictionLevel`
            });
          }
        }
      }

      return {
        valid: violations.length === 0,
        violations,
        bindingsCount
      };
    } catch (error) {
      return {
        valid: false,
        violations: [{
          severity: 'CRITICAL',
          message: `Capability bindings validation error: ${error.message}`
        }]
      };
    }
  }

  /**
   * Validate module isolation (PHASE 1.7)
   */
  async validateModuleIsolation() {
    try {
      const accessRulesLoader = this.constitutionManager.getAccessRulesLoader?.();
      if (!accessRulesLoader) {
        return {
          valid: true,
          reason: 'access_rules_not_loaded',
          violations: []
        };
      }

      const accessRules = accessRulesLoader.getData();
      const violations = [];

      if (accessRules.isolationLevels) {
        for (const [level, config] of Object.entries(accessRules.isolationLevels)) {
          if (!config.modules || !Array.isArray(config.modules)) {
            violations.push({
              severity: 'MEDIUM',
              message: `Isolation level ${level} has invalid modules definition`
            });
          }

          if (!config.accessControl) {
            violations.push({
              severity: 'MEDIUM',
              message: `Isolation level ${level} missing accessControl definition`
            });
          }
        }
      }

      return {
        valid: violations.length === 0,
        violations,
        levelsCount: accessRules.isolationLevels ? Object.keys(accessRules.isolationLevels).length : 0
      };
    } catch (error) {
      return {
        valid: false,
        violations: [{
          severity: 'CRITICAL',
          message: `Module isolation validation error: ${error.message}`
        }]
      };
    }
  }

  /**
   * Validate identity chain (PHASE 1.7)
   */
  async validateIdentityChain() {
    try {
      const identityLoader = this.constitutionManager.getIdentityRegistryLoader?.();
      if (!identityLoader) {
        return {
          valid: true,
          reason: 'identity_loader_not_found',
          violations: []
        };
      }

      const violations = [];
      // Identity chain validation would check for consistent identity propagation

      return {
        valid: violations.length === 0,
        violations,
        identitiesRegistered: true
      };
    } catch (error) {
      return {
        valid: false,
        violations: [{
          severity: 'MEDIUM',
          message: `Identity chain validation error: ${error.message}`
        }]
      };
    }
  }
}

module.exports = RuntimeValidationEngine;
