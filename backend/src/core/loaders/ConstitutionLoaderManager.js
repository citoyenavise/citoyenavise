/**
 * ConstitutionLoaderManager.js - Orchestrate loading entire constitution
 * PHASE 1.2: Runtime Loaders
 *
 * Responsibility: Orchestrate loading all constitutional layers
 * - Manage all 7 loaders
 * - Execute sequential loading
 * - Provide unified constitution access
 * - Verify all declarations loaded
 */

const ModuleManifestLoader = require('./ModuleManifestLoader');
const SchemaRegistryLoader = require('./SchemaRegistryLoader');
const DependencyRulesLoader = require('./DependencyRulesLoader');
const CapabilityRegistryLoader = require('./CapabilityRegistryLoader');
const GovernancePoliciesLoader = require('./GovernancePoliciesLoader');
const IdentityRegistryLoader = require('./IdentityRegistryLoader');
const VersioningPolicyLoader = require('./VersioningPolicyLoader');

class ConstitutionLoaderManager {
  constructor() {
    this.loaders = {
      moduleManifest: new ModuleManifestLoader(),
      schemaRegistry: new SchemaRegistryLoader(),
      dependencyRules: new DependencyRulesLoader(),
      capabilityRegistry: new CapabilityRegistryLoader(),
      governancePolicies: new GovernancePoliciesLoader(),
      identityRegistry: new IdentityRegistryLoader(),
      versioningPolicy: new VersioningPolicyLoader()
    };

    this.constitution = null;
    this.loaded = false;
    this.loadStartTime = null;
    this.loadEndTime = null;
  }

  /**
   * Load entire constitution
   */
  async loadConstitution() {
    this.loadStartTime = Date.now();

    try {
      // Load all loaders in parallel for efficiency
      const results = await Promise.allSettled([
        this.loaders.moduleManifest.load(),
        this.loaders.schemaRegistry.load(),
        this.loaders.dependencyRules.load(),
        this.loaders.capabilityRegistry.load(),
        this.loaders.governancePolicies.load(),
        this.loaders.identityRegistry.load(),
        this.loaders.versioningPolicy.load()
      ]);

      // Check for failures
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        const errors = failures.map(f => f.reason.message).join('; ');
        throw new Error(`Constitution loading failed: ${errors}`);
      }

      // Build unified constitution object
      this._buildConstitution();
      this.loaded = true;
      this.loadEndTime = Date.now();

      return {
        success: true,
        loadDuration_ms: this.loadEndTime - this.loadStartTime,
        modules: this.loaders.moduleManifest.getModuleCount(),
        eventTypes: this.loaders.schemaRegistry.getEventTypeCount(),
        rules: this.loaders.dependencyRules.getRuleCount(),
        policies: this.loaders.governancePolicies.getPolicyCount(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.loaded = false;
      throw error;
    }
  }

  /**
   * Build unified constitution object
   */
  _buildConstitution() {
    this.constitution = {
      modules: this.loaders.moduleManifest.getAllModules(),
      eventTypes: this.loaders.schemaRegistry.getAllEventSchemas(),
      rules: this.loaders.dependencyRules.getAllRules(),
      policies: this.loaders.governancePolicies.getAllPolicies(),
      capabilities: this.loaders.capabilityRegistry.getAllCapabilities(),
      limits: this.loaders.capabilityRegistry.getAllScalabilityLimits(),
      targets: this.loaders.capabilityRegistry.getAllPerformanceTargets(),
      globalIdentity: this.loaders.identityRegistry.getGlobalIdentity(),
      versioningPolicy: this.loaders.versioningPolicy.getVersioningPolicy(),

      metadata: {
        sealed: true,
        immutable: true,
        read_only: true,
        loaded: true,
        loadTime_ms: this.loadEndTime - this.loadStartTime,
        loadedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Get entire constitution
   */
  getConstitution() {
    if (!this.loaded) {
      throw new Error('Constitution not loaded. Call loadConstitution() first.');
    }
    return this.constitution;
  }

  /**
   * Get module manifest loader
   */
  getModuleManifestLoader() {
    return this.loaders.moduleManifest;
  }

  /**
   * Get schema registry loader
   */
  getSchemaRegistryLoader() {
    return this.loaders.schemaRegistry;
  }

  /**
   * Get dependency rules loader
   */
  getDependencyRulesLoader() {
    return this.loaders.dependencyRules;
  }

  /**
   * Get capability registry loader
   */
  getCapabilityRegistryLoader() {
    return this.loaders.capabilityRegistry;
  }

  /**
   * Get governance policies loader
   */
  getGovernancePoliciesLoader() {
    return this.loaders.governancePolicies;
  }

  /**
   * Get identity registry loader
   */
  getIdentityRegistryLoader() {
    return this.loaders.identityRegistry;
  }

  /**
   * Get versioning policy loader
   */
  getVersioningPolicyLoader() {
    return this.loaders.versioningPolicy;
  }

  /**
   * Verify all declarations are consistent
   */
  verifyConstitutionIntegrity() {
    if (!this.loaded) {
      throw new Error('Constitution not loaded');
    }

    const issues = [];

    // Verify all modules exist in manifest
    const moduleManifest = this.loaders.moduleManifest;
    for (const module of moduleManifest.getAllModules()) {
      // Check dependencies exist
      for (const dep of module.dependencies || []) {
        if (!moduleManifest.moduleExists(dep)) {
          issues.push(`Module ${module.name} depends on non-existent module ${dep}`);
        }
      }

      // Check declared events exist in schema registry
      const schemaRegistry = this.loaders.schemaRegistry;
      for (const eventType of module.events_emitted || []) {
        if (!schemaRegistry.eventTypeExists(eventType)) {
          issues.push(`Module ${module.name} emits undeclared event type ${eventType}`);
        }
      }
    }

    // Verify dependency rules consistency
    const depRules = this.loaders.dependencyRules;
    const allModules = moduleManifest.getAllModules().map(m => m.name);
    for (const module of allModules) {
      const allowed = depRules.getCanDependOn(module);
      if (allowed) {
        for (const allowedDep of allowed) {
          if (!moduleManifest.moduleExists(allowedDep)) {
            issues.push(`Dependency rule allows ${module} to depend on non-existent ${allowedDep}`);
          }
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      checkTime: new Date().toISOString()
    };
  }

  /**
   * Get constitution status
   */
  getStatus() {
    return {
      loaded: this.loaded,
      sealed: true,
      immutable: true,
      read_only: true,
      modules: this.loaded ? this.loaders.moduleManifest.getModuleCount() : 0,
      eventTypes: this.loaded ? this.loaders.schemaRegistry.getEventTypeCount() : 0,
      rules: this.loaded ? this.loaders.dependencyRules.getRuleCount() : 0,
      policies: this.loaded ? this.loaders.governancePolicies.getPolicyCount() : 0,
      loadTime_ms: this.loaded ? this.loadEndTime - this.loadStartTime : null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get detailed constitution report
   */
  getDetailedReport() {
    if (!this.loaded) {
      throw new Error('Constitution not loaded');
    }

    return {
      constitution: {
        status: 'LOADED',
        sealed: true,
        immutable: true,
        read_only: true
      },
      modules: {
        count: this.loaders.moduleManifest.getModuleCount(),
        byLevel: {
          infrastructure: this.loaders.moduleManifest.getModulesByLevel(0).length,
          standalone: this.loaders.moduleManifest.getModulesByLevel(1).length,
          domain: this.loaders.moduleManifest.getModulesByLevel(2).length,
          derived: this.loaders.moduleManifest.getModulesByLevel(3).length,
          complex: this.loaders.moduleManifest.getModulesByLevel(4).length
        }
      },
      events: {
        count: this.loaders.schemaRegistry.getEventTypeCount()
      },
      governance: {
        rules: this.loaders.dependencyRules.getRuleCount(),
        policies: this.loaders.governancePolicies.getPolicyCount(),
        mandatoryPolicies: this.loaders.governancePolicies.getMandatoryPolicies().length
      },
      capabilities: {
        count: this.loaders.capabilityRegistry.getCapabilityCount(),
        limits: Object.keys(this.loaders.capabilityRegistry.getAllScalabilityLimits()).length,
        targets: Object.keys(this.loaders.capabilityRegistry.getAllPerformanceTargets()).length
      },
      identity: {
        identities: this.loaders.identityRegistry.getMetadata().identity_count
      },
      versioning: {
        rules: this.loaders.versioningPolicy.getMetadata().versioning_rule_count,
        compatibilityRules: this.loaders.versioningPolicy.getMetadata().compatibility_rule_count,
        deprecationRules: this.loaders.versioningPolicy.getMetadata().deprecation_rule_count
      },
      metadata: {
        loadedAt: new Date(this.loadEndTime).toISOString(),
        loadDuration_ms: this.loadEndTime - this.loadStartTime,
        integrity: this.verifyConstitutionIntegrity()
      }
    };
  }
}

module.exports = ConstitutionLoaderManager;
