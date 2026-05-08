/**
 * ModuleGuard
 * PHASE 7.0.3 — Module Loading Guard
 *
 * Wraps module loading validation around ArchitectureEnforcementEngine.
 * Enforces that modules are in the spec and their dependencies are authorized
 * before they are loaded into the runtime.
 */

class ModuleGuard {
  constructor(enforcementEngine) {
    if (!enforcementEngine) throw new Error('enforcementEngine required');
    this.engine = enforcementEngine;
    this.guardedModules = new Map(); // moduleName → { valid, timestamp }
  }

  /**
   * Guard a module before loading
   * Validates: module exists in spec + all dependencies are authorized
   */
  guardModule(moduleName, deps = []) {
    // Check module exists in spec
    const moduleCheck = this.engine.validateModule(moduleName);
    if (!moduleCheck.valid) {
      return { allowed: false, reason: moduleCheck.reason, moduleName };
    }

    // Validate all dependencies
    for (const dep of deps) {
      try {
        this.engine.validateDependency(moduleName, dep);
      } catch (e) {
        return {
          allowed: false,
          reason: e.message,
          moduleName,
          failedDependency: dep
        };
      }
    }

    // Record successful guard
    this.guardedModules.set(moduleName, { valid: true, timestamp: Date.now() });
    return { allowed: true, moduleName };
  }

  /**
   * Get list of modules that have passed guard
   */
  getGuardedModules() {
    return [...this.guardedModules.keys()];
  }

  /**
   * Get guard status for a module
   */
  getGuardStatus(moduleName) {
    return this.guardedModules.get(moduleName) || null;
  }

  /**
   * Reset guard (for testing)
   */
  reset() {
    this.guardedModules.clear();
  }
}

module.exports = ModuleGuard;
