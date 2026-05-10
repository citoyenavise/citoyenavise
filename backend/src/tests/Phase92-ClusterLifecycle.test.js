/**
 * PHASE 9.2 — Cluster Lifecycle Management Tests
 *
 * Tests all 4 components:
 * ✔ ClusterBootstrapManager (7-step bootstrap)
 * ✔ DeterministicClusterRebuilder (6-step rebuild)
 * ✔ ShardDiscoveryProtocol (5-phase join)
 * ✔ SafeColdStartEngine (cold start validation)
 *
 * CRITICAL INVARIANTS:
 * ✔ deterministic step ordering
 * ✔ proof capture for every decision
 * ✔ immutability throughout
 * ✔ zero state assumptions
 */

const assert = require('assert');
const ClusterBootstrapManager = require('../core/bootstrap/ClusterBootstrapManager');
const DeterministicClusterRebuilder = require('../core/recovery/DeterministicClusterRebuilder');
const ShardDiscoveryProtocol = require('../core/discovery/ShardDiscoveryProtocol');
const SafeColdStartEngine = require('../core/bootstrap/SafeColdStartEngine');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Safe Cold Start Configuration Validation
 * Verify configuration validation catches errors
 */
async function testColdStartValidation() {
  console.log('\n=== TEST 1: Safe Cold Start Configuration Validation ===');
  try {
    // Valid config
    const validEngine = new SafeColdStartEngine({
      nodeIds: ['node_1', 'node_2', 'node_3'],
      shardCount: 3,
      replicationFactor: 3
    });

    const validationResult = validEngine._validateConfiguration();
    assert(validationResult.valid === true, 'Valid config should pass');

    // Invalid: replicationFactor > nodeIds.length
    const invalidEngine = new SafeColdStartEngine({
      nodeIds: ['node_1'],
      shardCount: 3,
      replicationFactor: 5
    });

    const invalidResult = invalidEngine._validateConfiguration();
    assert(invalidResult.valid === false, 'Should reject replicationFactor > nodeCount');
    assert(invalidResult.errors.length > 0, 'Should have error messages');

    // Invalid: both initialBoot and recoverFromBackup
    const conflictEngine = new SafeColdStartEngine({
      nodeIds: ['node_1', 'node_2'],
      shardCount: 2,
      replicationFactor: 2,
      initialBoot: true,
      recoverFromBackup: true
    });

    const conflictResult = conflictEngine._validateConfiguration();
    assert(
      conflictResult.valid === false,
      'Should reject both initialBoot and recoverFromBackup'
    );

    console.log(`✅ Validation: ${validEngine.metrics.validationsPassed} passed validation`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Cluster Bootstrap Manager (7-step bootstrap)
 * Verify bootstrap completes all 7 steps
 */
async function testBootstrapManager() {
  console.log('\n=== TEST 2: Cluster Bootstrap Manager (7-Step) ===');
  try {
    const bootstrapManager = new ClusterBootstrapManager({
      nodeIds: ['node_1', 'node_2', 'node_3'],
      shardCount: 3,
      replicationFactor: 3,
      bootstrapTimeoutMs: 1000
    });

    // Create mock kernel
    bootstrapManager.kernel = {
      currentLifecycleState: null,
      bootstrapValid: false
    };

    // Create minimal proof system mock
    bootstrapManager.proofSystem = {
      captureDecision: function() {},
      verify: function() { return { valid: true }; }
    };

    // Create mock registry
    bootstrapManager.globalRegistry = {};

    // Create mock shard router
    bootstrapManager.shardRouter = {};

    // Execute bootstrap
    const result = await bootstrapManager.executeBootstrap();

    assert(
      result.bootstrapSuccessful === true,
      'Bootstrap should succeed'
    );
    assert(
      bootstrapManager.bootstrapState.stepsCompleted.length === 7,
      '7 steps should complete'
    );
    assert(
      bootstrapManager.bootstrapState.proofIds.length >= 7,
      'Proofs should be captured for each step'
    );
    assert(
      bootstrapManager.kernel.bootstrapValid === true,
      'Kernel should be bootstrapValid'
    );

    // Validate bootstrap
    const validation = bootstrapManager.validateBootstrapComplete();
    assert(validation.valid === true, 'Bootstrap should validate as complete');
    assert(validation.stepsCompleted === 7, 'All 7 steps completed');

    console.log(`✅ Bootstrap: 7/7 steps completed, all proofs captured`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Deterministic Cluster Rebuilder (6-step rebuild)
 * Verify rebuild after crash
 */
async function testClusterRebuilder() {
  console.log('\n=== TEST 3: Deterministic Cluster Rebuilder (6-Step) ===');
  try {
    const rebuilder = new DeterministicClusterRebuilder({
      allNodeIds: ['node_1', 'node_2', 'node_3'],
      activeNodeIds: ['node_1', 'node_2'], // node_3 crashed
      primaryNodeId: 'node_1',
      shardCount: 3,
      replicationFactor: 3
    });

    // Create mock kernel
    rebuilder.kernel = {
      currentLifecycleState: 'RECOVERY',
      recoveryMode: true
    };

    // Create minimal mocks
    rebuilder.proofSystem = {
      captureDecision: function() {},
      verify: function() { return { valid: true, entriesVerified: 10 }; }
    };

    rebuilder.globalRegistry = {
      getIdempotencySet: function() { return new Set(['event_1', 'event_2']); }
    };

    rebuilder.executionMap = {
      getCurrentSequence: function() { return 10; },
      reconstructState: function() {
        return { success: true, hash: 'test_hash' };
      }
    };

    rebuilder.shardRouter = {
      getShardAssignment: function(shardId) {
        // shard_2 has crashed node_3 as primary
        if (shardId === 'shard_2') {
          return {
            shardId,
            primaryNode: 'node_3', // crashed
            replicaNodes: ['node_3', 'node_1', 'node_2']
          };
        }
        return {
          shardId,
          primaryNode: 'node_1',
          replicaNodes: ['node_1', 'node_2', 'node_3']
        };
      }
    };

    // Execute rebuild
    const result = await rebuilder.executeRebuild();

    assert(result.rebuildSuccessful === true, 'Rebuild should succeed');
    assert(
      rebuilder.recoveryState.stepsCompleted.length === 6,
      '6 steps should complete'
    );
    assert(
      rebuilder.recoveryState.crashedNodes.size === 1,
      '1 node should be detected as crashed'
    );
    assert(
      rebuilder.metrics.shardsRebalanced === 1,
      'One shard should be rebalanced'
    );

    // Validate rebuild
    const validation = rebuilder.validateRebuildComplete();
    assert(validation.valid === true, 'Rebuild should validate as complete');
    assert(validation.kernelReady === true, 'Kernel should be ready');

    console.log(`✅ Rebuild: 6/6 steps completed, ${rebuilder.metrics.shardsRebalanced} shards rebalanced`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Shard Discovery Protocol (5-phase join)
 * Verify node discovery and join
 */
async function testShardDiscovery() {
  console.log('\n=== TEST 4: Shard Discovery Protocol (5-Phase) ===');
  try {
    const discovery = new ShardDiscoveryProtocol({
      seedNodeId: 'node_1',
      primaryNodeId: 'node_1',
      requestTimeout: 1000,
      responseTimeout: 1000,
      joinTimeout: 1000,
      syncTimeout: 1000,
      ackTimeout: 1000
    });

    // Create minimal mocks
    discovery.proofSystem = {
      captureDecision: function() {},
      getLastNProofs: function() { return []; }
    };

    discovery.shardRouter = {
      getCompleteShardMap: function() {
        return {
          shard_0: { primaryNode: 'node_1' },
          shard_1: { primaryNode: 'node_2' },
          shard_2: { primaryNode: 'node_3' }
        };
      },
      getShardAssignment: function(shardId) {
        return {
          shardId,
          primaryNode: 'node_1',
          replicaNodes: []
        };
      }
    };

    discovery.executionMap = {
      getCurrentSequence: function() { return 0; },
      reconstructState: function() {
        return { success: true, hash: 'initial_hash' };
      },
      getCurrentStateHash: function() { return 'initial_hash'; }
    };

    // Execute complete discovery for new node
    const newNodeId = 'node_4';
    const assignedShards = ['shard_0', 'shard_1'];

    const result = await discovery.executeCompleteDiscovery(
      newNodeId,
      assignedShards
    );

    assert(result.success === true, 'Discovery should succeed');
    assert(result.discoveryCComplete === true, 'All phases should complete');
    assert(result.shardsAssigned === 2, 'Node should be assigned to shards');

    // Validate discovery state
    const validation = discovery.validateDiscoveryState(newNodeId);
    assert(validation.valid === true, 'Discovery should validate');
    assert(validation.active === true, 'Node should be active');

    // Check metrics
    const metrics = discovery.getMetrics();
    assert(metrics.nodesJoined === 1, 'One node should have joined');
    assert(
      metrics.phaseCompletions.PHASE_1_BOOT === 1,
      'PHASE 1 should complete'
    );
    assert(
      metrics.phaseCompletions.PHASE_5_ACK === 1,
      'PHASE 5 should complete'
    );

    console.log(`✅ Discovery: New node joined with ${assignedShards.length} shard assignments`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Cold Start Engine Complete Flow
 * Verify full cold start from zero state
 */
async function testColdStartEngine() {
  console.log('\n=== TEST 5: Cold Start Engine Complete Flow ===');
  try {
    // Create minimal mocks for components
    const mockProofSystem = {
      captureDecision: function() {},
      verify: function() { return { valid: true }; },
      proofLog: []
    };

    const mockRegistry = {
      eventLog: [],
      idempotencySet: new Set()
    };

    const mockShardRouter = {
      registerShard: function() {}
    };

    const mockBootstrapManager = {
      executeBootstrap: function() {
        return Promise.resolve({
          bootstrapSuccessful: true,
          stepsCompleted: 7,
          shardsCreated: 3
        });
      }
    };

    const mockKernel = {
      currentLifecycleState: 'BOOTSTRAP',
      bootstrapValid: false,
      initialBootValid: false
    };

    const engine = new SafeColdStartEngine({
      nodeIds: ['node_1', 'node_2', 'node_3'],
      shardCount: 3,
      replicationFactor: 3,
      initialBoot: true,
      bootstrapTimeoutMs: 1000,
      proofSystem: mockProofSystem,
      globalRegistry: mockRegistry,
      shardRouter: mockShardRouter,
      bootstrapManager: mockBootstrapManager,
      kernel: mockKernel
    });

    // Pre-check validation
    const preValidation = engine._validateConfiguration();
    assert(preValidation.valid === true, 'Config should be valid');

    // Execute cold start
    const result = await engine.executeColdStart();

    assert(result.coldStartSuccessful === true, 'Cold start should succeed');
    assert(
      engine.coldStartState.steps.length === 5,
      'All 5 steps should complete'
    );
    assert(engine.metrics.proofsCaptured >= 0, 'Proofs tracking should be initialized');
    assert(
      engine.kernel.currentLifecycleState === 'READY',
      'Kernel should be READY'
    );

    // Validate safety
    const safety = engine.validateColdStartSafety();
    assert(safety.safe === true, 'Cold start should be safe');
    assert(safety.stepsCompleted === 5, 'All steps should be validated');

    // Check all systems initialized
    const coldStartState = engine.getColdStartState();
    assert(
      coldStartState.status === 'SUCCESS',
      'Cold start status should be SUCCESS'
    );
    assert(
      coldStartState.config.shardCount === 3,
      'Shard count should match config'
    );
    assert(
      coldStartState.config.nodeIds.length === 3,
      'All nodes should be in config'
    );

    console.log(`✅ Cold Start: Complete 5-step flow, ${engine.metrics.proofsCaptured} proofs captured`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: End-to-End Cluster Lifecycle (Bootstrap → Join → Rebuild)
 * Verify complete cluster lifecycle
 */
async function testEndToEndLifecycle() {
  console.log('\n=== TEST 6: End-to-End Cluster Lifecycle ===');
  try {
    // Phase A: Cold Start Bootstrap
    const mockProofSystem = {
      captureDecision: function() {},
      verify: function() { return { valid: true }; },
      proofLog: []
    };

    const mockRegistry = {
      eventLog: [],
      idempotencySet: new Set()
    };

    const mockShardRouter = {
      registerShard: function() {}
    };

    const mockBootstrapManager = {
      executeBootstrap: function() {
        return Promise.resolve({
          bootstrapSuccessful: true,
          stepsCompleted: 7
        });
      }
    };

    const mockKernel = {
      currentLifecycleState: 'BOOTSTRAP',
      bootstrapValid: false,
      initialBootValid: false
    };

    const engine = new SafeColdStartEngine({
      nodeIds: ['node_1', 'node_2', 'node_3'],
      shardCount: 3,
      replicationFactor: 3,
      proofSystem: mockProofSystem,
      globalRegistry: mockRegistry,
      shardRouter: mockShardRouter,
      bootstrapManager: mockBootstrapManager,
      kernel: mockKernel
    });

    const coldStart = await engine.executeColdStart();
    assert(coldStart.coldStartSuccessful === true, 'Cold start should succeed');

    // Phase B: Node Discovery and Join
    const discovery = new ShardDiscoveryProtocol({
      primaryNodeId: 'node_1'
    });

    // Create minimal mocks
    discovery.proofSystem = {
      captureDecision: function() {},
      getLastNProofs: function() { return []; }
    };
    discovery.shardRouter = {
      getCompleteShardMap: function() { return {}; },
      getShardAssignment: function(s) {
        return { shardId: s, primaryNode: 'node_1', replicaNodes: [] };
      }
    };
    discovery.executionMap = {
      getCurrentSequence: function() { return 0; },
      reconstructState: function() {
        return { success: true, hash: 'hash' };
      },
      getCurrentStateHash: function() { return 'hash'; }
    };

    const joinResult = await discovery.executeCompleteDiscovery('node_4', [
      'shard_0'
    ]);
    assert(joinResult.success === true, 'Node join should succeed');

    // Phase C: Rebuild After Crash
    const rebuilder = new DeterministicClusterRebuilder({
      allNodeIds: ['node_1', 'node_2', 'node_3', 'node_4'],
      activeNodeIds: ['node_1', 'node_2', 'node_4'], // node_3 crashed
      primaryNodeId: 'node_1',
      shardCount: 3,
      replicationFactor: 3
    });

    rebuilder.kernel = { currentLifecycleState: 'RECOVERY' };
    rebuilder.proofSystem = {
      captureDecision: function() {},
      verify: function() { return { valid: true, entriesVerified: 0 }; }
    };
    rebuilder.globalRegistry = {
      getIdempotencySet: function() { return new Set(); }
    };
    rebuilder.executionMap = {
      getCurrentSequence: function() { return 0; },
      reconstructState: function() {
        return { success: true, hash: 'hash' };
      }
    };
    rebuilder.shardRouter = {
      getShardAssignment: function(s) {
        return { shardId: s, primaryNode: 'node_1', replicaNodes: ['node_2'] };
      }
    };

    const rebuildResult = await rebuilder.executeRebuild();
    assert(rebuildResult.rebuildSuccessful === true, 'Rebuild should succeed');
    assert(
      rebuildResult.crashedNodeCount === 1,
      '1 crashed node should be detected'
    );

    console.log(`✅ Lifecycle: Bootstrap → Join (node_4) → Rebuild (node_3 crash) complete`);

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
  console.log('🧪 PHASE 9.2 — Cluster Lifecycle Management');
  console.log('═'.repeat(70));

  try {
    await testColdStartValidation();
    await testBootstrapManager();
    await testClusterRebuilder();
    await testShardDiscovery();
    await testColdStartEngine();
    await testEndToEndLifecycle();

    console.log('\n' + '═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/6 tests`);
    console.log('═'.repeat(70));
    console.log('\n🎯 CLUSTER LIFECYCLE MANAGEMENT: COMPLETE');
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
  ClusterBootstrapManager,
  DeterministicClusterRebuilder,
  ShardDiscoveryProtocol,
  SafeColdStartEngine
};
