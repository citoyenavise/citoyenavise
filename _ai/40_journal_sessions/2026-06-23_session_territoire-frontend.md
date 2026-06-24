# AUDIT DE SESSION — 2026-06-23
Architecture territoriale : kit d'ingestion, doctrine, fiche Canada, frontend territoire + carte, auto-deploy.
Opérateur : Claude Code (Opus 4.8). Propriétaire : M. Fortin.


---

## 1. OBJECTIF DE LA SESSION

Intégrer l'architecture territoriale V3, établir une méthode d'ingestion de données publiques fiable et économe, ingérer le premier territoire (Canada), puis le rendre **vivant sur le site** avec une carte des territoires. Corrections d'accueil en fin de course.

---

## 2. RÉALISATIONS (ce qui est ACHEVÉ)

### 2.1 Kit territorial (docs/)
Tous dans `docs/` — lus au démarrage de chaque session d'ingestion via la commande `/territoire` :
- `SYNTHESE_V3.md` — synthèse officielle V3 (déplacée de `_ai/SYNTHESE_OFFICIELLE.md` via `git mv`).
- `TERRITOIRE_TEMPLATE.md` — moule unique des fiches territoire.
- `SOURCES_OFFICIELLES.md` — URLs autorisées par niveau et catégorie (canon d'ingestion).
- `REGLES_INGESTION.md` — protocole des 3 passes.
- `COMMANDE_CLAUDE_CODE_PHASE1_2.md` — commande maître Phase 1 & 2.
- `SOURCES_POTENTIELLES.md` — répertoire élargi (Polimètre, SEAO/OCDS, financement politique, Décrypteurs, benchmark civic-tech, géospatial).
- `DOCTRINE_INGESTION.md` — « max données / min tokens » en 4 couches.
- `PIPELINE_INGESTION.md` — chaîne technique réelle.

### 2.2 Commande & scripts
- `.claude/commands/territoire.md` — commande `/territoire` (recharge les 4 fichiers du kit).
- `scripts/ingest/dq.mjs` — utilitaire API CKAN Données Québec (search/show/get via curl).
- `scripts/ingest/shp2geojson.py` — conversion SHP/GPKG → GeoJSON (geopandas + GDAL).

### 2.3 Ingestion — Canada (TERRITOIRE_0001)
- `territoires/niveau_1/TERRITOIRE_0001_Canada.md` — fiche complète, **100 % sources officielles** :
  - Population 36 991 981 · superficie 8 788 702,80 km² · densité 4,2 (StatCan recensement 2021)
  - PM Mark Carney · chef opp. Pierre Poilievre · prés. Chambre Francis Scarpaleggia
  - Budget fédéral 2025-2026 : revenus 507,5 G$ / dépenses 585,9 G$ / déficit 78,3 G$ (révisé 66,9)
  - Stats : chômage 10,3 % · propriété 66,5 % · baccalauréat+ 32,9 % (recensement 2021)
  - *Reste à 100 % repo* : centroïde géographique (couche lourde mise de côté).
- `INBOX/INBOX_GLOBAL.md` — INBOX centrale (4 entrées Canada toutes résolues).
- Arborescence créée : `territoires/niveau_1→6`, `representants/`, `institutions/`, `enjeux/`, `projets/`, `decisions/`, `statistiques/`, `archives/`, `data/geo/` (gitignoré).

### 2.4 Frontend — module territoire (LIVE)
- `frontend/src/territoires/canada.md` — fiche Canada citoyenne (Markdown).
- `frontend/src/territoires/geo/regions_qc.geojson` — 17 régions admin QC (280 Ko, source MERN/SDA).
- `frontend/src/lib/territoireLoader.js` — chargeur découplé du système éditorial.
- `frontend/src/pages/TerritoirePage.jsx` + `.css` — page `/territoire` (carte + liste) et `/territoire/:slug` (fiche).
- `frontend/src/components/CarteTerritoires.jsx` + `.css` — carte choroplèthe (polygones colorés + frontières + sélection).
- `frontend/src/App.jsx` — routes `/territoire` et `/territoire/:slug`.
- `frontend/src/components/layout/NavHaut.jsx` — liens « Territoire » et « Élus ».
- `frontend/src/pages/Accueil.jsx` — épuré (slogan + intro + bouton élu retirés).
- `.gitignore` — `data/geo/` ignoré (couches volumineuses).

### 2.5 Déploiement
- **Auto-deploy réparé** : le maillon manquant était l'absence de **webhook GitHub** (toggle Dokploy ON mais jamais notifié). Webhooks créés (par l'agent VPS) → chaque `git push origin main` redéploie automatiquement (rolling, ~30-90 s, sans coupure).
- Vérifié 2× en conditions réelles (déploiements à 90 s puis 30 s).

---

## 3. MÉTHODES EMPLOYÉES (pour reproduire proprement)

### 3.1 Doctrine d'ingestion (4 couches)
1. **Sources officielles d'abord** — 1 requête → 1 source → extraction structurée.
2. **Extraction ciblée** — requête = ENTITÉ + INFORMATION ; extraire seulement les champs voulus.
3. **Outils** — Firecrawl/Tavily/Exa (à provisionner) ; **Jina Reader utilisable maintenant** via `curl https://r.jina.ai/https://cible`.
4. **Base de connaissance** — sauvegarder, ne jamais refaire une recherche.

### 3.2 Protocole 3 passes
PASS 1 (squelette) → PASS 2 (ingestion par catégorie, checklist) → PASS 3 (synthèse, liens, complétude). **Jamais d'invention** : donnée non extraite → champ vide ou INBOX.

### 3.3 Pipeline technique (validé)
- **Téléchargement réel** : `curl` (le réseau sortant fonctionne ; testé sur 14 Mo et 133 Mo).
- **Découverte de données** : API CKAN Données Québec (`package_search` / `package_show`) via `scripts/ingest/dq.mjs`.
- **Pages bloquées (403) ou JS** : `curl` + **Jina Reader** (`r.jina.ai`) — a sauvé l'extraction StatCan (404 sur WebFetch) et canada.ca (403). StatCan « Perspective géographique » (fogs-spg, `topic=7` Logement, `topic=11` Scolarité, `topic=12` Travail) très exploitable.
- **HTML simple** : WebFetch (mais bloqué par certains sites gouvernementaux → préférer Jina).
- **Géospatial** : `curl` SHP du MERN (Système sur les découpages administratifs, zip avec `regio_s`/`mrc_s`/`munic_s`) → conversion `geopandas` (dissolve par région, `to_crs(4326)`, `simplify(0.005)`). **Encodage SDA = UTF-8** (ne PAS forcer Latin-1, sinon double-encodage).

### 3.4 Frontend & déploiement
- Module territoire **découplé** du système éditorial `content/` + `sync-content.mjs` (qui régénère `_manifest.json` depuis PHOENIX et efface `content/`) → fiches dans `frontend/src/territoires/`, jamais écrasées.
- Import GeoJSON via `?raw` + `JSON.parse` (bundle dans le chunk lazy de la page).
- Build local (`npm run build`) **systématique avant push** ; le build Dokploy est déterministe (mêmes hashes que local → preuve de mise en ligne par `curl` sur l'asset).

---

## 4. ÉTAT FINAL — EN LIGNE

| Élément | URL / Emplacement | État |
|---------|-------------------|------|
| Carte des 17 régions QC | citoyenavise.org/territoire | ✅ live |
| Fiche Canada | citoyenavise.org/territoire/canada | ✅ live |
| Accueil épuré | citoyenavise.org | ✅ live |
| Menu « Élus » + « Territoire » | nav | ✅ live |
| Auto-deploy (webhook) | push main → Dokploy | ✅ fonctionnel |

Infra : VPS, Dokploy `http://2.24.217.42:3000` (projet citoyenavise, 2 apps : frontend + backend Docker Swarm + Traefik). `citoyenavise.org` → frontend, `api.citoyenavise.org` → backend. Backend migré de Render vers le VPS.

---

## 5. DÉCISIONS CLÉS DE LA SESSION

1. Module territoire **découplé** du système éditorial (robustesse vs sync-content).
2. Carte placée sur **`/territoire`** (pas `/carte`, qui reste élus/pétitions).
3. Couches géo via **SDA MERN** (officiel, multi-niveaux dans un seul zip).
4. **Anti-invention strict** appliqué : tout manque → INBOX, jamais comblé de mémoire.
5. Déploiement = **push sur main** (workflow projet, auto-deploy Dokploy).

---

## 6. PROCHAINES ÉTAPES (proprement définies)

### Immédiat / court terme
1. **Carte — sélecteur de niveaux** : ajouter MRC (`mrc_s`) et municipalités (`munic_s`) depuis le zip SDA déjà téléchargé (`data/geo/sda100k.zip`). Même pipeline `shp2geojson` (dissolve, simplify ; municipalités = ~1100 polygones → simplifier davantage / charger à la demande).
2. **Clic région → fiche** : activer le lien `/territoire/:slug` quand les fiches régions existeront.
3. **Centroïde Canada** : finaliser la fiche repo à 100 % avec une couche légère (éviter la couche de 133 Mo).

### Phase 1 d'ingestion (suite)
4. **Québec Province (TERRITOIRE_0002)** puis **17 régions (0003-0019)** — protocole 3 passes, sources officielles (ANQ, DGEQ, ISQ, StatCan). Québec ville (0021) = pilote prioritaire en Phase 2.

### Gouvernance
5. **Promotion de sources** de `SOURCES_POTENTIELLES.md` vers `SOURCES_OFFICIELLES.md` (décision M. Fortin) : Polimètre, SEAO/OCDS, financement politique.

---

## 7. SUIVIS / DETTE / POINTS D'ATTENTION

- **CONTEXT.md PHOENIX inexistant** : la règle 6.5 (CLAUDE.md) pointe vers `PHOENIX/.../SYSTEMES/CONTEXT.md` qui n'existe pas. Structure réelle : `SYSTEMES/` (Mission, Vision, Architecture…) + `_PILOTAGE.md` + `AUDITS/`. → À clarifier : mettre à jour la règle 6.5, ou désigner `_PILOTAGE.md` comme fichier de pilotage.
- **Fiche Canada repo à ~98 %** : centroïde géographique en attente.
- **`data/geo/*.zip` (~220 Mo)** : `lpr.zip` (Canada, 133 Mo) + `sda100k.zip` (87 Mo, utile pour MRC/municipalités) — locaux, gitignorés. Nettoyer `lpr.zip` ; garder `sda100k.zip` pour les niveaux 3-4.
- **Outils Couche 3** (Firecrawl, Tavily, Exa) + **Qdrant/N8N** : à provisionner (clés API / VPS) pour passer à l'échelle (1200+ municipalités).
- **WebFetch** bloqué (403) par plusieurs sites gouvernementaux → privilégier **Jina Reader via curl**.

---

## 8. COMMITS DE LA SESSION

| Hash | Objet |
|------|-------|
| d191728 | chore(territoire): kit d'ingestion + fiche Canada |
| 5fb369a | feat(frontend): fiches territoire — page /territoire + Canada |
| ec33e75 | chore(deploy): déclencheur + validation webhook auto-deploy |
| 8e76e96 | fix(frontend): épure accueil + accès Élus dans le menu |
| 5a6a5e8 | feat(territoire): carte choroplèthe des régions du Québec |

---

*Fin de l'audit de session 2026-06-23.*
