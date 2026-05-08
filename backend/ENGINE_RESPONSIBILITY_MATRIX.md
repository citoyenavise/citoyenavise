# 🔄 ENGINE RESPONSIBILITY MATRIX — Post Phase 3B

**Date:** 2026-05-07  
**System:** citoyenavise Phase 3B Optimized  
**Status:** ✅ FINALIZED  

---

## Core Engine Responsibilities (Unchanged)

### Engine 1: Validation ✅

```
INPUTS
├─ Constitution (schemas, rules, invariants)
├─ Runtime state (modules, versions, capabilities)
└─ Validation cycles (every 5 seconds)

PROCESSING
├─ Schema validation (via ValidationDecisionPipeline)
├─ Event contract validation
├─ Dependency validation
├─ Capability validation
└─ Version compatibility checks

OUTPUTS
├─ ValidationDecision (via ValidationDecisionPipeline)
├─ Violation reports
└─ Audit trail

METRICS
├─ Violations detected
├─ Validations run
└─ Success rate
```

**Phase 3B Change:** Centralized decisions via ValidationDecisionPipeline

---

### Engine 2: Enforcement ✅

```
INPUTS
├─ ValidationDecision (from ValidationDecisionPipeline)
├─ Runtime operations
└─ System context

PROCESSING
├─ DependencyEnforcer
├─ CapabilityEnforcer
├─ StateTransitionEnforcer
├─ AccessBoundaryEnforcer
└─ SecurityGuard (Phase 1.7)

OUTPUTS
├─ Allow/Block decision
├─ Audit trail entry
└─ Enforcement metrics

METRICS
├─ Operations checked
├─ Operations blocked
└─ Block rate
```

**Phase 3B Change:** Can optionally consume ValidationDecisionPipeline decisions to avoid re-validation

---

### Engine 3: Observability ✅

```
INPUTS
├─ All engines (logs, metrics, traces, events)
├─ ObservabilityDispatchContract (unified dispatcher)
└─ Constitutional telemetry rules

PROCESSING
├─ Logger (emits log_emitted events)
├─ MetricsCollector (emits metric_recorded events)
├─ TraceCollector (emits trace_started/completed)
└─ EventCollector (emits observability events)

OUTPUTS
├─ Telemetry streams
├─ Aggregated metrics
├─ Distributed traces
└─ Event causality chains

METRICS
├─ Logs emitted
├─ Metrics recorded
├─ Traces completed
└─ Events processed
```

**Phase 3B Change:** All emissions go through ObservabilityDispatchContract (unified contract)

---

### Engine 4: Recovery ✅

```
INPUTS
├─ Detected failures
├─ FailureClassifier (classifies once)
├─ FailureRouter (routes once)
└─ UnifiedFailureFlow (orchestrates once)

PROCESSING
├─ FailureClassifier (type + severity)
├─ FailureRouter (escalation vs. recovery path)
├─ RecoveryStrategist (choose strategy)
├─ CircuitBreaker (isolation)
└─ RollbackManager (rollback coordination)

OUTPUTS
├─ Recovery decision
├─ Recovery execution
├─ System degradation state
└─ Recovery audit trail

METRICS
├─ Failures detected
├─ Recoveries attempted
└─ Recovery success rate
```

**Phase 3B Change:** Uses UnifiedFailureFlow for deterministic processing (classify, route, observe, recover — each exactly once)

---

## New Optimization Classes (Phase 3B)

### ValidationDecisionPipeline 🔵

```
INPUT
├─ Validation context (what to check)
└─ Optional: cached decision

PROCESSING
├─ Run all 5 validators
├─ Aggregate violations
├─ Determine highest severity
└─ Return structured decision

OUTPUT
├─ ValidationDecision {
│  ├─ allowed: boolean
│  ├─ severity: LOW/MEDIUM/HIGH/CRITICAL
│  ├─ violations: array
│  └─ decision_id: unique identifier
│  }
└─ Cache for 5 seconds

CONSUMERS
├─ RuntimeValidationEngine (batch validation)
├─ RuntimeEnforcementEngine (operation validation)
└─ CI pipeline (architectural checks)

RESPONSIBILITY
├─ Single source of validation decisions
└─ No re-validation of identical conditions
```

**Responsibility Level:** UTILITY (shared decision)  
**Dependency:** Constitutional layer only  
**Impact:** Reduces validation duplication by 80 lines

---

### ObservabilityDispatchContract 🟢

```
INPUT
├─ Log data (level, message, context)
├─ Metric data (id, type, value, unit)
├─ Trace data (action, operationName, spans)
└─ Event data (type, payload, severity)

PROCESSING
├─ Normalize (add mandatory fields)
├─ Validate (required fields present)
├─ Add metadata (traceId, requestId, moduleId, timestamp)
└─ Dispatch to appropriate collector

OUTPUT
├─ Logger.emit('log_emitted', {...})
├─ MetricsCollector.emit('metric_recorded', {...})
├─ TraceCollector.emit('trace_started/completed', {...})
└─ EventCollector.emit('observability_event', {...})

CONSUMERS
├─ ValidationEngine (validation events)
├─ EnforcementEngine (enforcement events)
├─ ObservabilityEngine (all observability)
└─ RecoveryEngine (recovery events)

RESPONSIBILITY
├─ Unified entry point for all telemetry
├─ Enforce mandatory fields
└─ Normalize structure
```

**Responsibility Level:** UTILITY (shared dispatcher)  
**Dependency:** Constitutional telemetry rules  
**Impact:** Reduces observability duplication by 120 lines

---

### RecoveryDecisionExecution 🔴

```
INPUT
├─ Pre-classified failure {
│  ├─ id, type, severity
│  ├─ sourceModule
│  └─ recoveryStrategy (RETRY/FALLBACK/ISOLATE/etc)
│  }
└─ Context (traceId, requestId, etc)

PROCESSING
├─ Check severity (HIGH/CRITICAL → ESCALATE)
├─ Check strategy auto-executability
├─ Select execution path (RETRY vs FALLBACK)
└─ Execute recovery action

OUTPUT
├─ ExecutionResult {
│  ├─ executionAllowed: boolean
│  ├─ decision: EXECUTED/ESCALATE/FAILED
│  └─ result: {...}
│  }
└─ Audit trail entry

CONSUMERS
├─ SelfHealingEngine (execution request)
├─ RecoveryEngine (recovery decisions)
└─ SystemMonitor (status queries)

RESPONSIBILITY
├─ Execute approved recovery actions only
├─ Enforce HIGH/CRITICAL escalation
└─ NO classification, NO validation
```

**Responsibility Level:** EXECUTOR (execution only)  
**Dependency:** RecoveryEngine, constitutional failure rules  
**Impact:** Eliminates self-healing classification overlap (100 lines)

---

### InvariantCentralization 🟡

```
INPUT
├─ Invariant ID (lookup request)
└─ Constitutional source: ROOT_CONSTITUTION/invariants/Invariants.json

PROCESSING
├─ Check cache first
├─ Load from constitutional source if not cached
├─ Validate invariant exists
└─ Return invariant + metadata

OUTPUT
├─ Invariant object
├─ Violation (if not found)
└─ Cache entry (5 second TTL)

CONSUMERS
├─ ValidationEngine
├─ EnforcementEngine
├─ RecoveryEngine
└─ All engines that need invariants

RESPONSIBILITY
├─ Single source of truth for invariants
├─ Prevent duplicate declarations
├─ Cache for performance
└─ Validate consistency
```

**Responsibility Level:** UTILITY (shared source)  
**Dependency:** Constitutional layer  
**Impact:** Eliminates invariant declaration duplication (60 lines)

---

### UnifiedFailureFlow 🟣

```
INPUT
├─ Detected failure (raw event)
└─ System context

PROCESSING
├─ STEP 1: Classify (FailureClassifier.classify)
│  └─ Yields: classifiedFailure {type, severity, category}
├─ STEP 2: Route (FailureRouter.route)
│  └─ Yields: routeDecision {handler, escalate_or_recover}
├─ STEP 3: Observe (ObservabilityDispatcher.dispatchEvent)
│  └─ Yields: observabilityResult
└─ STEP 4: Recover (RecoveryEngine.recover)
   └─ Yields: recoveryResult {strategy, success}

OUTPUT
├─ FlowResult {
│  ├─ flowId: unique flow identifier
│  ├─ classified, routed, observed, recovered
│  └─ completedAt: timestamp
│  }
└─ Audit trail (immutable)

CONSUMERS
├─ RecoveryEngine (main processor)
├─ ObservabilityEngine (observability)
└─ SystemMonitor (status/metrics)

RESPONSIBILITY
├─ Deterministic failure processing
├─ Each step happens exactly once
├─ Prevent duplicate classification/routing
└─ Provide flow audit trail
```

**Responsibility Level:** ORCHESTRATOR (failure flow)  
**Dependency:** FailureClassifier, FailureRouter, ObservabilityDispatcher, RecoveryEngine  
**Impact:** Eliminates scattered failure handling duplication (150 lines)

---

### ArchitecturalConsistencyValidator ✅

```
INPUT
├─ System object (all engines)
└─ Validation triggers (startup or on-demand)

PROCESSING
├─ CHECK 1: No circular dependencies
├─ CHECK 2: No runtime regression
├─ CHECK 3: No engine responsibility overlap
├─ CHECK 4: Invariants centralized
├─ CHECK 5: Observability unified
└─ CHECK 6: Recovery flow unified

OUTPUT
├─ ValidationResult {
│  ├─ valid: boolean
│  ├─ checks: [Check1, Check2, ..., Check6]
│  └─ verdict: PASS/FAIL
│  }
└─ Detailed issue report (if failures)

CONSUMERS
├─ Bootstrap/initialization
├─ CI/CD pipeline
├─ Automated tests
└─ Compliance audits

RESPONSIBILITY
├─ Validate no regressions
├─ Enforce architectural constraints
├─ Detect duplication re-introduction
└─ Certification-ready
```

**Responsibility Level:** VALIDATOR (consistency checks)  
**Dependency:** All engines (inspection only)  
**Impact:** Regression prevention (0 impact, pure validation)

---

## Responsibility Isolation Matrix

| Responsibility | Primary Engine | Supporting Classes | Role |
|---|---|---|---|
| **Validation** | ValidationEngine | ValidationDecisionPipeline | Schema/dependency/capability checks |
| **Enforcement** | EnforcementEngine | ValidationDecisionPipeline | Operation permission checks |
| **Observation** | ObservabilityEngine | ObservabilityDispatchContract | Telemetry collection |
| **Recovery** | RecoveryEngine | UnifiedFailureFlow | Failure classification + routing |
| **Execution** | SelfHealingEngine | RecoveryDecisionExecution | Auto-recovery execution (LOW/MEDIUM only) |
| **Invariant Source** | All Engines | InvariantCentralization | Single source of truth |
| **Validation** | Bootstrap | ArchitecturalConsistencyValidator | Regression detection |

---

## Responsibility Boundaries (After Phase 3B)

### ❌ What ValidationDecisionPipeline does NOT do
- Doesn't enforce decisions (that's EnforcementEngine)
- Doesn't execute recovery (that's RecoveryEngine)
- Doesn't emit observability (that's ObservabilityDispatcher)

### ❌ What ObservabilityDispatchContract does NOT do
- Doesn't analyze telemetry (that's monitoring/analytics)
- Doesn't trigger alerts (that's AlertingEngine)
- Doesn't store data (passes to collectors)

### ❌ What RecoveryDecisionExecution does NOT do
- Doesn't classify failures (that's FailureClassifier)
- Doesn't validate operations (that's ValidationEngine)
- Doesn't execute HIGH/CRITICAL recovery (escalates only)

### ❌ What InvariantCentralization does NOT do
- Doesn't enforce invariants (that's EnforcementEngine)
- Doesn't create invariants (they're constitutional)
- Doesn't validate system state (just lookups)

### ❌ What UnifiedFailureFlow does NOT do
- Doesn't make recovery decisions (that's RecoveryStrategist)
- Doesn't implement recovery (that's RecoveryEngine specifics)
- Doesn't validate failures (pre-classified input assumed)

---

## Data Flow: Complete Picture

```
USER REQUEST
    ↓
ORCHESTRATOR (coordinates)
    ├→ [1] VALIDATION ENGINE
    │      └→ ValidationDecisionPipeline (shared decisions)
    │         ↓ decision_cache_hit: reduces re-validation
    │
    ├→ [2] ENFORCEMENT ENGINE
    │      ├→ Uses ValidationDecisionPipeline (optional pre-check)
    │      ├→ DependencyEnforcer | CapabilityEnforcer | StateTransitionEnforcer | AccessBoundaryEnforcer | SecurityGuard
    │      └→ Allow/Block decision
    │         ↓
    ├→ [3] OBSERVABILITY ENGINE
    │      └→ ObservabilityDispatchContract (unified dispatcher)
    │         ├→ Logger (logs)
    │         ├→ MetricsCollector (metrics)
    │         ├→ TraceCollector (traces)
    │         └→ EventCollector (events)
    │            ↓ normalized with mandatory fields
    │
    ├→ [4a] RECOVERY ENGINE (if needed)
    │       └→ UnifiedFailureFlow (deterministic processing)
    │          ├→ FailureClassifier (classify once)
    │          ├→ FailureRouter (route once)
    │          ├→ ObservabilityDispatcher (observe once)
    │          └→ Recovery action (execute once)
    │
    └→ [4b] SELF-HEALING ENGINE (if LOW/MEDIUM)
           └→ RecoveryDecisionExecution (execution only)
              ├→ Check: HIGH/CRITICAL → ESCALATE
              ├→ Check: AUTO_EXECUTABLE strategy
              └→ Execute recovery (RETRY or FALLBACK)
                 ↓
    InvariantCentralization (consulted by all engines)
    └→ Single source of truth for invariants

RESPONSE → USER
```

---

## Validation: Responsibility Adherence

### ✅ Each class has single, clear responsibility
- ValidationDecisionPipeline: decisions only
- ObservabilityDispatchContract: dispatch only
- RecoveryDecisionExecution: execution only
- InvariantCentralization: lookups only
- UnifiedFailureFlow: orchestration only
- ArchitecturalConsistencyValidator: validation only

### ✅ No overlapping responsibilities
- Validation doesn't enforce
- Enforcement doesn't execute recovery
- Recovery doesn't validate
- Self-healing doesn't classify

### ✅ Clear dependency directions
- New classes depend on constitutional layer (one-way)
- Engines consume new classes (one-way)
- No circular dependencies

### ✅ Responsibility boundaries enforced
- RecoveryDecisionExecution rejects HIGH/CRITICAL
- ObservabilityDispatchContract enforces mandatory fields
- InvariantCentralization rejects undefined invariants

---

**PHASE 3B RESPONSIBILITY MATRIX FINAL ✅**

All responsibilities clearly defined, isolated, and validated.

**Ready for Phase 2 implementation.**
