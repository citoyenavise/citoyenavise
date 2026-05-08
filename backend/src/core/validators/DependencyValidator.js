/**
 * DependencyValidator.js - Validate dependency rules
 * PHASE 1.3: Validation Layer
 *
 * Responsibility: Validate dependency constraints and hierarchy
 * - Check all dependencies are declared
 * - Verify no cycles exist
 * - Enforce hierarchy levels
 * - Validate dependency matrix
 */

class DependencyValidator {
  constructor(constitutionManager) {
    this.constitutionManager = constitutionManager;
  }

  /**
   * Run dependency validation
   */
  async validate() {
    const violations = [];
    const depRules = this.constitutionManager.getDependencyRulesLoader();
    const manifest = this.constitutionManager.getModuleManifestLoader();

    try {
      // Check all dependencies are declared
      const undeclaredResult = this._checkUndeclaredDependencies(manifest, depRules);
      if (!undeclaredResult.valid) {
        violations.push(...undeclaredResult.violations);
      }

      // Check no cycles
      const cycleResult = this._checkNoCycles(manifest);
      if (!cycleResult.valid) {
        violations.push(...cycleResult.violations);
      }

      // Check hierarchy levels
      const hierarchyResult = this._checkHierarchyLevels(manifest, depRules);
      if (!hierarchyResult.valid) {
        violations.push(...hierarchyResult.violations);
      }

      // Check dependency matrix consistency
      const matrixResult = this._checkDependencyMatrix(manifest, depRules);
      if (!matrixResult.valid) {
        violations.push(...matrixResult.violations);
      }

      return {
        valid: violations.length === 0,
        validatorName: 'DependencyValidator',
        rulesChecked: depRules.getRuleCount(),
        violations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        valid: false,
        validatorName: 'DependencyValidator',
        violations: [{
          rule: 'UNEXPECTED',
          severity: 'CRITICAL',
          message: `Unexpected error in dependency validation: ${error.message}`
        }],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check all dependencies are declared
   */
  _checkUndeclaredDependencies(manifest, depRules) {
    const violations = [];
    const modules = manifest.getAllModules();

    for (const module of modules) {
      for (const dep of module.dependencies || []) {
        // Check if dependency is declared
        if (!manifest.moduleExists(dep)) {
          violations.push({
            rule: 'dependencies_declared',
            severity: 'CRITICAL',
            message: `Module ${module.name} depends on undeclared module ${dep}`,
            module: module.name,
            undeclaredDependency: dep
          });
        }

        // Check if dependency is allowed
        const allowed = depRules.isDependencyAllowed(module.name, dep);
        if (!allowed.allowed) {
          violations.push({
            rule: 'dependency_allowed',
            severity: 'CRITICAL',
            message: `Module ${module.name} is not allowed to depend on ${dep}: ${allowed.reason}`,
            module: module.name,
            disallowedDependency: dep
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
   * Check for dependency cycles
   */
  _checkNoCycles(manifest) {
    const violations = [];
    const modules = manifest.getAllModules();
    const visited = new Set();
    const recursionStack = new Set();

    /**
     * DFS to detect cycles
     */
    const hasCycle = (moduleName, path = []) => {
      if (recursionStack.has(moduleName)) {
        return { hasCycle: true, cycle: [...path, moduleName] };
      }

      if (visited.has(moduleName)) {
        return { hasCycle: false };
      }

      visited.add(moduleName);
      recursionStack.add(moduleName);

      const module = manifest.getModule(moduleName);
      if (module && module.dependencies) {
        for (const dep of module.dependencies) {
          const result = hasCycle(dep, [...path, moduleName]);
          if (result.hasCycle) {
            return result;
          }
        }
      }

      recursionStack.delete(moduleName);
      return { hasCycle: false };
    };

    // Check each module for cycles
    for (const module of modules) {
      visited.clear();
      recursionStack.clear();

      const result = hasCycle(module.name);
      if (result.hasCycle) {
        violations.push({
          rule: 'no_cycles',
          severity: 'CRITICAL',
          message: `Dependency cycle detected: ${result.cycle.join(' -> ')}`,
          cycle: result.cycle
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Check hierarchy levels are respected
   */
  _checkHierarchyLevels(manifest, depRules) {
    const violations = [];
    const modules = manifest.getAllModules();

    for (const module of modules) {
      for (const dep of module.dependencies || []) {
        const depModule = manifest.getModule(dep);
        if (!depModule) continue;

        // Lower level modules cannot depend on higher level modules
        if (module.hierarchy_level < depModule.hierarchy_level) {
          violations.push({
            rule: 'hierarchy_respect',
            severity: 'HIGH',
            message: `Module ${module.name} (level ${module.hierarchy_level}) depends on ${dep} (level ${depModule.hierarchy_level}) - violates hierarchy`,
            module: module.name,
            moduleLevel: module.hierarchy_level,
            dependency: dep,
            dependencyLevel: depModule.hierarchy_level
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
   * Check dependency matrix consistency
   */
  _checkDependencyMatrix(manifest, depRules) {
    const violations = [];
    const modules = manifest.getAllModules();

    for (const module of modules) {
      const canDependOn = depRules.getCanDependOn(module.name);
      const canBeDepBy = depRules.getCanBeDependedOnBy(module.name);

      // Check that actual dependencies are in allowed set
      for (const actualDep of module.dependencies || []) {
        if (canDependOn && !canDependOn.includes(actualDep)) {
          violations.push({
            rule: 'dependency_matrix_consistency',
            severity: 'HIGH',
            message: `Module ${module.name} has dependency ${actualDep} not in allowed list`,
            module: module.name,
            dependency: actualDep,
            allowedDependencies: canDependOn
          });
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }
}

module.exports = DependencyValidator;
