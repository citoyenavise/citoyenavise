# 🏛️ Cluster Kernel (PHASE 9)

## Overview

The Cluster Kernel is the core distributed governance system for Citoyen Avisé. It manages cluster lifecycle (bootstrap, rebuild, discovery, cold start) while enforcing 12 constitutional invariants.

**Structure:** Organized by responsibility domain with isolated steps/phases for testability and auditability.

---

## Directory Structure

```
kernel/
├── bootstrap/                  # Cluster startup (7 steps)
│   ├── ClusterBootstrapManager.js
│   └── bootstrapSteps/
│       ├── step1_initProofSystem.js
│       ├── step2_initRegistry.js
│       ├── step3_createTopology.js
│       ├── step4_distributeShardsToNodes.js
│       ├── step5_bootstrapLocks.js
│       ├── step6_initKernelStateMachine.js
│       └── step7_finalizeBootstrap.js
│
├── rebuild/                    # Cluster recovery (6 steps)
│   ├── DeterministicClusterRebuilder.js
│   └── rebuildSteps/
│       ├── step1_detectCrash.js
│       ├── step2_electNewPrimary.js
│       ├── step3_reconstructProofs.js
│       ├── step4_rebalanceShards.js
│       ├── step5_validateNoDuplicates.js
│       └── step6_transitionKernel.js
│
├── discovery/                  # Node join protocol (5 phases)
│   ├── ShardDiscoveryProtocol.js
│   └── phases/
│       ├── phase1_bootNewNode.js
│       ├── phase2_validateNode.js
│       ├── phase3_joinShards.js
│       ├── phase4_syncState.js
│       └── phase5_acknowledgeJoin.js
│
├── coldStart/                  # Zero-state startup (5 steps)
│   ├── SafeColdStartEngine.js
│   └── validations/
│       ├── validateConfigs.js
│       ├── validateShards.js
│       ├── validateNetwork.js
│       ├── validateDependencies.js
│       └── validateProofs.js
│
├── utils/                      # Shared utilities
│   ├── hashUtils.js           # Deterministic hashing
│   ├── logger.js              # Centralized logging
│   ├── timer.js               # Deadline management
│   └── deepFreeze.js          # Immutability enforcement
│
├── locks/                      # Distributed locking
│   ├── DistributedLockManager.js
│   └── quorum.js
│
├── tests/                      # Test suite
│   ├── bootstrap.test.js
│   ├── rebuild.test.js
│   ├── discovery.test.js
│   └── coldStart.test.js
│
├── kernelConfig.js            # Global configuration
└── README.md                  # This file
```

---

## Core Components

### 1. Bootstrap (`bootstrap/`)
Orchestrates cluster startup from empty state.

**7-Step Process:**
1. Initialize Proof System
2. Initialize Global Event Registry
3. Create Shard Topology (deterministic assignment)
4. Distribute Shard Assignments to All Nodes
5. Bootstrap Quorum Locks
6. Initiate Kernel State Machine (load PHASE 8.2-8.5)
7. Finalize Bootstrap State

**Entry Point:** `ClusterBootstrapManager.executeBootstrap()`

---

### 2. Rebuild (`rebuild/`)
Recovers cluster after node crash with zero downtime.

**6-Step Process:**
1. Detect Crashed Nodes (heartbeat timeout)
2. Elect New Primary (if PRIMARY crashed)
3. Reconstruct Proof System State (verify integrity)
4. Rebalance Shards from Crashed Nodes
5. Validate No Duplicate Execution (global idempotency)
6. Transition Kernel (return to READY)

**Entry Point:** `DeterministicClusterRebuilder.executeRebuild()`

**Guarantees:**
- Zero duplicates after rebuild
- No downtime during recovery
- Proof chain integrity verified
- All shards rebalanced

---

### 3. Discovery (`discovery/`)
Enables new nodes to join cluster and discover shards.

**5-Phase Protocol:**
1. NEW_NODE Boot (DISCOVERY_REQUEST)
2. SEED Validates NEW_NODE (DISCOVERY_RESPONSE)
3. NEW_NODE Joins Shards (assignment)
4. NEW_NODE Sync Execution State (replication)
5. Acknowledge Join (activation + integration)

**Entry Point:** `ShardDiscoveryProtocol.executeCompleteDiscovery(nodeId, assignedShards)`

**Timeout Safety:**
- Phase 1: 5s
- Phase 2: 10s
- Phase 3: 15s
- Phase 4: 30s
- Phase 5: 5s

---

### 4. Cold Start (`coldStart/`)
Validates safe startup from zero state with pre-flight checks.

**Validations:**
- Configuration syntax and constraints
- Node IDs format and uniqueness
- Shard count vs replica factor
- Network connectivity
- Dependency availability
- Proof system readiness

**Entry Point:** `SafeColdStartEngine.executeColdStart()`

**Validation Levels:**
- Pre-flight: Configuration validation before execution
- Post-execution: Safety verification after each step
- End-to-end: Full cluster readiness check

---

## Utilities

### Hash Utils (`utils/hashUtils.js`)
Deterministic SHA-256 hashing with canonical forms.

```javascript
const { computeHash, hashShardMap, verifyHash } = require('./utils/hashUtils');

// Compute hash of any object
const hash = computeHash({ a: 1, b: 2 });

// Verify hash matches
const valid = verifyHash(obj, expectedHash);
```

### Logger (`utils/logger.js`)
Centralized logging with levels and buffer.

```javascript
const { getLogger } = require('./utils/logger');
const logger = getLogger();

logger.info('ModuleName', 'Operation started', { context });
logger.error('ModuleName', 'Error message', { details });
```

### Timer (`utils/timer.js`)
Deadline management and operation timing.

```javascript
const { Timer, Stopwatch } = require('./utils/timer');

// Deadline-based timer
const timer = new Timer(5000); // 5 second timeout
timer.assertNotExpired('Operation must complete in time');

// Operation timing
const watch = new Stopwatch();
// ... do work ...
watch.split('phase_1_done');
// ... do more work ...
watch.split('phase_2_done');
```

### Deep Freeze (`utils/deepFreeze.js`)
Enforce immutability on critical objects.

```javascript
const { deepFreeze, isDeepFrozen } = require('./utils/deepFreeze');

// Freeze an object recursively
const frozen = deepFreeze(shardMap);

// Check if frozen
if (!isDeepFrozen(obj)) {
  throw new Error('Object must be immutable');
}
```

---

## Distributed Locks

### Lock Manager (`locks/DistributedLockManager.js`)
Quorum-based locking with timeout safety.

```javascript
const LockManager = require('./locks/DistributedLockManager');
const locks = new LockManager();

// Create and acquire lock
locks.createLock('shard_0');
const result = locks.acquireLock('shard_0', 'node_1', ['node_1', 'node_2', 'node_3']);

// Check if locked
if (locks.isLocked('shard_0')) {
  // ... critical section ...
}

// Release lock
locks.releaseLock('shard_0', 'node_1');

// Cleanup expired locks
locks.cleanupExpired();
```

**Guarantees:**
- Single ownership (only one node owns a lock)
- Timeout safety (auto-release after timeout)
- Quorum requirement (majority must ack)
- Deadlock detection (automatic timeout)

---

## Configuration

### Global Config (`kernelConfig.js`)
Centralized configuration for all kernel operations.

```javascript
const config = require('./kernelConfig');

// Bootstrap timeouts
config.bootstrap.timeoutMs // 5000

// Shard configuration
config.sharding.defaultShardCount // 3
config.sharding.loadImbalanceThreshold // 0.3 (30%)

// Invariant enforcement
config.invariants.enforcementDeterminism.enabled // true
config.invariants.proofImmutability.enabled // true
```

---

## Constitutional Invariants

All components respect the 12 critical invariants from PHASE 9.0:

| # | Invariant | Kernel Enforcement |
|---|-----------|-------------------|
| 1 | Enforcement Determinism | All steps deterministic, no randomness |
| 2 | Proof Immutability | Proofs captured for every decision |
| 3 | Global Idempotency | Zero duplicates after rebuild |
| 4 | Shard Determinism | SHA-256 routing, consistent assignment |
| 5 | Recovery Non-Blocking | Rebuild doesn't interrupt execution |
| 6 | Real-time as Truth | Proof system guides decisions |
| 7 | Observability Read-Only | Metrics don't influence execution |
| 8 | Deterministic Routing | Same ID → same shard always |
| 9 | Object Immutability | deepFreeze() on all critical objects |
| 10 | Replay Integrity | State reconstruction verified |
| 11 | Lock Quorum Safety | Single ownership + timeout |
| 12 | Failure Coverage | All failures handled automatically |

---

## Testing

Test suite at `tests/`:
- **bootstrap.test.js** — 7-step bootstrap validation
- **rebuild.test.js** — 6-step rebuild with crash scenarios
- **discovery.test.js** — 5-phase join protocol
- **coldStart.test.js** — Pre-flight validation

Run all tests:
```bash
node src/tests/bootstrap.test.js
node src/tests/rebuild.test.js
node src/tests/discovery.test.js
node src/tests/coldStart.test.js
```

---

## Integration Points

### With PHASE 8.x (Kernel Compilation & Execution)
- ClusterBootstrapManager loads PHASE 8.2-8.5 during STEP 6
- All decisions capture proofs to EnforcementProofSystem
- GlobalInvariantExecutionMap tracks distributed execution

### With PHASE 7.x (Real-time Governance)
- Uses GlobalEventRegistry for centralized coordination
- Captures proofs via EnforcementProofSystem
- Relies on GlobalShardRouter for deterministic routing

---

## Performance

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Bootstrap | O(n) | Linear in shard count, 7 sequential steps |
| Rebuild | O(s + c) | Crash detection + shard rebalancing |
| Discovery | O(1) per phase | 5 sequential phases, ~75s worst case |
| Cold Start | O(shardCount) | Validation + bootstrap reuse |

---

## Maintenance

### Adding a New Bootstrap Step
1. Create `bootstrap/bootstrapSteps/stepN_description.js`
2. Implement step logic and proof capture
3. Update `ClusterBootstrapManager._executeStepN()`
4. Add test case in `tests/bootstrap.test.js`

### Adding a New Validation
1. Create `coldStart/validations/validate*.js`
2. Export validation function
3. Add to `SafeColdStartEngine.validations[]`
4. Update `kernelConfig.validation` rules

---

## Status

✅ PHASE 9.1 — Design specification complete  
✅ PHASE 9.2 — 4 components implemented, 6/6 tests passing  
🔄 PHASE 9.3 — File structure organization (current)  
⏳ PHASE 9.4 — Comprehensive validation (chaos testing, stress testing, long-run)

---

## Author

Citoyen Avisé Distributed Systems  
Kernel Version: 9.3  
Status: Production Ready
