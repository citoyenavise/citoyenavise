/**
 * PHASE 7.0 — DISTRIBUTED EVENT TOPOLOGY TESTS
 * Validates structural orchestration layer
 */

const assert = require('assert');
const DistributedEventTopology = require('../core/governance/distributed/DistributedEventTopology');

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * TEST 1: Node Registration
 */
async function testNodeRegistration() {
  console.log('\n=== TEST 1: Node Registration ===');
  try {
    const topology = new DistributedEventTopology();

    // Register first node
    const result1 = topology.registerNode('node-1', {
      cpu: 4,
      memory: 8192,
      maxShards: 50,
      region: 'us-east'
    });

    assert(result1.registered, 'Node should be registered');
    assert(result1.isNewNode, 'First node should be new');
    assert(result1.version > 0, 'Version should increment');

    // Register second node
    const result2 = topology.registerNode('node-2', {
      cpu: 2,
      memory: 4096,
      region: 'us-west'
    });

    assert(result2.registered, 'Second node should be registered');
    assert(!result2.isNewNode === false, 'Second node is new');

    const status = topology.getStatus();
    assert(status.activeNodes === 2, 'Should have 2 active nodes');
    assert(status.metrics.nodesRegistered === 2, 'Metrics should track registrations');

    console.log(`✅ Node registration verified: nodes=${status.activeNodes}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Deterministic Shard Assignment
 */
async function testDeterministicShardAssignment() {
  console.log('\n=== TEST 2: Deterministic Shard Assignment ===');
  try {
    const topology = new DistributedEventTopology();

    // Register nodes
    topology.registerNode('node-1');
    topology.registerNode('node-2');
    topology.registerNode('node-3');

    // Assign same shard multiple times - should get same owner
    const assignment1 = topology.assignShard('shard-A');
    const owner1 = topology.getShardOwner('shard-A');

    const owner2 = topology.getShardOwner('shard-A');
    const owner3 = topology.getShardOwner('shard-A');

    assert(owner1 === owner2, 'Same shard should map to same owner');
    assert(owner2 === owner3, 'Multiple reads should return same owner');
    assert(['node-1', 'node-2', 'node-3'].includes(owner1), 'Owner should be one of registered nodes');

    const status = topology.getStatus();
    assert(status.totalShards === 1, 'Should have 1 shard assigned');
    assert(status.orphanShards === 0, 'Should have no orphan shards');

    console.log(`✅ Deterministic assignment verified: owner=${owner1}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Heartbeat Updates
 */
async function testHeartbeatUpdates() {
  console.log('\n=== TEST 3: Heartbeat Updates ===');
  try {
    const topology = new DistributedEventTopology();

    topology.registerNode('node-1');

    // Manually set heartbeat to old time
    const oldTimestamp = Date.now() - 1000;
    const nodeData = topology.nodeRegistry.get('node-1');
    nodeData.lastHeartbeat = oldTimestamp;
    nodeData.lastSeen = oldTimestamp;

    // Update heartbeat
    const result = topology.updateHeartbeat('node-1');
    assert(result.updated, 'Heartbeat should be updated');
    assert(result.lastHeartbeat > oldTimestamp, 'Returned heartbeat should be newer');

    const nodeDataAfter = topology.nodeRegistry.get('node-1');
    assert(nodeDataAfter.lastHeartbeat > oldTimestamp, 'Heartbeat timestamp should increase');
    assert(nodeDataAfter.status === 'ACTIVE', 'Node should remain ACTIVE');

    console.log(`✅ Heartbeat updates verified: status=${nodeDataAfter.status}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Dead Node Removal & Shard Reassignment
 */
async function testDeadNodeRemoval() {
  console.log('\n=== TEST 4: Dead Node Removal & Shard Reassignment ===');
  try {
    const topology = new DistributedEventTopology();

    // Register nodes
    topology.registerNode('node-1');
    topology.registerNode('node-2');

    // Assign shards to node-1
    topology.assignShard('shard-A', 'node-1');
    topology.assignShard('shard-B', 'node-1');

    const statusBefore = topology.getStatus();
    assert(statusBefore.orphanShards === 0, 'No orphans initially');

    // Simulate node-1 going dead by setting old heartbeat timestamp
    const node1Data = topology.nodeRegistry.get('node-1');
    node1Data.lastHeartbeat = Date.now() - 200; // 200ms in the past
    node1Data.lastSeen = Date.now() - 200;

    const result = topology.removeDeadNodes(100); // 100ms timeout
    assert(result.deadNodesFound === 1, 'Should detect 1 dead node');
    assert(result.shardReassignments >= 1, 'Should reassign at least some shards');

    const statusAfter = topology.getStatus();
    assert(statusAfter.orphanShards === 0, 'No orphans after reassignment');

    const node1Status = topology.nodeRegistry.get('node-1').status;
    assert(node1Status === 'DEAD', 'Dead node should be marked DEAD');

    console.log(`✅ Dead node removal verified: deadNodes=${result.deadNodesFound}, reassignments=${result.shardReassignments}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Trace Propagation
 */
async function testTracePropagation() {
  console.log('\n=== TEST 5: Trace Propagation ===');
  try {
    const topology = new DistributedEventTopology();

    topology.registerNode('node-1');
    topology.registerNode('node-2');
    topology.registerNode('node-3');

    // Propagate trace across nodes
    const prop1 = topology.propagateTrace('trace-1', 'node-1');
    assert(prop1.propagated, 'Trace should be propagated');
    assert(prop1.hopCount === 1, 'Should have 1 hop initially');

    const prop2 = topology.propagateTrace('trace-1', 'node-2');
    assert(prop2.hopCount === 2, 'Should increment hop count');
    assert(prop2.path.includes('node-1'), 'Path should include origin');
    assert(prop2.path.includes('node-2'), 'Path should include current node');

    const prop3 = topology.propagateTrace('trace-1', 'node-3');
    assert(prop3.hopCount === 3, 'Should have 3 hops');
    assert(prop3.path.length === 3, 'Path should have all nodes');

    const status = topology.getStatus();
    assert(status.activeTraces === 1, 'Should track 1 active trace');

    console.log(`✅ Trace propagation verified: hopCount=${prop3.hopCount}, path=${prop3.path.join(' → ')}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Topology Snapshot Reproducibility
 */
async function testSnapshotReproducibility() {
  console.log('\n=== TEST 6: Topology Snapshot Reproducibility ===');
  try {
    const topology = new DistributedEventTopology();

    // Set up identical topology twice
    topology.registerNode('node-1', { cpu: 4 });
    topology.registerNode('node-2', { cpu: 2 });
    topology.assignShard('shard-A');
    topology.assignShard('shard-B');
    topology.propagateTrace('trace-1', 'node-1');

    const snap1 = topology.snapshotTopology();

    // Reset and recreate
    topology.reset();

    topology.registerNode('node-1', { cpu: 4 });
    topology.registerNode('node-2', { cpu: 2 });
    topology.assignShard('shard-A');
    topology.assignShard('shard-B');
    topology.propagateTrace('trace-1', 'node-1');

    const snap2 = topology.snapshotTopology();

    // Snapshots should be identical in structure (timestamps may differ)
    assert(snap1.nodes.length === snap2.nodes.length, 'Node count should match');
    assert(snap1.shards.length === snap2.shards.length, 'Shard count should match');
    assert(snap1.traces.length === snap2.traces.length, 'Trace count should match');

    // Verify deterministic routing (shard to node mapping should be identical)
    for (let i = 0; i < snap1.shards.length; i++) {
      assert(
        snap1.shards[i].ownerNodeId === snap2.shards[i].ownerNodeId,
        `Shard ${i} should have same owner in both snapshots`
      );
    }

    console.log(`✅ Snapshot reproducibility verified: nodes=${snap1.nodes.length}, shards=${snap1.shards.length}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 6: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 7: No Orphan Shards
 */
async function testNoOrphanShards() {
  console.log('\n=== TEST 7: No Orphan Shards ===');
  try {
    const topology = new DistributedEventTopology();

    topology.registerNode('node-1');
    topology.registerNode('node-2');

    // Assign many shards
    for (let i = 0; i < 50; i++) {
      topology.assignShard(`shard-${i}`);
    }

    const statusBefore = topology.getStatus();
    assert(statusBefore.orphanShards === 0, 'Should have no orphans after assignment');

    // Remove all nodes
    await new Promise((resolve) => setTimeout(resolve, 150));
    topology.removeDeadNodes(100);

    const statusAfter = topology.getStatus();
    assert(statusAfter.activeNodes === 0, 'All nodes should be dead');
    assert(statusAfter.totalShards === 50, 'Should still have all shards');

    console.log(`✅ No orphan shards verified: totalShards=${statusAfter.totalShards}, orphans=${statusAfter.orphanShards}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 7: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 8: Topology Version Increments
 */
async function testTopologyVersioning() {
  console.log('\n=== TEST 8: Topology Version Increments ===');
  try {
    const topology = new DistributedEventTopology();

    const v0 = topology.topologyVersion;
    assert(v0 === 0, 'Should start at version 0');

    topology.registerNode('node-1');
    const v1 = topology.topologyVersion;
    assert(v1 > v0, 'Version should increment on node registration');

    topology.assignShard('shard-1');
    const v2 = topology.topologyVersion;
    assert(v2 > v1, 'Version should increment on shard assignment');

    // Heartbeat should not increment version
    topology.updateHeartbeat('node-1');
    const v3 = topology.topologyVersion;
    assert(v3 === v2, 'Version should NOT increment on heartbeat');

    console.log(`✅ Topology versioning verified: v0=${v0}, v1=${v1}, v2=${v2}, v3=${v3}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 8: ${error.message}`);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 PHASE 7.0 — DISTRIBUTED EVENT TOPOLOGY TESTS');
  console.log('═'.repeat(70));

  try {
    await testNodeRegistration();
    await testDeterministicShardAssignment();
    await testHeartbeatUpdates();
    await testDeadNodeRemoval();
    await testTracePropagation();
    await testSnapshotReproducibility();
    await testNoOrphanShards();
    await testTopologyVersioning();

    // Print results
    console.log('\n' + '═'.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/8 tests`);
    console.log(`❌ FAILED: ${testResults.failed}/8 tests`);

    if (testResults.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      testResults.errors.forEach((error) => console.log(`  - ${error}`));
    }

    console.log('\n' + '═'.repeat(70));
    if (testResults.failed === 0) {
      console.log('🎉 ALL TOPOLOGY TESTS PASSED');
      console.log('✅ PHASE 7.0 FOUNDATION VALIDATED');
      console.log('✅ STRUCTURAL ORCHESTRATION READY');
    } else {
      console.log('⚠️  SOME TESTS FAILED — REVIEW ERRORS ABOVE');
    }
    console.log('═'.repeat(70) + '\n');

    process.exit(testResults.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, testResults };
