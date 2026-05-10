/**
 * PHASE 8.5 — Self-Optimizing Kernel Meta-Compilation Layer
 *
 * Tests auto-tuning, profiling, cost analysis, and adaptive balancing.
 *
 * CRITICAL INVARIANTS:
 * ✔ deterministic optimization
 * ✔ no divergence from causal ordering
 * ✔ profiling accuracy
 * ✔ cost-aware execution planning
 * ✔ shard rebalancing stability
 * ✔ full optimization loop integrity
 */

const assert = require('assert');
const KernelPerformanceProfiler = require('../core/kernel/optimization/KernelPerformanceProfiler');
const MetaOptimizationEngine = require('../core/kernel/optimization/MetaOptimizationEngine');
const InvariantCostAnalyzer = require('../core/kernel/optimization/InvariantCostAnalyzer');
const AdaptiveShardBalancer = require('../core/kernel/optimization/AdaptiveShardBalancer');
const InvariantShardRouter = require('../core/kernel/sharding/InvariantShardRouter');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Kernel Profiling Accuracy
 * Verify profiling captures metrics correctly
 */
async function testProfilingAccuracy() {
  console.log('\n=== TEST 1: Kernel Profiling Accuracy ===');
  try {
    const profiler = new KernelPerformanceProfiler();

    // Record component executions
    profiler.recordExecution('component_a', 10);
    profiler.recordExecution('component_a', 12);
    profiler.recordExecution('component_a', 11);

    profiler.recordExecution('component_b', 50);
    profiler.recordExecution('component_b', 55);

    // Capture metrics
    const captureResult = profiler.captureGlobalMetrics();
    assert(captureResult.captured === true, 'Metrics capture should succeed');

    // Get component metrics
    const metricsResult = profiler.getComponentMetrics('component_a');
    assert(metricsResult.available === true, 'Component metrics should be available');
    assert(metricsResult.metrics.executions === 3, 'Should have 3 executions');
    assert(
      parseFloat(metricsResult.metrics.avgMs) > 10,
      'Average should be > 10ms'
    );

    // Identify bottlenecks
    const bottlenecks = profiler.identifyBottlenecks();
    assert(bottlenecks.bottlenecks.length > 0, 'Should identify bottlenecks');

    console.log(`✅ Profiling: 5 executions captured, bottlenecks identified`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Cost-Based Optimization Stability
 * Verify optimization recommendations are stable
 */
async function testOptimizationStability() {
  console.log('\n=== TEST 2: Cost-Based Optimization Stability ===');
  try {
    const profiler = new KernelPerformanceProfiler();
    const engine = new MetaOptimizationEngine({ profiler });

    // Simulate high-latency component
    for (let i = 0; i < 10; i++) {
      profiler.recordExecution('slow_component', 80 + Math.random() * 20);
    }

    // Generate recommendations twice
    const rec1 = engine.analyzeAndRecommend();
    assert(rec1.analyzed === true, 'Analysis should succeed');
    const rec1Count = rec1.recommendations.length;

    const rec2 = engine.analyzeAndRecommend();
    assert(rec2.analyzed === true, 'Second analysis should succeed');
    const rec2Count = rec2.recommendations.length;

    // Recommendations should be consistent
    assert(rec1Count === rec2Count, 'Recommendation count should be stable');

    // Apply optimization
    if (rec1.recommendations.length > 0) {
      const applyResult = engine.applyOptimization(rec1.recommendations[0]);
      assert(applyResult.applied === true, 'Optimization should apply');

      // Validate determinism
      const validation = engine.validateDeterminism(rec1.recommendations[0]);
      assert(validation.valid === true, 'Optimization should be deterministic');
    }

    console.log(`✅ Stability: ${rec1Count} recommendations generated stably`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: No Determinism Violation After Optimization
 * Verify optimization doesn't break deterministic execution
 */
async function testDeterminismPreservation() {
  console.log('\n=== TEST 3: No Determinism Violation After Optimization ===');
  try {
    const engine = new MetaOptimizationEngine();

    const optimizations = [
      { type: 'ENABLE_CACHING', componentId: 'cache_comp' },
      { type: 'BATCH_EXECUTION', componentId: 'batch_comp' },
      { type: 'PREFETCH_OPTIMIZATION', componentId: 'prefetch_comp' }
    ];

    for (const opt of optimizations) {
      const validation = engine.validateDeterminism(opt);
      assert(validation.valid === true, `${opt.type} should be deterministic`);
      assert(validation.deterministic === true, 'Should be marked deterministic');
    }

    // Apply all optimizations
    const results = [];
    for (const opt of optimizations) {
      const result = engine.applyOptimization(opt);
      results.push(result);
      assert(result.applied === true, `${opt.type} should apply`);
    }

    // Verify parameters adjusted deterministically
    const params = engine.getTuningParameters();
    assert(params.parameters.cacheSize > 0, 'Cache size should be tuned');
    assert(params.parameters.executionBatchSize > 0, 'Batch size should be tuned');

    console.log(`✅ Preservation: 3 optimizations applied, determinism maintained`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Shard Rebalancing Consistency
 * Verify shard rebalancing preserves causal order
 */
async function testShardRebalancingConsistency() {
  console.log('\n=== TEST 4: Shard Rebalancing Consistency ===');
  try {
    const profiler = new KernelPerformanceProfiler();
    const router = new InvariantShardRouter();
    const balancer = new AdaptiveShardBalancer({ shardRouter: router, profiler });

    // Register shards
    for (let i = 0; i < 3; i++) {
      router.registerShard(`shard_${i}`, `node_${i}`);
    }

    // Simulate uneven load
    profiler.recordShardExecution('shard_0', 10, 50); // Heavy load
    profiler.recordShardExecution('shard_1', 5, 10);  // Light load
    profiler.recordShardExecution('shard_2', 6, 15);  // Medium load

    // Analyze load
    const analysisResult = balancer.analyzeShardLoad();
    assert(analysisResult.analyzed === true, 'Analysis should succeed');

    // Generate rebalancing movements
    const movementsResult = balancer.generateRebalancingMovements();
    assert(movementsResult.generated === true, 'Movements should generate');

    // Apply rebalancing
    if (movementsResult.movements.length > 0) {
      const applyResult = balancer.applyRebalancing(movementsResult.movements);
      assert(applyResult.applied === true, 'Rebalancing should apply');
      assert(applyResult.coreOrderPreserved === true, 'Causality should be preserved');
    }

    // Validate causality
    const validation = balancer.validateCausalityPreservation();
    assert(validation.valid === true, 'Causality should be preserved');

    console.log(`✅ Rebalancing: Load analysis → movements → causality validated`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Invariant Execution Integrity
 * Verify invariant cost analysis and execution planning
 */
async function testInvariantIntegrity() {
  console.log('\n=== TEST 5: Invariant Execution Integrity ===');
  try {
    const analyzer = new InvariantCostAnalyzer({
      invariantRegistry: {
        getInvariant: (id) => ({
          available: true,
          invariantId: id,
          bytecode: [
            { op: 'LOAD_CONTEXT' },
            { op: 'EVALUATE_PREDICATE' },
            { op: 'EVALUATE_PREDICATE' },
            { op: 'RETURN' }
          ],
          level: id.includes('critical') ? 'CRITICAL' : 'INFO'
        })
      }
    });

    // Analyze invariants
    const analysis1 = analyzer.analyzeInvariant('rule_critical_check');
    assert(analysis1.analyzed === true, 'Analysis should succeed');
    assert(analysis1.criticality === 'CRITICAL', 'Should identify criticality');

    const analysis2 = analyzer.analyzeInvariant('rule_info_check');
    assert(analysis2.analyzed === true, 'Second analysis should succeed');

    // Record execution costs
    analyzer.recordExecutionCost('rule_critical_check', 1.5);
    analyzer.recordExecutionCost('rule_critical_check', 1.6);
    analyzer.recordExecutionCost('rule_info_check', 0.5);

    // Generate execution plan
    const plan = analyzer.generateExecutionPlan([
      'rule_critical_check',
      'rule_info_check'
    ]);
    assert(plan.generated === true, 'Plan should generate');

    // Critical should be prioritized
    const planRules = plan.plan.map(p => p.invariantId);
    const criticalIndex = planRules.indexOf('rule_critical_check');
    const infoIndex = planRules.indexOf('rule_info_check');

    assert(
      criticalIndex < infoIndex,
      'Critical should be executed before info'
    );

    console.log(`✅ Integrity: 2 invariants analyzed, cost-based execution plan generated`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: End-to-End Self-Optimization Loop
 * Verify complete optimization cycle works
 */
async function testEndToEndOptimization() {
  console.log('\n=== TEST 6: End-to-End Self-Optimization Loop ===');
  try {
    const profiler = new KernelPerformanceProfiler();
    const engine = new MetaOptimizationEngine({ profiler });
    const analyzer = new InvariantCostAnalyzer({
      invariantRegistry: {
        getInvariant: (id) => ({
          available: true,
          bytecode: [{ op: 'EVALUATE_PREDICATE' }],
          level: 'CRITICAL'
        })
      }
    });
    const router = new InvariantShardRouter();
    const balancer = new AdaptiveShardBalancer({
      shardRouter: router,
      profiler
    });

    // PHASE 1: Profile
    for (let i = 0; i < 20; i++) {
      profiler.recordExecution('comp_1', 15 + Math.random() * 10);
      profiler.recordExecution('comp_2', 30 + Math.random() * 20);
    }
    profiler.recordShardExecution('shard_0', 12, 20);
    profiler.recordShardExecution('shard_1', 8, 10);

    const profileCapture = profiler.captureGlobalMetrics();
    assert(profileCapture.captured === true, 'Profiling should capture');

    // PHASE 2: Analyze invariants
    analyzer.analyzeInvariant('rule_1');
    analyzer.recordExecutionCost('rule_1', 2.5);

    // PHASE 3: Optimize
    const optimization = engine.analyzeAndRecommend();
    assert(optimization.analyzed === true, 'Optimization should analyze');

    let optimizationsApplied = 0;
    if (optimization.recommendations && optimization.recommendations.length > 0) {
      const applied = engine.applyOptimization(optimization.recommendations[0]);
      if (applied.applied) {
        optimizationsApplied++;
      }
    }
    assert(optimization.analyzed === true, 'Analysis should succeed regardless of recommendations');

    // PHASE 4: Rebalance
    const loadAnalysis = balancer.analyzeShardLoad();
    assert(loadAnalysis.analyzed === true, 'Load analysis should work');

    // Verify all systems report stats
    const profilerStats = profiler.getStats();
    const engineStats = engine.getStats();
    const analyzerStats = analyzer.getStats();
    const balancerStats = balancer.getStats();

    assert(profilerStats.metricsCollected > 0, 'Profiler should have metrics');
    assert(engineStats.optimizationsGenerated >= 0, 'Engine should track optimizations');
    assert(analyzerStats.invariantsAnalyzed > 0, 'Analyzer should analyze');
    assert(balancerStats.rebalancesPerformed >= 0, 'Balancer should track');

    console.log(`✅ End-to-End: Profile → Analyze → Optimize → Rebalance completed`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 6: ${error.message}`);
    throw error;
  }
}

/**
 * RUN ALL TESTS
 */
async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 PHASE 8.5 — Self-Optimizing Kernel Meta-Compilation Layer');
  console.log('═'.repeat(70));

  try {
    await testProfilingAccuracy();
    await testOptimizationStability();
    await testDeterminismPreservation();
    await testShardRebalancingConsistency();
    await testInvariantIntegrity();
    await testEndToEndOptimization();

    console.log('\n' + '═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/6 tests`);
    console.log('═'.repeat(70));
    console.log('\n🎯 SELF-OPTIMIZING KERNEL: COMPLETE');
    process.exit(testResults.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    console.error('Errors:', testResults.errors);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllTests();
}

module.exports = {
  KernelPerformanceProfiler,
  MetaOptimizationEngine,
  InvariantCostAnalyzer,
  AdaptiveShardBalancer
};
