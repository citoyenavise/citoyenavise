/**
 * Module Carte Avancée — Système Central du Site
 * Clustering, heatmap, filtres dynamiques, animations
 */

class AdvancedMap {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.clusters = null;
    this.markers = {};
    this.heatmapLayer = null;
    this.allNodes = [];
    this.filters = {
      type: 'all',
      region: 'all',
      category: 'all',
    };
    this.selectedMarker = null;
    this.bounds = null;
  }

  /**
   * Initialiser la carte
   */
  initialize() {
    // Container
    const container = document.getElementById(this.containerId);
    if (!container) throw new Error(`Container ${this.containerId} not found`);

    // Créer carte
    this.map = L.map(this.containerId, {
      zoomControl: true,
      attributionControl: false,
      fadeAnimation: true,
      markerZoomAnimation: true,
    }).setView([56.1304, -106.3468], 3);

    // Tile layer avec style subtil
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
      className: 'map-tiles',
    }).addTo(this.map);

    // Cluster group (markercluster)
    this.clusters = L.markerClusterGroup({
      maxClusterRadius: 80,
      iconCreateFunction: (cluster) => this.createClusterIcon(cluster),
      disableClusteringAtZoom: 15,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    this.map.addLayer(this.clusters);

    // Events
    this.setupMapEvents();
    this.setupClusterEvents();

    return this;
  }

  /**
   * Créer icône cluster personnalisée
   */
  createClusterIcon(cluster) {
    const count = cluster.getChildCount();
    let size = 'small';
    let color = '#C1272D';

    if (count > 100) {
      size = 'large';
      color = '#A01E23';
    } else if (count > 50) {
      size = 'medium';
      color = '#C1272D';
    }

    return L.divIcon({
      html: `
        <div class="cluster-icon cluster-${size}" style="background-color: ${color};">
          <span>${count}</span>
        </div>
      `,
      className: 'cluster-marker',
      iconSize: null,
      iconAnchor: null,
    });
  }

  /**
   * Ajouter nœuds GeoJSON
   */
  addNodes(geojson) {
    if (!geojson || !geojson.features) return;

    this.allNodes = geojson.features;
    this.clusters.clearLayers();
    this.markers = {};

    // Données pour heatmap
    const heatmapData = [];

    geojson.features.forEach(feature => {
      const { coordinates } = feature.geometry;
      const props = feature.properties;

      // Marker
      const marker = this.createMarker(props, coordinates);
      this.clusters.addLayer(marker);
      this.markers[props.id] = marker;

      // Heatmap data
      heatmapData.push([coordinates[1], coordinates[0], 1]);
    });

    // Ajouter heatmap
    if (heatmapData.length > 0) {
      this.addHeatmap(heatmapData);
    }

    // Fit bounds
    if (this.clusters.getLayers().length > 0) {
      try {
        this.map.fitBounds(this.clusters.getBounds().pad(0.1));
      } catch (e) {
        // Ignore si pas assez de markers
      }
    }
  }

  /**
   * Créer marker avec popup
   */
  createMarker(props, coordinates) {
    const marker = L.circleMarker([coordinates[1], coordinates[0]], {
      radius: 8,
      fillColor: this.getMarkerColor(props),
      color: 'white',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.85,
      className: 'map-marker',
    });

    // Popup
    const popupHTML = this.createPopupContent(props);
    marker.bindPopup(popupHTML, {
      maxWidth: 300,
      className: 'map-popup',
      closeButton: true,
    });

    // Hover effects
    marker.on('mouseover', () => {
      marker.setRadius(12);
      marker.setStyle({ weight: 3, fillOpacity: 1 });
    });

    marker.on('mouseout', () => {
      if (this.selectedMarker !== marker) {
        marker.setRadius(8);
        marker.setStyle({ weight: 2.5, fillOpacity: 0.85 });
      }
    });

    marker.on('click', () => {
      this.selectMarker(marker);
    });

    return marker;
  }

  /**
   * Déterminer couleur marker
   */
  getMarkerColor(props) {
    const colors = {
      citizen: '#C1272D',
      organization: '#2A7D32',
      event: '#1976D2',
    };
    return colors[props.nodeType] || '#C1272D';
  }

  /**
   * Créer contenu popup
   */
  createPopupContent(props) {
    const div = document.createElement('div');
    div.className = 'popup-content-advanced';
    div.innerHTML = `
      <div class="popup-header">
        <div class="popup-avatar" style="background:${this.getMarkerColor(props)}">
          ${getInitials(props.name)}
        </div>
        <div class="popup-info">
          <div class="popup-name">${props.name || 'Utilisateur'}</div>
          <div class="popup-type">${this.formatType(props.nodeType)}</div>
        </div>
      </div>

      ${props.description ? `<div class="popup-description">${truncate(props.description, 100)}</div>` : ''}

      ${props.interests ? `
        <div class="popup-interests">
          ${props.interests.slice(0, 3).map(i => `<span class="interest-tag">${i}</span>`).join('')}
        </div>
      ` : ''}

      <div class="popup-stats">
        <span>👥 ${props.followersCount || 0}</span>
        <span>📝 ${props.postsCount || 0}</span>
      </div>

      <button class="popup-button" data-profile-id="${props.profileId}">
        Voir profil →
      </button>
    `;

    // Ajouter event listener au bouton
    const button = div.querySelector('.popup-button');
    if (button && props.profileId) {
      button.addEventListener('click', () => {
        navigate(`/profiles/${props.profileId}`);
      });
    }

    return div;
  }

  /**
   * Formater type de nœud
   */
  formatType(type) {
    const types = {
      citizen: '🍁 Citoyen',
      organization: '🏢 Organisation',
      event: '📅 Événement',
    };
    return types[type] || type;
  }

  /**
   * Ajouter heatmap
   */
  addHeatmap(data) {
    if (this.heatmapLayer) {
      this.map.removeLayer(this.heatmapLayer);
    }

    this.heatmapLayer = L.heatLayer(data, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      max: 1.0,
      gradient: {
        0.0: '#2A7D32',
        0.5: '#FFC107',
        1.0: '#C1272D',
      },
    });

    // Toggle via bouton
    const toggle = document.querySelector('[data-map-toggle="heatmap"]');
    if (toggle && toggle.classList.contains('active')) {
      this.heatmapLayer.addTo(this.map);
    }
  }

  /**
   * Sélectionner un marker
   */
  selectMarker(marker) {
    // Deselect ancien
    if (this.selectedMarker) {
      this.selectedMarker.setRadius(8);
      this.selectedMarker.setStyle({ weight: 2.5, fillOpacity: 0.85 });
    }

    // Select nouveau
    this.selectedMarker = marker;
    marker.setRadius(12);
    marker.setStyle({ weight: 3, fillOpacity: 1 });
    marker.openPopup();
  }

  /**
   * Appliquer filtres
   */
  applyFilters(filters) {
    this.filters = { ...this.filters, ...filters };

    let filtered = this.allNodes.filter(feature => {
      const props = feature.properties;

      // Filtre type
      if (this.filters.type !== 'all' && props.nodeType !== this.filters.type) {
        return false;
      }

      // Filtre région
      if (this.filters.region !== 'all') {
        // Si coords disponibles, vérifier région
        // Pour MVP, skip
      }

      // Filtre catégorie
      if (this.filters.category !== 'all' && props.category !== this.filters.category) {
        return false;
      }

      return true;
    });

    // Recréer markers filtrés
    this.clusters.clearLayers();
    this.markers = {};

    filtered.forEach(feature => {
      const { coordinates } = feature.geometry;
      const marker = this.createMarker(feature.properties, coordinates);
      this.clusters.addLayer(marker);
      this.markers[feature.properties.id] = marker;
    });
  }

  /**
   * Zoomer sur région
   */
  zoomToRegion(region) {
    const regionBounds = {
      QC: [[ 45.0, -79.8], [47.8, -57.0]],
      ON: [[ 41.7, -95.2], [56.4, -74.3]],
      BC: [[ 48.3, -139.1], [60.0, -114.0]],
      AB: [[ 49.0, -120.0], [60.1, -110.0]],
      MB: [[ 49.0, -102.3], [56.9, -95.2]],
      CA: [[ 41.7, -141.0], [83.1, -52.6]],  // Canada complet
    };

    const bounds = regionBounds[region] || regionBounds['CA'];
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  /**
   * Rechercher et zoomer
   */
  searchAndZoom(query) {
    const results = this.allNodes.filter(feature => {
      const props = feature.properties;
      const q = query.toLowerCase();
      return (
        props.name.toLowerCase().includes(q) ||
        (props.description && props.description.toLowerCase().includes(q))
      );
    });

    if (results.length === 0) {
      showToast('Aucun résultat trouvé', 'warning');
      return;
    }

    if (results.length === 1) {
      const coords = results[0].geometry.coordinates;
      this.map.flyTo([coords[1], coords[0]], 14, {
        duration: 1.5,
      });
      const marker = this.markers[results[0].properties.id];
      if (marker) {
        this.selectMarker(marker);
      }
    } else {
      // Plusieurs résultats → fit bounds
      const group = L.featureGroup(
        results.map(feature => {
          const coords = feature.geometry.coordinates;
          return L.circleMarker([coords[1], coords[0]]);
        })
      );
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  /**
   * Setup events carte
   */
  setupMapEvents() {
    // Click en dehors popup → deselect
    this.map.on('click', () => {
      if (this.selectedMarker) {
        this.selectedMarker.closePopup();
        this.selectedMarker.setRadius(8);
        this.selectedMarker.setStyle({ weight: 2.5, fillOpacity: 0.85 });
        this.selectedMarker = null;
      }
    });

    // Zoom animation
    this.map.on('zoomstart', () => {
      this.map.getContainer().classList.add('zooming');
    });

    this.map.on('zoomend', () => {
      this.map.getContainer().classList.remove('zooming');
    });

    // Bounds update
    this.map.on('moveend', () => {
      this.bounds = this.map.getBounds();
      this.onBoundsChanged?.();
    });
  }

  /**
   * Setup cluster events
   */
  setupClusterEvents() {
    this.clusters.on('clustermouseover', (a) => {
      a.layer.setOpacity(0.7);
    });

    this.clusters.on('clustermouseout', (a) => {
      a.layer.setOpacity(1);
    });
  }

  /**
   * Export données visibles
   */
  getVisibleNodes() {
    if (!this.bounds) return this.allNodes;

    return this.allNodes.filter(feature => {
      const coords = feature.geometry.coordinates;
      return this.bounds.contains([coords[1], coords[0]]);
    });
  }

  /**
   * Redessiner
   */
  redraw() {
    this.map.invalidateSize();
  }
}

// Styles avancés (injecter)
if (!document.querySelector('#map-advanced-styles')) {
  const style = document.createElement('style');
  style.id = 'map-advanced-styles';
  style.textContent = `
    /* Carte */
    #map {
      background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }

    .map-tiles {
      filter: brightness(1.05) contrast(1.1);
    }

    /* Markers */
    .map-marker {
      transition: all 0.2s ease;
      cursor: pointer;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .map-marker:hover {
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    }

    /* Clusters */
    .cluster-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: white;
      font-weight: 700;
      font-size: 0.9rem;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s;
      animation: clusterPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .cluster-small {
      width: 40px;
      height: 40px;
    }

    .cluster-medium {
      width: 50px;
      height: 50px;
      font-size: 1rem;
    }

    .cluster-large {
      width: 60px;
      height: 60px;
      font-size: 1.1rem;
    }

    .cluster-marker:hover .cluster-icon {
      transform: scale(1.15);
    }

    @keyframes clusterPop {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Popup */
    .map-popup .leaflet-popup-content {
      padding: 0;
      margin: 0;
      border-radius: 12px;
      font-family: inherit;
    }

    .popup-content-advanced {
      padding: 16px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    }

    .popup-header {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      align-items: flex-start;
    }

    .popup-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
      flex-shrink: 0;
    }

    .popup-name {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--noir-doux);
    }

    .popup-type {
      font-size: 0.8rem;
      color: var(--gris);
      margin-top: 2px;
    }

    .popup-description {
      font-size: 0.85rem;
      color: var(--gris-texte);
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .popup-interests {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .interest-tag {
      display: inline-block;
      padding: 2px 8px;
      background: var(--rouge-clair);
      color: var(--rouge);
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .popup-stats {
      display: flex;
      gap: 12px;
      font-size: 0.8rem;
      color: var(--gris);
      margin-bottom: 12px;
      padding: 8px 0;
      border-top: 1px solid var(--gris-clair);
      border-bottom: 1px solid var(--gris-clair);
    }

    .popup-button {
      width: 100%;
      padding: 8px;
      background: var(--rouge);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .popup-button:hover {
      background: var(--rouge-fonce);
      transform: translateY(-1px);
    }

    /* Zoom animation */
    #map.zooming {
      transition: opacity 0.1s;
    }

    /* Heatmap */
    .leaflet-heatmap-layer {
      opacity: 0.7;
      transition: opacity 0.3s;
    }
  `;
  document.head.appendChild(style);
}
