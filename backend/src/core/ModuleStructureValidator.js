/**
 * ModuleStructureValidator.js - Enforce module structure standardization
 * PHASE 2.1: Module Structure Standardization
 *
 * Responsibility: Validate all modules conform to standard structure
 * - Check folder structure
 * - Verify mandatory files
 * - Validate exports
 * - Enforce naming conventions
 * - Block non-conformant modules from loading
 */

const fs = require('fs');
const path = require('path');

class ModuleStructureValidator {
  constructor(constitutionManager) {
    this.constitutionManager = constitutionManager;
    this.standard = null;
    this.validationResults = [];
    this.nonConformantModules = [];
  }

  /**
   * Load standard structure definition
   */
  loadStandard() {
    try {
      const standardPath = path.join(
        __dirname,
        '../ROOT_CONSTITUTION/backend-standards/ModuleStandardStructure.json'
      );
      const standardJson = fs.readFileSync(standardPath, 'utf8');
      this.standard = JSON.parse(standardJson);
      return { loaded: true, version: this.standard.version };
    } catch (error) {
      return { loaded: false, error: error.message };
    }
  }

  /**
   * Validate single module structure
   */
  validateModuleStructure(modulePath, moduleName) {
    const result = {
      moduleName,
      modulePath,
      valid: true,
      checks: [],
      issues: []
    };

    // Check 1: Required folders exist
    const foldersCheck = this._checkRequiredFolders(modulePath);
    result.checks.push(foldersCheck);
    if (!foldersCheck.valid) result.valid = false;

    // Check 2: Required files present
    const filesCheck = this._checkRequiredFiles(modulePath);
    result.checks.push(filesCheck);
    if (!filesCheck.valid) result.valid = false;

    // Check 3: Manifest.json valid
    const manifestCheck = this._checkManifest(modulePath);
    result.checks.push(manifestCheck);
    if (!manifestCheck.valid) result.valid = false;

    // Check 4: index.js exports mandatory functions
    const exportsCheck = this._checkMandatoryExports(modulePath);
    result.checks.push(exportsCheck);
    if (!exportsCheck.valid) result.valid = false;

    // Check 5: Naming conventions
    const namingCheck = this._checkNamingConventions(modulePath);
    result.checks.push(namingCheck);
    if (!namingCheck.valid) result.valid = false;

    // Check 6: No root-level custom files
    const rootCheck = this._checkRootFiles(modulePath);
    result.checks.push(rootCheck);
    if (!rootCheck.valid) result.valid = false;

    result.timestamp = new Date().toISOString();

    if (!result.valid) {
      this.nonConformantModules.push(moduleName);
    }

    this.validationResults.push(result);
    return result;
  }

  /**
   * Check required folders exist
   */
  _checkRequiredFolders(modulePath) {
    const requiredFolders = [
      'manifest', 'contracts', 'events', 'services',
      'controllers', 'validation', 'observability', 'tests'
    ];

    const missing = [];
    for (const folder of requiredFolders) {
      const folderPath = path.join(modulePath, folder);
      if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
        missing.push(folder);
      }
    }

    return {
      check: 'REQUIRED_FOLDERS',
      valid: missing.length === 0,
      required: requiredFolders,
      missing,
      issues: missing.length > 0 ? [`Missing folders: ${missing.join(', ')}`] : []
    };
  }

  /**
   * Check required files present
   */
  _checkRequiredFiles(modulePath) {
    const requiredFiles = [
      'index.js', 'routes.js', 'manifest/manifest.json'
    ];

    const missing = [];
    for (const file of requiredFiles) {
      const filePath = path.join(modulePath, file);
      if (!fs.existsSync(filePath)) {
        missing.push(file);
      }
    }

    return {
      check: 'REQUIRED_FILES',
      valid: missing.length === 0,
      required: requiredFiles,
      missing,
      issues: missing.length > 0 ? [`Missing files: ${missing.join(', ')}`] : []
    };
  }

  /**
   * Check manifest.json is valid
   */
  _checkManifest(modulePath) {
    const manifestPath = path.join(modulePath, 'manifest', 'manifest.json');

    try {
      if (!fs.existsSync(manifestPath)) {
        return {
          check: 'MANIFEST_VALID',
          valid: false,
          issues: ['manifest.json not found']
        };
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

      // Check required fields
      const requiredFields = ['name', 'version', 'dependencies', 'capabilities', 'events'];
      const missing = [];

      for (const field of requiredFields) {
        if (!manifest.hasOwnProperty(field)) {
          missing.push(field);
        }
      }

      return {
        check: 'MANIFEST_VALID',
        valid: missing.length === 0,
        requiredFields,
        missing,
        issues: missing.length > 0 ? [`Missing manifest fields: ${missing.join(', ')}`] : []
      };

    } catch (error) {
      return {
        check: 'MANIFEST_VALID',
        valid: false,
        issues: [`manifest.json parse error: ${error.message}`]
      };
    }
  }

  /**
   * Check index.js exports mandatory functions
   */
  _checkMandatoryExports(modulePath) {
    const indexPath = path.join(modulePath, 'index.js');
    const mandatoryExports = ['init', 'ready', 'shutdown', 'health', 'getRoutes', 'getEvents', 'getContracts'];

    try {
      if (!fs.existsSync(indexPath)) {
        return {
          check: 'MANDATORY_EXPORTS',
          valid: false,
          mandatoryExports,
          missing: mandatoryExports,
          issues: ['index.js not found']
        };
      }

      const content = fs.readFileSync(indexPath, 'utf8');
      const missing = [];

      for (const exportName of mandatoryExports) {
        // Check if exported (module.exports.functionName or const function = ...)
        if (!content.includes(`exports.${exportName}`) && !content.includes(`module.exports.${exportName}`)) {
          missing.push(exportName);
        }
      }

      return {
        check: 'MANDATORY_EXPORTS',
        valid: missing.length === 0,
        mandatoryExports,
        missing,
        issues: missing.length > 0 ? [`Missing exports: ${missing.join(', ')}`] : []
      };

    } catch (error) {
      return {
        check: 'MANDATORY_EXPORTS',
        valid: false,
        mandatoryExports,
        issues: [`Error checking exports: ${error.message}`]
      };
    }
  }

  /**
   * Check naming conventions
   */
  _checkNamingConventions(modulePath) {
    const issues = [];

    // Check service files match pattern: *.service.js
    const servicesPath = path.join(modulePath, 'services');
    if (fs.existsSync(servicesPath)) {
      const files = fs.readdirSync(servicesPath);
      for (const file of files) {
        if (file.endsWith('.js') && !file.includes('.test') && !file.includes('.spec')) {
          if (!file.endsWith('.service.js')) {
            issues.push(`Service file doesn't match pattern: ${file} (expected *.service.js)`);
          }
        }
      }
    }

    // Check controller files match pattern: *.controller.js
    const controllersPath = path.join(modulePath, 'controllers');
    if (fs.existsSync(controllersPath)) {
      const files = fs.readdirSync(controllersPath);
      for (const file of files) {
        if (file.endsWith('.js') && !file.includes('.test') && !file.includes('.spec')) {
          if (!file.endsWith('.controller.js')) {
            issues.push(`Controller file doesn't match pattern: ${file} (expected *.controller.js)`);
          }
        }
      }
    }

    return {
      check: 'NAMING_CONVENTIONS',
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Check root-level files conform to standard
   */
  _checkRootFiles(modulePath) {
    const allowedRootFiles = ['index.js', 'routes.js', 'manifest.json', '.env', '.gitignore'];
    const issues = [];

    const files = fs.readdirSync(modulePath);
    for (const file of files) {
      const filePath = path.join(modulePath, file);
      if (fs.statSync(filePath).isFile() && !file.startsWith('.')) {
        if (!allowedRootFiles.includes(file)) {
          issues.push(`Non-standard root file: ${file}`);
        }
      }
    }

    return {
      check: 'ROOT_FILES',
      valid: issues.length === 0,
      allowedFiles: allowedRootFiles,
      issues
    };
  }

  /**
   * Validate all modules in directory
   */
  validateAllModules(modulesBasePath) {
    const results = {
      total: 0,
      conformant: 0,
      nonConformant: 0,
      modules: [],
      summary: {}
    };

    try {
      const modules = fs.readdirSync(modulesBasePath);

      for (const module of modules) {
        const modulePath = path.join(modulesBasePath, module);
        if (fs.statSync(modulePath).isDirectory()) {
          results.total++;
          const result = this.validateModuleStructure(modulePath, module);
          results.modules.push(result);

          if (result.valid) {
            results.conformant++;
          } else {
            results.nonConformant++;
          }
        }
      }

      results.summary = {
        totalModules: results.total,
        conformantModules: results.conformant,
        nonConformantModules: results.nonConformant,
        conformanceRate: results.total > 0
          ? ((results.conformant / results.total) * 100).toFixed(2) + '%'
          : '0%'
      };

      return results;

    } catch (error) {
      return {
        error: error.message,
        total: 0,
        conformant: 0,
        nonConformant: 0
      };
    }
  }

  /**
   * Get validation results
   */
  getResults() {
    return {
      validationResults: this.validationResults,
      nonConformantModules: this.nonConformantModules,
      totalValidations: this.validationResults.length,
      conformanceRate: this.validationResults.length > 0
        ? ((this.validationResults.filter(r => r.valid).length / this.validationResults.length) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Get detailed report
   */
  getDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      standard: this.standard ? this.standard.version : 'NOT_LOADED',
      results: this.getResults(),
      details: {
        conformant: this.validationResults.filter(r => r.valid),
        nonConformant: this.validationResults.filter(r => !r.valid)
      }
    };

    return report;
  }
}

module.exports = ModuleStructureValidator;
