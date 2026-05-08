/**
 * DependencyAuditScanner
 * PHASE 1.3 — Architectural CI
 *
 * Audits actual require() calls in source files against declared DependencyRules.
 * Detects undeclared dependencies, forbidden dependencies, and circular dependencies.
 * Read-only analysis, never modifies files.
 *
 * Responsibilities:
 * - Extract local require() calls from files
 * - Compare against DependencyRules matrix
 * - Detect circular dependencies via DFS
 * - Generate audit reports
 * - Validate module structure conformance
 */

const fs = require('fs');
const path = require('path');

class DependencyAuditScanner {
  constructor(constitutionManager) {
    if (!constitutionManager) throw new Error('constitutionManager required');

    this.constitutionManager = constitutionManager;
    this.auditResults = new Map();
    this.circularDependencies = [];
    this.metrics = {
      modulesScanned: 0,
      undeclaredDependencies: 0,
      forbiddenDependencies: 0,
      circularDependenciesFound: 0
    };

    // Load DependencyRules from constitution
    const rulesPath = path.join(__dirname, '../../../ROOT_CONSTITUTION/dependency-rules/DependencyRules.json');
    try {
      const raw = fs.readFileSync(rulesPath, 'utf8');
      this.dependencyRules = JSON.parse(raw);
    } catch (error) {
      this.dependencyRules = null;
    }
  }

  /**
   * Scan a single file for require() calls
   */
  scanFile(filePath) {
    if (!filePath) throw new Error('filePath required');

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

      const requires = [];
      let match;

      while ((match = requireRegex.exec(fileContent)) !== null) {
        const moduleName = match[1];
        requires.push(moduleName);
      }

      // Filter to local requires only (start with . or ..)
      const localRequires = requires.filter((m) => m.startsWith('.') || m.startsWith('..'));
      const externalRequires = requires.filter((m) => !m.startsWith('.') && !m.startsWith('..'));

      return {
        filePath,
        localRequires,
        externalRequires
      };
    } catch (error) {
      return {
        filePath,
        error: error.message,
        localRequires: [],
        externalRequires: []
      };
    }
  }

  /**
   * Audit a single module against declared dependency rules
   */
  auditModule(moduleName, moduleDirPath) {
    if (!moduleName || !moduleDirPath) throw new Error('moduleName and moduleDirPath required');

    const files = this._getAllJsFiles(moduleDirPath);
    const allRequires = new Set();

    for (const file of files) {
      const scan = this.scanFile(file);
      for (const req of scan.localRequires) {
        // Normalize require path to module name
        const normalized = this._normalizeRequirePath(req);
        allRequires.add(normalized);
      }
    }

    // Get declared dependencies for this module from constitution
    const declaredDeps = this._getDeclaredDependencies(moduleName);

    // Find undeclared dependencies
    const undeclaredDeps = [];
    for (const req of allRequires) {
      if (!declaredDeps.includes(req)) {
        undeclaredDeps.push(req);
      }
    }

    const result = {
      moduleName,
      declared: declaredDeps,
      actual: Array.from(allRequires),
      undeclared: undeclaredDeps,
      conformant: undeclaredDeps.length === 0
    };

    this.auditResults.set(moduleName, result);
    this.metrics.modulesScanned += 1;
    this.metrics.undeclaredDependencies += undeclaredDeps.length;

    return result;
  }

  /**
   * Detect circular dependencies in a directory tree
   */
  detectCircularDependencies(rootDir) {
    if (!rootDir) throw new Error('rootDir required');

    const visited = new Set();
    const visiting = new Set();
    const cycles = [];

    const dfs = (currentFile, path_stack = []) => {
      if (visited.has(currentFile)) return;
      if (visiting.has(currentFile)) {
        // Found a cycle
        const cycleStart = path_stack.indexOf(currentFile);
        const cycle = path_stack.slice(cycleStart).concat([currentFile]);
        cycles.push(cycle);
        return;
      }

      visiting.add(currentFile);
      path_stack.push(currentFile);

      const scan = this.scanFile(currentFile);
      for (const req of scan.localRequires) {
        const resolvedPath = this._resolveRequirePath(currentFile, req);
        if (resolvedPath && fs.existsSync(resolvedPath)) {
          dfs(resolvedPath, [...path_stack]);
        }
      }

      visiting.delete(currentFile);
    };

    // Start DFS from each JS file
    const files = this._getAllJsFiles(rootDir);
    for (const file of files) {
      if (!visited.has(file)) {
        dfs(file);
      }
    }

    this.circularDependencies = cycles;
    this.metrics.circularDependenciesFound = cycles.length;

    return {
      cycles,
      hasCycles: cycles.length > 0
    };
  }

  /**
   * Audit all modules in core directory
   */
  auditAllModules(coreDir) {
    if (!coreDir) throw new Error('coreDir required');

    this.auditResults.clear();

    try {
      const entries = fs.readdirSync(coreDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const moduleName = entry.name;
          const modulePath = path.join(coreDir, moduleName);
          this.auditModule(moduleName, modulePath);
        }
      }
    } catch (error) {
      throw new Error(`Failed to audit modules: ${error.message}`);
    }

    return {
      timestamp: new Date().toISOString(),
      modulesAudited: this.auditResults.size,
      results: Array.from(this.auditResults.values())
    };
  }

  /**
   * Get audit report
   */
  getAuditReport() {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        modulesScanned: this.metrics.modulesScanned,
        undeclaredDependenciesTotal: this.metrics.undeclaredDependencies,
        circularDependenciesFound: this.metrics.circularDependenciesFound
      },
      modules: Array.from(this.auditResults.values()),
      circularDependencies: this.circularDependencies
    };
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics }
    };
  }

  /**
   * Reset state
   */
  reset() {
    this.auditResults.clear();
    this.circularDependencies = [];
    this.metrics = {
      modulesScanned: 0,
      undeclaredDependencies: 0,
      forbiddenDependencies: 0,
      circularDependenciesFound: 0
    };
    return { reset: true };
  }

  /**
   * Private: Get all .js files in a directory recursively
   */
  _getAllJsFiles(dirPath) {
    const files = [];

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          files.push(...this._getAllJsFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Silently skip unreadable directories
    }

    return files;
  }

  /**
   * Private: Normalize require path to module name
   */
  _normalizeRequirePath(reqPath) {
    // Convert ./module or ../parent/module to module name
    const normalized = reqPath
      .replace(/^\.\//, '')
      .replace(/^\.\.\//, '')
      .split('/')[0];
    return normalized;
  }

  /**
   * Private: Resolve require path to actual file
   */
  _resolveRequirePath(fromFile, reqPath) {
    const baseDir = path.dirname(fromFile);
    const targetPath = path.resolve(baseDir, reqPath);

    // Try .js, then /index.js
    if (fs.existsSync(targetPath + '.js')) return targetPath + '.js';
    if (fs.existsSync(path.join(targetPath, 'index.js'))) {
      return path.join(targetPath, 'index.js');
    }
    return null;
  }

  /**
   * Private: Get declared dependencies for a module from constitution
   */
  _getDeclaredDependencies(moduleName) {
    if (!this.dependencyRules) return [];
    const matrix = this.dependencyRules.dependency_matrix || {};
    const moduleEntry = matrix[moduleName];
    if (!moduleEntry) return [];
    const deps = moduleEntry.can_depend_on || [];
    return Array.isArray(deps) ? deps : [];
  }
}

module.exports = DependencyAuditScanner;
