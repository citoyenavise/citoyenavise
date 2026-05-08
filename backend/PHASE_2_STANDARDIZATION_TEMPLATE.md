# PHASE 2.1 Standardization Template & Batch Processing Guide

**Purpose:** Enable systematic standardization of remaining 28 MEDIUM + LOW priority modules

---

## STANDARDIZATION TEMPLATE FOR ANY MODULE

### Step 1: Create Folder Structure (8 folders)

```bash
mkdir -p module/manifest
mkdir -p module/contracts
mkdir -p module/events
mkdir -p module/services
mkdir -p module/controllers
mkdir -p module/validation
mkdir -p module/observability
mkdir -p module/tests
```

### Step 2: Create manifest/manifest.json

```json
{
  "name": "MODULE_NAME",
  "version": "1.0.0",
  "description": "Module description",
  "dependencies": [],
  "capabilities": ["module:read", "module:write"],
  "events": ["module:event_name"],
  "routes": {
    "prefix": "/api/v1/module_name",
    "methods": ["GET", "POST", "PUT", "DELETE"]
  },
  "lifecycle": {
    "initRequired": true,
    "readyRequired": true,
    "healthChecks": true
  }
}
```

### Step 3: Create contracts/index.js

```javascript
// Re-export all contract schemas
module.exports = {};
```

### Step 4: Create Request/Response Contract Schemas

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Operation Request/Response",
  "type": "object",
  "properties": { },
  "required": []
}
```

### Step 5: Create events/index.js

```javascript
// Re-export all event declarations
module.exports = {};
```

### Step 6: Create Event Declarations

```json
{
  "name": "module:event_name",
  "version": "1.0.0",
  "domain": "module",
  "action": "event_name",
  "entity": "entity_type",
  "description": "Event description",
  "schema": {
    "type": "object",
    "properties": { },
    "required": []
  }
}
```

### Step 7: Create validation/index.js

```javascript
const { z } = require('zod');

const operationRules = {
  field: z.string().min(1),
};

module.exports = {
  operationRules,
};
```

### Step 8: Create observability/index.js

```javascript
module.exports = {
  telemetryConfig: {
    logLevel: 'info',
    captureMetrics: true,
    captureTraces: true,
    sampleRate: 1.0,
  },
  metrics: {
    operationCount: 'counter',
  },
};
```

### Step 9: Move Service Files to services/

```bash
# Move or consolidate service files
mv module.service.js services/module.service.js
mv additional.service.js services/additional.service.js
```

### Step 10: Move Controller Files to controllers/

```bash
# Move or consolidate controller files
mv module.controller.js controllers/module.controller.js
mv additional.controller.js controllers/additional.controller.js
```

### Step 11: Create tests/setup.js

```javascript
beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  jest.clearAllTimers();
});
```

### Step 12: Create Standardized index.js

```javascript
const routes = require('./routes');
const contracts = require('./contracts');
const events = require('./events');

let isReady = false;

async function init(context) {
  try {
    console.log('[MODULE_NAME] Initializing...');
    isReady = false;
    return { initialized: true, moduleName: 'MODULE_NAME' };
  } catch (error) {
    throw new Error(`[MODULE_NAME] Initialization failed: ${error.message}`);
  }
}

async function ready() {
  if (!isReady) {
    isReady = true;
    console.log('[MODULE_NAME] Ready for requests');
  }
  return { ready: true };
}

async function shutdown() {
  try {
    console.log('[MODULE_NAME] Shutting down...');
    isReady = false;
    return { shutdown: true };
  } catch (error) {
    console.error('[MODULE_NAME] Shutdown error:', error.message);
    return { shutdown: false, error: error.message };
  }
}

async function health() {
  return {
    status: isReady ? 'healthy' : 'unhealthy',
    details: {
      ready: isReady,
      moduleName: 'MODULE_NAME',
      timestamp: new Date().toISOString(),
    },
  };
}

function getRoutes() {
  return routes;
}

function getEvents() {
  return events;
}

function getContracts() {
  return contracts;
}

module.exports.init = init;
module.exports.ready = ready;
module.exports.shutdown = shutdown;
module.exports.health = health;
module.exports.getRoutes = getRoutes;
module.exports.getEvents = getEvents;
module.exports.getContracts = getContracts;
```

### Step 13: Update routes.js

```javascript
const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired } = require('../../core/middleware/auth');
const controller = require('./controllers/MODULE_NAME.controller');

const router = express.Router();

// Add routes - update controller paths to point to new location
router.get('/', asyncHandler(controller.operation));

module.exports = router;
```

### Step 14: Delete Old Files

```bash
# Remove non-standard files from root
rm -f module/controller.js
rm -f module/service.js
rm -f module/schema.js
rm -f module/*.controller.js  (if in root)
rm -f module/*.service.js     (if in root)
```

### Step 15: Validate with ModuleStructureValidator

```bash
node -e "
const ModuleStructureValidator = require('./src/core/ModuleStructureValidator');
const validator = new ModuleStructureValidator();
validator.loadStandard();
const result = validator.validateModuleStructure('./src/modules/MODULE_NAME', 'MODULE_NAME');
console.log('VALID:', result.valid);
"
```

---

## BATCH PROCESSING STRATEGY

### MEDIUM Priority Modules (14)

**Group 1 (Days 1-2):** 5 modules
- admin
- analytics
- comments
- content
- education

**Group 2 (Day 3):** 5 modules
- establishments
- ideas
- initiatives
- likes
- map

**Group 3 (Day 4):** 4 modules
- media
- moderation
- profiles
- search

### LOW Priority Modules (14)

**Group 1 (Day 5):** 5 modules
- ai_mascot
- cms
- follow
- friends
- groups

**Group 2 (Day 6):** 5 modules
- homepage
- influence_system
- official_pages
- popular_system
- programmes

**Group 3 (Day 7):** 4 modules
- public_dashboard
- reports
- settings
- webhooks

---

## QUALITY ASSURANCE

### Per-Module Validation Checklist

- [ ] 8 folders created
- [ ] manifest/manifest.json created
- [ ] contracts/index.js created
- [ ] events/index.js created
- [ ] validation/index.js created
- [ ] observability/index.js created
- [ ] services/ folder populated
- [ ] controllers/ folder populated
- [ ] tests/setup.js created
- [ ] index.js updated with 7 exports
- [ ] routes.js updated with new controller paths
- [ ] Old root files deleted
- [ ] ModuleStructureValidator passes 6/6 checks

### Per-Batch Validation

After each group of 5 modules:

```bash
node -e "
const ModuleStructureValidator = require('./src/core/ModuleStructureValidator');
const validator = new ModuleStructureValidator();
validator.loadStandard();

const modules = ['mod1', 'mod2', 'mod3', 'mod4', 'mod5'];
let conformant = 0;
modules.forEach(mod => {
  const result = validator.validateModuleStructure(\`./src/modules/\${mod}\`, mod);
  if (result.valid) conformant++;
  console.log(mod, result.valid ? '✅' : '❌');
});
console.log(\`Result: \${conformant}/\${modules.length}\`);
"
```

---

## EXPECTED TIMELINE

### Week 2 (Days 1-4): MEDIUM Priority Modules
- 14 modules × 30-45 minutes = ~10 hours
- Batch 1: 5 modules (2 hours)
- Batch 2: 5 modules (2 hours)
- Batch 3: 4 modules (1.5 hours)
- Validation & corrections: 2 hours

### Week 3 (Days 5-7): LOW Priority Modules
- 14 modules × 25-35 minutes = ~8 hours (faster due to experience)
- Batch 1: 5 modules (1.5 hours)
- Batch 2: 5 modules (1.5 hours)
- Batch 3: 4 modules (1 hour)
- Validation & corrections: 2 hours

### Week 3 (Day 8): Final Audit
- Validate all 33 modules
- Generate compliance matrix
- Create PHASE 2.1 certification

---

## COMMON PITFALLS TO AVOID

❌ **DO NOT:**
- Skip folder creation
- Keep old root-level service.js or controller.js files
- Forget to update module export paths in index.js
- Neglect to create manifest.json with required fields
- Use custom folder structures

✅ **DO:**
- Follow the template exactly
- Test each module with ModuleStructureValidator
- Delete old non-standard files
- Create all 8 folders even if some are empty initially
- Keep the pattern consistent across all modules

---

## AUTOMATION OPPORTUNITY

A script can be created to:
1. Generate template files from module name
2. Create folder structure
3. Generate manifest.json
4. Create boilerplate index.js
5. Identify old files for deletion
6. Run validation automatically

**Estimated automation potential:** 80% of boilerplate work

---

## SUCCESS METRICS

**Phase 2.1 Completion:**
- 33/33 modules standardized
- 33/33 modules pass 6 validation checks
- 100% conformance rate
- Zero structural drift
- Zero broken imports

**Target Date:** 2026-05-14 (7 days from HIGH priority completion)

---

**This template enables systematic, repeatable standardization of all remaining backend modules.**
