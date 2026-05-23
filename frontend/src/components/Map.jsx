import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import './Map.css';

// Centre pilote : Québec ville (décision §22 SYNTHESE_OFFICIELLE.md, 2026-05-14)
const PILOTE_CENTER = [46.8139, -71.2080];
const PILOTE_ZOOM = 12;
const PILOTE_RADIUS_M = 7000; // 7 km autour du Vieux-Québec

// Icônes personnalisées DivIcon (Lot 1.2)
// Élu : pictogramme personne, couleur rose CitoyenAvise
const eluIcon = L.divIcon({
  className: 'cv-marker cv-marker-elu',
  html: `
    <div class="cv-marker-pin cv-marker-pin-elu" aria-label="Élu">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="white">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    </div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

// Pétition : pictogramme document avec coche
const petitionIcon = L.divIcon({
  className: 'cv-marker cv-marker-petition',
  html: `
    <div class="cv-marker-pin cv-marker-pin-petition" aria-label="Pétition">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="white">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 14l-3-3 1.41-1.41L13 13.17l3.59-3.58L18 11l-5 5zm0-9V3.5L18.5 9H13z"/>
      </svg>
    </div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

const pickIcon = (type) => (type === 'petition' ? petitionIcon : eluIcon);

const buildPopupContent = (marker) => {
  const lang = localStorage.getItem('language') || 'fr';

  if (marker.type === 'petition') {
    const titre = marker.titre || marker.title || 'Pétition';
    const signatures = marker.signatures_count ?? marker.signaturesCount ?? 0;
    const enjeu = marker.enjeu || '';
    const enjeuLabel = enjeu
      ? enjeu.charAt(0).toUpperCase() + enjeu.slice(1)
      : '';
    return `
      <div class="cv-popup cv-popup-petition">
        <span class="cv-popup-type">Pétition</span>
        <h3>${titre}</h3>
        ${enjeu ? `<span class="cv-popup-enjeu cv-popup-enjeu-${enjeu}">${enjeuLabel}</span>` : ''}
        <p class="cv-popup-meta">${signatures} signature${signatures > 1 ? 's' : ''}</p>
        <a href="/${lang}/petitions/${marker.id}" class="cv-popup-link">
          Voir la pétition
        </a>
      </div>
    `;
  }

  // Défaut : élu
  return `
    <div class="cv-popup cv-popup-elu">
      <span class="cv-popup-type">Élu</span>
      <h3>${marker.nom || marker.name || ''}</h3>
      <p class="cv-popup-meta">${marker.titre || ''}</p>
      <p class="cv-popup-meta">${marker.region || ''}</p>
      <a href="/${lang}/elus/${marker.id}" class="cv-popup-link">
        Voir profil complet
      </a>
    </div>
  `;
};

const MarkersLayer = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    // Couche simple sans clustering — chaque marqueur reste distinct
    const layer = L.layerGroup();

    markers.forEach((marker) => {
      const lat = marker.latitude ?? marker.lat;
      const lng = marker.longitude ?? marker.lng;
      if (lat == null || lng == null) return;

      const leafletMarker = L.marker([lat, lng], {
        icon: pickIcon(marker.type),
      }).bindPopup(buildPopupContent(marker));

      layer.addLayer(leafletMarker);
    });

    map.addLayer(layer);

    return () => {
      map.removeLayer(layer);
    };
  }, [markers, map]);

  return null;
};

const Map = ({ markers = [] }) => (
  <MapContainer
    center={PILOTE_CENTER}
    zoom={PILOTE_ZOOM}
    style={{ height: '600px', width: '100%' }}
    scrollWheelZoom
  >
    <TileLayer
      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      subdomains="abcd"
      maxZoom={20}
    />
    <Circle
      center={PILOTE_CENTER}
      radius={PILOTE_RADIUS_M}
      pathOptions={{
        color: '#ec4899',
        weight: 2,
        fillColor: '#ec4899',
        fillOpacity: 0.08,
      }}
    />
    <MarkersLayer markers={markers} />
  </MapContainer>
);

export default Map;
