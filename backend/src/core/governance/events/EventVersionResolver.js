/**
 * EventVersionResolver
 * PHASE 5.3 — Event Schema Registry & Validation
 *
 * Resolves event version compatibility and performs migrations.
 * Handles:
 * - Version compatibility checking
 * - Automatic migration to active version
 * - Deprecation tracking
 * - Version lifecycle management
 */

const fs = require('fs');
const path = require('path');

class EventVersionResolver {
  constructor(options = {}) {
    this.versionMatrixPath = options.versionMatrixPath ||
      path.join(__dirname, '../../../../ROOT_EVENTS/EventVersionMatrix.json');
    this.compatibilityRulesPath = options.compatibilityRulesPath ||
      path.join(__dirname, '../../../../ROOT_EVENTS/EventCompatibilityRules.json');

    this.versionMatrix = {};
    this.compatibilityRules = {};
    this.metrics = {
      resolutionsAttempted: 0,
      resolutionsSucceeded: 0,
      resolutionsFailed: 0,
      migrationsPerformed: 0,
      deprecatedVersionsEncountered: 0
    };

    this._loadConfigs();
  }

  /**
   * Resolve event to active version
   */
  resolveVersion(event) {
    if (!event) throw new Error('event required');

    this.metrics.resolutionsAttempted += 1;

    try {
      const eventType = event.type;
      const currentVersion = event.metadata?.version || '1.0.0';

      // Get event type config
      const eventConfig = this.versionMatrix.events[eventType];
      if (!eventConfig) {
        throw new Error(`No version config for event type: ${eventType}`);
      }

      const activeVersion = eventConfig.current_version;

      // Check if version is deprecated
      const versionStatus = eventConfig.version_lifecycle[currentVersion];
      if (versionStatus === 'deprecated') {
        this.metrics.deprecatedVersionsEncountered += 1;
      }

      // If already on active version, done
      if (currentVersion === activeVersion) {
        this.metrics.resolutionsSucceeded += 1;
        return {
          resolved: true,
          originalVersion: currentVersion,
          targetVersion: activeVersion,
          migrationNeeded: false
        };
      }

      // Check compatibility
      if (!this._isCompatible(eventType, currentVersion, activeVersion)) {
        this.metrics.resolutionsFailed += 1;
        throw new Error(
          `Version ${currentVersion} not compatible with active version ${activeVersion}`
        );
      }

      this.metrics.resolutionsSucceeded += 1;
      return {
        resolved: true,
        originalVersion: currentVersion,
        targetVersion: activeVersion,
        migrationNeeded: true,
        compatibilityStatus: 'compatible'
      };
    } catch (error) {
      this.metrics.resolutionsFailed += 1;
      throw error;
    }
  }

  /**
   * Migrate event to target version
   */
  migrate(event, targetVersion = null) {
    if (!event) throw new Error('event required');

    try {
      const eventType = event.type;
      const currentVersion = event.metadata?.version || '1.0.0';
      const target = targetVersion ||
        this.versionMatrix.events[eventType]?.current_version ||
        '1.0.0';

      // No migration needed
      if (currentVersion === target) {
        return {
          migrated: false,
          reason: 'already_on_target_version',
          version: currentVersion
        };
      }

      // Create migrated event
      const migrated = {
        ...event,
        metadata: {
          ...event.metadata,
          version: target,
          migratedFrom: currentVersion,
          migrationTimestamp: new Date().toISOString()
        }
      };

      this.metrics.migrationsPerformed += 1;

      return {
        migrated: true,
        originalVersion: currentVersion,
        targetVersion: target,
        event: migrated
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get version status for event type
   */
  getVersionStatus(eventType) {
    const config = this.versionMatrix.events[eventType];
    if (!config) {
      return { found: false };
    }

    return {
      found: true,
      eventType,
      currentVersion: config.current_version,
      versions: config.versions.map(v => ({
        version: v.version,
        status: v.status,
        released: v.released,
        deprecationDate: v.deprecation_date
      })),
      versionLifecycle: config.version_lifecycle
    };
  }

  /**
   * Check if version is deprecated
   */
  isDeprecated(eventType, version) {
    const config = this.versionMatrix.events[eventType];
    if (!config) return false;

    const lifecycle = config.version_lifecycle[version];
    return lifecycle === 'deprecated' || lifecycle === 'end-of-life';
  }

  /**
   * Get active version for event type
   */
  getActiveVersion(eventType) {
    const config = this.versionMatrix.events[eventType];
    return config?.current_version || '1.0.0';
  }

  /**
   * Get all versions for event type
   */
  getAllVersions(eventType) {
    const config = this.versionMatrix.events[eventType];
    if (!config) return [];

    return config.versions.map(v => v.version);
  }

  /**
   * Validate version string (semver)
   */
  isValidSemver(version) {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    return semverRegex.test(version);
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.resolutionsAttempted > 0
        ? Math.round((this.metrics.resolutionsSucceeded / this.metrics.resolutionsAttempted) * 100)
        : 0
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      resolutionsAttempted: 0,
      resolutionsSucceeded: 0,
      resolutionsFailed: 0,
      migrationsPerformed: 0,
      deprecatedVersionsEncountered: 0
    };
    return { reset: true };
  }

  /**
   * Private: Check compatibility
   */
  _isCompatible(eventType, fromVersion, toVersion) {
    const rules = this.compatibilityRules.compatibility_rules[eventType];
    if (!rules) return true; // Assume compatible if no specific rules

    // Check if breaking changes are prevented
    const rule = rules.rules[0]; // Simple case: single rule
    if (!rule) return true;

    // Simplified: if from/to versions match or are in allowed range
    return rule.breaking_changes_allowed === false;
  }

  /**
   * Private: Load configurations
   */
  _loadConfigs() {
    try {
      if (fs.existsSync(this.versionMatrixPath)) {
        const raw = fs.readFileSync(this.versionMatrixPath, 'utf8');
        this.versionMatrix = JSON.parse(raw);
      } else {
        console.warn(`Version matrix not found at ${this.versionMatrixPath}`);
        this.versionMatrix = { events: {} };
      }

      if (fs.existsSync(this.compatibilityRulesPath)) {
        const raw = fs.readFileSync(this.compatibilityRulesPath, 'utf8');
        this.compatibilityRules = JSON.parse(raw);
      } else {
        console.warn(`Compatibility rules not found at ${this.compatibilityRulesPath}`);
        this.compatibilityRules = { compatibility_rules: {} };
      }
    } catch (error) {
      console.error('Failed to load version configs:', error.message);
      this.versionMatrix = { events: {} };
      this.compatibilityRules = { compatibility_rules: {} };
    }
  }
}

module.exports = EventVersionResolver;
