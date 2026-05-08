// Script de vérification de l'intégrité du Blueprint Phase 1

const fs = require('fs');
const path = require('path');

class BlueprintVerifier {
  constructor() {
    this.results = {
      components: {},
      manifests: {},
      tests: {},
      overall: true,
      timestamp: new Date().toISOString(),
    };
  }

  // Vérifier l'existence d'un fichier
  checkFile(filePath, description) {
    const exists = fs.existsSync(filePath);
    const fileSize = exists ? fs.statSync(filePath).size : 0;

    this.results.components[description] = {
      exists,
      fileSize,
      path: filePath,
      status: exists ? '✅' : '❌',
    };

    return exists;
  }

  // Vérifier tous les composants Phase 1
  verifyPhase1() {
    console.log('\n📋 Vérification Phase 1 - Composants Core\n');

    const baseDir = __dirname;
    const components = [
      // Orchestrator
      ['core/orchestrator/Orchestrator.js', 'Orchestrator'],
      ['core/orchestrator/OrchestratorEvents.js', 'OrchestratorEvents'],
      ['core/orchestrator/OrchestratorContext.js', 'OrchestratorContext'],
      ['core/orchestrator/index.js', 'Orchestrator Index'],

      // State Machine
      ['core/state-machine/StateMachine.js', 'StateMachine'],
      ['core/state-machine/State.js', 'State'],
      ['core/state-machine/Transition.js', 'Transition'],
      ['core/state-machine/Guard.js', 'Guard'],
      ['core/state-machine/SideEffect.js', 'SideEffect'],
      ['core/state-machine/index.js', 'StateMachine Index'],

      // Events
      ['core/events/EventTypes.js', 'EventTypes'],
      ['core/events/EventSchema.js', 'EventSchema'],
      ['core/events/EventValidator.js', 'EventValidator'],
      ['core/events/index.js', 'Events Index'],

      // Logging
      ['core/logging/Logger.js', 'Logger'],
      ['core/logging/index.js', 'Logging Index'],

      // Invariants
      ['core/invariants/Invariant.js', 'Invariant'],
      ['core/invariants/index.js', 'Invariants Index'],

      // Conventions
      ['core/conventions/Conventions.js', 'Conventions'],
      ['core/conventions/index.js', 'Conventions Index'],

      // Versioning
      ['core/versioning/VersionManager.js', 'VersionManager'],
      ['core/versioning/index.js', 'Versioning Index'],

      // Core Main Index
      ['core/index.js', 'Core Main Index'],

      // Documentation
      ['core/README.md', 'Core README'],
    ];

    let successCount = 0;
    for (const [filePath, description] of components) {
      const fullPath = path.join(baseDir, filePath);
      if (this.checkFile(fullPath, description)) {
        successCount++;
        console.log(`${this.results.components[description].status} ${description}`);
      } else {
        console.log(`${this.results.components[description].status} ${description} - MANQUANT`);
        this.results.overall = false;
      }
    }

    console.log(`\n✅ Phase 1 Components: ${successCount}/${components.length}`);
    return successCount === components.length;
  }

  // Vérifier tous les manifests Phase 2
  verifyPhase2() {
    console.log('\n📦 Vérification Phase 2 - Manifests\n');

    const baseDir = path.join(__dirname, 'config', 'manifests');
    const manifests = [
      ['manifest.modules.json', 'Module Manifest'],
      ['manifest.states.json', 'States Manifest'],
      ['manifest.phases.json', 'Phases Manifest'],
      ['index.js', 'ManifestLoader'],
      ['README.md', 'Manifests README'],
    ];

    let successCount = 0;
    for (const [fileName, description] of manifests) {
      const fullPath = path.join(baseDir, fileName);
      const key = `Manifest: ${description}`;
      if (this.checkFile(fullPath, key)) {
        successCount++;
        console.log(`${this.results.components[key].status} ${description}`);
      } else {
        console.log(`${this.results.components[key].status} ${description} - MANQUANT`);
        this.results.overall = false;
      }
    }

    console.log(`\n✅ Phase 2 Manifests: ${successCount}/${manifests.length}`);
    return successCount === manifests.length;
  }

  // Vérifier les tests
  verifyTests() {
    console.log('\n🧪 Vérification Tests\n');

    const testsDir = path.join(__dirname, 'tests');
    const testFiles = [
      ['blueprint.test.js', 'Blueprint Tests'],
      ['manifests.test.js', 'Manifests Tests'],
    ];

    let successCount = 0;
    for (const [fileName, description] of testFiles) {
      const fullPath = path.join(testsDir, fileName);
      if (this.checkFile(fullPath, description)) {
        successCount++;
        console.log(`${this.results.components[description].status} ${description}`);
      } else {
        console.log(`${this.results.components[description].status} ${description} - MANQUANT`);
        this.results.overall = false;
      }
    }

    console.log(`\n✅ Tests: ${successCount}/${testFiles.length}`);
    return successCount === testFiles.length;
  }

  // Charger et valider les manifests JSON
  verifyManifestContent() {
    console.log('\n✔️ Validation Contenu Manifests\n');

    const baseDir = path.join(__dirname, 'config', 'manifests');

    // Vérifier modules.json
    try {
      const modulesPath = path.join(baseDir, 'manifest.modules.json');
      const modules = JSON.parse(fs.readFileSync(modulesPath, 'utf-8'));

      console.log(`📄 manifest.modules.json:`);
      console.log(`   - Modules déclarés: ${modules.modules.length}`);
      console.log(
        `   - Module IDs: ${modules.modules
          .map((m) => m.id)
          .join(', ')}`
      );
      console.log(`   - Version schema: ${modules.version}`);

      this.results.manifests['modules.json'] = {
        valid: modules.modules.length === 5,
        moduleCount: modules.modules.length,
      };
    } catch (error) {
      console.log(`❌ Erreur manifest.modules.json: ${error.message}`);
      this.results.overall = false;
    }

    // Vérifier states.json
    try {
      const statesPath = path.join(baseDir, 'manifest.states.json');
      const states = JSON.parse(fs.readFileSync(statesPath, 'utf-8'));

      console.log(`\n📄 manifest.states.json:`);
      console.log(`   - États déclarés: ${Object.keys(states.states).length}`);
      console.log(`   - Transitions: ${states.transitions.length}`);
      console.log(`   - Version schema: ${states.version}`);

      this.results.manifests['states.json'] = {
        valid: Object.keys(states.states).length > 0,
        stateCount: Object.keys(states.states).length,
        transitionCount: states.transitions.length,
      };
    } catch (error) {
      console.log(`❌ Erreur manifest.states.json: ${error.message}`);
      this.results.overall = false;
    }

    // Vérifier phases.json
    try {
      const phasesPath = path.join(baseDir, 'manifest.phases.json');
      const phases = JSON.parse(fs.readFileSync(phasesPath, 'utf-8'));

      console.log(`\n📄 manifest.phases.json:`);
      console.log(`   - Phases déclarées: ${Object.keys(phases.phases).length}`);
      console.log(`   - Version system: ${phases.metadata.systemVersion}`);

      this.results.manifests['phases.json'] = {
        valid: Object.keys(phases.phases).length === 5,
        phaseCount: Object.keys(phases.phases).length,
      };
    } catch (error) {
      console.log(`❌ Erreur manifest.phases.json: ${error.message}`);
      this.results.overall = false;
    }
  }

  // Rapport final
  generateReport() {
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('RAPPORT FINAL - BLUEPRINT PHASE 1');
    console.log('═'.repeat(60));

    const componentCount = Object.keys(this.results.components).length;
    const manifestCount = Object.keys(this.results.manifests).length;
    const testCount = Object.keys(this.results.tests).length;

    const totalFiles = componentCount + manifestCount + testCount;

    console.log(`\n📊 Statistiques:`);
    console.log(`   Composants Core: ${componentCount} fichiers`);
    console.log(`   Manifests Phase 2: ${manifestCount} fichiers`);
    console.log(`   Tests: ${testCount} fichiers`);
    console.log(`   Total: ${totalFiles} fichiers`);

    console.log(`\n✅ État Global: ${this.results.overall ? 'COMPLET ✅' : 'INCOMPLET ❌'}`);

    console.log(`\n🔍 Détails:`);
    if (this.results.manifests['modules.json']) {
      console.log(
        `   - Modules: ${this.results.manifests['modules.json'].moduleCount} déclarés`
      );
    }
    if (this.results.manifests['states.json']) {
      console.log(
        `   - États: ${this.results.manifests['states.json'].stateCount} déclarés`
      );
      console.log(
        `   - Transitions: ${this.results.manifests['states.json'].transitionCount}`
      );
    }
    if (this.results.manifests['phases.json']) {
      console.log(`   - Phases: ${this.results.manifests['phases.json'].phaseCount}`);
    }

    console.log(`\n⏰ Timestamp: ${this.results.timestamp}`);

    console.log('\n═'.repeat(60));

    return this.results;
  }

  // Exécuter la vérification complète
  verify() {
    console.log('\n🔧 VÉRIFICATION INTÉGRITÉ BLUEPRINT PHASE 1\n');

    const phase1 = this.verifyPhase1();
    const phase2 = this.verifyPhase2();
    const tests = this.verifyTests();

    this.verifyManifestContent();

    const report = this.generateReport();

    return {
      phase1Valid: phase1,
      phase2Valid: phase2,
      testsValid: tests,
      manifestsValid:
        report.manifests['modules.json']?.valid &&
        report.manifests['states.json']?.valid &&
        report.manifests['phases.json']?.valid,
      overallValid: this.results.overall,
    };
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  const verifier = new BlueprintVerifier();
  const result = verifier.verify();

  process.exit(result.overallValid ? 0 : 1);
}

module.exports = BlueprintVerifier;
