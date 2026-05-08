/**
 * PHASE 7.1 — Distributed Batch Processing Across Cluster
 *
 * Tests DistributedBatchEngine with multi-node scenarios.
 * CRITICAL INVARIANTS:
 * ✔ Distributed batch NEVER influences Real-Time decisions
 * ✔ Routing is deterministic (same decisionId → same node)
 * ✔ Node crash triggers redistribution
 * ✔ Cluster metrics aggregate correctly
 * ✔ Real-Time chains remain valid after cluster operations
 */

const assert = require('assert');
const DistributedBatchEngine = require('../core/governance/enforcement/DistributedBatchEngine');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Node Registration
 * Verify that nodes can be registered and cluster state is correct
 */
async function testNodeRegistration() {
  console.log('\n=== TEST 1: Node Registration ===');
  try {
    const engine = new DistributedBatchEngine({ shardCount: 3 });

    // Register 3 nodes
    const reg1 = engine.registerNode('batch-node-1');
    const reg2 = engine.registerNode('batch-node-2');
    const reg3 = engine.registerNode('batch-node-3');

    assert(reg1.registered === true, 'Node 1 should be registered');
    assert(reg2.registered === true, 'Node 2 should be registered');
    assert(reg3.registered === true, 'Node 3 should be registered');

    // Check cluster status
    const status = engine.getClusterStatus();
    assert(status.totalNodes === 3, `Should have 3 nodes, got ${status.totalNodes}`);
    assert(status.activeNodes === 3, `Should have 3 active nodes, got ${status.activeNodes}`);

    // Check shard distribution
    const distribution = Object.values(status.shardOwnership).filter((v) => v !== null);
    assert(
      distribution.length === 3,
      `All ${engine.shardCount} shards should be assigned, got ${distribution.length}`
    );

    console.log(
      `✅ Registered 3 nodes: ${status.activeNodes}/${status.totalNodes} active, ${distribution.length}/${engine.shardCount} shards assigned`
    );
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Consistent Hash Routing
 * Verify that routing is deterministic
 */
async function testConsistentHashRouting() {
  console.log('\n=== TEST 2: Consistent Hash Routing ===');
  try {
    const engine = new DistributedBatchEngine({ shardCount: 3 });
    engine.registerNode('batch-node-1');
    engine.registerNode('batch-node-2');
    engine.registerNode('batch-node-3');

    // Route the same decision 5 times — should always go to same node
    const decisionId = 'decision-consistency-test-1234';
    const routes = [];
    for (let i = 0; i < 5; i++) {
      const route = engine._routeDecision(decisionId);
      routes.push(route.nodeId);
    }

    // All routes should be identical
    const uniqueRoutes = new Set(routes);
    assert(
      uniqueRoutes.size === 1,
      `Decision should always route to same node, got ${uniqueRoutes.size} different nodes`
    );

    console.log(`✅ Deterministic routing verified: decision → ${routes[0]} (5/5 consistent)`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Batch Distribution Across Nodes
 * Verify that decisions are distributed across multiple nodes
 */
async function testBatchDistributionAcrossNodes() {
  console.log('\n=== TEST 3: Batch Distribution Across Nodes ===');
  try {
    const engine = new DistributedBatchEngine({ shardCount: 3 });
    engine.registerNode('batch-node-1');
    engine.registerNode('batch-node-2');
    engine.registerNode('batch-node-3');

    // Capture 60 decisions with different IDs
    const nodeDistribution = { 'batch-node-1': 0, 'batch-node-2': 0, 'batch-node-3': 0 };
    for (let i = 0; i < 60; i++) {
      const result = engine.captureDistributed({
        module: `Module${i}`,
        action: 'testAction',
        ruleEvaluated: 'test_rule',
        input: { decisionId: i },
        result: { valid: i % 3 !== 0 },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - 10
      });
      nodeDistribution[result.nodeId]++;
    }

    // Verify all nodes received at least some decisions
    assert(
      nodeDistribution['batch-node-1'] > 0,
      'Node 1 should have received decisions'
    );
    assert(
      nodeDistribution['batch-node-2'] > 0,
      'Node 2 should have received decisions'
    );
    assert(
      nodeDistribution['batch-node-3'] > 0,
      'Node 3 should have received decisions'
    );

    console.log(
      `✅ Distribution verified: Node1=${nodeDistribution['batch-node-1']}, Node2=${nodeDistribution['batch-node-2']}, Node3=${nodeDistribution['batch-node-3']}`
    );
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Node Crash Redistribution
 * Verify that crashing a node redistributes its workload
 */
async function testNodeCrashRedistribution() {
  console.log('\n=== TEST 4: Node Crash Redistribution ===');
  try {
    const engine = new DistributedBatchEngine({ shardCount: 3 });
    engine.registerNode('batch-node-1');
    engine.registerNode('batch-node-2');
    engine.registerNode('batch-node-3');

    // Get initial distribution
    const statusBefore = engine.getClusterStatus();
    assert(statusBefore.activeNodes === 3, 'Should have 3 active nodes before crash');

    // Simulate crash of node-2
    const crashResult = engine.simulateNodeCrash('batch-node-2');
    assert(crashResult.crashed === true, 'Crash should succeed');
    assert(crashResult.redistributed > 0, 'Shards should be redistributed');

    // Check after crash
    const statusAfter = engine.getClusterStatus();
    assert(statusAfter.activeNodes === 2, `Should have 2 active nodes after crash, got ${statusAfter.activeNodes}`);
    assert(statusAfter.failedNodes === 1, 'Should have 1 failed node');

    // Try to route to the crashed node's original shard — should fallback
    const nodeBeforeCrash = engine._routeDecision('shard-1-test');
    assert(nodeBeforeCrash.nodeId !== 'batch-node-2', 'Crashed node should not receive routing');

    console.log(`✅ Failover verified: crashed node redistributed ${crashResult.redistributed} shards`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Cluster Metrics Aggregation
 * Verify that metrics are correctly aggregated across nodes
 */
async function testClusterMetricsAggregation() {
  console.log('\n=== TEST 5: Cluster Metrics Aggregation ===');
  try {
    const engine = new DistributedBatchEngine({ shardCount: 3 });
    engine.registerNode('batch-node-1');
    engine.registerNode('batch-node-2');
    engine.registerNode('batch-node-3');

    // Capture 30 decisions
    for (let i = 0; i < 30; i++) {
      engine.captureDistributed({
        module: `Module${i}`,
        action: 'validateModule',
        ruleEvaluated: 'test_rule',
        input: { i },
        result: { valid: i % 5 !== 0 }, // 6 violations (20%), 24 successes
        severity: i % 5 !== 0 ? 'INFO' : 'VIOLATION',
        enforcementLayer: 'TEST',
        startTime: Date.now() - 10
      });
    }

    // Get cluster metrics
    const metrics = engine.getClusterMetrics();

    assert(metrics.clusterTotals.totalCaptured === 30, `Should capture 30 total, got ${metrics.clusterTotals.totalCaptured}`);
    assert(metrics.clusterTotals.totalViolations === 6, `Should have 6 violations, got ${metrics.clusterTotals.totalViolations}`);
    assert(metrics.isAuthoritative === false, 'Batch metrics must never be authoritative');
    assert(
      metrics.clusterStatus.activeNodes === 3,
      `Should have 3 active nodes, got ${metrics.clusterStatus.activeNodes}`
    );

    console.log(
      `✅ Metrics aggregated: ${metrics.clusterTotals.totalCaptured} total, ${metrics.clusterTotals.totalViolations} violations, ${metrics.clusterStatus.activeNodes} active nodes`
    );
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Real-Time Isolation After Cluster Operations
 * Verify that Real-Time chains remain valid even after batch cluster ops
 */
async function testRealTimeIsolationAfterClusterOps() {
  console.log('\n=== TEST 6: Real-Time Isolation After Cluster Ops ===');
  try {
    const engine = new DistributedBatchEngine({ shardCount: 3 });
    engine.registerNode('batch-node-1');
    engine.registerNode('batch-node-2');
    engine.registerNode('batch-node-3');

    // Capture initial decisions
    for (let i = 0; i < 10; i++) {
      engine.captureDistributed({
        module: 'TestModule',
        action: 'validateModule',
        ruleEvaluated: 'test_rule',
        input: { i },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - 10
      });
    }

    // Verify all real-time chains before crash
    for (const [nodeId, node] of engine.nodes) {
      const verify = node.proofSystem.verify();
      assert(verify.valid === true, `Node ${nodeId} chain should be valid before crash`);
    }

    // Simulate node crash + batch distribution after
    engine.simulateNodeCrash('batch-node-2');

    // Capture more decisions (routes to remaining nodes)
    for (let i = 10; i < 20; i++) {
      engine.captureDistributed({
        module: 'TestModule',
        action: 'validateModule',
        ruleEvaluated: 'test_rule',
        input: { i },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - 10
      });
    }

    // Verify all real-time chains after crash + distribution
    for (const [nodeId, node] of engine.nodes) {
      const verify = node.proofSystem.verify();
      if (node.isAlive()) {
        assert(
          verify.valid === true,
          `Active node ${nodeId} chain should be valid after crash and distribution`
        );
      }
    }

    // Consolidate proofs — should succeed
    const consolidated = engine.consolidateClusterProofs();
    assert(consolidated.rootHash !== null, 'Should produce a root hash');
    assert(consolidated.isAuthoritative === false, 'Consolidation must not be authoritative');

    console.log(`✅ Real-Time isolation verified: chains valid after cluster operations`);
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
  console.log('🧪 PHASE 7.1 — Distributed Batch Processing Across Cluster');
  console.log('═'.repeat(70));

  try {
    await testNodeRegistration();
    await testConsistentHashRouting();
    await testBatchDistributionAcrossNodes();
    await testNodeCrashRedistribution();
    await testClusterMetricsAggregation();
    await testRealTimeIsolationAfterClusterOps();

    console.log('\n' + '═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/6 tests`);
    console.log('═'.repeat(70));
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

module.exports = { DistributedBatchEngine };
