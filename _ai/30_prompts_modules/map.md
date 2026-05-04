---
name: Prompt — Module Carte Interactive
description: Guide pour implémenter localisation GeoJSON, filtrage spatial
type: reference
---

# Module 4 : Carte Interactive

**Utilise ce prompt quand tu travailles sur visualisation géospatiale, nœuds citoyens, filtres régionaux**

## 🎯 Vue d'ensemble
- **Responsabilité** : Localisation des citoyens/orgs, requêtes spatiales, GeoJSON
- **Tables** : `map_nodes`, `profiles` (location)
- **API** : /map/nodes (GeoJSON), /map/nodes?bounds=..., /map/nodes?region=...
- **Frontend** : Leaflet.js, clustering, filtres régionaux
- **Technologie** : PostGIS pour requêtes spatiales optimisées

## 📚 Fichiers de référence
- _ai/02_architecture_modules.md — Module 4
- database/schema.sql — Tables map_nodes, profiles
- _ai/01_contraintes_generales.md — Performance, GIS

## 🏗️ Checklist d'implémentation

### Backend Routes
```javascript
// backend/src/routes/map.js
GET    /api/v1/map/nodes                  → GeoJSON de tous les nœuds (optionnel : bbox required)
GET    /api/v1/map/nodes?bounds=...       → Nœuds dans bbox (west,south,east,north)
GET    /api/v1/map/nodes?region=QC        → Nœuds par province
GET    /api/v1/map/nodes?category=...     → Nœuds par catégorie (citizen, organization, event)
POST   /api/v1/map/nodes                  → Créer nœud (admin only)
PUT    /api/v1/map/nodes/:id              → Éditer nœud (admin)
DELETE /api/v1/map/nodes/:id              → Supprimer nœud (admin)

// Exemple requête
GET /api/v1/map/nodes?bounds=-74,45,-73,46&region=QC&limit=200
```

### Services
```javascript
// mapService.js
- getNodesInBbox(west, south, east, north, limit) → GeoJSON
  // Utilise PostGIS : ST_Contains(geometry, bbox)
- getNodesByRegion(province) → GeoJSON
- getNodeById(id) → node object
- createMapNode(profileId, data) → node
  // Auto-créé pour chaque profil avec location
- updateMapNode(id, data) → node updated
- deleteMapNode(id) → soft delete

// Exemple PostGIS query
// Récupérer nœuds dans bbox
SELECT 
  n.id, n.name, n.profile_id, n.latitude, n.longitude,
  n.category, pr.username, pr.avatar_url
FROM map_nodes n
LEFT JOIN profiles pr ON n.profile_id = pr.id
WHERE ST_DWithin(
  ST_SetSRID(ST_Point(n.longitude, n.latitude), 4326),
  ST_SetSRID(ST_MakeEnvelope($1, $2, $3, $4, 4326), 4326),
  0
)
AND n.visibility = 'public'
LIMIT $5;
```

### Frontend (Leaflet)
```javascript
// public/js/modules/map.js
- initMap(containerId) → initialiser Leaflet
- loadNodes(bounds or region) → API call, affiche pins
- addCluster() → Leaflet.markercluster (si dense)
- handleZoom() → Changer résolution selon zoom
- filterByRegion(province) → Mettre à jour carte
- onMarkerClick(node) → Ouvrir profil ou modal

// Exemple
const map = L.map('map').setView([56.1304, -106.3468], 4); // Canada
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Charger les nœuds
fetch('/api/v1/map/nodes?bounds=-141,41,-52,83')
  .then(r => r.json())
  .then(geojson => {
    L.geoJSON(geojson, {
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`
          <a href="/profiles/${feature.properties.profile_id}">
            ${feature.properties.name}
          </a>
        `);
      }
    }).addTo(map);
  });
```

### Validation Input
```javascript
const bboxSchema = z.object({
  bounds: z.string().regex(/^-?\d+,-?\d+,-?\d+,-?\d+$/, 'Format: west,south,east,north'),
  // ou séparé
  west: z.number().min(-180).max(180),
  south: z.number().min(-90).max(90),
  east: z.number().min(-180).max(180),
  north: z.number().min(-90).max(90),
  limit: z.number().min(1).max(500).default(200),
});

const regionSchema = z.object({
  region: z.enum(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']),
});
```

### GeoJSON Response Format
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-73.5673, 45.5017]
      },
      "properties": {
        "id": "uuid-node",
        "name": "Marie Dubois",
        "profile_id": "uuid-profile",
        "category": "citizen",
        "interests": ["élections", "environnement"],
        "location": "Montréal, QC",
        "avatar_url": "https://...",
        "follower_count": 12,
        "post_count": 5
      }
    }
  ]
}
```

### Tests
```javascript
describe('Map Routes', () => {
  test('GET /api/v1/map/nodes?bounds=... : nœuds dans bbox', async () => {
    // GeoJSON valid
    // Inclure profiles info (username, avatar)
    // Limiter à 500 nœuds max
  });
  
  test('GET /api/v1/map/nodes?region=QC : par région', async () => {
    // Retourner nœuds QC seulement
    // Valider enum provinces
  });
  
  test('Nœuds créés auto pour profils avec location', async () => {
    // Create profile avec { location: "Montréal, QC", latitude: 45.5, longitude: -73.6 }
    // Auto-créer map_node
    // Vérifier dans GET /map/nodes
  });
});
```

### DB (PostGIS Setup)
```sql
-- Activer PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table map_nodes avec géométrie
CREATE TABLE map_nodes (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geometry GEOMETRY(Point, 4326) GENERATED ALWAYS AS 
    (ST_SetSRID(ST_Point(longitude, latitude), 4326)) STORED,
  province VARCHAR(2),
  category VARCHAR(50),
  visibility ENUM('public', 'private') DEFAULT 'public',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index spatial
CREATE INDEX idx_map_nodes_geom ON map_nodes USING gist(geometry);
CREATE INDEX idx_map_nodes_province ON map_nodes(province);
```

### Performance (Important)
```javascript
// ❌ MAUVAIS : charger TOUS les nœuds
SELECT * FROM map_nodes → 10,000 rows → client surcharge

// ✅ BON : Bbox + limit
SELECT ... FROM map_nodes WHERE ST_Contains(geometry, bbox) LIMIT 500

// ✅ BON : Clustering côté JS (pas serveur)
// Leaflet.markercluster gère le rendu optimisé
```

### Intégration avec Profils
```javascript
// Quand un profil est créé avec location
POST /api/v1/profiles
{
  "bio": "Citoyen engagé",
  "location": "Montréal, QC",
  "latitude": 45.5017,
  "longitude": -73.5673,
  "interests": ["élections"]
}

// Auto-créer map_node
// Le citoyen apparaît immédiatement sur la carte
```

## 🧪 Exemple minimal

```javascript
// Chargement de la carte
const map = L.map('map', {
  center: [56.1304, -106.3468],
  zoom: 3,
  minZoom: 3,
  maxZoom: 18
});

// Fetch des nœuds pour la vue actuelle
async function loadNodes() {
  const bounds = map.getBounds();
  const response = await fetch(
    `/api/v1/map/nodes?bounds=${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
  );
  const geojson = await response.json();
  
  L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) => {
      const marker = L.circleMarker(latlng, {
        radius: 8,
        fillColor: '#C1272D',
        weight: 2,
        fillOpacity: 0.8
      });
      marker.bindPopup(`<a href="/profiles/${feature.properties.profile_id}">${feature.properties.name}</a>`);
      return marker;
    }
  }).addTo(map);
}

map.on('moveend', loadNodes);
loadNodes();
```

## 🗺️ Provinces Canada (enums)
```
AB (Alberta), BC (Colombie-Britannique), MB (Manitoba),
NB (Nouveau-Brunswick), NL (Terre-Neuve-et-Labrador),
NS (Nouvelle-Écosse), NT (Territoires du Nord-Ouest),
NU (Nunavut), ON (Ontario), PE (Île-du-Prince-Édouard),
QC (Québec), SK (Saskatchewan), YT (Territoire du Yukon)
```

## 📋 Livrable attendu
1. backend/src/routes/map.js — Routes GeoJSON
2. backend/src/services/mapService.js — PostGIS queries
3. backend/tests/map.test.js — Tests
4. Migrations DB : PostGIS setup, map_nodes table
5. public/js/modules/map.js — Leaflet integration
6. pages/map/index.html — Page carte
7. Mise à jour CLAUDE.md pour setup PostGIS local
