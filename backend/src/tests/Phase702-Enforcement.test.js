/**
 * PHASE 7.0.2 — Architecture Enforcement Tests
 *
 * Validates that the ArchitectureEnforcementEngine correctly enforces
 * the architectural specifications at runtime.
 */

const assert = require('assert');
const ArchitectureEnforcementEngine = require('../core/governance/enforcement/ArchitectureEnforcementEngine.js');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Module Validation
 */
async function testModuleValidation() {
  console.log('\n=== TEST 1: Module Validation ===');
  try {
    const engine = new ArchitectureEnforcementEngine();

    // Test 1a: Unknown module should return { valid: false }
    const r1 = engine.validateModule('NonExistentModule');
    assert(r1.valid === false, 'Unknown module should return valid:false');
    assert(r1.reason === 'MODULE_NOT_IN_SPEC', 'Reason should be MODULE_NOT_IN_SPEC');
    assert(r1.level === 'VIOLATION', 'Level should be VIOLATION');
    console.log(`✅ Unknown module rejected: ${JSON.stringify(r1)}`);

    // Test 1b: Known module with contract should return { valid: true }
    const r2 = engine.validateModule('HardenedEventBus');
    assert(r2.valid === true, 'HardenedEventBus should be valid');
    console.log(`✅ HardenedEventBus validated: ${JSON.stringify(r2)}`);

    // Test 1c: Another module with contract
    const r3 = engine.validateModule('SelfHealingOrchestrator');
    assert(r3.valid === true, 'SelfHealingOrchestrator should be valid');
    console.log(`✅ SelfHealingOrchestrator validated`);

    // Verify metrics updated
    assert(engine.metrics.modulesValidated === 3, 'Should have validated 3 modules');
    console.log(`✅ Metrics tracked: modulesValidated=${engine.metrics.modulesValidated}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Dependency Validation
 */
async function testDependencyValidation() {
  console.log('\n=== TEST 2: Dependency Validation ===');
  try {
    const engine = new ArchitectureEnforcementEngine();

    // Test 2a: Unauthorized dependency should throw
    let threw = false;
    let thrownError = null;
    try {
      // HardenedEventBus has deps=[] so SelfHealingOrchestrator is not authorized
      engine.validateDependency('HardenedEventBus', 'SelfHealingOrchestrator');
    } catch (e) {
      threw = true;
      thrownError = e;
    }
    assert(threw, 'Should have thrown for unauthorized dependency');
    assert(thrownError.code === 'ARCHITECTURE_VIOLATION', 'Error code should be ARCHITECTURE_VIOLATION');
    console.log(`✅ Unauthorized dependency blocked with code: ${thrownError.code}`);

    // Test 2b: Authorized dependency should return { valid: true }
    const r2 = engine.validateDependency('RuntimeValidationEngine', 'HardenedEventBus');
    assert(r2.valid === true, 'RuntimeValidationEngine → HardenedEventBus should be valid');
    console.log(`✅ Authorized dependency validated`);

    // Verify metrics
    assert(engine.metrics.dependenciesValidated >= 2, 'Should have validated dependencies');
    console.log(`✅ Metrics tracked: dependenciesValidated=${engine.metrics.dependenciesValidated}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Event Contract Validation
 */
async function testEventContractValidation() {
  console.log('\n=== TEST 3: Event Contract Validation ===');
  try {
    const engine = new ArchitectureEnforcementEngine();

    // Test 3a: Unknown event type should return DROP
    const r1 = engine.validateEvent('UNKNOWN_TYPE', 'SomeModule', {});
    assert(r1.valid === false, 'Unknown event type should be invalid');
    assert(r1.action === 'DROP', 'Action should be DROP');
    assert(r1.alert === true, 'Should generate alert');
    console.log(`✅ Unknown event type dropped: action=${r1.action}`);

    // Test 3b: Valid VIOLATION event with all required fields
    const validEvent = {
      message: 'test violation',
      validator: 'TestValidator',
      severity: 'LOW',
      timestamp: Date.now(),
      source: 'RuntimeValidationEngine'
    };
    const r2 = engine.validateEvent('VIOLATION', 'RuntimeValidationEngine', validEvent);
    assert(r2.valid === true, 'Valid event with all fields should pass');
    console.log(`✅ Valid VIOLATION event accepted`);

    // Test 3c: Incomplete event should be dropped
    const incompleteEvent = {
      message: 'only one field'
    };
    const r3 = engine.validateEvent('VIOLATION', 'RuntimeValidationEngine', incompleteEvent);
    assert(r3.valid === false, 'Incomplete event should be invalid');
    assert(r3.action === 'DROP', 'Should DROP incomplete events');
    console.log(`✅ Incomplete event dropped`);

    // Verify metrics
    assert(engine.metrics.eventsValidated === 3, 'Should have validated 3 events');
    console.log(`✅ Metrics tracked: eventsValidated=${engine.metrics.eventsValidated}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Injection Validation
 */
async function testInjectionValidation() {
  console.log('\n=== TEST 4: Injection Validation ===');
  try {
    const engine = new ArchitectureEnforcementEngine();

    // Test 4a: Unauthorized service injection should be blocked
    const r1 = engine.validateInjection('RuntimeValidationEngine', 'audit');
    // RuntimeValidationEngine only has ['eventBus'] in InjectionMap.modules
    assert(r1.valid === false, 'Non-authorized service should be blocked');
    assert(r1.reason === 'UNAUTHORIZED_INJECTION', 'Reason should be UNAUTHORIZED_INJECTION');
    assert(r1.action === 'BLOCK', 'Action should be BLOCK');
    console.log(`✅ Unauthorized injection blocked: ${r1.reason}`);

    // Test 4b: Authorized service injection should pass
    const r2 = engine.validateInjection('RuntimeValidationEngine', 'eventBus');
    assert(r2.valid === true, 'eventBus should be authorized for RuntimeValidationEngine');
    console.log(`✅ Authorized injection accepted`);

    // Test 4c: Unknown module should be blocked
    const r3 = engine.validateInjection('UnknownModule', 'eventBus');
    assert(r3.valid === false, 'Unknown module injection should be blocked');
    console.log(`✅ Unknown module injection blocked`);

    // Verify metrics
    assert(engine.metrics.injectionsValidated === 3, 'Should have validated 3 injections');
    console.log(`✅ Metrics tracked: injectionsValidated=${engine.metrics.injectionsValidated}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Lifecycle Validation
 */
async function testLifecycleValidation() {
  console.log('\n=== TEST 5: Lifecycle Validation ===');
  try {
    const engine = new ArchitectureEnforcementEngine();

    // Test 5a: Invalid transition READY→INIT should be rejected
    const r1 = engine.validateLifecycle('READY', 'INIT');
    assert(r1.valid === false, 'READY→INIT should be invalid');
    assert(r1.level === 'CRITICAL', 'Level should be CRITICAL');
    console.log(`✅ Invalid lifecycle transition blocked`);

    // Test 5b: Valid transition INIT→READY should pass
    const r2 = engine.validateLifecycle('INIT', 'READY');
    assert(r2.valid === true, 'INIT→READY should be valid');
    console.log(`✅ INIT→READY transition accepted`);

    // Verify state was updated
    assert(engine.currentLifecycleState === 'READY', 'Current state should be updated to READY');
    console.log(`✅ Current state updated: ${engine.currentLifecycleState}`);

    // Test 5c: Valid transition READY→DEGRADED
    const r3 = engine.validateLifecycle('READY', 'DEGRADED');
    assert(r3.valid === true, 'READY→DEGRADED should be valid');
    assert(engine.currentLifecycleState === 'DEGRADED', 'State should be DEGRADED');
    console.log(`✅ READY→DEGRADED transition accepted`);

    // Verify metrics
    assert(engine.metrics.lifecycleTransitions === 3, 'Should have validated 3 transitions');
    console.log(`✅ Metrics tracked: lifecycleTransitions=${engine.metrics.lifecycleTransitions}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Health Monitoring
 */
async function testHealthMonitoring() {
  console.log('\n=== TEST 6: Health Monitoring ===');
  try {
    const engine = new ArchitectureEnforcementEngine();

    // Test 6a: CRITICAL health check should return status.value=2
    const criticalResults = [
      { name: 'eventBusAlive', status: 'CRITICAL' },
      { name: 'metricsFlowActive', status: 'OK' }
    ];
    const status1 = engine.monitorSystemHealth(criticalResults);
    assert(status1.value === 2, 'CRITICAL health check should return value=2');
    assert(status1.meaning === 'Critical system failure detected', 'Status meaning should indicate CRITICAL');
    console.log(`✅ CRITICAL health returned value=${status1.value}`);

    // Test 6b: All healthy checks should return HEALTHY (value=0)
    const healthyResults = [
      { name: 'eventBusAlive', status: 'OK' },
      { name: 'metricsFlowActive', status: 'OK' },
      { name: 'auditIntegrity', status: 'OK' }
    ];
    const status2 = engine.monitorSystemHealth(healthyResults);
    assert(status2.value === 0, 'All OK should return HEALTHY (value=0)');
    assert(status2.meaning === 'All checks passing, no issues', 'Status meaning should indicate HEALTHY');
    console.log(`✅ HEALTHY status returned value=${status2.value}`);

    // Test 6c: WARNING check should return DEGRADED (value=1)
    const degradedResults = [
      { name: 'metricsFlowActive', status: 'WARNING' }
    ];
    const status3 = engine.monitorSystemHealth(degradedResults);
    assert(status3.value === 1, 'WARNING check should return DEGRADED (value=1)');
    assert(status3.meaning === 'Some checks failing, still operational', 'Status meaning should indicate DEGRADED');
    console.log(`✅ DEGRADED status returned value=${status3.value}`);

    // Verify metrics
    assert(engine.metrics.healthChecks === 3, 'Should have monitored 3 health checks');
    console.log(`✅ Metrics tracked: healthChecks=${engine.metrics.healthChecks}`);

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
  console.log('🧪 PHASE 7.0.2 — Architecture Enforcement Engine');
  console.log('═'.repeat(70));

  try {
    await testModuleValidation();
    await testDependencyValidation();
    await testEventContractValidation();
    await testInjectionValidation();
    await testLifecycleValidation();
    await testHealthMonitoring();

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

module.exports = { ArchitectureEnforcementEngine };
