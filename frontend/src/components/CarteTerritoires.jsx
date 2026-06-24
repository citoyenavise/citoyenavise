import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import regionsRaw from '../territoires/geo/regions_qc.geojson?raw';
import './CarteTerritoires.css';

// Vue d'ensemble du Québec
const QC_CENTER = [52.0, -71.5];
const QC_ZOOM = 5;

// Palette de couleurs distinctes (17 régions)
const COULEURS = [
  '#e6194B', '#3cb44b', '#f59331', '#4363d8', '#f58231', '#911eb4',
  '#1f9ea6', '#bf3aa0', '#7a9e1e', '#c2738a', '#469990', '#8d6cc0',
  '#9A6324', '#9e2a2b', '#3a7d44', '#7d7a1e', '#2c3e8c',
];

/**
 * CarteTerritoires — carte choroplèthe des territoires (frontières + couleurs).
 * Niveau 2 (régions administratives du Québec). Clic = sélection mise en évidence.
 * Source : MERN, Système sur les découpages administratifs (SDA), 2026.
 */
export default function CarteTerritoires() {
  const data = useMemo(() => JSON.parse(regionsRaw), []);
  const [selected, setSelected] = useState(null);

  const styleFor = (feature) => {
    const idx = data.features.indexOf(feature);
    const isSel = selected && feature.properties.code === selected.code;
    return {
      color: isSel ? '#111111' : '#ffffff',
      weight: isSel ? 3 : 1,
      fillColor: COULEURS[idx % COULEURS.length],
      fillOpacity: isSel ? 0.85 : 0.5,
    };
  };

  const onEach = (feature, layer) => {
    layer.bindTooltip(feature.properties.nom, { sticky: true });
    layer.on({
      click: () => setSelected(feature.properties),
      mouseover: (e) => e.target.setStyle({ weight: 2.5, fillOpacity: 0.72 }),
      mouseout: (e) => {
        const isSel = selected && feature.properties.code === selected.code;
        if (!isSel) e.target.setStyle(styleFor(feature));
      },
    });
  };

  return (
    <div className="carte-territoires">
      <MapContainer
        center={QC_CENTER}
        zoom={QC_ZOOM}
        style={{ height: '520px', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <GeoJSON
          key={selected ? selected.code : 'aucune'}
          data={data}
          style={styleFor}
          onEachFeature={onEach}
        />
      </MapContainer>
      <div className="carte-territoires-info" aria-live="polite">
        {selected ? (
          <span>
            <strong>{selected.nom}</strong> — région administrative (code {selected.code})
          </span>
        ) : (
          <span className="carte-territoires-aide">
            Niveau 2 — régions administratives du Québec. Clique une région pour la
            mettre en évidence.
          </span>
        )}
      </div>
    </div>
  );
}
