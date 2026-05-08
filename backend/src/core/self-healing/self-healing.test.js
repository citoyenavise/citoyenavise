/**
 * self-healing.test.js
 * PHASE 1.3 — Self-Healing Governance — Unit Tests
 *
 * 40+ tests covering all self-healing components:
 * - ViolationPatternAnalyzer (10 tests)
 * - AutoCorrectionEngine (12 tests)
 * - DegradationMonitor (8 tests)
 * - SelfHealingAuditTrail (7 tests)
 * - SelfHealingOrchestrator (9 tests)
 */

const {
  ViolationPatternAnalyzer,
  AutoCorrectionEngine,
  DegradationMonitor,
  SelfHealingAuditTrail,
  SelfHealingOrchestrator,
  createSelfHealingLayer
} = require('./index');

describe('ViolationPatternAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new ViolationPatternAnalyzer({});
  });

  test('should initialize', () => {
    expect(analyzer).toBeDefined();
    expect(analyzer.violationHistory).toEqual([]);
  });

  test('should record violation', () => {
    const violation = { type: 'TEST', severity: 'LOW', module: 'test-module' };
    analyzer.recordViolation(violation);
    expect(analyzer.violationHistory.length).toBe(1);
  });

  test('should throw if violation not provided', () => {
    expect(() => analyzer.recordViolation()).toThrow();
  });

  test('should detect recurring pattern (≥3 occurrences)', () => {
    for (let i = 0; i < 5; i++) {
      analyzer.recordViolation({ type: 'TEST', severity: 'LOW', module: 'mod' });
    }
    const analysis = analyzer.analyzePatterns();
    expect(analysis.recurringCount).toBeGreaterThan(0);
  });

  test('should not detect pattern with <3 occurrences', () => {
    analyzer.recordViolation({ type: 'TEST', severity: 'LOW', module: 'mod' });
    analyzer.recordViolation({ type: 'TEST', severity: 'LOW', module: 'mod' });
    const analysis = analyzer.analyzePatterns();
    expect(analysis.recurringCount).toBe(0);
  });

  test('should generate predictions', () => {
    for (let i = 0; i < 5; i++) {
      analyzer.recordViolation({ type: 'TEST', severity: 'LOW', module: 'mod' });
    }
    const predictions = analyzer.predictNextViolation();
    expect(Array.isArray(predictions)).toBe(true);
  });

  test('should get recurring patterns', () => {
    for (let i = 0; i < 5; i++) {
      analyzer.recordViolation({ type: 'TEST', severity: 'LOW', module: 'mod' });
    }
    const patterns = analyzer.getRecurringPatterns();
    expect(Array.isArray(patterns)).toBe(true);
  });

  test('should calculate violation frequency', () => {
    analyzer.recordViolation({ type: 'TEST', severity: 'LOW', module: 'mod' });
    const freq = analyzer.getViolationFrequency(60000);
    expect(freq).toHaveProperty('total');
    expect(freq).toHaveProperty('bySeverity');
  });

  test('should reset state', () => {
    analyzer.recordViolation({ type: 'TEST', severity: 'LOW', module: 'mod' });
    analyzer.reset();
    expect(analyzer.violationHistory.length).toBe(0);
    expect(analyzer.patterns.size).toBe(0);
  });

  test('should return status with metrics', () => {
    const status = analyzer.getStatus();
    expect(status).toHaveProperty('timestamp');
    expect(status).toHaveProperty('metrics');
  });

  test('should generate analysis report', () => {
    analyzer.recordViolation({ type: 'TEST', severity: 'LOW', module: 'mod' });
    const report = analyzer.generateAnalysisReport();
    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('analysis');
    expect(report).toHaveProperty('predictions');
  });
});

describe('AutoCorrectionEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new AutoCorrectionEngine({});
  });

  test('should initialize', () => {
    expect(engine).toBeDefined();
    expect(engine.config.allowedSeverities).toEqual(['LOW', 'MEDIUM']);
  });

  test('should throw if options not provided', () => {
    expect(() => new AutoCorrectionEngine(null)).toThrow();
  });

  test('canCorrect should return true for LOW', () => {
    const result = engine.canCorrect({ severity: 'LOW' });
    expect(result.canCorrect).toBe(true);
  });

  test('canCorrect should return true for MEDIUM', () => {
    const result = engine.canCorrect({ severity: 'MEDIUM' });
    expect(result.canCorrect).toBe(true);
  });

  test('canCorrect should return false for HIGH with mustEscalate true', () => {
    const result = engine.canCorrect({ severity: 'HIGH' });
    expect(result.canCorrect).toBe(false);
    expect(result.mustEscalate).toBe(true);
  });

  test('canCorrect should return false for CRITICAL with mustEscalate true', () => {
    const result = engine.canCorrect({ severity: 'CRITICAL' });
    expect(result.canCorrect).toBe(false);
    expect(result.mustEscalate).toBe(true);
  });

  test('should apply correction for LOW violation', async () => {
    const violation = { severity: 'LOW', type: 'TEST' };
    const result = await engine.applyCorrection(violation);
    expect(result).toHaveProperty('applied');
  });

  test('should register correction strategy', () => {
    const fn = (v) => ({ applied: true });
    engine.registerCorrectionStrategy('CUSTOM', fn);
    expect(engine.correctionStrategies.has('CUSTOM')).toBe(true);
  });

  test('should throw if registerCorrectionStrategy missing args', () => {
    expect(() => engine.registerCorrectionStrategy()).toThrow();
  });

  test('should get correction history', () => {
    const history = engine.getCorrectionHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  test('should reset state', () => {
    const result = engine.reset();
    expect(result.reset).toBe(true);
    expect(engine.correctionHistory.length).toBe(0);
  });

  test('should return status with immutable config', () => {
    const status = engine.getStatus();
    expect(status.allowedSeverities).toEqual(['LOW', 'MEDIUM']);
    expect(status.forbiddenSeverities).toEqual(['HIGH', 'CRITICAL']);
  });
});

describe('DegradationMonitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new DegradationMonitor({});
  });

  test('should initialize', () => {
    expect(monitor).toBeDefined();
    expect(monitor.healthSnapshots).toEqual([]);
  });

  test('should record health snapshot', () => {
    const healthData = { violationRate: 0.1, validationCycleDuration_ms: 100 };
    monitor.recordHealthSnapshot(healthData);
    expect(monitor.healthSnapshots.length).toBe(1);
  });

  test('should calculate health score 0-100', () => {
    const healthData = { violationRate: 0.1, validationCycleDuration_ms: 100 };
    monitor.recordHealthSnapshot(healthData);
    expect(monitor.healthSnapshots[0].healthScore).toBeGreaterThanOrEqual(0);
    expect(monitor.healthSnapshots[0].healthScore).toBeLessThanOrEqual(100);
  });

  test('should detect degradation trend with declining scores', () => {
    for (let i = 0; i < 5; i++) {
      monitor.recordHealthSnapshot({ violationRate: i * 0.1 });
    }
    const trend = monitor.detectDegradationTrend();
    expect(trend).toHaveProperty('degrading');
    expect(trend).toHaveProperty('slope');
  });

  test('should return degradation false with <3 snapshots', () => {
    monitor.recordHealthSnapshot({ violationRate: 0.1 });
    monitor.recordHealthSnapshot({ violationRate: 0.1 });
    const trend = monitor.detectDegradationTrend();
    expect(trend.degrading).toBe(false);
  });

  test('should start monitoring', () => {
    const provider = () => ({ violationRate: 0.1 });
    const result = monitor.start(provider);
    expect(result.started).toBe(true);
    monitor.stop();
  });

  test('should stop monitoring', () => {
    const provider = () => ({ violationRate: 0.1 });
    monitor.start(provider);
    const result = monitor.stop();
    expect(result.stopped).toBe(true);
  });

  test('should reset state', () => {
    monitor.recordHealthSnapshot({ violationRate: 0.1 });
    monitor.reset();
    expect(monitor.healthSnapshots.length).toBe(0);
  });
});

describe('SelfHealingAuditTrail', () => {
  let trail;

  beforeEach(() => {
    trail = new SelfHealingAuditTrail({});
  });

  test('should initialize', () => {
    expect(trail).toBeDefined();
    expect(trail.trail).toEqual([]);
  });

  test('should log decision', () => {
    trail.logDecision('TEST_DECISION', { data: 'test' });
    expect(trail.trail.length).toBe(1);
    expect(trail.trail[0].decisionType).toBe('TEST_DECISION');
  });

  test('should throw if decision type missing', () => {
    expect(() => trail.logDecision()).toThrow();
  });

  test('should log correction attempt', () => {
    const violation = { type: 'TEST', severity: 'LOW' };
    trail.logCorrectionAttempt(violation, 'STRATEGY', 'expected');
    expect(trail.metrics.correctionsLogged).toBe(1);
  });

  test('should log correction outcome', () => {
    trail.logCorrectionOutcome('corr_123', true, {});
    expect(trail.trail.length).toBe(1);
  });

  test('should log escalation', () => {
    const violation = { type: 'TEST', severity: 'CRITICAL' };
    trail.logEscalation(violation, 'severity_not_allowed');
    expect(trail.metrics.escalationsLogged).toBe(1);
  });

  test('should get trail by type', () => {
    trail.logDecision('TYPE_A', {});
    trail.logDecision('TYPE_B', {});
    const filtered = trail.getTrailByType('TYPE_A');
    expect(filtered.length).toBe(1);
  });

  test('should get statistics', () => {
    trail.logDecision('TEST', {});
    const stats = trail.getStatistics();
    expect(stats).toHaveProperty('totalEntries');
    expect(stats).toHaveProperty('entriesByType');
  });

  test('should reset state (in-memory only)', () => {
    trail.logDecision('TEST', {});
    trail.reset();
    expect(trail.trail.length).toBe(0);
  });
});

describe('SelfHealingOrchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new SelfHealingOrchestrator({});
  });

  test('should initialize', () => {
    expect(orchestrator).toBeDefined();
    expect(orchestrator.patternAnalyzer).toBeDefined();
  });

  test('should throw if options not provided', () => {
    expect(() => new SelfHealingOrchestrator(null)).toThrow();
  });

  test('processViolation should log audit before action', async () => {
    const violation = { type: 'TEST', severity: 'LOW', module: 'test' };
    const result = await orchestrator.processViolation(violation);
    expect(result).toHaveProperty('auditEntryId');
    expect(orchestrator.auditTrail.trail.length).toBeGreaterThan(0);
  });

  test('processViolation LOW should attempt correction', async () => {
    const violation = { type: 'TEST', severity: 'LOW', module: 'test' };
    const result = await orchestrator.processViolation(violation);
    expect(result.action).toBe('CORRECTED');
  });

  test('processViolation CRITICAL should escalate', async () => {
    const violation = { type: 'TEST', severity: 'CRITICAL', module: 'test' };
    const result = await orchestrator.processViolation(violation);
    expect(result.action).toBe('ESCALATED');
  });

  test('runHealingCycle should process batch', async () => {
    const violations = [
      { type: 'A', severity: 'LOW', module: 'test' },
      { type: 'B', severity: 'LOW', module: 'test' }
    ];
    const result = await orchestrator.runHealingCycle(violations);
    expect(result.processed.length).toBe(2);
  });

  test('should start monitoring if callback provided', () => {
    const provider = () => ({ violationRate: 0.1 });
    const result = orchestrator.startMonitoring(provider);
    expect(result.started).toBe(true);
    orchestrator.stopMonitoring();
  });

  test('should get healing report', () => {
    const report = orchestrator.getHealingReport();
    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('metrics');
  });

  test('should reset state', () => {
    const result = orchestrator.reset();
    expect(result.reset).toBe(true);
  });

  test('should return status', () => {
    const status = orchestrator.getStatus();
    expect(status).toHaveProperty('timestamp');
    expect(status).toHaveProperty('metrics');
  });
});

describe('Integration - createSelfHealingLayer', () => {
  test('should create integrated layer', () => {
    const layer = createSelfHealingLayer({});
    expect(layer).toBeDefined();
    expect(layer.orchestrator).toBeDefined();
    expect(layer.process).toBeDefined();
    expect(layer.runCycle).toBeDefined();
  });

  test('integrated layer process method should work', async () => {
    const layer = createSelfHealingLayer({});
    const violation = { type: 'TEST', severity: 'LOW', module: 'test' };
    const result = await layer.process(violation);
    expect(result).toBeDefined();
  });

  test('integrated layer getReport method should work', () => {
    const layer = createSelfHealingLayer({});
    const report = layer.getReport();
    expect(report).toHaveProperty('metrics');
  });
});
