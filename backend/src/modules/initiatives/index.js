/**
 * Initiatives Module - PHASE 2.2 Standardized
 */

const routes = require('./routes');
const contracts = require('./contracts');
const events = require('./events');

let isReady = false;

async function init(context) {
  try {
    console.log('[initiatives] Initializing...');
    isReady = false;
    return { initialized: true, moduleName: 'initiatives' };
  } catch (error) {
    throw new Error(`[initiatives] Initialization failed: ${error.message}`);
  }
}

async function ready() {
  if (!isReady) {
    isReady = true;
    console.log('[initiatives] Ready for requests');
  }
  return { ready: true };
}

async function shutdown() {
  try {
    console.log('[initiatives] Shutting down...');
    isReady = false;
    return { shutdown: true };
  } catch (error) {
    console.error('[initiatives] Shutdown error:', error.message);
    return { shutdown: false, error: error.message };
  }
}

async function health() {
  return {
    status: isReady ? 'healthy' : 'unhealthy',
    details: {
      ready: isReady,
      moduleName: 'initiatives',
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
