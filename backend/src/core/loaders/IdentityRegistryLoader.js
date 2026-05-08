/**
 * IdentityRegistryLoader.js - Load all identity declarations from constitution
 * PHASE 1.2: Runtime Loaders
 *
 * Responsibility: Load identity registries from constitution
 * - Load GlobalIdentity.json
 * - Load RequestIdentity.json
 * - Load EventIdentity.json
 * - Load IdempotencyRegistry.json
 * - Build unified identity index
 */

const fs = require('fs');
const path = require('path');

class IdentityRegistryLoader {
  constructor() {
    this.identityDir = path.join(__dirname, '../../..', 'ROOT_CONSTITUTION/identity');
    this.globalIdentity = null;
    this.requestIdentity = null;
    this.eventIdentity = null;
    this.idempotencyRegistry = null;
    this.identityIndex = new Map();
    this.sealed = false;
  }

  /**
   * Load all identity-related files
   */
  async load() {
    if (this.sealed) {
      throw new Error('IdentityRegistryLoader already sealed. Cannot load again.');
    }

    try {
      await this._loadGlobalIdentity();
      await this._loadRequestIdentity();
      await this._loadEventIdentity();
      await this._loadIdempotencyRegistry();

      this._buildIndex();
      this.sealed = true;

      return {
        success: true,
        filesLoaded: 4,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to load IdentityRegistry: ${error.message}`);
    }
  }

  /**
   * Load GlobalIdentity.json
   */
  async _loadGlobalIdentity() {
    const filePath = path.join(this.identityDir, 'GlobalIdentity.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    if (!data.sealed || !data.immutable || !data.read_only) {
      throw new Error('GlobalIdentity.json is not properly sealed');
    }

    this.globalIdentity = data;
  }

  /**
   * Load RequestIdentity.json
   */
  async _loadRequestIdentity() {
    const filePath = path.join(this.identityDir, 'RequestIdentity.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    if (!data.sealed || !data.immutable || !data.read_only) {
      throw new Error('RequestIdentity.json is not properly sealed');
    }

    this.requestIdentity = data;
  }

  /**
   * Load EventIdentity.json
   */
  async _loadEventIdentity() {
    const filePath = path.join(this.identityDir, 'EventIdentity.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    if (!data.sealed || !data.immutable || !data.read_only) {
      throw new Error('EventIdentity.json is not properly sealed');
    }

    this.eventIdentity = data;
  }

  /**
   * Load IdempotencyRegistry.json
   */
  async _loadIdempotencyRegistry() {
    const filePath = path.join(this.identityDir, 'IdempotencyRegistry.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    if (!data.sealed || !data.immutable || !data.read_only) {
      throw new Error('IdempotencyRegistry.json is not properly sealed');
    }

    this.idempotencyRegistry = data;
  }

  /**
   * Build unified identity index
   */
  _buildIndex() {
    // Index module identities
    if (this.globalIdentity.module_identities) {
      for (const [moduleName, identity] of Object.entries(this.globalIdentity.module_identities)) {
        this.identityIndex.set(`module:${moduleName}`, identity);
      }
    }

    // Index service identities
    if (this.globalIdentity.service_identities) {
      for (const [serviceName, identity] of Object.entries(this.globalIdentity.service_identities)) {
        this.identityIndex.set(`service:${serviceName}`, identity);
      }
    }
  }

  /**
   * Get global identity
   */
  getGlobalIdentity() {
    if (!this.sealed) {
      throw new Error('IdentityRegistryLoader not loaded');
    }
    return this.globalIdentity;
  }

  /**
   * Get request identity scheme
   */
  getRequestIdentityScheme() {
    if (!this.sealed) {
      throw new Error('IdentityRegistryLoader not loaded');
    }
    return this.requestIdentity;
  }

  /**
   * Get event identity scheme
   */
  getEventIdentityScheme() {
    if (!this.sealed) {
      throw new Error('IdentityRegistryLoader not loaded');
    }
    return this.eventIdentity;
  }

  /**
   * Get idempotency registry
   */
  getIdempotencyRegistry() {
    if (!this.sealed) {
      throw new Error('IdentityRegistryLoader not loaded');
    }
    return this.idempotencyRegistry;
  }

  /**
   * Get identity by key
   */
  getIdentity(key) {
    if (!this.sealed) {
      throw new Error('IdentityRegistryLoader not loaded');
    }
    return this.identityIndex.get(key);
  }

  /**
   * Get module identity
   */
  getModuleIdentity(moduleName) {
    if (!this.sealed) {
      throw new Error('IdentityRegistryLoader not loaded');
    }
    return this.globalIdentity.module_identities?.[moduleName];
  }

  /**
   * Get service identity
   */
  getServiceIdentity(serviceName) {
    if (!this.sealed) {
      throw new Error('IdentityRegistryLoader not loaded');
    }
    return this.globalIdentity.service_identities?.[serviceName];
  }

  /**
   * Check if module is idempotent
   */
  isModuleIdempotent(moduleName) {
    if (!this.sealed) {
      throw new Error('IdentityRegistryLoader not loaded');
    }

    const moduleIdempotency = this.idempotencyRegistry.modules?.[moduleName];
    return moduleIdempotency?.idempotent === true;
  }

  /**
   * Get idempotency rules for module
   */
  getModuleIdempotencyRules(moduleName) {
    if (!this.sealed) {
      throw new Error('IdentityRegistryLoader not loaded');
    }

    return this.idempotencyRegistry.modules?.[moduleName];
  }

  /**
   * Get constitution metadata
   */
  getMetadata() {
    if (!this.sealed) {
      throw new Error('IdentityRegistryLoader not loaded');
    }
    return {
      sealed: true,
      immutable: true,
      read_only: true,
      global_identity_loaded: !!this.globalIdentity,
      request_identity_loaded: !!this.requestIdentity,
      event_identity_loaded: !!this.eventIdentity,
      idempotency_registry_loaded: !!this.idempotencyRegistry,
      identity_count: this.identityIndex.size,
      loaded_at: new Date().toISOString()
    };
  }
}

module.exports = IdentityRegistryLoader;
