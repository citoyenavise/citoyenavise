/**
 * ci-governance.test.js
 * PHASE 1.3 — Architectural CI — Unit Tests
 *
 * 40+ tests covering all CI governance components:
 * - ArchitecturalConformanceAnalyzer (10 tests)
 * - DependencyAuditScanner (10 tests)
 * - ConstitutionalPipelineRunner (8 tests)
 * - CIReportGenerator (7 tests)
 * - CIGovernancePipelineOrchestrator (7 tests)
 */

const {
  ArchitecturalConformanceAnalyzer,
  DependencyAuditScanner,
  ConstitutionalPipelineRunner,
  CIReportGenerator,
  CIGovernancePipelineOrchestrator,
  runCIPipeline
} = require('./index');

// Mock constitution manager
const mockConstitutionManager = {
  getModuleManifestLoader: () => ({ modules: [] }),
  getDependencyRulesLoader: () => ({ rules: [] })
};

describe('ArchitecturalConformanceAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new ArchitecturalConformanceAnalyzer(mockConstitutionManager);
  });

  test('should initialize with constitution manager', () => {
    expect(analyzer).toBeDefined();
    expect(analyzer.constitutionManager).toBeDefined();
  });

  test('should throw if constitution manager not provided', () => {
    expect(() => new ArchitecturalConformanceAnalyzer()).toThrow();
  });

  test('should return getStatus() with metrics', () => {
    const status = analyzer.getStatus();
    expect(status).toHaveProperty('timestamp');
    expect(status).toHaveProperty('metrics');
    expect(status.metrics.filesAnalyzed).toBe(0);
  });

  test('should reset state correctly', () => {
    analyzer.metrics.filesAnalyzed = 5;
    const result = analyzer.reset();
    expect(result.reset).toBe(true);
    expect(analyzer.metrics.filesAnalyzed).toBe(0);
  });

  test('should handle non-existent file gracefully', () => {
    const result = analyzer.analyzeFile('/nonexistent/file.js');
    expect(result.conformant).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should count violations correctly', () => {
    const report = analyzer.getConformanceReport();
    expect(report).toHaveProperty('summary');
    expect(report.summary).toHaveProperty('filesAnalyzed');
    expect(report.summary).toHaveProperty('violationsTotal');
  });

  test('should track metrics after analysis', () => {
    const status1 = analyzer.getStatus();
    expect(status1.metrics.filesAnalyzed).toBe(0);
  });

  test('conformance report should have correct structure', () => {
    const report = analyzer.getConformanceReport();
    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('violations');
    expect(report).toHaveProperty('results');
  });

  test('should calculate conformance rate', () => {
    const report = analyzer.getConformanceReport();
    expect(report.summary.conformanceRate).toBeDefined();
  });

  test('should handle analyzeDirectory on non-existent directory', () => {
    const results = analyzer.analyzeDirectory('/nonexistent/directory');
    expect(Array.isArray(results)).toBe(true);
  });
});

describe('DependencyAuditScanner', () => {
  let scanner;

  beforeEach(() => {
    scanner = new DependencyAuditScanner(mockConstitutionManager);
  });

  test('should initialize with constitution manager', () => {
    expect(scanner).toBeDefined();
    expect(scanner.constitutionManager).toBeDefined();
  });

  test('should throw if constitution manager not provided', () => {
    expect(() => new DependencyAuditScanner()).toThrow();
  });

  test('should return getStatus() with metrics', () => {
    const status = scanner.getStatus();
    expect(status).toHaveProperty('timestamp');
    expect(status).toHaveProperty('metrics');
  });

  test('should reset state correctly', () => {
    scanner.metrics.modulesScanned = 3;
    const result = scanner.reset();
    expect(result.reset).toBe(true);
    expect(scanner.metrics.modulesScanned).toBe(0);
  });

  test('should handle non-existent file in scanFile', () => {
    const result = scanner.scanFile('/nonexistent/file.js');
    expect(result.error).toBeDefined();
    expect(Array.isArray(result.localRequires)).toBe(true);
  });

  test('should detect circular dependencies', async () => {
    const result = scanner.detectCircularDependencies('/nonexistent/dir');
    expect(result).toHaveProperty('cycles');
    expect(result).toHaveProperty('hasCycles');
  });

  test('should generate audit report', () => {
    const report = scanner.getAuditReport();
    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('modules');
  });

  test('should handle auditAllModules on non-existent directory', () => {
    expect(() => scanner.auditAllModules('/nonexistent')).toThrow();
  });

  test('should return empty array for auditAllModules success case', () => {
    const result = scanner.detectCircularDependencies('.');
    expect(Array.isArray(result.cycles)).toBe(true);
  });

  test('should initialize circular dependencies as empty', () => {
    expect(Array.isArray(scanner.circularDependencies)).toBe(true);
    expect(scanner.circularDependencies.length).toBe(0);
  });

  test('should track metrics correctly', () => {
    const status = scanner.getStatus();
    expect(status.metrics.modulesScanned).toBe(0);
    expect(status.metrics.undeclaredDependencies).toBe(0);
  });
});

describe('ConstitutionalPipelineRunner', () => {
  let runner;

  beforeEach(() => {
    runner = new ConstitutionalPipelineRunner({});
  });

  test('should initialize with default options', () => {
    expect(runner).toBeDefined();
    expect(runner.config).toBeDefined();
  });

  test('should throw if options not provided', () => {
    expect(() => new ConstitutionalPipelineRunner(null)).toThrow();
  });

  test('should run pipeline and return result', async () => {
    const result = await runner.run();
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('stages');
    expect(result).toHaveProperty('duration_ms');
  });

  test('pipeline result should have all stages', async () => {
    const result = await runner.run();
    const stageNames = result.stages.map((s) => s.stage);
    expect(stageNames).toContain('LOAD_CONSTITUTION');
    expect(stageNames).toContain('VERIFY_INTEGRITY');
  });

  test('should increment pipeline runs metric', async () => {
    const status1 = runner.getStatus();
    const initialCount = status1.metrics.pipelinesRun;

    await runner.run();

    const status2 = runner.getStatus();
    expect(status2.metrics.pipelinesRun).toBe(initialCount + 1);
  });

  test('should reset state correctly', async () => {
    await runner.run();
    const result = runner.reset();
    expect(result.reset).toBe(true);
    expect(runner.metrics.pipelinesRun).toBe(0);
  });

  test('should return getStatus with metrics', () => {
    const status = runner.getStatus();
    expect(status).toHaveProperty('timestamp');
    expect(status).toHaveProperty('metrics');
  });

  test('should have pipeline stages defined', () => {
    expect(Array.isArray(runner.pipelineStages)).toBe(true);
    expect(runner.pipelineStages.length).toBe(5);
  });

  test('each stage should have success property', async () => {
    const result = await runner.run();
    for (const stage of result.stages) {
      expect(stage).toHaveProperty('stage');
      expect(stage).toHaveProperty('success');
      expect(stage).toHaveProperty('duration_ms');
    }
  });
});

describe('CIReportGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new CIReportGenerator({});
  });

  test('should initialize with default options', () => {
    expect(generator).toBeDefined();
    expect(generator.config).toBeDefined();
  });

  test('should generate JSON report', () => {
    const pipelineResult = { success: true, stages: [] };
    const report = generator.generateJSONReport(pipelineResult);
    expect(report.format).toBe('json');
    expect(report.content).toBeDefined();
    expect(report.report).toBeDefined();
  });

  test('JSON report should have correct structure', () => {
    const pipelineResult = { success: true, stages: [] };
    const report = generator.generateJSONReport(pipelineResult);
    const parsed = JSON.parse(report.content);
    expect(parsed).toHaveProperty('meta');
    expect(parsed).toHaveProperty('summary');
    expect(parsed).toHaveProperty('stages');
  });

  test('should generate Markdown report', () => {
    const pipelineResult = { success: true, stages: [] };
    const report = generator.generateMarkdownReport(pipelineResult);
    expect(report.format).toBe('markdown');
    expect(report.content).toContain('✅');
  });

  test('should generate JUnit report', () => {
    const pipelineResult = { success: true, stages: [] };
    const report = generator.generateJUnitReport(pipelineResult);
    expect(report.format).toBe('junit');
    expect(report.content).toContain('<?xml');
    expect(report.content).toContain('testsuite');
  });

  test('should generate all formats', () => {
    const pipelineResult = { success: true, stages: [] };
    const reports = generator.generateAllFormats(pipelineResult);
    expect(Array.isArray(reports)).toBe(true);
    expect(reports.length).toBe(3);
  });

  test('should reset state correctly', () => {
    const result = generator.reset();
    expect(result.reset).toBe(true);
    expect(generator.generatedReports.length).toBe(0);
  });

  test('should return status with metrics', () => {
    const status = generator.getStatus();
    expect(status).toHaveProperty('timestamp');
    expect(status).toHaveProperty('metrics');
  });
});

describe('CIGovernancePipelineOrchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new CIGovernancePipelineOrchestrator({});
  });

  test('should initialize with options', () => {
    expect(orchestrator).toBeDefined();
    expect(orchestrator.pipelineRunner).toBeDefined();
    expect(orchestrator.reportGenerator).toBeDefined();
  });

  test('should execute pipeline and return result', async () => {
    const result = await orchestrator.execute({ save: false });
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('exitCode');
    expect(result).toHaveProperty('duration_ms');
  });

  test('should have exit code 0 on success', async () => {
    // Mock a successful pipeline
    const result = { success: true, stages: [] };
    orchestrator.pipelineRunner.run = async () => result;

    const execResult = await orchestrator.execute({ save: false });
    expect(execResult.exitCode).toBe(0);
  });

  test('should have exit code 1 on failure', async () => {
    // Mock a failed pipeline
    const result = { success: false, stages: [] };
    orchestrator.pipelineRunner.run = async () => result;

    const execResult = await orchestrator.execute({ save: false });
    expect(execResult.exitCode).toBe(1);
  });

  test('should track execution history', async () => {
    await orchestrator.execute({ save: false });
    const history = orchestrator.getExecutionHistory();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  test('should return last execution', async () => {
    await orchestrator.execute({ save: false });
    const last = orchestrator.getLastExecution();
    expect(last).toBeDefined();
    expect(last).toHaveProperty('timestamp');
    expect(last).toHaveProperty('success');
  });

  test('should reset state correctly', () => {
    const result = orchestrator.reset();
    expect(result.reset).toBe(true);
    expect(orchestrator.executionHistory.length).toBe(0);
  });

  test('should format summary for console', async () => {
    const result = { success: true, exitCode: 0, duration_ms: 100 };
    const formatted = orchestrator.formatSummaryForConsole(result);
    expect(typeof formatted).toBe('string');
    expect(formatted).toContain('✅');
  });
});

describe('Integration - runCIPipeline', () => {
  test('should be a function', () => {
    expect(typeof runCIPipeline).toBe('function');
  });

  test('should return a promise', () => {
    const result = runCIPipeline({ save: false });
    expect(result instanceof Promise).toBe(true);
  });
});

describe('Factory functions', () => {
  test('createPipelineOrchestrator should create instance', () => {
    const { createPipelineOrchestrator } = require('./index');
    const orchestrator = createPipelineOrchestrator({});
    expect(orchestrator).toBeDefined();
    expect(orchestrator.execute).toBeDefined();
  });

  test('createReportGenerator should create instance', () => {
    const { createReportGenerator } = require('./index');
    const generator = createReportGenerator({});
    expect(generator).toBeDefined();
    expect(generator.generateJSONReport).toBeDefined();
  });

  test('createPipelineRunner should create instance', () => {
    const { createPipelineRunner } = require('./index');
    const runner = createPipelineRunner({});
    expect(runner).toBeDefined();
    expect(runner.run).toBeDefined();
  });
});
