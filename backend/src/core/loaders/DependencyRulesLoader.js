/**
 * DependencyRulesLoader.js - Load and validate DependencyRules.json
 * PHASE 1.2: Runtime Loaders
 *
 * Responsibility: Load dependency rules and constraints from constitution
 * - Parse DependencyRules.json
 * - Build dependency matrix
 * - Provide dependency constraint validation
 */

const fs = require('fs');
const path = require('path');

class DependencyRulesLoader {
  constructor() {
    this.rulesPath = path.join(__dirname, '../../..', 'ROOT_CONSTITUTION/dependency-rules/DependencyRules.json');
    this.rules = null;
    this.ruleIndex = new Map();
    this.dependencyMatrix = new Map();
    this.sealed = false;
  }

  /**
   * Load and parse DependencyRules.json
   */
  async load() {
    if (this.sealed) {
      throw new Error('DependencyRulesLoader already sealed. Cannot load again.');
    }

    try {
      const content = fs.readFileSync(this.rulesPath, 'utf8');
      const ruleSet = JSON.parse(content);

      if (!ruleSet.sealed || !ruleSet.immutable || !ruleSet.read_only) {
        throw new Error('DependencyRules.json is not properly sealed');
      }

      this.rules = ruleSet.rules || [];
      this._buildIndex();
      this._buildMatrix();
      this.sealed = true;

      return {
        success: true,
        ruleCount: this.rules.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to load DependencyRules: ${error.message}`);
    }
  }

  /**
   * Build searchable index of rules
   */
  _buildIndex() {
    for (const rule of this.rules) {
      this.ruleIndex.set(rule.id, {
        id: rule.id,
        description: rule.description,
        type: rule.type,
        severity: rule.severity,
        enforcement: rule.enforcement
      });
    }
  }

  /**
   * Build dependency matrix from rules
   */
  _buildMatrix() {
    const dependencyMatrixRules = this.rules.find(r => r.id === 'dependency_matrix');
    if (dependencyMatrixRules && dependencyMatrixRules.matrix) {
      for (const [module, constraints] of Object.entries(dependencyMatrixRules.matrix)) {
        this.dependencyMatrix.set(module, {
          can_depend_on: constraints.can_depend_on || [],
          can_be_depended_on_by: constraints.can_be_depended_on_by || [],
          hierarchy_level: constraints.hierarchy_level || 0
        });
      }
    }
  }

  /**
   * Get rule by id
   */
  getRule(ruleId) {
    if (!this.sealed) {
      throw new Error('DependencyRulesLoader not loaded');
    }
    return this.ruleIndex.get(ruleId);
  }

  /**
   * Get all rules
   */
  getAllRules() {
    if (!this.sealed) {
      throw new Error('DependencyRulesLoader not loaded');
    }
    return Array.from(this.ruleIndex.values());
  }

  /**
   * Check if dependency is allowed
   */
  isDependencyAllowed(fromModule, toModule) {
    if (!this.sealed) {
      throw new Error('DependencyRulesLoader not loaded');
    }

    const constraints = this.dependencyMatrix.get(fromModule);
    if (!constraints) {
      return { allowed: false, reason: `Module ${fromModule} not found in dependency matrix` };
    }

    if (!constraints.can_depend_on.includes(toModule)) {
      return {
        allowed: false,
        reason: `${fromModule} cannot depend on ${toModule}`
      };
    }

    return { allowed: true };
  }

  /**
   * Get modules that can depend on given module
   */
  getCanDependOn(moduleName) {
    if (!this.sealed) {
      throw new Error('DependencyRulesLoader not loaded');
    }

    const constraints = this.dependencyMatrix.get(moduleName);
    if (!constraints) {
      return [];
    }
    return constraints.can_depend_on;
  }

  /**
   * Get modules that can be depended on by given module
   */
  getCanBeDependedOnBy(moduleName) {
    if (!this.sealed) {
      throw new Error('DependencyRulesLoader not loaded');
    }

    const constraints = this.dependencyMatrix.get(moduleName);
    if (!constraints) {
      return [];
    }
    return constraints.can_be_depended_on_by;
  }

  /**
   * Get rule count
   */
  getRuleCount() {
    if (!this.sealed) {
      throw new Error('DependencyRulesLoader not loaded');
    }
    return this.ruleIndex.size;
  }

  /**
   * Get critical rules only
   */
  getCriticalRules() {
    if (!this.sealed) {
      throw new Error('DependencyRulesLoader not loaded');
    }
    return Array.from(this.ruleIndex.values())
      .filter(r => r.severity === 'CRITICAL');
  }

  /**
   * Get constitution metadata
   */
  getMetadata() {
    if (!this.sealed) {
      throw new Error('DependencyRulesLoader not loaded');
    }
    return {
      sealed: true,
      immutable: true,
      read_only: true,
      rule_count: this.ruleIndex.size,
      dependency_matrix_size: this.dependencyMatrix.size,
      loaded_at: new Date().toISOString()
    };
  }
}

module.exports = DependencyRulesLoader;
