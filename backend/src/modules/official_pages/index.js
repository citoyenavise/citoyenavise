/**
 * Official pages Module - PHASE 2.3 Standardized
 */

const routes = require("./routes");
const contracts = require("./contracts");
const events = require("./events");

let isReady = false;

async function init(context) {
  try {
    console.log("[official_pages] Initializing...");
    isReady = false;
    return { initialized: true, moduleName: "official_pages" };
  } catch (error) {
    throw new Error(`[official_pages] Initialization failed: ${error.message}`);
  }
}

async function ready() {
  if (!isReady) {
    isReady = true;
    console.log("[official_pages] Ready for requests");
  }
  return { ready: true };
}

async function shutdown() {
  try {
    console.log("[official_pages] Shutting down...");
    isReady = false;
    return { shutdown: true };
  } catch (error) {
    console.error("[official_pages] Shutdown error:", error.message);
    return { shutdown: false, error: error.message };
  }
}

async function health() {
  return {
    status: isReady ? "healthy" : "unhealthy",
    details: {
      ready: isReady,
      moduleName: "official_pages",
      timestamp: new Date().toISOString(),
    },
  };
}

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
