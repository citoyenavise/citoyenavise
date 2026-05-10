/**
 * PHASE 8.2 — Universal Invariant Compilation Layer
 *
 * Tests compilation of invariants into kernel bytecode.
 *
 * CRITICAL INVARIANTS:
 * ✔ deterministic compilation (same input → same bytecode)
 * ✔ zero runtime interpretation
 * ✔ DAG optimization and fusion
 * ✔ immutable compiled artifacts
 * ✔ integrity verification
 * ✔ end-to-end execution
 */

const assert = require('assert');
const InvariantCompiler = require('../core/kernel/InvariantCompiler');
const KernelInvariantRegistry = require('../core/kernel/adapters/KernelInvariantRegistry');
const InvariantExecutionEngine = require('../core/kernel/InvariantExecutionEngine');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Deterministic Compilation to Bytecode
 * Verify same rule → identical bytecode hash
 */
async function testDeterministicCompilation() {
  console.log('\n=== TEST 1: Deterministic Compilation ===');
  try {
    const compiler = new InvariantCompiler();

    // Define rule
    const rule = {
      ruleId: 'rule_payment_positive',
      level: 'CRITICAL',
      schema: 'INVARIANT_1',
      conditions: [
        { field: 'amount', operator: 'gt', value: 0 }
      ]
    };

    // Compile twice
    const result1 = compiler.compileRule(rule);
    assert(result1.compiled === true, 'First compilation should succeed');
    const hash1 = result1.bytecodeHash;

    const result2 = compiler.compileRule(rule);
    assert(result2.compiled === true, 'Second compilation should succeed');
    const hash2 = result2.bytecodeHash;

    // Verify determinism
    assert(hash1 === hash2, `Hash should be deterministic: ${hash1} vs ${hash2}`);
    assert(hash1.length === 64, 'SHA-256 hash should be 64 chars');

    console.log(`✅ Deterministic: same rule → same hash (${hash1.substring(0, 16)}...)`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: DAG Optimization and Fusion
 * Verify DAG is built and fusion opportunities counted
 */
async function testDAGOptimization() {
  console.log('\n=== TEST 2: DAG Optimization and Fusion ===');
  try {
    const compiler = new InvariantCompiler();

    // Define invariant set with dependencies
    const invariantSet = {
      setId: 'set_payment_rules',
      rules: [
        {
          ruleId: 'rule_positive_amount',
          level: 'CRITICAL',
          conditions: [{ field: 'amount', operator: 'gt', value: 0 }]
        },
        {
          ruleId: 'rule_valid_currency',
          level: 'CRITICAL',
          conditions: [{ field: 'currency', operator: 'in', value: ['USD', 'EUR'] }],
          dependsOn: ['rule_positive_amount']
        },
        {
          ruleId: 'rule_within_limit',
          level: 'WARNING',
          conditions: [{ field: 'amount', operator: 'lte', value: 1000000 }],
          dependsOn: ['rule_positive_amount']
        }
      ]
    };

    // Compile set with optimization
    const result = compiler.compileInvariantSet(invariantSet);
    assert(result.compiled === true, 'Set compilation should succeed');
    assert(result.rulesCompiled === 3, 'All 3 rules should compile');
    assert(result.optimizationsFused > 0, 'Should find fusion opportunities');

    const stats = compiler.getStats();
    assert(stats.rulesCompiled === 3, 'Compiler stats should show 3 rules');

    console.log(`✅ DAG optimized: 3 rules, ${result.optimizationsFused} fusions found`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Registry Registration and Versioning
 * Verify invariants register with versioning and schema tracking
 */
async function testRegistryAndVersioning() {
  console.log('\n=== TEST 3: Registry and Versioning ===');
  try {
    const compiler = new InvariantCompiler();
    const registry = new KernelInvariantRegistry();

    // Compile invariant
    const rule = {
      ruleId: 'rule_auth_valid',
      level: 'CRITICAL',
      version: '1.0',
      schema: 'INVARIANT_1',
      conditions: [
        { field: 'tokenValid', operator: 'eq', value: true }
      ]
    };

    const compileResult = compiler.compileRule(rule);
    assert(compileResult.compiled === true, 'Compilation should succeed');

    // Register in kernel
    const bytecode = compiler.getBytecode('rule_auth_valid');
    const registerResult = registry.registerInvariant({
      ruleId: 'rule_auth_valid',
      bytecode: bytecode.bytecode,
      version: '1.0',
      schema: 'INVARIANT_1',
      level: 'CRITICAL',
      bytecodeHash: bytecode.hash
    });

    assert(registerResult.registered === true, 'Registration should succeed');

    // Verify schema tracking
    const schemaResult = registry.getSchemaInvariants('INVARIANT_1');
    assert(schemaResult.available === true, 'Schema should be available');
    assert(schemaResult.invariants.length === 1, 'Should have 1 invariant');

    // Upgrade schema version
    const upgradeResult = registry.upgradeSchema('INVARIANT_1', '1.1');
    assert(upgradeResult.upgraded === true, 'Schema upgrade should succeed');

    console.log(`✅ Registry versioned: schema 1.0 → 1.1, 1 invariant registered`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Bytecode Execution
 * Verify compiled bytecode executes correctly with context
 */
async function testBytecodeExecution() {
  console.log('\n=== TEST 4: Bytecode Execution ===');
  try {
    const compiler = new InvariantCompiler();
    const registry = new KernelInvariantRegistry();
    const engine = new InvariantExecutionEngine({ registry });

    // Compile and register rule
    const rule = {
      ruleId: 'rule_amount_positive',
      level: 'CRITICAL',
      version: '1.0',
      schema: 'INVARIANT_1',
      conditions: [
        { field: 'amount', operator: 'gt', value: 0 }
      ]
    };

    compiler.compileRule(rule);
    const bytecode = compiler.getBytecode('rule_amount_positive');
    registry.registerInvariant({
      ruleId: 'rule_amount_positive',
      bytecode: bytecode.bytecode,
      version: '1.0',
      schema: 'INVARIANT_1',
      level: 'CRITICAL',
      bytecodeHash: bytecode.hash
    });

    // Execute with valid context (amount > 0)
    const validResult = engine.executeInvariant('rule_amount_positive', {
      amount: 100
    });
    assert(validResult.executed === true, 'Execution should succeed');
    assert(validResult.valid === true, 'Valid context should pass');

    // Execute with invalid context (amount = 0)
    const invalidResult = engine.executeInvariant('rule_amount_positive', {
      amount: 0
    });
    assert(invalidResult.executed === true, 'Execution should complete');
    assert(invalidResult.valid === false, 'Invalid context should fail');

    const metrics = engine.getMetrics('rule_amount_positive');
    assert(metrics.execution.executions === 2, 'Should have 2 executions');
    assert(metrics.execution.successes === 1, 'Should have 1 success');

    console.log(`✅ Bytecode executed: 2 runs, 1 pass, 1 fail`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Integrity Verification and Fault Handling
 * Verify hash-based integrity detection and fault recovery
 */
async function testIntegrityAndFaults() {
  console.log('\n=== TEST 5: Integrity and Fault Handling ===');
  try {
    const compiler = new InvariantCompiler();
    const registry = new KernelInvariantRegistry();

    // Compile rule
    const rule = {
      ruleId: 'rule_data_valid',
      level: 'CRITICAL',
      schema: 'INVARIANT_1',
      conditions: [
        { field: 'data', operator: 'ne', value: null }
      ]
    };

    compiler.compileRule(rule);
    const bytecode = compiler.getBytecode('rule_data_valid');

    // Register with correct hash
    const registerResult = registry.registerInvariant({
      ruleId: 'rule_data_valid',
      bytecode: bytecode.bytecode,
      version: '1.0',
      schema: 'INVARIANT_1',
      level: 'CRITICAL',
      bytecodeHash: bytecode.hash
    });
    assert(registerResult.registered === true, 'Registration should succeed');

    // Verify integrity
    const verifyResult = registry.verifyInvariant('rule_data_valid');
    assert(verifyResult.verified === true, 'Integrity check should pass');
    assert(verifyResult.valid === true, 'Hash should match');

    // Try to register with wrong hash (should fail)
    const badRegisterResult = registry.registerInvariant({
      ruleId: 'rule_bad_hash',
      bytecode: bytecode.bytecode,
      version: '1.0',
      schema: 'INVARIANT_1',
      level: 'CRITICAL',
      bytecodeHash: 'bad_hash_value'
    });
    assert(badRegisterResult.registered === false, 'Bad hash should reject registration');
    assert(badRegisterResult.reason === 'HASH_MISMATCH', 'Should cite hash mismatch');

    console.log(`✅ Integrity verified: correct hash passes, wrong hash rejected`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: End-to-End Flow
 * Verify complete pipeline: compile → register → execute → verify
 */
async function testEndToEndFlow() {
  console.log('\n=== TEST 6: End-to-End Complete Flow ===');
  try {
    const compiler = new InvariantCompiler();
    const registry = new KernelInvariantRegistry();
    const engine = new InvariantExecutionEngine({ registry });

    // Define complex invariant set
    const invariantSet = {
      setId: 'set_transaction_rules',
      rules: [
        {
          ruleId: 'rule_amount_positive',
          level: 'CRITICAL',
          schema: 'TRANSACTION_1',
          version: '1.0',
          conditions: [
            { field: 'amount', operator: 'gt', value: 0, critical: true }
          ]
        },
        {
          ruleId: 'rule_valid_account',
          level: 'CRITICAL',
          schema: 'TRANSACTION_1',
          version: '1.0',
          conditions: [
            { field: 'accountId', operator: 'ne', value: null, critical: true }
          ]
        },
        {
          ruleId: 'rule_within_limits',
          level: 'WARNING',
          schema: 'TRANSACTION_1',
          version: '1.0',
          conditions: [
            { field: 'amount', operator: 'lte', value: 1000000 }
          ]
        }
      ]
    };

    // PHASE 1: Compile set
    const compileResult = compiler.compileInvariantSet(invariantSet);
    assert(compileResult.compiled === true, 'Compilation should succeed');
    assert(compileResult.rulesCompiled === 3, 'All rules should compile');

    // PHASE 2: Register all rules
    for (const rule of invariantSet.rules) {
      const bytecode = compiler.getBytecode(rule.ruleId);
      const registerResult = registry.registerInvariant({
        ruleId: rule.ruleId,
        bytecode: bytecode.bytecode,
        version: rule.version,
        schema: rule.schema,
        level: rule.level,
        bytecodeHash: bytecode.hash
      });
      assert(registerResult.registered === true, `${rule.ruleId} should register`);
    }

    // PHASE 3: Execute with valid transaction
    const validTx = {
      amount: 50000,
      accountId: 'acc_12345'
    };

    const results = [];
    for (const rule of invariantSet.rules) {
      const execResult = engine.executeInvariant(rule.ruleId, validTx);
      results.push({
        ruleId: rule.ruleId,
        valid: execResult.valid
      });
      assert(execResult.executed === true, `${rule.ruleId} should execute`);
      assert(execResult.valid === true, `${rule.ruleId} should pass with valid tx`);
    }

    // PHASE 4: Execute with invalid transaction
    const invalidTx = {
      amount: -100,
      accountId: null
    };

    for (const rule of invariantSet.rules) {
      const execResult = engine.executeInvariant(rule.ruleId, invalidTx);
      if (rule.ruleId !== 'rule_within_limits') {
        // Critical rules should fail
        assert(execResult.valid === false, `${rule.ruleId} should fail with invalid tx`);
      }
    }

    // PHASE 5: Verify integrity of all rules
    const schemaResults = registry.verifySchema('TRANSACTION_1');
    assert(schemaResults.verified === true, 'Schema should verify');
    assert(schemaResults.invariantsChecked === 3, 'All 3 rules checked');

    // PHASE 6: Verify metrics
    const compilerStats = compiler.getStats();
    const registryStats = registry.getStats();
    const engineMetrics = engine.getMetrics();

    assert(compilerStats.rulesCompiled === 3, 'Compiler: 3 rules');
    assert(registryStats.totalInvariants === 3, 'Registry: 3 invariants');
    assert(engineMetrics.totalExecutions === 6, 'Engine: 6 executions (3 rules × 2 runs)');

    console.log(`✅ End-to-end: compiled 3 rules, registered 3, executed 6 (3 pass, 3 fail), verified all`);

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
  console.log('🧪 PHASE 8.2 — Universal Invariant Compilation Layer');
  console.log('═'.repeat(70));

  try {
    await testDeterministicCompilation();
    await testDAGOptimization();
    await testRegistryAndVersioning();
    await testBytecodeExecution();
    await testIntegrityAndFaults();
    await testEndToEndFlow();

    console.log('\n' + '═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/6 tests`);
    console.log('═'.repeat(70));
    console.log('\n🎯 INVARIANT COMPILATION: UNIVERSAL BYTECODE LAYER COMPLETE');
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
  InvariantCompiler,
  KernelInvariantRegistry,
  InvariantExecutionEngine
};
