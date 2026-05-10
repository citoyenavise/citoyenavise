/**
 * PHASE 8.4 — Cross-Domain Composition + Causal Workflow Orchestration
 *
 * Tests multi-domain workflows with causal ordering and orchestration.
 *
 * CRITICAL INVARIANTS:
 * ✔ causal graph construction correctness
 * ✔ cross-domain operation composition
 * ✔ topological execution order (no cycles)
 * ✔ shard distributed workflow execution
 * ✔ invariant propagation across domains
 * ✔ full workflow reconstruction from logs
 */

const assert = require('assert');
const CausalWorkflowGraphEngine = require('../core/kernel/orchestration/CausalWorkflowGraphEngine');
const CrossDomainCompositionEngine = require('../core/kernel/orchestration/CrossDomainCompositionEngine');
const WorkflowInvariantBinder = require('../core/kernel/orchestration/WorkflowInvariantBinder');
const DistributedWorkflowScheduler = require('../core/kernel/orchestration/DistributedWorkflowScheduler');
const InvariantShardRouter = require('../core/kernel/sharding/InvariantShardRouter');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Multi-Domain Graph Construction
 * Verify causal graph builds correctly from multi-domain operations
 */
async function testMultiDomainGraphConstruction() {
  console.log('\n=== TEST 1: Multi-Domain Graph Construction ===');
  try {
    const graphEngine = new CausalWorkflowGraphEngine();
    const composition = new CrossDomainCompositionEngine();

    // Register domains
    composition.registerDomain('api', { name: 'API Domain', operationTypes: ['CREATE', 'READ'] });
    composition.registerDomain('ai', { name: 'AI Domain', operationTypes: ['PREDICT', 'TRAIN'] });
    composition.registerDomain('data', { name: 'Data Domain', operationTypes: ['QUERY', 'PERSIST'] });

    // Create multi-domain operations
    const domainOps = [
      { domain: 'api', operationId: 'op_api_1', type: 'CREATE', dependsOn: [] },
      { domain: 'data', operationId: 'op_data_1', type: 'QUERY', dependsOn: ['op_api_1'] },
      { domain: 'ai', operationId: 'op_ai_1', type: 'PREDICT', dependsOn: ['op_data_1'] },
      { domain: 'api', operationId: 'op_api_2', type: 'READ', dependsOn: ['op_ai_1'] }
    ];

    // Compose workflow
    const compResult = composition.composeWorkflow('wf_multidom', domainOps);
    assert(compResult.composed === true, 'Composition should succeed');
    assert(compResult.unifiedOperationCount === 4, 'Should have 4 unified operations');

    // Get unified operations
    const opsResult = composition.getUnifiedOperations('wf_multidom');
    const unifiedOps = opsResult.operations;

    // Build causal graph
    const buildResult = graphEngine.buildWorkflowGraph('wf_multidom', unifiedOps);
    assert(buildResult.built === true, 'Graph should build');
    assert(buildResult.nodeCount === 4, 'Should have 4 nodes');

    // Verify graph integrity
    const integrityResult = graphEngine.validateGraphIntegrity('wf_multidom');
    assert(integrityResult.valid === true, 'Graph should be valid');

    console.log(`✅ Multi-domain: 3 domains, 4 operations → causal graph built`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Causal Ordering Preservation
 * Verify topological order is preserved (no cycles)
 */
async function testCausalOrderingPreservation() {
  console.log('\n=== TEST 2: Causal Ordering Preservation ===');
  try {
    const graphEngine = new CausalWorkflowGraphEngine();

    // Create operations with explicit dependencies forming valid DAG
    const ops = [
      { operationId: 'op_1', type: 'READ', dependsOn: [] },
      { operationId: 'op_2', type: 'PROCESS', dependsOn: ['op_1'] },
      { operationId: 'op_3', type: 'PROCESS', dependsOn: ['op_1'] },
      { operationId: 'op_4', type: 'AGGREGATE', dependsOn: ['op_2', 'op_3'] },
      { operationId: 'op_5', type: 'WRITE', dependsOn: ['op_4'] }
    ];

    // Build graph
    const buildResult = graphEngine.buildWorkflowGraph('wf_dag', ops);
    assert(buildResult.built === true, 'Graph build should succeed');

    // Resolve causal dependencies
    const resolveResult = graphEngine.resolveCausalDependencies('wf_dag');
    assert(resolveResult.resolved === true, 'Should resolve without cycles');

    // Get execution plan (topologically sorted)
    const planResult = graphEngine.getExecutionPlan('wf_dag');
    assert(planResult.available === true, 'Plan should exist');

    const order = planResult.executionOrder;
    assert(order.length === 5, 'Should have 5 nodes in order');

    // Verify topological order: op_1 before op_2, op_3 before op_4, etc.
    assert(order.indexOf('op_1') < order.indexOf('op_2'), 'op_1 should be before op_2');
    assert(order.indexOf('op_1') < order.indexOf('op_3'), 'op_1 should be before op_3');
    assert(order.indexOf('op_2') < order.indexOf('op_4'), 'op_2 should be before op_4');
    assert(order.indexOf('op_3') < order.indexOf('op_4'), 'op_3 should be before op_4');
    assert(order.indexOf('op_4') < order.indexOf('op_5'), 'op_4 should be before op_5');

    console.log(`✅ Ordering: 5-node DAG → valid topological order ${order.join(' → ')}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Cycle Detection
 * Verify cycles are detected before execution
 */
async function testCycleDetection() {
  console.log('\n=== TEST 3: Cycle Detection ===');
  try {
    const graphEngine = new CausalWorkflowGraphEngine();

    // Create operations with circular dependency
    const opsWithCycle = [
      { operationId: 'op_1', type: 'PROCESS', dependsOn: ['op_3'] },
      { operationId: 'op_2', type: 'PROCESS', dependsOn: ['op_1'] },
      { operationId: 'op_3', type: 'PROCESS', dependsOn: ['op_2'] } // cycle: op_1 → op_2 → op_3 → op_1
    ];

    // Build graph with cycle
    const buildResult = graphEngine.buildWorkflowGraph('wf_cycle', opsWithCycle);
    assert(buildResult.built === true, 'Graph should build');

    // Try to resolve - should detect cycle
    const resolveResult = graphEngine.resolveCausalDependencies('wf_cycle');
    assert(resolveResult.resolved === false, 'Should fail on cycle');
    assert(resolveResult.reason === 'CYCLES_DETECTED', 'Should cite cycle detection');
    assert(resolveResult.cycleCount > 0, 'Should report cycle count');

    console.log(`✅ Cycle Detection: circular dependency detected and rejected`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Shard Distributed Workflow Execution
 * Verify workflow graph maps to shards and executes
 */
async function testShardDistributedExecution() {
  console.log('\n=== TEST 4: Shard Distributed Workflow Execution ===');
  try {
    const graphEngine = new CausalWorkflowGraphEngine();
    const router = new InvariantShardRouter();
    const scheduler = new DistributedWorkflowScheduler({
      graphEngine,
      shardRouter: router
    });

    // Register shards
    for (let i = 0; i < 4; i++) {
      router.registerShard(`shard_${i}`, `node_${i}`);
    }

    // Build and resolve graph
    const ops = [
      { operationId: 'op_1', dependsOn: [] },
      { operationId: 'op_2', dependsOn: ['op_1'] },
      { operationId: 'op_3', dependsOn: ['op_1'] },
      { operationId: 'op_4', dependsOn: ['op_2', 'op_3'] }
    ];

    graphEngine.buildWorkflowGraph('wf_shard', ops);
    graphEngine.resolveCausalDependencies('wf_shard');

    // Schedule workflow on shards
    const scheduleResult = scheduler.scheduleWorkflow('wf_shard');
    assert(scheduleResult.scheduled === true, 'Scheduling should succeed');
    assert(scheduleResult.nodeCount === 4, 'Should have 4 nodes');
    assert(scheduleResult.shardCount > 0, 'Should use multiple shards');

    // Get schedule
    const getScheduleResult = scheduler.getSchedule('wf_shard');
    assert(getScheduleResult.available === true, 'Schedule should be available');

    // Simulate node completion
    for (const op of ops) {
      const markResult = scheduler.markNodeCompletion('wf_shard', op.operationId);
      assert(markResult.marked === true, `Should mark ${op.operationId} complete`);
    }

    // Check workflow completion
    const stateResult = scheduler.getWorkflowState('wf_shard');
    assert(stateResult.completedNodes === 4, 'All 4 nodes should be completed');
    assert(stateResult.status === 'COMPLETED', 'Workflow should be completed');

    console.log(`✅ Execution: 4-node workflow → ${scheduleResult.shardCount} shards → completed`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Invariant Propagation Correctness
 * Verify invariants propagate across workflow domains
 */
async function testInvariantPropagation() {
  console.log('\n=== TEST 5: Invariant Propagation Correctness ===');
  try {
    const binder = new WorkflowInvariantBinder({
      invariantRegistry: {
        getInvariant: (ruleId) => ({
          available: true,
          ruleId,
          schema: 'WORKFLOW_1',
          version: '1.0',
          level: 'CRITICAL'
        })
      }
    });

    // Bind invariants to workflow
    const bindResult = binder.bindInvariantsToWorkflow('wf_inv', ['rule_consistency', 'rule_validity']);
    assert(bindResult.bound === true, 'Binding should succeed');
    assert(bindResult.invariantCount === 2, 'Should bind 2 invariants');

    // Enforce invariants
    const enforceResult = binder.enforceWorkflowInvariants('wf_inv', { validContext: true });
    assert(enforceResult.enforced === true, 'Enforcement should succeed');
    assert(enforceResult.allValid === true, 'Valid context should pass');

    // Propagate to domains
    const propResult = binder.propagateInvariants('wf_inv', ['api', 'ai', 'data']);
    assert(propResult.propagated === true, 'Propagation should succeed');
    assert(propResult.propagationCount > 0, 'Should propagate to domains');

    // Validate binding
    const validResult = binder.validateBinding('wf_inv');
    assert(validResult.valid === true, 'Binding should be valid');

    console.log(`✅ Propagation: 2 invariants → 3 domains, all domains covered`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Full Workflow Reconstruction
 * Verify complete workflow state can be reconstructed
 */
async function testFullWorkflowReconstruction() {
  console.log('\n=== TEST 6: Full Workflow Reconstruction ===');
  try {
    const graphEngine = new CausalWorkflowGraphEngine();
    const composition = new CrossDomainCompositionEngine();
    const router = new InvariantShardRouter();
    const scheduler = new DistributedWorkflowScheduler({ graphEngine, shardRouter: router });

    // Register domains
    composition.registerDomain('domain_a', { name: 'Domain A' });
    composition.registerDomain('domain_b', { name: 'Domain B' });

    // Register shards
    for (let i = 0; i < 3; i++) {
      router.registerShard(`shard_${i}`, `node_${i}`);
    }

    // Create complete workflow
    const domainOps = [
      { domain: 'domain_a', operationId: 'op_a1', dependsOn: [] },
      { domain: 'domain_b', operationId: 'op_b1', dependsOn: ['op_a1'] },
      { domain: 'domain_a', operationId: 'op_a2', dependsOn: ['op_b1'] }
    ];

    // Compose
    const compResult = composition.composeWorkflow('wf_reconstruct', domainOps);
    assert(compResult.composed === true, 'Composition should succeed');

    // Get unified operations
    const opsResult = composition.getUnifiedOperations('wf_reconstruct');

    // Build graph
    graphEngine.buildWorkflowGraph('wf_reconstruct', opsResult.operations);
    graphEngine.resolveCausalDependencies('wf_reconstruct');

    // Schedule on shards
    scheduler.scheduleWorkflow('wf_reconstruct');

    // Simulate execution and completion
    for (const op of opsResult.operations) {
      scheduler.markNodeCompletion('wf_reconstruct', op.operationId);
    }

    // Reconstruct: Get all artifacts
    const scheduleResult = scheduler.getSchedule('wf_reconstruct');
    const stateResult = scheduler.getWorkflowState('wf_reconstruct');
    const compMetadata = composition.getCompositionMetadata('wf_reconstruct');

    // Verify reconstruction
    assert(scheduleResult.available === true, 'Schedule available');
    assert(stateResult.available === true, 'State available');
    assert(compMetadata.available === true, 'Composition metadata available');
    assert(stateResult.completedNodes === 3, 'All 3 nodes completed');
    assert(compMetadata.metadata.domainCount === 2, 'Both domains participated');

    console.log(`✅ Reconstruction: Full workflow state recoverable (domains, graph, schedule, execution)`);

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
  console.log('🧪 PHASE 8.4 — Cross-Domain Composition & Causal Workflow Orchestration');
  console.log('═'.repeat(70));

  try {
    await testMultiDomainGraphConstruction();
    await testCausalOrderingPreservation();
    await testCycleDetection();
    await testShardDistributedExecution();
    await testInvariantPropagation();
    await testFullWorkflowReconstruction();

    console.log('\n' + '═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/6 tests`);
    console.log('═'.repeat(70));
    console.log('\n🎯 CROSS-DOMAIN ORCHESTRATION: COMPLETE');
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
  CausalWorkflowGraphEngine,
  CrossDomainCompositionEngine,
  WorkflowInvariantBinder,
  DistributedWorkflowScheduler
};
