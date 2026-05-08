# PHASE 2.1 Quick Start — Immediate Execution Guide

**For:** Continuing module standardization (MEDIUM + LOW priority)  
**Duration:** 3-4 days for all remaining 28 modules  
**Pattern:** Proven with 5/5 HIGH priority modules (100% success rate)

---

## 🚀 THREE-STEP PROCESS

### Step 1: Prepare Module (5 minutes)

For each module:

```bash
cd backend/src/modules/MODULE_NAME

# Create 8 folders
mkdir -p manifest contracts events services controllers validation observability tests

# Delete old files
rm -f controller.js service.js schema.js *.controller.js *.service.js 
```

### Step 2: Create Boilerplate Files (10 minutes)

Use template from [PHASE_2_STANDARDIZATION_TEMPLATE.md](PHASE_2_STANDARDIZATION_TEMPLATE.md):

1. **Create manifest/manifest.json**
   - Copy template, update name/description/capabilities

2. **Create contracts/index.js**
   - Use empty export template

3. **Create events/index.js**
   - Use empty export template

4. **Create validation/index.js**
   - Use empty export template

5. **Create observability/index.js**
   - Use telemetry config template

6. **Create tests/setup.js**
   - Use standard test setup template

### Step 3: Update Core Files (10 minutes)

1. **Update index.js**
   - Replace with 7-export template
   - Change MODULE_NAME to actual module name

2. **Update routes.js**
   - Change controller require path from `'./controller'` to `'./controllers/MODULE_NAME.controller'`
   - Add `const { asyncHandler } = require('../../core/middleware/errorHandler');` if not present

3. **Move service files to services/**
   ```bash
   mv service.js services/MODULE_NAME.service.js
   ```

4. **Move controller files to controllers/**
   ```bash
   mv controller.js controllers/MODULE_NAME.controller.js
   ```

---

## ✅ VALIDATION (2 minutes)

```bash
cd /path/to/backend

node -e "
const ModuleStructureValidator = require('./src/core/ModuleStructureValidator');
const validator = new ModuleStructureValidator();
validator.loadStandard();
const result = validator.validateModuleStructure('./src/modules/MODULE_NAME', 'MODULE_NAME');
console.log('VALID:', result.valid ? '✅' : '❌');
if (!result.valid) {
  result.checks.forEach(c => {
    if (!c.valid) console.log('FAILED:', c.check, c.issues);
  });
}
"
```

---

## 📋 MEDIUM PRIORITY MODULES (14)

**Estimated:** 5-7 days  
**Approach:** Process in groups of 5, validate after each group

### Group 1 (Days 1-2)
- [ ] admin
- [ ] analytics
- [ ] comments
- [ ] content
- [ ] education

### Group 2 (Day 3)
- [ ] establishments
- [ ] ideas
- [ ] initiatives
- [ ] likes
- [ ] map

### Group 3 (Day 4)
- [ ] media
- [ ] moderation
- [ ] profiles
- [ ] search

---

## 📋 LOW PRIORITY MODULES (14)

**Estimated:** 3-5 days  
**Approach:** Process in groups of 5, validate after each group

### Group 1 (Day 5)
- [ ] ai_mascot
- [ ] cms
- [ ] follow
- [ ] friends
- [ ] groups

### Group 2 (Day 6)
- [ ] homepage
- [ ] influence_system
- [ ] official_pages
- [ ] popular_system
- [ ] programmes

### Group 3 (Day 7)
- [ ] public_dashboard
- [ ] reports
- [ ] settings
- [ ] webhooks

---

## 🎯 BATCH VALIDATION SCRIPT

Run after standardizing each group of 5:

```bash
node -e "
const ModuleStructureValidator = require('./src/core/ModuleStructureValidator');
const validator = new ModuleStructureValidator();
validator.loadStandard();

const modules = ['mod1', 'mod2', 'mod3', 'mod4', 'mod5'];
let conformant = 0;
modules.forEach(mod => {
  const result = validator.validateModuleStructure(\`./src/modules/\${mod}\`, mod);
  console.log(mod.padEnd(15), result.valid ? '✅ CONFORMANT' : '❌ FAILED');
  if (result.valid) conformant++;
});
console.log('─'.repeat(30));
console.log(\`Result: \${conformant}/\${modules.length} modules conformant\`);
"
```

---

## 📝 CHECKLIST FOR EACH MODULE

### Pre-Standardization
- [ ] Module exists in `backend/src/modules/`
- [ ] Module has current controller.js and service.js
- [ ] Module has routes.js

### During Standardization
- [ ] Create 8 folders (manifest, contracts, events, services, controllers, validation, observability, tests)
- [ ] Create manifest/manifest.json (with required fields)
- [ ] Create contracts/index.js
- [ ] Create events/index.js
- [ ] Create validation/index.js
- [ ] Create observability/index.js
- [ ] Create tests/setup.js
- [ ] Move service.js → services/MODULE_NAME.service.js
- [ ] Move controller.js → controllers/MODULE_NAME.controller.js
- [ ] Update index.js (7 mandatory exports)
- [ ] Update routes.js (controller path)

### Post-Standardization
- [ ] Delete old root-level service.js
- [ ] Delete old root-level controller.js
- [ ] Delete old root-level schema.js (if exists)
- [ ] Run ModuleStructureValidator
- [ ] Verify VALID: true
- [ ] Verify all 6 checks PASS
- [ ] Mark module as ✅ DONE

---

## ⚡ TIME ESTIMATES

| Task | Duration | Count | Total |
|------|----------|-------|-------|
| Prepare module | 5 min | 28 | 2.3 hours |
| Create boilerplate | 10 min | 28 | 4.6 hours |
| Update core files | 10 min | 28 | 4.6 hours |
| Validate module | 2 min | 28 | 0.9 hours |
| **Per-group validation** | 5 min | 6 | 0.5 hours |
| **TOTAL** | | | **13 hours** |

**Calendar Time:** 2-3 days intensive work (or 4-5 days at normal pace)

---

## 📊 TRACKING PROGRESS

### Daily Log Template

```
DATE: 2026-05-XX
DAY: X/7

COMPLETED:
✅ admin
✅ analytics
✅ comments
✅ content
✅ education

PROGRESS: 5/28 (18%)

VALIDATION RESULTS:
Group 1: 5/5 CONFORMANT ✅
```

---

## 🔍 TROUBLESHOOTING

### ModuleStructureValidator returns FAILED

**Check:**
1. Are all 8 folders created?
2. Is manifest/manifest.json present?
3. Does index.js have all 7 exports?
4. Are old root files (service.js, controller.js) deleted?
5. Is routes.js pointing to new controller path?

### Routes not working after update

**Fix:**
1. Verify controller path in routes.js: `'./controllers/MODULE_NAME.controller'`
2. Verify controller file exists: `src/modules/MODULE_NAME/controllers/MODULE_NAME.controller.js`
3. Verify require statement uses correct path

### Module import errors

**Fix:**
1. Update all relative imports that reference old paths
2. Example: `const service = require('./service');` → `require('./services/MODULE_NAME.service');`
3. Example: `const controller = require('./controller');` → `require('./controllers/MODULE_NAME.controller');`

---

## 🎬 BEGIN IMMEDIATELY

1. **Start with Group 1 (MEDIUM priority):** admin, analytics, comments, content, education
2. **Follow 3-step process** for each module (25 minutes per module)
3. **Validate after each group** (5 minutes)
4. **Continue systematically** through all 28 modules

---

## 📞 REFERENCE

**Full Template:** [PHASE_2_STANDARDIZATION_TEMPLATE.md](PHASE_2_STANDARDIZATION_TEMPLATE.md)

**Validator Code:** `src/core/ModuleStructureValidator.js`

**Example (HIGH priority):** `src/modules/auth/` (all 8 folders, 7 exports, etc.)

---

## 🏁 DONE CONDITION

All 28 remaining modules:
- ✅ Have 8 standard folders
- ✅ Have manifest.json
- ✅ Have 7 mandatory exports
- ✅ Pass ModuleStructureValidator (6/6 checks)
- ✅ Marked as ✅ DONE

**Result:** 33/33 modules CONFORMANT (100%)

---

**Ready to execute. Use template. Process systematically. Validate after each batch. Complete in 2-3 days.**
