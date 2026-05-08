/**
 * PHASE 7.0.3 — Real-Time Architecture Guard Integration Tests
 *
 * Validates that ArchitectureEnforcementEngine is correctly integrated
 * into the 5 critical runtime flows.
 */

const assert = require('assert');
const ArchitectureEnforcementEngine = require('../core/governance/enforcement/ArchitectureEnforcementEngine');
const ModuleGuard = require('../core/governance/enforcement/ModuleGuard');
const HardenedEventBus = require('../core/governance/events/HardenedEventBus');
const SelfHealingOrchestrator = require('../core/self-healing/SelfHealingOrchestrator');
const RecoveryOrchestrator = require('../core/recovery/RecoveryOrchestrator');
const DistributedEventTopology = require('../core/governance/distributed/DistributedEventTopology');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Event Bus Guard
 * HardenedEventBus with enforcement engine injected rejects invalid events
 */
async function testEventBusGuard() {
  console.log('\n=== TEST 1: Event Bus Guard ===');
  try {
    const engine = new ArchitectureEnforcementEngine();
    // Move to READY state
    engine.validateLifecycle('INIT', 'READY');

    const bus = new HardenedEventBus({ enforcementEngine: engine });

    // Test: Invalid event type should be rejected with 'architecture_violation'
    const invalidEvent = {
      id: 'test-event-1',
      type: 'INVALID_TYPE',
      source: 'TestModule',
      payload: { message: 'test' },
      timestamp: Date.now()
    };

    const result = await bus.publish(invalidEvent);
    assert(result.published === false, 'Invalid event should be rejected');
    assert(result.reason === 'architecture_violation', `Expected 'architecture_violation', got '${result.reason}'`);
    console.log(`✅ Invalid event rejected: reason=${result.reason}`);

    // Test: Valid event should pass through
    const validEvent = {
      id: 'test-event-2',
      eventId: 'test-event-2',
      type: 'VIOLATION',
      source: 'RuntimeValidationEngine',
      severity: 'LOW',
      message: 'Test violation',
      validator: 'TestValidator',
      timestamp: Date.now(),
      payload: { message: 'Test violation', validator: 'TestValidator' }
    };

    const result2 = await bus.publish(validEvent);
    assert(result2.published === true, `Valid event should be published. Got: ${JSON.stringify(result2)}`);
    console.log(`✅ Valid event published successfully`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Self-Healing Guard
 * SelfHealingOrchestrator with enforcement engine in UNDEFINED state blocks healing
 */
async function testSelfHealingGuard() {
  console.log('\n=== TEST 2: Self-Healing Guard ===');
  try {
    const engine = new ArchitectureEnforcementEngine();
    // DO NOT move to READY — leave in UNDEFINED state to test blocking

    const orchestrator = new SelfHealingOrchestrator({ enforcementEngine: engine });

    // Test: processViolation should be blocked due to system not ready
    const violation = {
      id: 'viol-1',
      type: 'TEST_VIOLATION',
      severity: 'LOW',
      validator: 'TestValidator',
      message: 'Test violation'
    };

    const result = await orchestrator.processViolation(violation);
    assert(result.action === 'BLOCKED', `Expected action 'BLOCKED', got '${result.action}'`);
    assert(result.reason === 'system_not_ready', `Expected reason 'system_not_ready', got '${result.reason}'`);
    console.log(`✅ Healing blocked due to system not ready: ${result.reason}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Recovery Guard
 * RecoveryOrchestrator with enforcement engine in UNDEFINED state skips recovery
 */
async function testRecoveryGuard() {
  console.log('\n=== TEST 3: Recovery Guard ===');
  try {
    const engine = new ArchitectureEnforcementEngine();
    // DO NOT move to READY — leave in UNDEFINED state to test blocking

    const orchestrator = new RecoveryOrchestrator({ enforcementEngine: engine });

    // Test: executeRecovery should be skipped due to system not ready
    const error = new Error('Test recovery error');
    const context = { traceId: 'trace-123', severity: 'CRITICAL' };

    const result = await orchestrator.executeRecovery(error, context);
    assert(result.skipped === true, `Expected skipped=true, got ${result.skipped}`);
    assert(result.reason === 'system_not_ready', `Expected reason 'system_not_ready', got '${result.reason}'`);
    console.log(`✅ Recovery skipped due to system not ready: ${result.reason}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Topology Guard
 * DistributedEventTopology with enforcement engine validates module registration
 */
async function testTopologyGuard() {
  console.log('\n=== TEST 4: Topology Guard ===');
  try {
    const engine = new ArchitectureEnforcementEngine();
    // Move to READY state
    engine.validateLifecycle('INIT', 'READY');

    const topology = new DistributedEventTopology({ enforcementEngine: engine });

    // Test: registerNode should succeed (module validation passes)
    const registerResult = topology.registerNode('node-1', { cpu: 4, memory: 8192 });
    assert(registerResult.registered === true, 'Node registration should succeed');
    console.log(`✅ Node registered successfully`);

    // Test: assignShard should succeed (dependency validation passes)
    const assignResult = topology.assignShard('shard-1', 'node-1');
    assert(assignResult.assigned === true, 'Shard assignment should succeed');
    console.log(`✅ Shard assigned successfully`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Module Guard
 * ModuleGuard validates modules before loading with enforcement engine
 */
async function testModuleGuard() {
  console.log('\n=== TEST 5: Module Guard ===');
  try {
    const engine = new ArchitectureEnforcementEngine();
    const guard = new ModuleGuard(engine);

    // Test: guardModule for known module with valid dependencies
    const result1 = guard.guardModule('HardenedEventBus', []);
    assert(result1.allowed === true, 'Known module should be allowed');
    assert(result1.moduleName === 'HardenedEventBus', 'Module name should match');
    console.log(`✅ Known module HardenedEventBus allowed`);

    // Test: guardModule for known module with valid dependency
    const result2 = guard.guardModule('SelfHealingOrchestrator', ['HardenedEventBus']);
    assert(result2.allowed === true, 'Module with valid dependency should be allowed');
    console.log(`✅ Module with valid dependency allowed`);

    // Test: guardModule for unknown module should be blocked
    const result3 = guard.guardModule('UnknownModule', []);
    assert(result3.allowed === false, 'Unknown module should be blocked');
    assert(result3.reason === 'MODULE_NOT_IN_SPEC', 'Should indicate module not in spec');
    console.log(`✅ Unknown module blocked: ${result3.reason}`);

    // Test: List of guarded modules
    const guarded = guard.getGuardedModules();
    assert(guarded.includes('HardenedEventBus'), 'HardenedEventBus should be in guarded list');
    assert(guarded.includes('SelfHealingOrchestrator'), 'SelfHealingOrchestrator should be in guarded list');
    assert(!guarded.includes('UnknownModule'), 'UnknownModule should not be in guarded list');
    console.log(`✅ Guarded modules tracked: ${guarded.join(', ')}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * RUN ALL TESTS
 */
async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 PHASE 7.0.3 — Real-Time Architecture Guard Integration');
  console.log('═'.repeat(70));

  try {
    await testEventBusGuard();
    await testSelfHealingGuard();
    await testRecoveryGuard();
    await testTopologyGuard();
    await testModuleGuard();

    console.log('\n' + '═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/5 tests`);
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

module.exports = { ArchitectureEnforcementEngine, ModuleGuard };
