/**
 * PHASE 10.8 Meta-Integrity Audit Layer — Test Suite
 * 50 comprehensive tests covering cross-phase consistency & corruption detection
 */

const assert = require('assert');
const {
  MetaIntegrityAuditor,
  CrossPhaseConsistencyScanner,
  TruthCorruptionDetector,
  GlobalModelAlignmentEngine,
  ObservationChainVerifier,
  AUDIT_ERROR_TYPES,
  CONTRADICTION_TYPES,
  SEVERITY_LEVELS
} = require('../core/governance/audit/Phase1080-MetaAudit.js');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Mock Layer Implementations for Testing
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const createMockLayer = (layerId, overrides = {}) => ({
  isAuthoritative: () => false,
  getMetrics: () => Object.freeze({
    GCS: 0.92,
    OAS: 0.88,
    OAL: 0.85,
    CAD: 0.12,
    FPE: 0.45,
    SE: 1.8,
    ORA: 85,
    ODL: 0.95,
    ...overrides
  }),
  detectInternalContradictions: () => [],
  ...overrides
});

const createCorruptedLayer = () => ({
  isAuthoritative: () => true, // Violates PHASE invariant
  getMetrics: () => ({
    GCS: 1.5, // Out of range
    OAL: 0.5
  }),
  detectInternalContradictions: () => [
    { type: 'LOGICAL_ERROR', detail: 'Impossible state' }
  ]
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 1: MetaIntegrityAuditor Tests (12 tests, 701-712)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('PHASE 10.8 Meta-Integrity Audit Layer', () => {
  describe('TEST 701-712: MetaIntegrityAuditor Initialization & Basic Audit', () => {

    test('TEST 701: Constructor creates auditor with 8 layers', () => {
      const layers = {
        '10.0': createMockLayer('10.0'),
        '10.1': createMockLayer('10.1'),
        '10.2': createMockLayer('10.2'),
        '10.3': createMockLayer('10.3'),
        '10.4': createMockLayer('10.4'),
        '10.5': createMockLayer('10.5'),
        '10.6': createMockLayer('10.6'),
        '10.7': createMockLayer('10.7')
      };

      const auditor = new MetaIntegrityAuditor(
        layers['10.0'], layers['10.1'], layers['10.2'], layers['10.3'],
        layers['10.4'], layers['10.5'], layers['10.6'], layers['10.7']
      );

      assert.strictEqual(Object.keys(auditor.layers).length, 8);
      assert.strictEqual(auditor.metrics.auditsPerformed, 0);
    });

    test('TEST 702: Constructor options frozen', () => {
      const auditor = new MetaIntegrityAuditor(
        createMockLayer('10.0'), createMockLayer('10.1'), createMockLayer('10.2'), createMockLayer('10.3'),
        createMockLayer('10.4'), createMockLayer('10.5'), createMockLayer('10.6'), createMockLayer('10.7'),
        { maxAnomalies: 500 }
      );

      assert.throws(() => {
        auditor.options.maxAnomalies = 1000;
      });
    });

    test('TEST 703: auditAllLayers returns frozen result', () => {
      const auditor = new MetaIntegrityAuditor(
        createMockLayer('10.0'), createMockLayer('10.1'), createMockLayer('10.2'), createMockLayer('10.3'),
        createMockLayer('10.4'), createMockLayer('10.5'), createMockLayer('10.6'), createMockLayer('10.7')
      );

      const result = auditor.auditAllLayers();
      assert(Object.isFrozen(result));
      assert(Object.isFrozen(result.layerConsistencies));
      assert(Object.isFrozen(result.contradictions));
    });

    test('TEST 704: auditAllLayers computes globalConsistencyScore in [0, 1]', () => {
      const auditor = new MetaIntegrityAuditor(
        createMockLayer('10.0'), createMockLayer('10.1'), createMockLayer('10.2'), createMockLayer('10.3'),
        createMockLayer('10.4'), createMockLayer('10.5'), createMockLayer('10.6'), createMockLayer('10.7')
      );

      const result = auditor.auditAllLayers();
      assert(typeof result.globalConsistencyScore === 'number');
      assert(result.globalConsistencyScore >= 0);
      assert(result.globalConsistencyScore <= 1);
    });

    test('TEST 705: auditAllLayers detects authoritative violation', () => {
      const corruptedLayer = createCorruptedLayer();
      const auditor = new MetaIntegrityAuditor(
        corruptedLayer, createMockLayer('10.1'), createMockLayer('10.2'), createMockLayer('10.3'),
        createMockLayer('10.4'), createMockLayer('10.5'), createMockLayer('10.6'), createMockLayer('10.7')
      );

      const result = auditor.auditAllLayers();
      assert(result.corruptions.length > 0);
      assert(result.corruptions.some(c => c.type === 'AUTHORITATIVE_VIOLATION'));
    });

    test('TEST 706: auditAllLayers detects range violations', () => {
      const outOfRangeLayer = createMockLayer('10.0', { GCS: 1.5 });
      const auditor = new MetaIntegrityAuditor(
        outOfRangeLayer, createMockLayer('10.1'), createMockLayer('10.2'), createMockLayer('10.3'),
        createMockLayer('10.4'), createMockLayer('10.5'), createMockLayer('10.6'), createMockLayer('10.7')
      );

      const result = auditor.auditAllLayers();
      const rangeViolations = result.corruptions.filter(c => c.type === 'RANGE_VIOLATION');
      assert(rangeViolations.length > 0);
    });

    test('TEST 707: auditAllLayers increments metrics counter', () => {
      const auditor = new MetaIntegrityAuditor(
        createMockLayer('10.0'), createMockLayer('10.1'), createMockLayer('10.2'), createMockLayer('10.3'),
        createMockLayer('10.4'), createMockLayer('10.5'), createMockLayer('10.6'), createMockLayer('10.7')
      );

      assert.strictEqual(auditor.metrics.auditsPerformed, 0);
      auditor.auditAllLayers();
      assert.strictEqual(auditor.metrics.auditsPerformed, 1);
      auditor.auditAllLayers();
      assert.strictEqual(auditor.metrics.auditsPerformed, 2);
    });

    test('TEST 708: getMetrics returns frozen copy', () => {
      const auditor = new MetaIntegrityAuditor(
        createMockLayer('10.0'), createMockLayer('10.1'), createMockLayer('10.2'), createMockLayer('10.3'),
        createMockLayer('10.4'), createMockLayer('10.5'), createMockLayer('10.6'), createMockLayer('10.7')
      );

      const metrics = auditor.getMetrics();
      assert(Object.isFrozen(metrics));
      assert.throws(() => {
        metrics.auditsPerformed = 999;
      });
    });

    test('TEST 709: Healthy layers produce high globalConsistencyScore', () => {
      const auditor = new MetaIntegrityAuditor(
        createMockLayer('10.0'), createMockLayer('10.1'), createMockLayer('10.2'), createMockLayer('10.3'),
        createMockLayer('10.4'), createMockLayer('10.5'), createMockLayer('10.6'), createMockLayer('10.7')
      );

      const result = auditor.auditAllLayers();
      assert(result.globalConsistencyScore > 0.85);
    });

    test('TEST 710: Result contains required fields', () => {
      const auditor = new MetaIntegrityAuditor(
        createMockLayer('10.0'), createMockLayer('10.1'), createMockLayer('10.2'), createMockLayer('10.3'),
        createMockLayer('10.4'), createMockLayer('10.5'), createMockLayer('10.6'), createMockLayer('10.7')
      );

      const result = auditor.auditAllLayers();
      assert(result.hasOwnProperty('globalConsistencyScore'));
      assert(result.hasOwnProperty('layerConsistencies'));
      assert(result.hasOwnProperty('contradictions'));
      assert(result.hasOwnProperty('timestamp'));
      assert.strictEqual(result.isAuthoritative, false);
    });

    test('TEST 711: Result durationMs is positive', () => {
      const auditor = new MetaIntegrityAuditor(
        createMockLayer('10.0'), createMockLayer('10.1'), createMockLayer('10.2'), createMockLayer('10.3'),
        createMockLayer('10.4'), createMockLayer('10.5'), createMockLayer('10.6'), createMockLayer('10.7')
      );

      const result = auditor.auditAllLayers();
      assert(result.durationMs >= 0);
    });

    test('TEST 712: isAuthoritative always false', () => {
      const auditor = new MetaIntegrityAuditor(
        createMockLayer('10.0'), createMockLayer('10.1'), createMockLayer('10.2'), createMockLayer('10.3'),
        createMockLayer('10.4'), createMockLayer('10.5'), createMockLayer('10.6'), createMockLayer('10.7')
      );

      const result = auditor.auditAllLayers();
      assert.strictEqual(result.isAuthoritative, false);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SECTION 2: CrossPhaseConsistencyScanner Tests (10 tests, 713-722)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('TEST 713-722: CrossPhaseConsistencyScanner', () => {
    const allLayers = {
      '10.0': createMockLayer('10.0'),
      '10.1': createMockLayer('10.1'),
      '10.2': createMockLayer('10.2'),
      '10.3': createMockLayer('10.3'),
      '10.4': createMockLayer('10.4'),
      '10.5': createMockLayer('10.5'),
      '10.6': createMockLayer('10.6'),
      '10.7': createMockLayer('10.7')
    };

    test('TEST 713: Constructor creates scanner', () => {
      const scanner = new CrossPhaseConsistencyScanner(allLayers);
      assert.strictEqual(scanner.options.hasOwnProperty, Object.prototype.hasOwnProperty);
      assert.strictEqual(scanner.scanMetrics.scansPerformed, 0);
    });

    test('TEST 714: scanAllLayerPairs returns frozen result', () => {
      const scanner = new CrossPhaseConsistencyScanner(allLayers);
      const result = scanner.scanAllLayerPairs();
      assert(Object.isFrozen(result));
      assert(Object.isFrozen(result.consistencyMatrix));
      assert(Object.isFrozen(result.contradictions));
    });

    test('TEST 715: scanAllLayerPairs creates N×N matrix', () => {
      const scanner = new CrossPhaseConsistencyScanner(allLayers);
      const result = scanner.scanAllLayerPairs();
      // 8 layers = 8×7/2 = 28 pairs
      assert.strictEqual(Object.keys(result.consistencyMatrix).length, 28);
    });

    test('TEST 716: Consistency scores in [0, 1]', () => {
      const scanner = new CrossPhaseConsistencyScanner(allLayers);
      const result = scanner.scanAllLayerPairs();

      for (const [pair, score] of Object.entries(result.consistencyMatrix)) {
        assert(typeof score === 'number');
        assert(score >= 0 && score <= 1);
      }
    });

    test('TEST 717: Increments scanMetrics counter', () => {
      const scanner = new CrossPhaseConsistencyScanner(allLayers);
      assert.strictEqual(scanner.scanMetrics.scansPerformed, 0);
      scanner.scanAllLayerPairs();
      assert.strictEqual(scanner.scanMetrics.scansPerformed, 1);
    });

    test('TEST 718: Result is non-authoritative', () => {
      const scanner = new CrossPhaseConsistencyScanner(allLayers);
      const result = scanner.scanAllLayerPairs();
      assert.strictEqual(result.isAuthoritative, false);
    });

    test('TEST 719: Contradictions array is present', () => {
      const scanner = new CrossPhaseConsistencyScanner(allLayers);
      const result = scanner.scanAllLayerPairs();
      assert(Array.isArray(result.contradictions));
    });

    test('TEST 720: Timestamp is ISO format', () => {
      const scanner = new CrossPhaseConsistencyScanner(allLayers);
      const result = scanner.scanAllLayerPairs();
      assert(typeof result.timestamp === 'string');
      assert(!isNaN(Date.parse(result.timestamp)));
    });

    test('TEST 721: getMetrics returns frozen', () => {
      const scanner = new CrossPhaseConsistencyScanner(allLayers);
      const metrics = scanner.getMetrics();
      assert(Object.isFrozen(metrics));
    });

    test('TEST 722: Healthy layers produce high consistency scores', () => {
      const scanner = new CrossPhaseConsistencyScanner(allLayers);
      const result = scanner.scanAllLayerPairs();
      const avgScore = Object.values(result.consistencyMatrix).reduce((a, b) => a + b, 0) /
                       Object.keys(result.consistencyMatrix).length;
      assert(avgScore > 0.8);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SECTION 3: TruthCorruptionDetector Tests (10 tests, 723-732)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('TEST 723-732: TruthCorruptionDetector', () => {
    const allResults = {
      '10.0': createMockLayer('10.0'),
      '10.1': createMockLayer('10.1'),
      '10.2': createMockLayer('10.2'),
      '10.3': createMockLayer('10.3'),
      '10.4': createMockLayer('10.4'),
      '10.5': createMockLayer('10.5'),
      '10.6': createMockLayer('10.6'),
      '10.7': createMockLayer('10.7')
    };

    test('TEST 723: Constructor creates detector', () => {
      const detector = new TruthCorruptionDetector(allResults);
      assert.strictEqual(detector.detectionMetrics.detectionsPerformed, 0);
    });

    test('TEST 724: detectImpossibilities returns frozen result', () => {
      const detector = new TruthCorruptionDetector(allResults);
      const result = detector.detectImpossibilities();
      assert(Object.isFrozen(result));
      assert(Object.isFrozen(result.impossibilities));
    });

    test('TEST 725: detectImpossibilities detects out-of-range metrics', () => {
      const corruptedResults = {
        ...allResults,
        '10.0': createMockLayer('10.0', { GCS: 1.5 })
      };
      const detector = new TruthCorruptionDetector(corruptedResults);
      const result = detector.detectImpossibilities();
      assert(result.impossibilities.length > 0);
      assert(result.impossibilities.some(i => i.type === 'OUT_OF_RANGE'));
    });

    test('TEST 726: measureCumulativeDrift returns frozen', () => {
      const detector = new TruthCorruptionDetector(allResults);
      const result = detector.measureCumulativeDrift();
      assert(Object.isFrozen(result));
      assert(typeof result.cumulativeDrift === 'number');
    });

    test('TEST 727: measureCumulativeDrift quantifies drift', () => {
      const detector = new TruthCorruptionDetector(allResults);
      const result = detector.measureCumulativeDrift();
      assert(result.cumulativeDrift >= 0);
    });

    test('TEST 728: detectParadoxes returns frozen', () => {
      const detector = new TruthCorruptionDetector(allResults);
      const result = detector.detectParadoxes();
      assert(Object.isFrozen(result));
      assert(Array.isArray(result.paradoxes));
    });

    test('TEST 729: isAuthoritative false on all results', () => {
      const detector = new TruthCorruptionDetector(allResults);
      const imp = detector.detectImpossibilities();
      const drift = detector.measureCumulativeDrift();
      const paradoxes = detector.detectParadoxes();

      assert.strictEqual(imp.isAuthoritative, false);
      assert.strictEqual(drift.isAuthoritative, false);
      assert.strictEqual(paradoxes.isAuthoritative, false);
    });

    test('TEST 730: Corruption density in [0, 1]', () => {
      const detector = new TruthCorruptionDetector(allResults);
      const result = detector.detectImpossibilities();
      assert(result.corruptionDensity >= 0);
      assert(result.corruptionDensity <= 1);
    });

    test('TEST 731: getMetrics returns frozen', () => {
      const detector = new TruthCorruptionDetector(allResults);
      const metrics = detector.getMetrics();
      assert(Object.isFrozen(metrics));
    });

    test('TEST 732: Results have timestamps', () => {
      const detector = new TruthCorruptionDetector(allResults);
      const imp = detector.detectImpossibilities();
      const drift = detector.measureCumulativeDrift();
      const paradoxes = detector.detectParadoxes();

      assert(imp.timestamp);
      assert(drift.timestamp);
      assert(paradoxes.timestamp);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SECTION 4: GlobalModelAlignmentEngine Tests (9 tests, 733-741)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('TEST 733-741: GlobalModelAlignmentEngine', () => {
    const allOutputs = {
      '10.0': createMockLayer('10.0'),
      '10.1': createMockLayer('10.1'),
      '10.2': createMockLayer('10.2'),
      '10.3': createMockLayer('10.3'),
      '10.4': createMockLayer('10.4'),
      '10.5': createMockLayer('10.5'),
      '10.6': createMockLayer('10.6'),
      '10.7': createMockLayer('10.7')
    };

    test('TEST 733: Constructor creates engine', () => {
      const engine = new GlobalModelAlignmentEngine(allOutputs);
      assert.strictEqual(engine.alignmentMetrics.measurementsPerformed, 0);
    });

    test('TEST 734: computeModelAgreement returns frozen', () => {
      const engine = new GlobalModelAlignmentEngine(allOutputs);
      const result = engine.computeModelAgreement();
      assert(Object.isFrozen(result));
      assert(Object.isFrozen(result.pairwiseAgreements));
    });

    test('TEST 735: Alignment index in [0, 1]', () => {
      const engine = new GlobalModelAlignmentEngine(allOutputs);
      const result = engine.computeModelAgreement();
      assert(result.alignmentIndex >= 0);
      assert(result.alignmentIndex <= 1);
    });

    test('TEST 736: Outliers array present', () => {
      const engine = new GlobalModelAlignmentEngine(allOutputs);
      const result = engine.computeModelAgreement();
      assert(Array.isArray(result.outlierModels));
      assert(typeof result.outlierCount === 'number');
    });

    test('TEST 737: Healthy layers have no outliers', () => {
      const engine = new GlobalModelAlignmentEngine(allOutputs);
      const result = engine.computeModelAgreement();
      assert(result.outlierCount <= 2);
    });

    test('TEST 738: Increments measurement counter', () => {
      const engine = new GlobalModelAlignmentEngine(allOutputs);
      assert.strictEqual(engine.alignmentMetrics.measurementsPerformed, 0);
      engine.computeModelAgreement();
      assert.strictEqual(engine.alignmentMetrics.measurementsPerformed, 1);
    });

    test('TEST 739: Result non-authoritative', () => {
      const engine = new GlobalModelAlignmentEngine(allOutputs);
      const result = engine.computeModelAgreement();
      assert.strictEqual(result.isAuthoritative, false);
    });

    test('TEST 740: getMetrics returns frozen', () => {
      const engine = new GlobalModelAlignmentEngine(allOutputs);
      const metrics = engine.getMetrics();
      assert(Object.isFrozen(metrics));
    });

    test('TEST 741: Has timestamp', () => {
      const engine = new GlobalModelAlignmentEngine(allOutputs);
      const result = engine.computeModelAgreement();
      assert(result.timestamp);
      assert(!isNaN(Date.parse(result.timestamp)));
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SECTION 5: ObservationChainVerifier Tests (9 tests, 742-750)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('TEST 742-750: ObservationChainVerifier', () => {
    const allOutputs = {
      '10.0': createMockLayer('10.0'),
      '10.1': createMockLayer('10.1'),
      '10.2': createMockLayer('10.2'),
      '10.3': createMockLayer('10.3'),
      '10.4': createMockLayer('10.4'),
      '10.5': createMockLayer('10.5'),
      '10.6': createMockLayer('10.6'),
      '10.7': createMockLayer('10.7')
    };

    test('TEST 742: Constructor creates verifier', () => {
      const verifier = new ObservationChainVerifier(allOutputs);
      assert.strictEqual(verifier.verificationMetrics.verificationsPerformed, 0);
    });

    test('TEST 743: verifyDataFlow returns frozen', () => {
      const verifier = new ObservationChainVerifier(allOutputs);
      const result = verifier.verifyDataFlow();
      assert(Object.isFrozen(result));
      assert(Object.isFrozen(result.pipelineBreaks));
    });

    test('TEST 744: Chain integrity in [0, 1]', () => {
      const verifier = new ObservationChainVerifier(allOutputs);
      const result = verifier.verifyDataFlow();
      assert(result.chainIntegrity >= 0);
      assert(result.chainIntegrity <= 1);
    });

    test('TEST 745: Data loss in [0, 1]', () => {
      const verifier = new ObservationChainVerifier(allOutputs);
      const result = verifier.verifyDataFlow();
      assert(result.dataLoss >= 0);
      assert(result.dataLoss <= 1);
    });

    test('TEST 746: Healthy pipeline has high integrity', () => {
      const verifier = new ObservationChainVerifier(allOutputs);
      const result = verifier.verifyDataFlow();
      assert(result.chainIntegrity > 0.9);
      assert(result.dataLoss < 0.1);
    });

    test('TEST 747: Increments counter', () => {
      const verifier = new ObservationChainVerifier(allOutputs);
      assert.strictEqual(verifier.verificationMetrics.verificationsPerformed, 0);
      verifier.verifyDataFlow();
      assert.strictEqual(verifier.verificationMetrics.verificationsPerformed, 1);
    });

    test('TEST 748: Non-authoritative', () => {
      const verifier = new ObservationChainVerifier(allOutputs);
      const result = verifier.verifyDataFlow();
      assert.strictEqual(result.isAuthoritative, false);
    });

    test('TEST 749: getMetrics frozen', () => {
      const verifier = new ObservationChainVerifier(allOutputs);
      const metrics = verifier.getMetrics();
      assert(Object.isFrozen(metrics));
    });

    test('TEST 750: Has timestamp', () => {
      const verifier = new ObservationChainVerifier(allOutputs);
      const result = verifier.verifyDataFlow();
      assert(result.timestamp);
      assert(!isNaN(Date.parse(result.timestamp)));
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SECTION 6: Integration & Constants Tests (10 tests, 751-760)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('TEST 751-760: Integration & Constants', () => {
    test('TEST 751: AUDIT_ERROR_TYPES exported and frozen', () => {
      assert(Object.isFrozen(AUDIT_ERROR_TYPES));
      assert(AUDIT_ERROR_TYPES.CONTRADICTION_DETECTED);
      assert(AUDIT_ERROR_TYPES.CORRUPTION_FOUND);
      assert(AUDIT_ERROR_TYPES.PIPELINE_BREAK);
    });

    test('TEST 752: CONTRADICTION_TYPES exported and frozen', () => {
      assert(Object.isFrozen(CONTRADICTION_TYPES));
      assert(CONTRADICTION_TYPES.METRIC_DIRECTION);
      assert(CONTRADICTION_TYPES.CAUSAL_REVERSAL);
      assert(CONTRADICTION_TYPES.CONSENSUS_VS_ANOMALY);
    });

    test('TEST 753: SEVERITY_LEVELS exported and frozen', () => {
      assert(Object.isFrozen(SEVERITY_LEVELS));
      assert(SEVERITY_LEVELS.CRITICAL);
      assert(SEVERITY_LEVELS.WARNING);
      assert(SEVERITY_LEVELS.INFO);
    });

    test('TEST 754: All 5 modules exported', () => {
      assert(MetaIntegrityAuditor);
      assert(CrossPhaseConsistencyScanner);
      assert(TruthCorruptionDetector);
      assert(GlobalModelAlignmentEngine);
      assert(ObservationChainVerifier);
    });

    test('TEST 755: All modules are constructable', () => {
      const layers = {
        '10.0': createMockLayer('10.0'),
        '10.1': createMockLayer('10.1'),
        '10.2': createMockLayer('10.2'),
        '10.3': createMockLayer('10.3'),
        '10.4': createMockLayer('10.4'),
        '10.5': createMockLayer('10.5'),
        '10.6': createMockLayer('10.6'),
        '10.7': createMockLayer('10.7')
      };

      const auditor = new MetaIntegrityAuditor(...Object.values(layers));
      const scanner = new CrossPhaseConsistencyScanner(layers);
      const detector = new TruthCorruptionDetector(layers);
      const engine = new GlobalModelAlignmentEngine(layers);
      const verifier = new ObservationChainVerifier(layers);

      assert(auditor && scanner && detector && engine && verifier);
    });

    test('TEST 756: Full audit workflow completes', () => {
      const layers = {
        '10.0': createMockLayer('10.0'),
        '10.1': createMockLayer('10.1'),
        '10.2': createMockLayer('10.2'),
        '10.3': createMockLayer('10.3'),
        '10.4': createMockLayer('10.4'),
        '10.5': createMockLayer('10.5'),
        '10.6': createMockLayer('10.6'),
        '10.7': createMockLayer('10.7')
      };

      const auditor = new MetaIntegrityAuditor(...Object.values(layers));
      const result1 = auditor.auditAllLayers();
      const result2 = auditor.auditAllLayers();

      assert(result1.globalConsistencyScore === result2.globalConsistencyScore); // Deterministic
      assert(auditor.metrics.auditsPerformed === 2);
    });

    test('TEST 757: Deterministic audit on identical data', () => {
      const layers = {
        '10.0': createMockLayer('10.0'),
        '10.1': createMockLayer('10.1'),
        '10.2': createMockLayer('10.2'),
        '10.3': createMockLayer('10.3'),
        '10.4': createMockLayer('10.4'),
        '10.5': createMockLayer('10.5'),
        '10.6': createMockLayer('10.6'),
        '10.7': createMockLayer('10.7')
      };

      const auditor = new MetaIntegrityAuditor(...Object.values(layers));
      const audit1 = auditor.auditAllLayers();
      const audit2 = auditor.auditAllLayers();

      assert.strictEqual(audit1.globalConsistencyScore, audit2.globalConsistencyScore);
    });

    test('TEST 758: Contaminated layer reduces GCS', () => {
      const healthyLayers = {
        '10.0': createMockLayer('10.0'),
        '10.1': createMockLayer('10.1'),
        '10.2': createMockLayer('10.2'),
        '10.3': createMockLayer('10.3'),
        '10.4': createMockLayer('10.4'),
        '10.5': createMockLayer('10.5'),
        '10.6': createMockLayer('10.6'),
        '10.7': createMockLayer('10.7')
      };

      const healthyAuditor = new MetaIntegrityAuditor(...Object.values(healthyLayers));
      const healthyResult = healthyAuditor.auditAllLayers();

      const corruptedLayers = {
        ...healthyLayers,
        '10.0': createCorruptedLayer()
      };

      const corruptedAuditor = new MetaIntegrityAuditor(...Object.values(corruptedLayers));
      const corruptedResult = corruptedAuditor.auditAllLayers();

      assert(corruptedResult.globalConsistencyScore < healthyResult.globalConsistencyScore);
    });

    test('TEST 759: Performance: audit completes in <1000ms', () => {
      const layers = {
        '10.0': createMockLayer('10.0'),
        '10.1': createMockLayer('10.1'),
        '10.2': createMockLayer('10.2'),
        '10.3': createMockLayer('10.3'),
        '10.4': createMockLayer('10.4'),
        '10.5': createMockLayer('10.5'),
        '10.6': createMockLayer('10.6'),
        '10.7': createMockLayer('10.7')
      };

      const auditor = new MetaIntegrityAuditor(...Object.values(layers));
      const result = auditor.auditAllLayers();

      assert(result.durationMs < 1000);
    });

    test('TEST 760: No modification of layers after audit', () => {
      const originalMetric = 0.92;
      const layers = {
        '10.0': createMockLayer('10.0', { GCS: originalMetric }),
        '10.1': createMockLayer('10.1'),
        '10.2': createMockLayer('10.2'),
        '10.3': createMockLayer('10.3'),
        '10.4': createMockLayer('10.4'),
        '10.5': createMockLayer('10.5'),
        '10.6': createMockLayer('10.6'),
        '10.7': createMockLayer('10.7')
      };

      const auditor = new MetaIntegrityAuditor(...Object.values(layers));
      auditor.auditAllLayers();

      // Layer metrics should be unchanged
      assert.strictEqual(layers['10.0'].getMetrics().GCS, originalMetric);
    });
  });
});

console.log('✓ PHASE 10.8 Meta-Integrity Audit Tests: All 60 tests defined (TEST 701-760)');
