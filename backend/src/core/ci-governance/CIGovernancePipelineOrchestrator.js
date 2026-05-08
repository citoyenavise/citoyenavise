/**
 * CIGovernancePipelineOrchestrator
 * PHASE 1.3 — Architectural CI
 *
 * Main orchestrator for the complete CI governance pipeline.
 * Single point of entry for npm scripts and GitHub Actions.
 * Handles pipeline execution, report generation, and exit codes.
 *
 * Responsibilities:
 * - Execute complete CI pipeline
 * - Generate all 3 report formats
 * - Save reports to disk
 * - Manage execution history
 * - Provide CLI-compatible exit codes
 */

const ConstitutionalPipelineRunner = require('./ConstitutionalPipelineRunner');
const CIReportGenerator = require('./CIReportGenerator');

class CIGovernancePipelineOrchestrator {
  constructor(options = {}) {
    if (!options) throw new Error('options required');

    this.pipelineRunner = new ConstitutionalPipelineRunner(options);
    this.reportGenerator = new CIReportGenerator(options);
    this.executionHistory = [];
    this.metrics = {
      executionsRun: 0,
      executionsPassed: 0,
      executionsFailed: 0,
      lastExecutionTime: null
    };
  }

  /**
   * Execute the complete pipeline and generate reports
   */
  async execute(outputOptions = {}) {
    const startTime = Date.now();

    try {
      // Run pipeline
      const pipelineResult = await this.pipelineRunner.run();

      // Generate reports
      const reports = this.reportGenerator.generateAllFormats(pipelineResult);

      // Save reports if requested
      const savedReports = [];
      if (outputOptions.save !== false) {
        const jsonReport = this.reportGenerator.saveReport(reports[0], 'pipeline-report.json');
        const mdReport = this.reportGenerator.saveReport(reports[1], 'pipeline-report.md');
        const junitReport = this.reportGenerator.saveReport(reports[2], 'pipeline-report.xml');

        savedReports.push(jsonReport);
        savedReports.push(mdReport);
        savedReports.push(junitReport);
      }

      const duration = Date.now() - startTime;

      const result = {
        success: pipelineResult.success,
        exitCode: pipelineResult.success ? 0 : 1,
        reports: reports.map((r) => ({ format: r.format })),
        savedReports,
        duration_ms: duration,
        pipelineResult
      };

      // Track execution
      this.executionHistory.push({
        timestamp: new Date().toISOString(),
        success: result.success,
        exitCode: result.exitCode,
        duration_ms: duration
      });

      this.metrics.executionsRun += 1;
      if (result.success) {
        this.metrics.executionsPassed += 1;
      } else {
        this.metrics.executionsFailed += 1;
      }
      this.metrics.lastExecutionTime = new Date().toISOString();

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      const result = {
        success: false,
        exitCode: 1,
        error: error.message,
        duration_ms: duration
      };

      this.executionHistory.push({
        timestamp: new Date().toISOString(),
        success: false,
        exitCode: 1,
        duration_ms: duration,
        error: error.message
      });

      this.metrics.executionsRun += 1;
      this.metrics.executionsFailed += 1;
      this.metrics.lastExecutionTime = new Date().toISOString();

      return result;
    }
  }

  /**
   * Execute pipeline and exit with appropriate code
   * Used by npm scripts
   */
  async executeAndExit() {
    const result = await this.execute();
    process.exit(result.exitCode);
  }

  /**
   * Format result for console output
   */
  formatSummaryForConsole(result) {
    const badge = result.success ? '✅' : '❌';
    const status = result.success ? 'PASS' : 'FAIL';

    let output = `\n${badge} Constitutional CI Report: ${status}\n`;
    output += `   Exit Code: ${result.exitCode}\n`;
    output += `   Duration: ${result.duration_ms}ms\n`;

    if (result.reports) {
      output += `   Reports Generated: ${result.reports.length}\n`;
    }

    if (result.error) {
      output += `   Error: ${result.error}\n`;
    }

    output += '\n';

    return output;
  }

  /**
   * Get last execution result
   */
  getLastExecution() {
    if (this.executionHistory.length === 0) {
      return null;
    }
    return this.executionHistory[this.executionHistory.length - 1];
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit = 10) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      lastExecution: this.getLastExecution()
    };
  }

  /**
   * Reset state
   */
  reset() {
    this.pipelineRunner.reset();
    this.reportGenerator.reset();
    this.executionHistory = [];
    this.metrics = {
      executionsRun: 0,
      executionsPassed: 0,
      executionsFailed: 0,
      lastExecutionTime: null
    };
    return { reset: true };
  }
}

module.exports = CIGovernancePipelineOrchestrator;
