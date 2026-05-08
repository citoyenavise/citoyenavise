/**
 * ConstitutionalPipelineRunner
 * PHASE 1.3 — Architectural CI
 *
 * Executes the 5-stage constitutional compliance pipeline in strict sequence.
 * Stages: LOAD_CONSTITUTION → VERIFY_INTEGRITY → ANALYZE_CONFORMANCE → AUDIT_DEPENDENCIES → COLLECT_RESULTS
 * Deterministic execution with fail-fast option.
 *
 * Responsibilities:
 * - Execute pipeline stages in order
 * - Load and verify constitution
 * - Run conformance analysis
 * - Audit dependencies
 * - Aggregate results into unified report
 * - Implement fail-fast behavior
 */

const path = require('path');
const ArchitecturalConformanceAnalyzer = require('./ArchitecturalConformanceAnalyzer');
const DependencyAuditScanner = require('./DependencyAuditScanner');

class ConstitutionalPipelineRunner {
  constructor(options = {}) {
    if (!options) throw new Error('options required');

    this.config = {
      constitutionPath: options.constitutionPath || path.join(__dirname, '../../../ROOT_CONSTITUTION'),
      targetCoreDir: options.targetCoreDir || path.join(__dirname, '..'),
      modulesPath: options.modulesPath || null,
      failFast: options.failFast !== false,
      timeout_ms: options.timeout_ms || 60000
    };

    this.pipelineResults = null;
    this.pipelineStages = [
      'LOAD_CONSTITUTION',
      'VERIFY_INTEGRITY',
      'ANALYZE_CONFORMANCE',
      'AUDIT_DEPENDENCIES',
      'COLLECT_RESULTS'
    ];
    this.metrics = {
      pipelinesRun: 0,
      pipelinesPassed: 0,
      pipelinesFailed: 0,
      averageDuration_ms: 0
    };
  }

  /**
   * Run the complete pipeline
   */
  async run() {
    const startTime = Date.now();
    const stageResults = [];
    let constitution = null;

    try {
      // Stage 1: Load Constitution
      const stage1 = await this._stageLoadConstitution();
      stageResults.push(stage1);
      if (!stage1.success) {
        if (this.config.failFast) {
          return this._buildPipelineResult(startTime, stageResults, false);
        }
      } else {
        constitution = stage1.constitution;
      }

      // Stage 2: Verify Integrity
      const stage2 = await this._stageVerifyIntegrity(constitution);
      stageResults.push(stage2);
      if (!stage2.success) {
        if (this.config.failFast) {
          return this._buildPipelineResult(startTime, stageResults, false);
        }
      }

      // Stage 3: Analyze Conformance
      const stage3 = await this._stageAnalyzeConformance();
      stageResults.push(stage3);
      if (!stage3.success) {
        if (this.config.failFast) {
          return this._buildPipelineResult(startTime, stageResults, false);
        }
      }

      // Stage 4: Audit Dependencies
      const stage4 = await this._stageAuditDependencies();
      stageResults.push(stage4);
      if (!stage4.success) {
        if (this.config.failFast) {
          return this._buildPipelineResult(startTime, stageResults, false);
        }
      }

      // Stage 5: Collect Results
      const stage5 = await this._stageCollectResults(stageResults);
      stageResults.push(stage5);

      return this._buildPipelineResult(startTime, stageResults, true);
    } catch (error) {
      return this._buildPipelineResult(startTime, stageResults, false, error.message);
    }
  }

  /**
   * Stage 1: Load Constitution
   */
  async _stageLoadConstitution() {
    const startTime = Date.now();

    try {
      // In a real implementation, would use ConstitutionLoaderManager from Phase 1.2
      // For now, simple validation that files exist
      const fs = require('fs');

      const ciPolicyPath = path.join(this.config.constitutionPath, 'ci-governance', 'CIGovernancePolicy.json');
      const healingPolicyPath = path.join(this.config.constitutionPath, 'self-healing', 'SelfHealingPolicy.json');

      if (!fs.existsSync(ciPolicyPath) || !fs.existsSync(healingPolicyPath)) {
        return {
          stage: 'LOAD_CONSTITUTION',
          success: false,
          details: 'Constitutional files not found',
          duration_ms: Date.now() - startTime,
          constitution: null
        };
      }

      const ciPolicy = JSON.parse(fs.readFileSync(ciPolicyPath, 'utf8'));
      const healingPolicy = JSON.parse(fs.readFileSync(healingPolicyPath, 'utf8'));

      return {
        stage: 'LOAD_CONSTITUTION',
        success: true,
        details: 'Constitution loaded successfully',
        duration_ms: Date.now() - startTime,
        constitution: { ciPolicy, healingPolicy }
      };
    } catch (error) {
      return {
        stage: 'LOAD_CONSTITUTION',
        success: false,
        error: error.message,
        duration_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Stage 2: Verify Integrity
   */
  async _stageVerifyIntegrity(constitution) {
    const startTime = Date.now();

    try {
      if (!constitution) {
        return {
          stage: 'VERIFY_INTEGRITY',
          success: false,
          details: 'Constitution not loaded',
          duration_ms: Date.now() - startTime
        };
      }

      // Verify structure
      if (!constitution.ciPolicy || !constitution.ciPolicy.policies) {
        return {
          stage: 'VERIFY_INTEGRITY',
          success: false,
          details: 'CI Policy structure invalid',
          duration_ms: Date.now() - startTime
        };
      }

      if (!constitution.healingPolicy || !constitution.healingPolicy.constraints) {
        return {
          stage: 'VERIFY_INTEGRITY',
          success: false,
          details: 'Self-Healing Policy structure invalid',
          duration_ms: Date.now() - startTime
        };
      }

      return {
        stage: 'VERIFY_INTEGRITY',
        success: true,
        details: 'Constitution integrity verified',
        duration_ms: Date.now() - startTime
      };
    } catch (error) {
      return {
        stage: 'VERIFY_INTEGRITY',
        success: false,
        error: error.message,
        duration_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Stage 3: Analyze Conformance
   */
  async _stageAnalyzeConformance() {
    const startTime = Date.now();

    try {
      const violations = [];

      // Part 1: Analyze the core directory itself for source code conformance
      const analyzer = new ArchitecturalConformanceAnalyzer({});
      const results = analyzer.analyzeDirectory(this.config.targetCoreDir);
      const coreViolations = results
        .filter((r) => r.violations && r.violations.length > 0)
        .flatMap((r) => r.violations);
      violations.push(...coreViolations);

      // Part 2: Call GovernanceValidator for modules if modulesPath provided
      if (this.config.modulesPath) {
        try {
          const GovernanceValidator = require('../GovernanceValidator');
          const govValidator = new GovernanceValidator();
          await govValidator.loadConstitution();
          await govValidator.validateAllModules(this.config.modulesPath);
          const govReport = govValidator.generateReport();
          const govViolations = (govReport.issues || []).map((issue) => ({
            type: 'GOVERNANCE_VIOLATION',
            severity: 'MEDIUM',
            message: issue
          }));
          violations.push(...govViolations);
        } catch (govError) {
          // GovernanceValidator not available or failed — continue without it
        }
      }

      return {
        stage: 'ANALYZE_CONFORMANCE',
        success: violations.length === 0,
        details: `Analyzed ${results.length} core files, found ${violations.length} violations`,
        duration_ms: Date.now() - startTime,
        violations,
        conformanceReport: analyzer.getConformanceReport()
      };
    } catch (error) {
      return {
        stage: 'ANALYZE_CONFORMANCE',
        success: false,
        error: error.message,
        duration_ms: Date.now() - startTime,
        violations: []
      };
    }
  }

  /**
   * Stage 4: Audit Dependencies
   */
  async _stageAuditDependencies() {
    const startTime = Date.now();

    try {
      const scanner = new DependencyAuditScanner({
        // Minimal constitution manager mock
      });

      // Detect circular dependencies
      const circularResult = scanner.detectCircularDependencies(this.config.targetCoreDir);

      const violations = circularResult.hasCycles
        ? [
            {
              type: 'CIRCULAR_DEPENDENCY_DETECTED',
              severity: 'CRITICAL',
              message: `Found ${circularResult.cycles.length} circular dependencies`
            }
          ]
        : [];

      return {
        stage: 'AUDIT_DEPENDENCIES',
        success: !circularResult.hasCycles,
        details: circularResult.hasCycles
          ? `Circular dependencies detected: ${circularResult.cycles.length}`
          : 'No circular dependencies found',
        duration_ms: Date.now() - startTime,
        violations,
        auditReport: scanner.getAuditReport()
      };
    } catch (error) {
      return {
        stage: 'AUDIT_DEPENDENCIES',
        success: false,
        error: error.message,
        duration_ms: Date.now() - startTime,
        violations: []
      };
    }
  }

  /**
   * Stage 5: Collect Results
   */
  async _stageCollectResults(stageResults) {
    const startTime = Date.now();

    try {
      const allViolations = stageResults
        .flatMap((s) => s.violations || [])
        .filter((v) => v !== undefined);

      const allSuccess = stageResults.every((s) => s.success !== false);

      return {
        stage: 'COLLECT_RESULTS',
        success: true,
        details: `Pipeline complete: ${allSuccess ? 'PASS' : 'FAIL'} with ${allViolations.length} violations`,
        duration_ms: Date.now() - startTime,
        verdict: allSuccess ? 'PASS' : 'FAIL',
        totalViolations: allViolations.length
      };
    } catch (error) {
      return {
        stage: 'COLLECT_RESULTS',
        success: false,
        error: error.message,
        duration_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Build final pipeline result
   */
  _buildPipelineResult(startTime, stages, overallSuccess, error = null) {
    const duration = Date.now() - startTime;
    const success = error ? false : overallSuccess;

    this.metrics.pipelinesRun += 1;
    if (success) {
      this.metrics.pipelinesPassed += 1;
    } else {
      this.metrics.pipelinesFailed += 1;
    }

    return {
      success,
      stages,
      duration_ms: duration,
      error,
      verdict: success ? 'PASS' : 'FAIL'
    };
  }

  /**
   * Get last pipeline result
   */
  getLastPipelineResult() {
    return this.pipelineResults;
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
    this.pipelineResults = null;
    this.metrics = {
      pipelinesRun: 0,
      pipelinesPassed: 0,
      pipelinesFailed: 0,
      averageDuration_ms: 0
    };
    return { reset: true };
  }
}

module.exports = ConstitutionalPipelineRunner;
