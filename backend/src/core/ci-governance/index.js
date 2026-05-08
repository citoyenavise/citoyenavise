/**
 * CI Governance Module — Index & Exports
 * PHASE 1.3 — Architectural CI
 *
 * Central exports for the Architectural CI pipeline.
 * Provides component classes, factory functions, and integrated pipeline runner.
 */

const ArchitecturalConformanceAnalyzer = require('./ArchitecturalConformanceAnalyzer');
const DependencyAuditScanner = require('./DependencyAuditScanner');
const ConstitutionalPipelineRunner = require('./ConstitutionalPipelineRunner');
const CIReportGenerator = require('./CIReportGenerator');
const CIGovernancePipelineOrchestrator = require('./CIGovernancePipelineOrchestrator');

/**
 * Factory: Create a pipeline orchestrator
 */
function createPipelineOrchestrator(options = {}) {
  return new CIGovernancePipelineOrchestrator(options);
}

/**
 * Factory: Create a pipeline runner
 */
function createPipelineRunner(options = {}) {
  return new ConstitutionalPipelineRunner(options);
}

/**
 * Factory: Create a report generator
 */
function createReportGenerator(options = {}) {
  return new CIReportGenerator(options);
}

/**
 * Factory: Create conformance analyzer
 */
function createConformanceAnalyzer(constitutionManager) {
  return new ArchitecturalConformanceAnalyzer(constitutionManager);
}

/**
 * Factory: Create dependency scanner
 */
function createDependencyScanner(constitutionManager) {
  return new DependencyAuditScanner(constitutionManager);
}

/**
 * Integrated pipeline runner — execute complete CI pipeline and save reports
 */
async function runCIPipeline(options = {}) {
  const orchestrator = createPipelineOrchestrator(options);
  return orchestrator.execute(options);
}

module.exports = {
  ArchitecturalConformanceAnalyzer,
  DependencyAuditScanner,
  ConstitutionalPipelineRunner,
  CIReportGenerator,
  CIGovernancePipelineOrchestrator,

  createPipelineOrchestrator,
  createPipelineRunner,
  createReportGenerator,
  createConformanceAnalyzer,
  createDependencyScanner,
  runCIPipeline,

  version: '1.0.0',
  phase: '1.3-ci',
  name: 'Architectural CI Governance'
};
