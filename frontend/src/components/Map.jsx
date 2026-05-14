import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import './Map.css';

const MarkerClusterWrapper = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    const markerClusterGroup = L.markerClusterGroup();

    markers.forEach((marker) => {
      const popupContent = `
        <div class="elu-popup">
          <h3>${marker.nom}</h3>
          <p class="titre">${marker.titre || ''}</p>
          <p class="region">${marker.region || ''}</p>
          <a href="/${localStorage.getItem('language') || 'fr'}/elus/${marker.id}" class="btn-detail">
            Voir profil complet
          </a>
        </div>
      `;

      const leafletMarker = L.marker([marker.latitude, marker.longitude])
        .bindPopup(popupContent);

      markerClusterGroup.addLayer(leafletMarker);
    });

    map.addLayer(markerClusterGroup);

    return () => {
      map.removeLayer(markerClusterGroup);
    };
  }, [markers, map]);

  return null;
};

const Map = ({ markers = [] }) => (
  <MapContainer
    center={[45.5, -73.5]}
    zoom={6}
    style={{ height: '600px', width: '100%' }}
    scrollWheelZoom
  >
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="© OpenStreetMap"
    />
    <MarkerClusterWrapper markers={markers} />
  </MapContainer>
);

export default Map;
