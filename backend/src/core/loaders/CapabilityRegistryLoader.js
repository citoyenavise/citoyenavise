/**
 * CapabilityRegistryLoader.js - Load and validate CapabilitiesRegistry.json
 * PHASE 1.2: Runtime Loaders
 *
 * Responsibility: Load system capabilities and constraints from constitution
 * - Parse CapabilitiesRegistry.json
 * - Build capability index
 * - Provide capability and limit access
 */

const fs = require('fs');
const path = require('path');

class CapabilityRegistryLoader {
  constructor() {
    this.registryPath = path.join(__dirname, '../../..', 'ROOT_CONSTITUTION/capabilities/CapabilitiesRegistry.json');
    this.registry = null;
    this.capabilities = new Map();
    this.limits = null;
    this.targets = null;
    this.sealed = false;
  }

  /**
   * Load and parse CapabilitiesRegistry.json
   */
  async load() {
    if (this.sealed) {
      throw new Error('CapabilityRegistryLoader already sealed. Cannot load again.');
    }

    try {
      const content = fs.readFileSync(this.registryPath, 'utf8');
      const registry = JSON.parse(content);

      if (!registry.sealed || !registry.immutable || !registry.read_only) {
        throw new Error('CapabilitiesRegistry.json is not properly sealed');
      }

      this.registry = registry;
      this._buildIndex();
      this.limits = registry.scalability_limits || {};
      this.targets = registry.performance_targets || {};
      this.sealed = true;

      return {
        success: true,
        capabilityCount: this.capabilities.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to load CapabilityRegistry: ${error.message}`);
    }
  }

  /**
   * Build searchable index of capabilities
   */
  _buildIndex() {
    const capabilities = this.registry.capabilities || {};
    for (const [key, capability] of Object.entries(capabilities)) {
      this.capabilities.set(key, {
        name: key,
        status: capability.status,
        description: capability.description
      });
    }
  }

  /**
   * Get capability by name
   */
  getCapability(name) {
    if (!this.sealed) {
      throw new Error('CapabilityRegistryLoader not loaded');
    }
    return this.capabilities.get(name);
  }

  /**
   * Check if capability is enabled
   */
  isCapabilityEnabled(name) {
    if (!this.sealed) {
      throw new Error('CapabilityRegistryLoader not loaded');
    }

    const capability = this.capabilities.get(name);
    return capability && capability.status === 'ENABLED';
  }

  /**
   * Get all capabilities
   */
  getAllCapabilities() {
    if (!this.sealed) {
      throw new Error('CapabilityRegistryLoader not loaded');
    }
    return Array.from(this.capabilities.values());
  }

  /**
   * Get scalability limit
   */
  getScalabilityLimit(limitKey) {
    if (!this.sealed) {
      throw new Error('CapabilityRegistryLoader not loaded');
    }
    return this.limits[limitKey];
  }

  /**
   * Get all scalability limits
   */
  getAllScalabilityLimits() {
    if (!this.sealed) {
      throw new Error('CapabilityRegistryLoader not loaded');
    }
    return { ...this.limits };
  }

  /**
   * Get performance target
   */
  getPerformanceTarget(targetKey) {
    if (!this.sealed) {
      throw new Error('CapabilityRegistryLoader not loaded');
    }
    return this.targets[targetKey];
  }

  /**
   * Get all performance targets
   */
  getAllPerformanceTargets() {
    if (!this.sealed) {
      throw new Error('CapabilityRegistryLoader not loaded');
    }
    return { ...this.targets };
  }

  /**
   * Check if within scalability limit
   */
  withinLimit(limitKey, value) {
    if (!this.sealed) {
      throw new Error('CapabilityRegistryLoader not loaded');
    }

    const limit = this.limits[limitKey];
    if (limit === undefined) {
      return { within: false, reason: `Limit ${limitKey} not found` };
    }

    return { within: value <= limit, limit, current: value };
  }

  /**
   * Get capability count
   */
  getCapabilityCount() {
    if (!this.sealed) {
      throw new Error('CapabilityRegistryLoader not loaded');
    }
    return this.capabilities.size;
  }

  /**
   * Get constitution metadata
   */
  getMetadata() {
    if (!this.sealed) {
      throw new Error('CapabilityRegistryLoader not loaded');
    }
    return {
      sealed: true,
      immutable: true,
      read_only: true,
      capability_count: this.capabilities.size,
      limit_count: Object.keys(this.limits).length,
      target_count: Object.keys(this.targets).length,
      loaded_at: new Date().toISOString()
    };
  }
}

module.exports = CapabilityRegistryLoader;
