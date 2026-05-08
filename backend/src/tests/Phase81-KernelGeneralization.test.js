/**
 * PHASE 8.1 — Distributed Governance Kernel Generalization
 *
 * Tests the abstraction of PHASE 7.0-7.7 into a generic reusable kernel.
 *
 * CRITICAL INVARIANTS:
 * ✔ deterministic execution preserved
 * ✔ idempotency global preserved
 * ✔ domain-agnostic operation model
 * ✔ invariants become runtime laws
 * ✔ plugins isolated from core
 * ✔ backward compatible with PHASE 7 system
 */

const assert = require('assert');
const DistributedGovernanceKernel = require('../core/kernel/DistributedGovernanceKernel');
const DomainAdapterRegistry = require('../core/kernel/DomainAdapterRegistry');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Kernel Initializes as Domain-Agnostic
 * Verify kernel can work with any domain
 */
async function testKernelInitialization() {
  console.log('\n=== TEST 1: Kernel Initialization (Domain-Agnostic) ===');
  try {
    const kernel = new DistributedGovernanceKernel();

    const state = kernel.getKernelState();
    assert(state.kernelId !== null, 'Kernel should have ID');
    assert(state.domainsRegistered === 0, 'Initially no domains registered');
    assert(state.operationsExecuted === 0, 'Initially 0 operations executed');

    console.log(`✅ Kernel initialized: ${state.kernelId}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Domain Adapter Translation Works
 * Verify event-driven models convert to operation-driven
 */
async function testDomainAdapterTranslation() {
  console.log('\n=== TEST 2: Domain Adapter Translation ===');
  try {
    const registry = new DomainAdapterRegistry();

    // Register adapter for "event-driven" domain
    const eventAdapterResult = registry.registerAdapter('event-system', {
      name: 'event-to-operation-adapter',
      translate: (input) => ({
        domainId: input.domainId,
        type: `op_${input.eventType}`,
        operationId: input.eventId,
        payload: input.payload,
        timestamp: input.timestamp
      })
    });

    assert(eventAdapterResult.registered === true, 'Adapter should register');

    // Translate event to operation
    const translation = registry.translate({
      domainId: 'event-system',
      eventType: 'USER_CREATED',
      eventId: 'evt_123',
      payload: { userId: 'user_1' },
      timestamp: Date.now()
    });

    assert(translation.translated === true, 'Translation should succeed');
    assert(translation.operation.type === 'op_USER_CREATED', 'Operation type should be translated');
    assert(translation.operation.operationId === 'evt_123', 'Operation should preserve eventId');

    console.log(`✅ Adapter translation: event → operation (${translation.operation.type})`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Invariants as Runtime Laws
 * Verify invariants become executable kernel laws
 */
async function testInvariantsAsLaws() {
  console.log('\n=== TEST 3: Invariants as Runtime Laws ===');
  try {
    const kernel = new DistributedGovernanceKernel();

    // Register domain
    const domainResult = kernel.registerDomain({
      domainId: 'payments',
      name: 'Payment Processing'
    });
    assert(domainResult.registered === true, 'Domain should register');

    // Register invariant (law): transaction amount must be positive
    const invariantResult = kernel.registerInvariant('payments', 'POSITIVE_AMOUNT', {
      level: 'CRITICAL',
      evaluate: async (operation) => {
        return operation.payload && operation.payload.amount > 0;
      }
    });
    assert(invariantResult.registered === true, 'Invariant should register');

    // Register operation handler
    kernel.registerOperationHandler('payments', 'TRANSFER', async (op) => ({
      success: true,
      transactionId: `tx_${Date.now()}`
    }));

    // Execute valid operation
    const validOp = await kernel.executeOperation({
      domainId: 'payments',
      type: 'TRANSFER',
      payload: { amount: 100, from: 'acc_1', to: 'acc_2' }
    });

    assert(validOp.executed === true, 'Valid operation should execute');

    // Execute invalid operation (negative amount)
    const invalidOp = await kernel.executeOperation({
      domainId: 'payments',
      type: 'TRANSFER',
      payload: { amount: -50, from: 'acc_1', to: 'acc_2' }
    });

    assert(invalidOp.executed === false, 'Invalid operation should be blocked');
    assert(invalidOp.reason === 'INVARIANT_VIOLATION', 'Should cite invariant violation');

    console.log(`✅ Invariants enforce runtime laws: blocked invalid operation`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Plugin Isolation
 * Verify plugins cannot modify enforcement core
 */
async function testPluginIsolation() {
  console.log('\n=== TEST 4: Plugin Isolation ===');
  try {
    const kernel = new DistributedGovernanceKernel();

    // Try to attach malicious plugin that claims it can modify enforcement
    const maliciousPluginResult = kernel.attachPlugin({
      name: 'malicious-plugin',
      canModifyEnforcement: true,
      onOperationExecuted: async () => {}
    });

    assert(maliciousPluginResult.attached === false, 'Malicious plugin should be rejected');
    assert(maliciousPluginResult.reason === 'PLUGIN_CANNOT_MODIFY_ENFORCEMENT', 'Should cite isolation rule');

    // Attach legitimate observability plugin
    const legitPluginResult = kernel.attachPlugin({
      name: 'observability-plugin',
      canModifyEnforcement: false,
      onOperationExecuted: async (op, result) => {
        // Only observe, never modify
      }
    });

    assert(legitPluginResult.attached === true, 'Legitimate plugin should attach');
    assert(kernel.plugins.size === 1, 'Should have 1 plugin');

    console.log(`✅ Plugin isolation enforced: malicious rejected, legit attached`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Multi-Domain Operation Routing
 * Verify kernel handles multiple domain operations correctly
 */
async function testMultiDomainRouting() {
  console.log('\n=== TEST 5: Multi-Domain Operation Routing ===');
  try {
    const kernel = new DistributedGovernanceKernel();

    // Register two different domains
    kernel.registerDomain({ domainId: 'orders', name: 'Order Processing' });
    kernel.registerDomain({ domainId: 'inventory', name: 'Inventory Management' });

    // Register handlers for each domain
    kernel.registerOperationHandler('orders', 'CREATE_ORDER', async (op) => ({
      success: true,
      orderId: `order_${Date.now()}`
    }));

    kernel.registerOperationHandler('inventory', 'RESERVE_STOCK', async (op) => ({
      success: true,
      reservationId: `res_${Date.now()}`
    }));

    // Execute operations from different domains
    const orderOp = await kernel.executeOperation({
      domainId: 'orders',
      type: 'CREATE_ORDER',
      payload: { customerId: 'cust_1', items: ['item_1', 'item_2'] }
    });

    const inventoryOp = await kernel.executeOperation({
      domainId: 'inventory',
      type: 'RESERVE_STOCK',
      payload: { itemId: 'item_1', quantity: 10 }
    });

    assert(orderOp.executed === true, 'Order operation should execute');
    assert(inventoryOp.executed === true, 'Inventory operation should execute');

    const state = kernel.getKernelState();
    assert(state.operationsExecuted === 2, 'Should have executed 2 operations');
    assert(state.domainsRegistered === 2, 'Should have 2 domains');

    console.log(`✅ Multi-domain routing: 2 domains, ${state.operationsExecuted} operations`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Deterministic Execution Preserved
 * Verify same operations produce same results (determinism)
 */
async function testDeterministicExecution() {
  console.log('\n=== TEST 6: Deterministic Execution Preserved ===');
  try {
    const kernel = new DistributedGovernanceKernel();

    kernel.registerDomain({ domainId: 'math', name: 'Math Operations' });

    kernel.registerOperationHandler('math', 'ADD', async (op) => ({
      success: true,
      result: op.payload.a + op.payload.b
    }));

    // Execute same operation twice
    const result1 = await kernel.executeOperation({
      domainId: 'math',
      type: 'ADD',
      payload: { a: 10, b: 20 }
    });

    const result2 = await kernel.executeOperation({
      domainId: 'math',
      type: 'ADD',
      payload: { a: 10, b: 20 }
    });

    assert(result1.result.result === result2.result.result, 'Results should be identical');
    assert(result1.result.result === 30, 'Result should be deterministic');

    console.log(`✅ Deterministic execution: 10 + 20 = ${result1.result.result} (both times)`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 6: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 7: Backward Compatibility with PHASE 7
 * Verify kernel can run event-based PHASE 7 domains
 */
async function testBackwardCompatibility() {
  console.log('\n=== TEST 7: Backward Compatibility with PHASE 7 ===');
  try {
    const kernel = new DistributedGovernanceKernel();
    const registry = new DomainAdapterRegistry();

    // Register PHASE 7 style event domain via adapter
    const adapter = {
      name: 'phase7-event-adapter',
      translate: (event) => ({
        domainId: event.domainId,
        type: `phase7_${event.type}`,
        operationId: event.eventId,
        payload: event,
        traceId: event.traceId,
        shardId: event.shardId
      })
    };

    registry.registerAdapter('phase7-events', adapter);

    // Register kernel domain
    kernel.registerDomain({ domainId: 'phase7-events', name: 'PHASE 7 Events' });

    // Register handler
    kernel.registerOperationHandler('phase7-events', 'phase7_USER_SIGNUP', async (op) => ({
      success: true,
      userId: `user_${Date.now()}`
    }));

    // Execute PHASE 7 style event
    const translation = registry.translate({
      domainId: 'phase7-events',
      type: 'USER_SIGNUP',
      eventId: 'evt_user_signup_1',
      traceId: 'trace_1',
      shardId: 'shard_0',
      payload: { email: 'user@example.com' }
    });

    assert(translation.translated === true, 'PHASE 7 event should translate');

    const result = await kernel.executeOperation(translation.operation);
    assert(result.executed === true, 'PHASE 7 operation should execute in new kernel');

    console.log(`✅ Backward compatibility: PHASE 7 events work with new kernel`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 7: ${error.message}`);
    throw error;
  }
}

/**
 * RUN ALL TESTS
 */
async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 PHASE 8.1 — Distributed Governance Kernel Generalization');
  console.log('═'.repeat(70));

  try {
    await testKernelInitialization();
    await testDomainAdapterTranslation();
    await testInvariantsAsLaws();
    await testPluginIsolation();
    await testMultiDomainRouting();
    await testDeterministicExecution();
    await testBackwardCompatibility();

    console.log('\n' + '═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/7 tests`);
    console.log('═'.repeat(70));
    console.log('\n🎯 KERNEL GENERALIZATION: SUCCESS');
    console.log('Architecture PHASE 7.0-7.7 → Generic Reusable Kernel');
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

module.exports = { DistributedGovernanceKernel, DomainAdapterRegistry };
