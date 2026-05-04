# 🗺️ Système Carte Immersive — Citoyen Avisé MVP

## Vue d'ensemble

La carte interactive est maintenant le système **central** du site, avec une expérience utilisateur immersive conçue pour maximiser l'engagement et la découverte de la communauté.

## ✨ Fonctionnalités

### 🎯 Clustering Intelligent
- Agrégation automatique des marqueurs par zone
- Icônes personnalisées avec compteurs
- Animation pop fluide lors du chargement
- Dégroupage au zoom (niveau 15+)
- Survol des clusters pour aperçu

### 🔥 Heatmap Dynamique
- Visualisation de la densité de population
- Gradient de couleurs (vert → jaune → rouge)
- Toggle accessible via bouton dans les contrôles
- Optimisation des performances au zoom élevé

### 🔎 Filtres Avancés
- **Type**: Tous / Citoyens / Organisations
- **Recherche**: Temps réel avec zoom automatique
- **Régions**: QC, ON, BC, AB + zoom prédéfini
- Application dynamique sans rechargement

### 🎨 Interactions Fluides
- **Hover marker**: Expansion avec ombre augmentée
- **Selection**: Marqueur permanent surligné + popup
- **Popup**: Contenu riche avec stats, intérêts, CTA
- **Zoom animations**: Transition fluide sur 1.5s
- **Click en dehors**: Déselection automatique

### 📱 Responsive Design
- Carte > sidebar sur desktop (85/15%)
- Carte > sidebar empilés en mobile (60/40%)
- Contrôles adaptatifs pour petit écran
- Sidebar avec scrollbar custom

## 🏗️ Architecture

### Module Principal: `public/js/modules/map-advanced.js`

```javascript
class AdvancedMap {
  // Initialisation
  initialize()              // Crée la carte Leaflet + clusters + événements
  
  // Données
  addNodes(geojson)         // Charge les profils avec heatmap
  applyFilters(filters)     // Filtre par type/région/catégorie
  
  // Interactions
  selectMarker(marker)      // Sélectionne et affiche popup
  searchAndZoom(query)      // Recherche + zoom sur résultats
  zoomToRegion(region)      // Zoom sur région prédéfinie
  
  // Utilitaires
  getVisibleNodes()         // Export nœuds dans bounds actuels
  redraw()                  // Invalidate size (responsive)
}
```

### Page: `public/pages/index.html`

Structure:
```
.home-container
├── .home-map
│   ├── #map (Leaflet)
│   └── .map-controls (boutons heatmap + zoom régions)
└── .home-sidebar
    ├── .sidebar-header (recherche + filtres)
    └── .sidebar-content (liste profils filtrés)
```

## 📊 Flux de Données

```
Backend API (/api/v1/map/nodes)
    ↓
GeoJSON { features: [...] }
    ↓
advancedMap.addNodes()
    ├── createMarker() pour chaque feature
    ├── Ajouter à clusters
    ├── Générer heatmap
    └── fitBounds()
    ↓
Markers + Popup + Events
```

## 🎮 Utilisation

### Initialisation
```javascript
// Dans index.html
const advancedMap = new AdvancedMap('map');
advancedMap.initialize();
advancedMap.addNodes(geojson);
```

### Filtrer
```javascript
advancedMap.applyFilters({
  type: 'citizen',        // 'all' | 'citizen' | 'organization'
  region: 'QC',           // 'all' | 'QC' | 'ON' | 'BC' | 'AB'
  category: 'education'   // 'all' | category string
});
```

### Chercher
```javascript
advancedMap.searchAndZoom('Montreal');
// Zoom sur résultats + popup du premier
```

### Zoom Région
```javascript
advancedMap.zoomToRegion('QC');
```

## 🎨 Styling

### CSS Variables (public/css/style.css)
```css
--rouge: #C1272D
--rouge-fonce: #A01E23
--rouge-clair: #FDEAEA
--gris-texte: #495057
--noir-doux: #1A1A2E
--ombre-carte: 0 2px 12px rgba(0,0,0,0.08)
```

### Composants (public/css/components.css)
- `.btn` — Boutons
- `.card` — Cartes
- `.toast` — Notifications
- `.modal-overlay` — Modales
- etc.

## 🎯 Marqueurs

### Couleurs par Type
- 🍁 **Citoyen**: #C1272D (rouge)
- 🏢 **Organisation**: #2A7D32 (vert)
- 📅 **Événement**: #1976D2 (bleu)

### Popup Contenu
```
┌─────────────────────┐
│ [Avatar] Nom        │
│        @username    │
├─────────────────────┤
│ Description courte  │
│ [Intérêt 1] [Int 2] │
│ 👥 42 • 📝 15       │
├─────────────────────┤
│ [Voir profil →]     │
└─────────────────────┘
```

## 🔧 Optimisations

### Performance
- Leaflet.MarkerCluster pour clustering
- Leaflet.heat pour heatmap lissée
- Bounds-based loading pour visibilité nœuds
- Lazy rendering des popups

### Accessibilité
- ARIA labels sur contrôles
- Clavier nav (Tab, Enter)
- Contraste couleurs WCAG AA
- Alt text sur avatars

## 📈 Prochaines Étapes

- [ ] Animations entrée marqueurs (stagger)
- [ ] Heatmap avec poids personnalisé
- [ ] Geo-recherche (localisation)
- [ ] Statistiques région
- [ ] Export GeoJSON
- [ ] Mode sombre

## 🐛 Dépannage

### Heatmap vide
- Vérifier que `geojson.features.length > 0`
- Vérifier format: `[lat, lon, intensity]`
- Vérifier zoom level < 11

### Markers non visibles
- Vérifier bounds API
- Vérifier coordinates format: `[lon, lat]`
- Vérifier que map est initialisée

### Popups ne s'ouvrent pas
- Vérifier console pour erreurs
- Vérifier `createPopupContent()` HTML valide
- Vérifier que `navigate()` est chargée

---

**Version**: 1.0 (MVP)  
**Dernière mise à jour**: 2026-05-02
