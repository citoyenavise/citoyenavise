/**
 * Establishments Module - PHASE 2.2 Standardized
 */

const routes = require('./routes');
const contracts = require('./contracts');
const events = require('./events');

let isReady = false;

async function init(context) {
  try {
    console.log('[establishments] Initializing...');
    isReady = false;
    return { initialized: true, moduleName: 'establishments' };
  } catch (error) {
    throw new Error(`[establishments] Initialization failed: ${error.message}`);
  }
}

async function ready() {
  if (!isReady) {
    isReady = true;
    console.log('[establishments] Ready for requests');
  }
  return { ready: true };
}

async function shutdown() {
  try {
    console.log('[establishments] Shutting down...');
    isReady = false;
    return { shutdown: true };
  } catch (error) {
    console.error('[establishments] Shutdown error:', error.message);
    return { shutdown: false, error: error.message };
  }
}

async function health() {
  return {
    status: isReady ? 'healthy' : 'unhealthy',
    details: {
      ready: isReady,
      moduleName: 'establishments',
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
