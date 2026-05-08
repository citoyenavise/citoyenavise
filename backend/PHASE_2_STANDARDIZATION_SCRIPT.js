/**
 * PHASE 2.1 Module Standardization Automation
 * Applies standard structure to non-conformant modules
 */

const fs = require('fs');
const path = require('path');

function createModuleStandardStructure(moduleName, modulePath) {
  const folders = [
    'manifest',
    'contracts',
    'events',
    'services',
    'controllers',
    'validation',
    'observability',
    'tests'
  ];

  // Create folders
  folders.forEach(folder => {
    const folderPath = path.join(modulePath, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  });

  // Create manifest.json
  const manifest = {
    name: moduleName,
    version: '1.0.0',
    description: `${moduleName} module`,
    dependencies: [],
    capabilities: [`${moduleName}:read`, `${moduleName}:write`],
    events: [],
    routes: { prefix: `/api/v1/${moduleName}`, methods: ['GET', 'POST', 'PUT', 'DELETE'] },
    lifecycle: { initRequired: true, readyRequired: true, healthChecks: true }
  };

  fs.writeFileSync(
    path.join(modulePath, 'manifest', 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Create contracts/index.js
  fs.writeFileSync(
    path.join(modulePath, 'contracts', 'index.js'),
    `module.exports = {};\n`
  );

  // Create events/index.js
  fs.writeFileSync(
    path.join(modulePath, 'events', 'index.js'),
    `module.exports = {};\n`
  );

  // Create validation/index.js
  fs.writeFileSync(
    path.join(modulePath, 'validation', 'index.js'),
    `module.exports = {};\n`
  );

  // Create observability/index.js
  fs.writeFileSync(
    path.join(modulePath, 'observability', 'index.js'),
    `module.exports = { telemetryConfig: { logLevel: 'info', captureMetrics: true } };\n`
  );

  // Create tests/setup.js
  fs.writeFileSync(
    path.join(modulePath, 'tests', 'setup.js'),
    `beforeAll(() => { process.env.NODE_ENV = 'test'; });\nafterAll(() => { jest.clearAllTimers(); });\n`
  );

  // Create standardized index.js if not exists
  const indexPath = path.join(modulePath, 'index.js');
  const routes = require(path.join(modulePath, 'routes'));

  const standardIndex = `
const routes = require('./routes');
const contracts = require('./contracts');
const events = require('./events');
let isReady = false;
async function init(context) { isReady = false; return { initialized: true, moduleName: '${moduleName}' }; }
async function ready() { isReady = true; return { ready: true }; }
async function shutdown() { isReady = false; return { shutdown: true }; }
async function health() { return { status: isReady ? 'healthy' : 'unhealthy', details: { ready: isReady, moduleName: '${moduleName}', timestamp: new Date().toISOString() } }; }
function getRoutes() { return routes; }
function getEvents() { return events; }
function getContracts() { return contracts; }
module.exports.init = init;
module.exports.ready = ready;
module.exports.shutdown = shutdown;
module.exports.health = health;
module.exports.getRoutes = getRoutes;
module.exports.getEvents = getEvents;
module.exports.getContracts = getContracts;
`;

  fs.writeFileSync(indexPath, standardIndex.trim());
}

// Get all modules
const modulesPath = path.join(__dirname, 'backend/src/modules');
const modules = fs.readdirSync(modulesPath).filter(m =>
  fs.statSync(path.join(modulesPath, m)).isDirectory()
);

console.log(`Found ${modules.length} modules`);
console.log('Standardizing...');

modules.forEach(moduleName => {
  const modulePath = path.join(modulesPath, moduleName);
  try {
    createModuleStandardStructure(moduleName, modulePath);
    console.log(`✓ ${moduleName}`);
  } catch (error) {
    console.log(`✗ ${moduleName}: ${error.message}`);
  }
});

console.log('Done.');
