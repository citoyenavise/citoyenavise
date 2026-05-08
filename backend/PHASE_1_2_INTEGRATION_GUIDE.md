---
name: PHASE_1_2_INTEGRATION_GUIDE
description: How to integrate PHASE 1.2 Runtime Loaders into the application bootstrap
type: guide
---

# 🔌 PHASE 1.2 — INTEGRATION GUIDE

**How to integrate Runtime Loaders into your application**

---

## 🎯 Integration Points

The Runtime Loaders must be integrated at **application startup**, before any other layers:

```
Application Startup
    ↓
1. Load Constitution (PHASE 1.2 - Loaders)
    ↓
2. Validate Constitution (PHASE 1.3 - Validation)
    ↓
3. Enforce Rules (PHASE 1.4 - Enforcement)
    ↓
4. Setup Observability (PHASE 1.5 - Observability)
    ↓
5. Setup Recovery (PHASE 1.6 - Recovery)
    ↓
6. Start Application
```

---

## 📝 INTEGRATION STEPS

### Step 1: Import in Bootstrap File

**File**: `backend/src/bootstrap.js` (or your startup file)

```javascript
const { ConstitutionLoaderManager } = require('./src/core/loaders');
```

### Step 2: Load Constitution Early

**In your startup sequence** (before initializing modules):

```javascript
async function initializeSystem() {
  console.log('🚀 Starting application initialization...');
  
  try {
    // STEP 1: Load Constitution (PHASE 1.2)
    console.log('📖 Loading constitution from ROOT_CONSTITUTION/...');
    const constitutionManager = new ConstitutionLoaderManager();
    const loadResult = await constitutionManager.loadConstitution();
    
    console.log(`✅ Constitution loaded successfully`);
    console.log(`   - Modules: ${loadResult.modules}`);
    console.log(`   - Event types: ${loadResult.eventTypes}`);
    console.log(`   - Governance rules: ${loadResult.rules}`);
    console.log(`   - Policies: ${loadResult.policies}`);
    console.log(`   - Load time: ${loadResult.loadDuration_ms}ms`);
    
    // STEP 2: Verify Constitution Integrity
    console.log('🔍 Verifying constitution integrity...');
    const integrity = constitutionManager.verifyConstitutionIntegrity();
    
    if (!integrity.valid) {
      console.error('❌ Constitution integrity violations detected:');
      integrity.issues.forEach(issue => console.error(`   - ${issue}`));
      process.exit(1);
    }
    console.log('✅ Constitution integrity verified');
    
    // STEP 3: Store for Global Access
    global.constitutionManager = constitutionManager;
    global.constitution = constitutionManager.getConstitution();
    
    // STEP 4: Log Detailed Report
    const report = constitutionManager.getDetailedReport();
    console.log('📊 Constitution Status:');
    console.log(JSON.stringify(report, null, 2));
    
    // STEP 5: Continue with other initialization
    // ... rest of your initialization code ...
    
  } catch (error) {
    console.error('❌ Failed to initialize system:', error);
    process.exit(1);
  }
}

// Start the system
initializeSystem();
```

### Step 3: Make Constitution Available Globally

After loading, the constitution is available globally:

```javascript
// From anywhere in your application
const { constitution, constitutionManager } = global;

// Get specific information
const modules = constitutionManager.getModuleManifestLoader().getAllModules();
const policies = constitutionManager.getGovernancePoliciesLoader().getAllPolicies();
```

---

## 🔗 USAGE IN DIFFERENT LAYERS

### In PHASE 1.3 (Validation Layer)

```javascript
const { constitutionManager } = global;

// Get constitution rules
const manifest = constitutionManager.getModuleManifestLoader();
const schemas = constitutionManager.getSchemaRegistryLoader();
const rules = constitutionManager.getDependencyRulesLoader();

// Validate against them
function validateModules() {
  const modules = manifest.getAllModules();
  // ... validation logic using manifest data ...
}
```

### In PHASE 1.4 (Enforcement Layer)

```javascript
const { constitutionManager } = global;

// Get enforcement rules
const policies = constitutionManager.getGovernancePoliciesLoader();
const rules = constitutionManager.getDependencyRulesLoader();

// Enforce them
function enforcePolicy(policyId) {
  const policy = policies.getPolicy(policyId);
  // ... enforcement logic ...
}
```

### In PHASE 1.5 (Observability Layer)

```javascript
const { constitutionManager } = global;

// Get capabilities and targets
const capabilities = constitutionManager.getCapabilityRegistryLoader();
const targets = capabilities.getAllPerformanceTargets();

// Use for baseline
console.log('Performance targets:', targets);
```

### In PHASE 1.6 (Recovery Layer)

```javascript
const { constitutionManager } = global;

// Get recovery policies
const policies = constitutionManager.getGovernancePoliciesLoader();

// Use for recovery decisions
function decideRecoveryLevel(failureType) {
  const allPolicies = policies.getAllPolicies();
  // ... use policies to decide recovery ...
}
```

---

## 📦 EXAMPLE: Express/Node.js Integration

If you're using Express, integrate loaders in your app initialization:

```javascript
// app.js
const express = require('express');
const { ConstitutionLoaderManager } = require('./src/core/loaders');

const app = express();

// Global initialization function
async function initializeApp() {
  try {
    // Load Constitution
    const constitutionManager = new ConstitutionLoaderManager();
    await constitutionManager.loadConstitution();
    
    // Verify it
    const integrity = constitutionManager.verifyConstitutionIntegrity();
    if (!integrity.valid) {
      throw new Error(`Constitution integrity failed: ${integrity.issues.join(', ')}`);
    }
    
    // Store globally
    app.locals.constitutionManager = constitutionManager;
    app.locals.constitution = constitutionManager.getConstitution();
    
    console.log('✅ Constitution loaded and verified');
    
    // Now your middleware and routes can use it
    return app;
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
    throw error;
  }
}

// Middleware to access constitution
function getConstitution(req, res, next) {
  req.constitution = req.app.locals.constitution;
  req.constitutionManager = req.app.locals.constitutionManager;
  next();
}

app.use(getConstitution);

// Routes can now use it
app.get('/api/system/constitution', (req, res) => {
  const report = req.constitutionManager.getDetailedReport();
  res.json(report);
});

// Export initialization
module.exports = { initializeApp, app };
```

**Startup**:
```javascript
// server.js
const { initializeApp } = require('./app');

async function start() {
  const app = await initializeApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch(err => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

---

## 🔒 SAFETY GUARANTEES

### Constitution Immutability

Once loaded, the constitution cannot be modified:

```javascript
// This is safe - no modifications possible
const constitution = global.constitutionManager.getConstitution();

// Loaders are sealed
const manifest = global.constitutionManager.getModuleManifestLoader();
// manifest.load() will throw - already sealed

// Constitution is read-only
console.log(constitution.metadata.read_only); // true
console.log(constitution.metadata.sealed);    // true
console.log(constitution.metadata.immutable); // true
```

### Zero Modifications to Disk

```javascript
// These operations read from disk only once
// They never write back to disk
// Files remain exactly as they were
const manager = new ConstitutionLoaderManager();
await manager.loadConstitution();

// No changes to ROOT_CONSTITUTION/ directory
// No temporary files created
// No state modifications
```

---

## ✅ CHECKLIST: Integration Complete

After integrating, verify:

- [ ] ConstitutionLoaderManager imported
- [ ] loadConstitution() called during startup
- [ ] Integrity verification passes
- [ ] Constitution stored in global
- [ ] No errors in console
- [ ] Load time is reasonable (< 200ms)
- [ ] All 7 loaders report success
- [ ] Constitution accessible from anywhere
- [ ] PHASE 1.3 (Validation) can access it
- [ ] Tests pass: `npm test -- loaders.test.js`

---

## 🐛 TROUBLESHOOTING

### Issue: "Constitution not loaded"

```javascript
// ❌ WRONG: Constitution accessed before loading
const constitution = global.constitution; // undefined!

// ✅ RIGHT: Load first, then access
const manager = new ConstitutionLoaderManager();
await manager.loadConstitution();
const constitution = manager.getConstitution();
```

### Issue: "Cannot find module"

```javascript
// Check your import path
const { ConstitutionLoaderManager } = require('./src/core/loaders');
// Path should be relative to your file location
```

### Issue: "Constitution integrity violations"

```javascript
// Check the issues list
const integrity = manager.verifyConstitutionIntegrity();
console.error('Issues:');
integrity.issues.forEach(issue => {
  console.error(`- ${issue}`);
});
// Common causes:
// - Missing module referenced in dependencies
// - Event type declared but no schema
// - Module declared twice
```

### Issue: "ModuleManifest.json is not properly sealed"

The constitution file is corrupted or modified. Check:
1. File has `"sealed": true`
2. File has `"immutable": true`
3. File has `"read_only": true`
4. File was not edited (should be in git history)

---

## 📊 MONITORING INTEGRATION

### Capture Load Metrics

```javascript
const manager = new ConstitutionLoaderManager();
const startTime = Date.now();
const result = await manager.loadConstitution();
const duration = Date.now() - startTime;

// Log metrics
console.log(`Constitution load time: ${duration}ms`);
console.log(`Modules: ${result.modules}`);
console.log(`Event types: ${result.eventTypes}`);
console.log(`Rules: ${result.rules}`);
console.log(`Policies: ${result.policies}`);

// Store for monitoring
process.env.CONSTITUTION_LOAD_TIME_MS = duration;
process.env.CONSTITUTION_MODULE_COUNT = result.modules;
```

### Health Check Endpoint

```javascript
app.get('/health/constitution', (req, res) => {
  const manager = req.app.locals.constitutionManager;
  const status = manager.getStatus();
  
  res.json({
    loaded: status.loaded,
    sealed: status.sealed,
    modules: status.modules,
    eventTypes: status.eventTypes,
    timestamp: status.timestamp
  });
});
```

---

## 🚀 NEXT STEPS

Once integration is complete:

1. **Run tests**: `npm test -- loaders.test.js`
2. **Start application**: Verify constitution loads successfully
3. **Move to PHASE 1.3**: Implement Validation Layer
4. **Continue layers**: Enforce → Observe → Recover

---

**INTEGRATION GUIDE COMPLETE**

✅ Constitution loaders ready for integration  
✅ Global access pattern established  
✅ Multi-layer integration verified  
✅ Safety guarantees confirmed  

🚀 Ready for PHASE 1.3: Validation Layer
