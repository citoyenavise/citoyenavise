/**
 * VersioningPolicyLoader.js - Load all versioning-related declarations from constitution
 * PHASE 1.2: Runtime Loaders
 *
 * Responsibility: Load versioning policies from constitution
 * - Load VersioningPolicy.json
 * - Load CompatibilityRules.json
 * - Load DeprecationPolicy.json
 * - Build unified versioning index
 */

const fs = require('fs');
const path = require('path');

class VersioningPolicyLoader {
  constructor() {
    this.versioningDir = path.join(__dirname, '../../..', 'ROOT_CONSTITUTION/versioning');
    this.versioningPolicy = null;
    this.compatibilityRules = null;
    this.deprecationPolicy = null;
    this.versionIndex = new Map();
    this.sealed = false;
  }

  /**
   * Load all versioning-related files
   */
  async load() {
    if (this.sealed) {
      throw new Error('VersioningPolicyLoader already sealed. Cannot load again.');
    }

    try {
      await this._loadVersioningPolicy();
      await this._loadCompatibilityRules();
      await this._loadDeprecationPolicy();

      this._buildIndex();
      this.sealed = true;

      return {
        success: true,
        filesLoaded: 3,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to load VersioningPolicy: ${error.message}`);
    }
  }

  /**
   * Load VersioningPolicy.json
   */
  async _loadVersioningPolicy() {
    const filePath = path.join(this.versioningDir, 'VersioningPolicy.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    if (!data.sealed || !data.immutable || !data.read_only) {
      throw new Error('VersioningPolicy.json is not properly sealed');
    }

    this.versioningPolicy = data;
  }

  /**
   * Load CompatibilityRules.json
   */
  async _loadCompatibilityRules() {
    const filePath = path.join(this.versioningDir, 'CompatibilityRules.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    if (!data.sealed || !data.immutable || !data.read_only) {
      throw new Error('CompatibilityRules.json is not properly sealed');
    }

    this.compatibilityRules = data;
  }

  /**
   * Load DeprecationPolicy.json
   */
  async _loadDeprecationPolicy() {
    const filePath = path.join(this.versioningDir, 'DeprecationPolicy.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    if (!data.sealed || !data.immutable || !data.read_only) {
      throw new Error('DeprecationPolicy.json is not properly sealed');
    }

    this.deprecationPolicy = data;
  }

  /**
   * Build unified versioning index
   */
  _buildIndex() {
    // Index versioning rules
    if (this.versioningPolicy.versioning_rules) {
      for (const rule of this.versioningPolicy.versioning_rules) {
        this.versionIndex.set(`rule:${rule.id}`, rule);
      }
    }

    // Index compatibility rules
    if (this.compatibilityRules.compatibility_matrix) {
      for (const [key, rule] of Object.entries(this.compatibilityRules.compatibility_matrix)) {
        this.versionIndex.set(`compat:${key}`, rule);
      }
    }

    // Index deprecation rules
    if (this.deprecationPolicy.deprecation_rules) {
      for (const rule of this.deprecationPolicy.deprecation_rules) {
        this.versionIndex.set(`depr:${rule.id}`, rule);
      }
    }
  }

  /**
   * Get versioning policy
   */
  getVersioningPolicy() {
    if (!this.sealed) {
      throw new Error('VersioningPolicyLoader not loaded');
    }
    return this.versioningPolicy;
  }

  /**
   * Get compatibility rules
   */
  getCompatibilityRules() {
    if (!this.sealed) {
      throw new Error('VersioningPolicyLoader not loaded');
    }
    return this.compatibilityRules;
  }

  /**
   * Get deprecation policy
   */
  getDeprecationPolicy() {
    if (!this.sealed) {
      throw new Error('VersioningPolicyLoader not loaded');
    }
    return this.deprecationPolicy;
  }

  /**
   * Parse semantic version
   */
  parseVersion(versionString) {
    const match = versionString.match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?$/);
    if (!match) {
      return null;
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] || null
    };
  }

  /**
   * Check if two versions are compatible
   */
  areVersionsCompatible(version1, version2) {
    if (!this.sealed) {
      throw new Error('VersioningPolicyLoader not loaded');
    }

    const v1 = this.parseVersion(version1);
    const v2 = this.parseVersion(version2);

    if (!v1 || !v2) {
      return { compatible: false, reason: 'Invalid version format' };
    }

    // Same major version is compatible
    if (v1.major === v2.major) {
      return { compatible: true, reason: 'Same major version' };
    }

    // Different major versions might still be compatible based on compatibility rules
    const compatRule = this.compatibilityRules?.compatibility_matrix?.[`${v1.major}.x`];
    if (compatRule && compatRule.compatible_with_major_versions?.includes(v2.major)) {
      return { compatible: true, reason: 'Compatibility rule allows' };
    }

    return { compatible: false, reason: 'Major version mismatch' };
  }

  /**
   * Check if version is deprecated
   */
  isVersionDeprecated(versionString) {
    if (!this.sealed) {
      throw new Error('VersioningPolicyLoader not loaded');
    }

    const deprecationRule = this.deprecationPolicy.deprecation_rules?.find(r =>
      r.deprecated_versions?.includes(versionString)
    );

    return !!deprecationRule;
  }

  /**
   * Get deprecation deadline for version
   */
  getDeprecationDeadline(versionString) {
    if (!this.sealed) {
      throw new Error('VersioningPolicyLoader not loaded');
    }

    const deprecationRule = this.deprecationPolicy.deprecation_rules?.find(r =>
      r.deprecated_versions?.includes(versionString)
    );

    return deprecationRule?.removal_date || null;
  }

  /**
   * Get versioning rule by id
   */
  getVersioningRule(ruleId) {
    if (!this.sealed) {
      throw new Error('VersioningPolicyLoader not loaded');
    }

    return this.versioningPolicy.versioning_rules?.find(r => r.id === ruleId);
  }

  /**
   * Get all versioning rules
   */
  getAllVersioningRules() {
    if (!this.sealed) {
      throw new Error('VersioningPolicyLoader not loaded');
    }

    return this.versioningPolicy.versioning_rules || [];
  }

  /**
   * Get constitution metadata
   */
  getMetadata() {
    if (!this.sealed) {
      throw new Error('VersioningPolicyLoader not loaded');
    }
    return {
      sealed: true,
      immutable: true,
      read_only: true,
      versioning_policy_loaded: !!this.versioningPolicy,
      compatibility_rules_loaded: !!this.compatibilityRules,
      deprecation_policy_loaded: !!this.deprecationPolicy,
      versioning_rule_count: this.versioningPolicy?.versioning_rules?.length || 0,
      compatibility_rule_count: Object.keys(this.compatibilityRules?.compatibility_matrix || {}).length,
      deprecation_rule_count: this.deprecationPolicy?.deprecation_rules?.length || 0,
      loaded_at: new Date().toISOString()
    };
  }
}

module.exports = VersioningPolicyLoader;
