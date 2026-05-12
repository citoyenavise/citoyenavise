import React, { useEffect, Suspense, lazy } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { useMap } from 'react-leaflet';
import './Map.css';

// Lazy load Leaflet components
const MapContainer = lazy(() => import('react-leaflet').then((mod) => ({ default: mod.MapContainer })));
const TileLayer = lazy(() => import('react-leaflet').then((mod) => ({ default: mod.TileLayer })));

const MarkerClusterWrapper = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    const markerClusterGroup = L.markerClusterGroup();

    markers.forEach((marker) => {
      const popupContent = `
        <div class="elu-popup">
          <h3>${marker.name}</h3>
          <p class="titre">${marker.titre || ''}</p>
          <p class="region">${marker.region || ''}</p>
          <a href="/${localStorage.getItem('language') || 'fr'}/elus/${marker.id}" class="btn-detail">
            Voir profil complet
          </a>
        </div>
      `;

      const leafletMarker = L.marker([marker.lat, marker.lng])
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

const LoadingMap = () => <div style={{
  height: '600px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
}}>Chargement de la carte...</div>;

const Map = ({ markers = [] }) => (
    <Suspense fallback={<LoadingMap />}>
      <MapContainer
        center={[45.5, -73.5]}
        zoom={6}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />
        <MarkerClusterWrapper markers={markers} />
      </MapContainer>
    </Suspense>
);

export default Map;
