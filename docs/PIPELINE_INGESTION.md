# PIPELINE D'INGESTION — citoyenavise.org
Chaîne technique réelle pour acquérir les données des fiches territoire.
Version 1.0 — 2026-06-23
Complète REGLES_INGESTION.md (le « quoi/quand ») par le « comment » technique.


---

## 1. OUTILS EN MAIN (vérifiés 2026-06-23)

| Outil | État | Rôle |
|-------|------|------|
| curl 8.19 | ✅ | Téléchargement réel de fichiers (GeoJSON, CSV, JSON), gros volumes OK (14 Mo testé en 3,2 s) |
| node 24 / npm 11 | ✅ | Découverte API CKAN, parsing, orchestration (`scripts/ingest/dq.mjs`) |
| python 3.12 | ✅ | Traitement de données, conversion possible (via libs à installer) |
| git 2.54 | ✅ | Versionnement |
| WebFetch (agent) | ✅ | Lecture/extraction de **pages HTML** (députés ANQ, sites de villes) — ne télécharge PAS de fichiers |
| geopandas 1.1.3 + GDAL 3.11.4 (pyogrio) | ✅ | Conversion SHP/GPKG/FGDB → GeoJSON (`scripts/ingest/shp2geojson.py`) |
| Jina Reader (`r.jina.ai` via curl) | ✅ | Nettoyage de page → markdown, très peu de tokens (Couche 3 niv. 2) |
| jq | ❌ | Parsing JSON CLI — **contourné** par node/python |
| ogr2ogr (CLI) / psql | ❌ | CLI standalone + import PostGIS direct — différé (vision GIL ; OSGeo4W si requis) |

---

## 2. TROIS CANAUX D'ACQUISITION

### Canal A — Fichiers via curl + API CKAN (Données Québec)
Le portail Données Québec expose une API CKAN qui permet de **découvrir** datasets et ressources, puis de **télécharger** les fichiers réels.

Utilitaire : `scripts/ingest/dq.mjs`
```bash
node scripts/ingest/dq.mjs search "régions administratives"   # trouver un dataset
node scripts/ingest/dq.mjs show territoire-administratif       # lister ses ressources + URLs
node scripts/ingest/dq.mjs get decoupage-municipal GeoJSON data/geo   # télécharger un format
```
Endpoints CKAN bruts (si besoin) :
- `https://www.donneesquebec.ca/recherche/api/3/action/package_search?q=...`
- `https://www.donneesquebec.ca/recherche/api/3/action/package_show?id=<dataset>`

### Canal B — Géospatial via WFS (GeoJSON direct, SANS conversion)
Plusieurs services cartographiques gouvernementaux exposent un **WFS** qui sort directement du GeoJSON en EPSG:4326 — aucune conversion requise.
```bash
curl -s -o data/geo/couche.geojson \
  "<endpoint-wfs>?service=wfs&version=2.0.0&request=getfeature&typename=<couche>&srsname=EPSG:4326&outputformat=geojson"
```
Exemples vérifiés : services MTQ (`ws.mapserver.transports.gouv.qc.ca`), données ouvertes Ville de Montréal (GeoJSON natif).

### Canal C — Pages HTML via WebFetch (agent)
Pour les données non disponibles en fichier (listes de députés ANQ, conseils municipaux, budgets en page web) : WebFetch lit la page et en extrait le texte structuré. Reste soumis aux RÈGLES (extraction incertaine → INBOX).

---

## 3. LE POINT GÉOSPATIAL — couches SHP du MERN

Les couches **officielles** des découpages administratifs (régions, MRC, municipalités) proviennent du **Système sur les découpages administratifs (SDA) du MERN**, diffusées en **SHP / GPKG / FGDB zippés** — pas en GeoJSON.

Pour les exploiter (carte Leaflet ou couche GIL/PostGIS), il faut une étape de conversion **qui nécessite un outil absent** :

| Option | Ce qu'il faut installer | Avantage | Inconvénient |
|--------|-------------------------|----------|--------------|
| **A. GeoJSON/WFS direct** | rien | Démarrage immédiat, Leaflet lit le GeoJSON statique | Ne couvre pas toutes les couches officielles SDA |
| **B. Python geopandas** | `pip install geopandas` | Lit SHP/GPKG, écrit GeoJSON ; pur Python | Dépendances lourdes (fiona, pyproj, shapely) |
| **C. GDAL / ogr2ogr** | OSGeo4W ou `pip install gdal` | Standard de l'industrie, import PostGIS direct | Installation Windows non triviale |

**Recommandation alignée sur la philosophie projet (simplicité d'abord)** :
démarrer en **Option A** (couches déjà en GeoJSON/WFS, servies statiquement à Leaflet), et n'installer la chaîne de conversion (B ou C) que lorsque PostGIS / requêtes spatiales deviennent nécessaires (couche GIL, vision).

---

## 4. PostGIS

PostGIS est marqué **optionnel** dans la stack (SYNTHESE §4.3) et relève de la couche GIL (vision). Au démarrage, **non requis** : Leaflet consomme des GeoJSON statiques. À activer plus tard pour les requêtes spatiales (point-in-polygon : « quelle circonscription contient cette adresse »). Nécessitera alors `ogr2ogr` + accès BD (DATABASE_URL — secret, ne jamais exposer en clair, cf. CLAUDE.md §6.6).

---

## 5. STATUT — PRÊT À DÉMARRER ?

| Type de donnée | Canal | Statut |
|----------------|-------|--------|
| Tabulaire (population, finances, listes) en CSV/JSON | A (curl+CKAN) | ✅ PRÊT |
| Élus / pages institutionnelles (HTML) | C (WebFetch) | ✅ PRÊT |
| Géospatial déjà en GeoJSON / WFS | B (curl WFS) | ✅ PRÊT |
| Géospatial uniquement en SHP (SDA MERN) | conversion (`shp2geojson.py`) | ✅ PRÊT — geopandas 1.1.3 / GDAL 3.11.4 |
| Base spatiale PostGIS | ogr2ogr CLI + psql | ⏸️ DIFFÉRÉ (vision GIL) |

---

## 6. JOURNAL

| Date | Auteur | Modification |
|------|--------|--------------|
| 2026-06-23 | Opérateur | Création V1. Inventaire outils, 3 canaux d'acquisition validés (curl+CKAN, WFS GeoJSON, WebFetch), script `dq.mjs` créé et testé. Manque identifié : chaîne de conversion SHP/PostGIS (GDAL/geopandas absent). |

---

*Fin du pipeline d'ingestion — V1.*
