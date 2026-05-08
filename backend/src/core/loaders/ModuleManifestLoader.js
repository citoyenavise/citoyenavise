/**
 * ModuleManifestLoader.js - Load and validate ModuleManifest.json
 * PHASE 1.2: Runtime Loaders
 *
 * Responsibility: Load module declarations from constitution
 * - Parse ModuleManifest.json
 * - Build module index
 * - Validate module structure
 * - Provide module metadata access
 */

const fs = require('fs');
const path = require('path');

class ModuleManifestLoader {
  constructor() {
    this.manifestPath = path.join(__dirname, '../../..', 'ROOT_CONSTITUTION/manifests/ModuleManifest.json');
    this.modules = null;
    this.moduleIndex = new Map();
    this.sealed = false;
  }

  /**
   * Load and parse ModuleManifest.json
   */
  async load() {
    if (this.sealed) {
      throw new Error('ModuleManifestLoader already sealed. Cannot load again.');
    }

    try {
      const content = fs.readFileSync(this.manifestPath, 'utf8');
      const manifest = JSON.parse(content);

      if (!manifest.sealed || !manifest.immutable || !manifest.read_only) {
        throw new Error('ModuleManifest.json is not properly sealed');
      }

      this.modules = manifest.modules || [];
      this._buildIndex();
      this.sealed = true;

      return {
        success: true,
        moduleCount: this.modules.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to load ModuleManifest: ${error.message}`);
    }
  }

  /**
   * Build searchable index of modules
   */
  _buildIndex() {
    for (const module of this.modules) {
      this.moduleIndex.set(module.name, {
        name: module.name,
        hierarchy_level: module.hierarchy_level,
        version: module.version,
        dependencies: module.dependencies || [],
        exposed_services: module.exposed_services || [],
        required_services: module.required_services || [],
        events_emitted: module.events_emitted || [],
        events_listened: module.events_listened || [],
        idempotent: module.idempotent || false
      });
    }
  }

  /**
   * Get module by name
   */
  getModule(name) {
    if (!this.sealed) {
      throw new Error('ModuleManifestLoader not loaded');
    }
    return this.moduleIndex.get(name);
  }

  /**
   * Get all modules
   */
  getAllModules() {
    if (!this.sealed) {
      throw new Error('ModuleManifestLoader not loaded');
    }
    return Array.from(this.moduleIndex.values());
  }

  /**
   * Get modules by hierarchy level
   */
  getModulesByLevel(level) {
    if (!this.sealed) {
      throw new Error('ModuleManifestLoader not loaded');
    }
    return Array.from(this.moduleIndex.values())
      .filter(m => m.hierarchy_level === level);
  }

  /**
   * Validate module exists
   */
  moduleExists(name) {
    if (!this.sealed) {
      throw new Error('ModuleManifestLoader not loaded');
    }
    return this.moduleIndex.has(name);
  }

  /**
   * Get module count
   */
  getModuleCount() {
    if (!this.sealed) {
      throw new Error('ModuleManifestLoader not loaded');
    }
    return this.moduleIndex.size;
  }

  /**
   * Get constitution metadata
   */
  getMetadata() {
    if (!this.sealed) {
      throw new Error('ModuleManifestLoader not loaded');
    }
    return {
      sealed: true,
      immutable: true,
      read_only: true,
      module_count: this.moduleIndex.size,
      loaded_at: new Date().toISOString()
    };
  }
}

module.exports = ModuleManifestLoader;
