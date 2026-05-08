/**
 * VersionCompatibilityValidator.js - Validate version compatibility
 * PHASE 1.3: Validation Layer
 *
 * Responsibility: Validate version compatibility and deprecation policies
 * - Check module versions are compatible
 * - Verify deprecation policies
 * - Check version lifecycle compliance
 * - Validate upgrade paths
 */

class VersionCompatibilityValidator {
  constructor(constitutionManager) {
    this.constitutionManager = constitutionManager;
  }

  /**
   * Run version compatibility validation
   */
  async validate() {
    const violations = [];
    const versionLoader = this.constitutionManager.getVersioningPolicyLoader();
    const manifest = this.constitutionManager.getModuleManifestLoader();

    try {
      // Check module version compliance
      const moduleVersionResult = this._checkModuleVersions(manifest, versionLoader);
      if (!moduleVersionResult.valid) {
        violations.push(...moduleVersionResult.violations);
      }

      // Check version policy compliance
      const policyResult = this._checkVersionPolicy(versionLoader);
      if (!policyResult.valid) {
        violations.push(...policyResult.violations);
      }

      // Check deprecation policy
      const deprecationResult = this._checkDeprecationPolicy(versionLoader);
      if (!deprecationResult.valid) {
        violations.push(...deprecationResult.violations);
      }

      // Check compatibility rules
      const compatResult = this._checkCompatibilityRules(versionLoader);
      if (!compatResult.valid) {
        violations.push(...compatResult.violations);
      }

      return {
        valid: violations.length === 0,
        validatorName: 'VersionCompatibilityValidator',
        versionsChecked: manifest.getModuleCount(),
        violations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        valid: false,
        validatorName: 'VersionCompatibilityValidator',
        violations: [{
          version: 'UNEXPECTED',
          severity: 'CRITICAL',
          message: `Unexpected error in version validation: ${error.message}`
        }],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check module version compliance
   */
  _checkModuleVersions(manifest, versionLoader) {
    const violations = [];
    const modules = manifest.getAllModules();

    for (const module of modules) {
      // Check version is present
      if (!module.version) {
        violations.push({
          module: module.name,
          severity: 'CRITICAL',
          message: `Module ${module.name} does not have a version declared`,
          issue: 'missing_version'
        });
        continue;
      }

      // Check version format is valid
      const parsed = versionLoader.parseVersion(module.version);
      if (!parsed) {
        violations.push({
          module: module.name,
          severity: 'CRITICAL',
          message: `Module ${module.name} has invalid version format: ${module.version}`,
          issue: 'invalid_version_format',
          version: module.version
        });
        continue;
      }

      // Check version is not deprecated
      if (versionLoader.isVersionDeprecated(module.version)) {
        const deadline = versionLoader.getDeprecationDeadline(module.version);
        violations.push({
          module: module.name,
          severity: 'HIGH',
          message: `Module ${module.name} is using deprecated version ${module.version}`,
          issue: 'deprecated_version',
          version: module.version,
          removalDeadline: deadline
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Check version policy compliance
   */
  _checkVersionPolicy(versionLoader) {
    const violations = [];
    const policy = versionLoader.getVersioningPolicy();

    if (!policy) {
      violations.push({
        policy: 'versioning_policy',
        severity: 'CRITICAL',
        message: 'No versioning policy defined',
        issue: 'missing_policy'
      });
      return { valid: violations.length === 0, violations };
    }

    // Check required policy fields
    const requiredFields = [
      'versioning_rules',
      'version_lifecycle',
      'version_format'
    ];

    for (const field of requiredFields) {
      if (!policy[field]) {
        violations.push({
          policy: 'versioning_policy',
          severity: 'MEDIUM',
          message: `Versioning policy missing field: ${field}`,
          issue: 'incomplete_policy',
          missingField: field
        });
      }
    }

    // Check that semantic versioning is used
    if (policy.version_format && !policy.version_format.includes('MAJOR.MINOR.PATCH')) {
      violations.push({
        policy: 'versioning_policy',
        severity: 'HIGH',
        message: 'Version format must follow semantic versioning (MAJOR.MINOR.PATCH)',
        issue: 'invalid_version_format',
        format: policy.version_format
      });
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Check deprecation policy
   */
  _checkDeprecationPolicy(versionLoader) {
    const violations = [];
    const policy = versionLoader.getDeprecationPolicy();

    if (!policy) {
      violations.push({
        policy: 'deprecation_policy',
        severity: 'MEDIUM',
        message: 'No deprecation policy defined',
        issue: 'missing_policy'
      });
      return { valid: violations.length === 0, violations };
    }

    // Check required policy fields
    if (!policy.deprecation_rules || !Array.isArray(policy.deprecation_rules)) {
      violations.push({
        policy: 'deprecation_policy',
        severity: 'MEDIUM',
        message: 'Deprecation policy missing deprecation_rules array',
        issue: 'missing_rules'
      });
    }

    // Check deprecation rules are complete
    if (policy.deprecation_rules) {
      for (const rule of policy.deprecation_rules) {
        if (!rule.id) {
          violations.push({
            policy: 'deprecation_policy',
            severity: 'MEDIUM',
            message: 'Deprecation rule missing id field',
            issue: 'incomplete_rule'
          });
        }
        if (!rule.deprecated_versions || !Array.isArray(rule.deprecated_versions)) {
          violations.push({
            policy: 'deprecation_policy',
            severity: 'MEDIUM',
            message: 'Deprecation rule missing deprecated_versions array',
            issue: 'incomplete_rule'
          });
        }
        if (!rule.removal_date) {
          violations.push({
            policy: 'deprecation_policy',
            severity: 'MEDIUM',
            message: 'Deprecation rule missing removal_date',
            issue: 'incomplete_rule'
          });
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Check compatibility rules
   */
  _checkCompatibilityRules(versionLoader) {
    const violations = [];
    const rules = versionLoader.getCompatibilityRules();

    if (!rules) {
      violations.push({
        rules: 'compatibility_matrix',
        severity: 'MEDIUM',
        message: 'No compatibility rules defined',
        issue: 'missing_rules'
      });
      return { valid: violations.length === 0, violations };
    }

    // Check compatibility matrix
    if (!rules.compatibility_matrix) {
      violations.push({
        rules: 'compatibility_matrix',
        severity: 'HIGH',
        message: 'No compatibility_matrix defined',
        issue: 'missing_matrix'
      });
      return { valid: violations.length === 0, violations };
    }

    // Check that matrix entries are complete
    for (const [version, compat] of Object.entries(rules.compatibility_matrix)) {
      if (!compat.compatible_with_major_versions) {
        violations.push({
          rules: 'compatibility_matrix',
          severity: 'MEDIUM',
          message: `Version ${version} missing compatible_with_major_versions`,
          issue: 'incomplete_entry',
          version
        });
      }

      if (!compat.upgrade_path) {
        violations.push({
          rules: 'compatibility_matrix',
          severity: 'LOW',
          message: `Version ${version} missing upgrade_path guidance`,
          issue: 'incomplete_entry',
          version
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }
}

module.exports = VersionCompatibilityValidator;
