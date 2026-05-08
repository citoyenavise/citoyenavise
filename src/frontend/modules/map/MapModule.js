/**
 * MapModule.js — Level 2 (Domain) — Dépend de : users, ideas
 */
class MapModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.nodes = new Map();
    this.clusters = new Map();
  }

  async initialize() {
    console.log('[Map] Initialisation');
    this.eventBus.on('idea:created', (event) => {
      console.log('[Map] Nouvelle idée détectée pour la carte');
    });
    await this.eventBus.emit('frontend:map:ready', { timestamp: new Date().toISOString() });
  }

  async loadNodes(region) {
    const response = await fetch(`/api/v1/map/nodes?region=${region}`);
    const data = await response.json();
    for (const node of data.nodes) {
      this.nodes.set(node.id, node);
    }
    return data.nodes;
  }

  async loadClusters() {
    const response = await fetch('/api/v1/map/clusters');
    const data = await response.json();
    for (const cluster of data.clusters) {
      this.clusters.set(cluster.id, cluster);
    }
    return data.clusters;
  }

  selectCluster(clusterId) {
    const cluster = this.clusters.get(clusterId);
    if (cluster) {
      this.eventBus.emit('frontend:map:cluster_selected', { clusterId });
    }
  }
}
module.exports = MapModule;
