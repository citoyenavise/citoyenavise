/**
 * ArchitecturalConformanceAnalyzer
 * PHASE 1.3 — Architectural CI
 *
 * Static structural analysis of source files against declared conventions.
 * Verifies export patterns, naming conventions, required methods, and file size limits.
 * Read-only analysis, never modifies source files.
 *
 * Responsibilities:
 * - Verify single-class-per-file export pattern
 * - Check PascalCase naming matches filename
 * - Verify presence of getStatus() and optionally generateReport() methods
 * - Enforce 450-line maximum file size
 * - Generate conformance reports
 */

const fs = require('fs');
const path = require('path');

class ArchitecturalConformanceAnalyzer {
  constructor(constitutionManager) {
    if (!constitutionManager) throw new Error('constitutionManager required');

    this.constitutionManager = constitutionManager;
    this.conformanceResults = [];
    this.metrics = {
      filesAnalyzed: 0,
      filesConformant: 0,
      violationsFound: 0,
      analysisTime_ms: 0
    };
  }

  /**
   * Analyze a single file for structural conformance
   */
  analyzeFile(filePath) {
    if (!filePath) throw new Error('filePath required');

    const startTime = Date.now();

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const filename = path.basename(filePath);
      const violations = [];

      // Check 1: Export pattern
      const exportCheck = this._checkExportPattern(fileContent);
      if (!exportCheck.valid) {
        violations.push({
          type: 'INVALID_EXPORT_PATTERN',
          severity: 'MEDIUM',
          message: exportCheck.message
        });
      }

      // Check 2: Naming conventions
      const namingCheck = this._checkNamingConventions(filename, fileContent);
      if (!namingCheck.valid) {
        violations.push(...namingCheck.violations);
      }

      // Check 3: Required methods
      const methodsCheck = this._checkRequiredMethods(fileContent, filename);
      if (!methodsCheck.valid) {
        violations.push(...methodsCheck.violations);
      }

      // Check 4: Line count
      const lineCount = fileContent.split('\n').length;
      if (lineCount > 450) {
        violations.push({
          type: 'LINE_COUNT_EXCEEDED',
          severity: 'MEDIUM',
          message: `File has ${lineCount} lines, max 450`
        });
      }

      const result = {
        filePath,
        filename,
        conformant: violations.length === 0,
        violations,
        lineCount,
        analysisTime_ms: Date.now() - startTime
      };

      this.conformanceResults.push(result);
      this.metrics.filesAnalyzed += 1;
      if (result.conformant) this.metrics.filesConformant += 1;
      this.metrics.violationsFound += violations.length;

      return result;
    } catch (error) {
      return {
        filePath,
        conformant: false,
        error: error.message,
        violations: [
          {
            type: 'FILE_READ_ERROR',
            severity: 'HIGH',
            message: error.message
          }
        ]
      };
    }
  }

  /**
   * Recursively analyze all .js files in a directory
   */
  analyzeDirectory(dirPath) {
    if (!dirPath) throw new Error('dirPath required');

    const results = [];

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively analyze subdirectories
          results.push(...this.analyzeDirectory(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          // Skip index.js and *.test.js
          if (entry.name === 'index.js' || entry.name.endsWith('.test.js')) {
            continue;
          }

          const result = this.analyzeFile(fullPath);
          results.push(result);
        }
      }
    } catch (error) {
      return [
        {
          dirPath,
          conformant: false,
          error: error.message
        }
      ];
    }

    return results;
  }

  /**
   * Get comprehensive conformance report
   */
  getConformanceReport() {
    const violations = this.conformanceResults.flatMap((r) => r.violations || []);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        filesAnalyzed: this.metrics.filesAnalyzed,
        filesConformant: this.metrics.filesConformant,
        filesNonConformant: this.metrics.filesAnalyzed - this.metrics.filesConformant,
        violationsTotal: this.metrics.violationsFound,
        conformanceRate: this.metrics.filesAnalyzed > 0
          ? ((this.metrics.filesConformant / this.metrics.filesAnalyzed) * 100).toFixed(2)
          : 'N/A'
      },
      violations,
      results: this.conformanceResults
    };
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      conformanceReport: this.getConformanceReport()
    };
  }

  /**
   * Reset state
   */
  reset() {
    this.conformanceResults = [];
    this.metrics = {
      filesAnalyzed: 0,
      filesConformant: 0,
      violationsFound: 0,
      analysisTime_ms: 0
    };
    return { reset: true };
  }

  /**
   * Private: Check module.exports = ClassName pattern
   */
  _checkExportPattern(fileContent) {
    const exportRegex = /^module\.exports\s*=\s*(\w+)\s*;?$/m;
    const match = fileContent.match(exportRegex);

    if (!match) {
      return {
        valid: false,
        message: 'File does not export exactly one class via module.exports = ClassName'
      };
    }

    // Count number of exports
    const exportMatches = fileContent.match(/module\.exports\s*=/g);
    if (exportMatches && exportMatches.length > 1) {
      return {
        valid: false,
        message: `File has ${exportMatches.length} module.exports statements, expected 1`
      };
    }

    return { valid: true };
  }

  /**
   * Private: Check naming conventions
   */
  _checkNamingConventions(filename, fileContent) {
    const violations = [];

    // Extract class name from filename
    const classNameFromFile = filename.replace('.js', '');

    // Check PascalCase
    if (!/^[A-Z]/.test(classNameFromFile)) {
      violations.push({
        type: 'NAMING_VIOLATION',
        severity: 'LOW',
        message: `Filename "${filename}" should start with uppercase (PascalCase)`
      });
    }

    // Extract class name from export
    const exportRegex = /^module\.exports\s*=\s*(\w+)\s*;?$/m;
    const match = fileContent.match(exportRegex);

    if (match) {
      const classNameFromCode = match[1];

      if (classNameFromFile !== classNameFromCode) {
        violations.push({
          type: 'NAMING_MISMATCH',
          severity: 'MEDIUM',
          message: `Filename "${classNameFromFile}" does not match exported class "${classNameFromCode}"`
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Private: Check required methods
   */
  _checkRequiredMethods(fileContent, filename) {
    const violations = [];

    // getStatus() is required for all classes
    if (!/getStatus\s*\(\s*\)/.test(fileContent)) {
      violations.push({
        type: 'MISSING_METHOD',
        severity: 'MEDIUM',
        message: 'Class must have getStatus() method'
      });
    }

    // generateReport() is required for orchestrator classes (names ending in Orchestrator)
    if (filename.includes('Orchestrator')) {
      if (!/generateReport\s*\(\s*\)/.test(fileContent)) {
        violations.push({
          type: 'MISSING_METHOD',
          severity: 'MEDIUM',
          message: 'Orchestrator class must have generateReport() method'
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }
}

module.exports = ArchitecturalConformanceAnalyzer;
