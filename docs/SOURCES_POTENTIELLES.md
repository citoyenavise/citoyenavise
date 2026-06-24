# SOURCES POTENTIELLES — citoyenavise.org
Répertoire élargi de sources à fort potentiel pour la transparence et la vérité.
Version 1.0 — 2026-06-23
Complément à SOURCES_OFFICIELLES.md (qui reste le canon d'ingestion des fiches territoire).


---

## STATUT DE CE DOCUMENT

- *Portée* : Québec d'abord (+ palier fédéral et benchmark international quand pertinent).
- *But* : élargir l'horizon des sources au-delà des portails déjà listés — registres de transparence, vérification, plateformes civiques de référence, couches géospatiales.
- *Fiabilité* : URLs issues de recherches web du 2026-06-23. À **revalider** (accès + format) avant toute ingestion, conformément à REGLES_INGESTION.md (source inaccessible → INBOX, donnée non extraite → champ vide, jamais d'invention).
- *Règle de promotion* : une source jugée fiable et utile ici peut être **promue** vers SOURCES_OFFICIELLES.md (décision M. Fortin) pour devenir source d'ingestion autorisée.

Légende potentiel : 🟢 élevé (cœur transparence/vérité) · 🟡 moyen (enrichissement) · 🔵 benchmark (inspiration produit, pas ingestion directe).

---

## 1. DONNÉES OUVERTES & API

| Source | URL | Format / Accès | Potentiel | Note |
|--------|-----|----------------|-----------|------|
| Données Québec (portail central) | https://www.donneesquebec.ca/ | Portail CKAN — API, CSV, JSON, GeoJSON | 🟢 | Hub provincial + municipal. Point d'entrée principal. |
| Données Québec — Projets de loi | https://www.donneesquebec.ca/recherche/dataset/projets-de-loi | CSV / JSON | 🟢 | Législation ANQ, sessions courantes + antérieures. |
| Données Québec — Répertoire municipalités | https://www.donneesquebec.ca/recherche/dataset/repertoire-des-municipalites-du-quebec | CSV | 🟢 | Désignation, région, circonscriptions, districts. |
| Données Québec — Catégorie Gouvernement & finances | https://donneesquebec.ca/recherche/fr/group/4223c6b5-f54b-471c-813d-19d6d1cc5f2f | JSON / CSV | 🟡 | Budgets et données financières municipales, MAJ quotidienne. |
| Élections Québec — Données ouvertes | https://www.electionsquebec.qc.ca/donnees-ouvertes/ | Fichiers structurés | 🟢 | Résultats électoraux provinciaux + municipaux (depuis 2021). |
| Ville de Québec — Données ouvertes | https://www.ville.quebec.qc.ca/services/donnees-services-ouverts/index.aspx | CSV / GeoJSON | 🟢 | Pilote. Districts, bibliothèques, etc. (relayé via Données Québec). |
| Portail Gouvernement ouvert Canada | https://ouvert.canada.ca/fr | API + CSV | 🟡 | Palier fédéral, miroir de plusieurs jeux QC. |
| Statistique Québec (ISQ) | https://statistique.quebec.ca/ | HTML + CSV | 🟡 | Profils régions/MRC/municipalités, indice de défavorisation. |
| Données prévisionnelles municipalités (Québec.ca) | https://www.quebec.ca/gouvernement/gestion-municipale/finances-fiscalite-municipales/information-financiere/publications-financieres/donnees-previsionnelles | CSV | 🟡 | Budgets prévisionnels municipaux. |

---

## 2. REGISTRES DE TRANSPARENCE (cœur « transparence »)

| Source | URL | Format / Accès | Potentiel | Note |
|--------|-----|----------------|-----------|------|
| Lobbyisme Québec / Carrefour Lobby Québec | https://lobbyisme.quebec/ | Registre HTML + recherche | 🟢 | Registre des lobbyistes QC (en vigueur depuis 2002). |
| Commissariat au lobbying du Canada | https://lobbycanada.gc.ca/ | Registre + jeu de données ouvert | 🟢 | Lobbying fédéral. Dataset : ouvert.canada.ca. |
| Élections Québec — Recherche de contributeurs | https://www.electionsquebec.qc.ca/comprendre/comprendre-le-financement-politique/ | Recherche en ligne | 🟢 | Contributions politiques (année courante + 6 ans). Nom, code postal, ville. |
| Élections Québec — Rapports financiers des entités politiques | https://www.electionsquebec.qc.ca/donnees-ouvertes/ | Rapports + données | 🟢 | États financiers annuels des partis (provincial + municipal). |
| Élections Canada — Financement politique | https://www.elections.ca/content.aspx?section=fin&document=index&lang=f | Recherche + données | 🟡 | Contributions fédérales. |
| SEAO — Contrats publics (données ouvertes) | https://www.donneesquebec.ca/recherche/dataset/systeme-electronique-dappel-doffres-seao | XML (depuis 2009) + JSON (depuis 2021, format inspiré Open Contracting Data Standard) | 🟢 | Marchés publics QC. Format OCDS = standard mondial de transparence des contrats. |
| Espace DATA — Contrats publics québécois | http://www.espacedata.ca/ | Réutilisation citoyenne des données SEAO | 🟢 | Exemple de réutilisation/visualisation déjà existant à étudier. |
| Vérificateur général du Québec | https://www.vgq.qc.ca/ | Rapports HTML/PDF | 🟢 | Audits indépendants des fonds publics. |
| Commissaire à l'éthique et à la déontologie (ANQ) | https://www.ced-qc.ca/ | HTML/PDF | 🟡 | Déclarations d'intérêts des élus provinciaux. |
| Commission municipale du Québec (CMQ) | https://www.cmq.gouv.qc.ca/ | Rapports d'audit | 🟡 | Audits de conformité municipale (ex. publication contrats SEAO). |

> ⚠️ Sensibilité Loi 25 / vie privée : les données de contributions politiques sont publiques mais nominatives. Tout réemploi sur citoyenavise.org doit respecter le cadre légal (cf. SYNTHESE_V3 §23.4 O2). À valider avant exposition publique.

---

## 3. VÉRIFICATION & DATA-JOURNALISME (cœur « vérité »)

| Source | URL | Type | Potentiel | Note |
|--------|-----|------|-----------|------|
| Décrypteurs (Radio-Canada) | https://ici.radio-canada.ca/decrypteurs | Fact-checking | 🟢 | Équipe reconnue IFCN. Méthodologie publique. |
| Détecteur de rumeurs (Agence Science-Presse) | https://www.sciencepresse.qc.ca/ | Fact-checking | 🟢 | Depuis 2016, soutien Fonds de recherche du Québec. |
| CQÉMI — « 30 secondes avant d'y croire » | https://30secondes.org/ | Éducation aux médias | 🟡 | Programme de littératie informationnelle. Inspiration pour le volet pédagogique (Laboratoire, Phase I). |
| International Fact-Checking Network (IFCN) | https://www.poynter.org/ifcn/ | Standards | 🔵 | Code de principes pour la vérification. Référence méthodologique. |

---

## 4. PLATEFORMES CIVIQUES — BENCHMARK

> Inspiration produit et standards de données. Pas de l'ingestion directe, mais des modèles à imiter pour citoyenavise.org.

| Plateforme | URL | Périmètre | Potentiel | Pourquoi c'est pertinent |
|------------|-----|-----------|-----------|--------------------------|
| Polimètre (CAPP, Université Laval) | https://www.polimetre.org/ | QC + Canada | 🟢🔵 | **Suivi des promesses électorales** — directement aligné avec « engagements d'élus » de citoyenavise. Méthodologie documentée. Partenariat possible. |
| Datagotchi (CLESSN, ULaval) | https://datagotchi.ulaval.ca/ | QC + Canada | 🔵 | Engagement ludique, prédiction de vote. Inspiration UX/gamification. |
| POLTEXT | https://www.poltext.org/ | QC + Canada | 🟡 | Corpus de plateformes électorales (données textuelles). |
| OpenParliament.ca | https://openparliament.ca/ | Canada fédéral | 🔵 | Modèle de suivi parlementaire (débats, votes, députés). Open source. |
| NosDéputés.fr (Regards Citoyens) | https://www.nosdeputes.fr/ | France | 🔵 | Observatoire citoyen de l'activité parlementaire. Open data + méthodo de référence. |
| GovTrack.us | https://www.govtrack.us/ | USA fédéral | 🔵 | Pionnier de la base ouverte sur lois + élus. API publique. |
| Open States (Plural) | https://openstates.org/ | USA (50 états) | 🔵 | Réplique GovTrack à l'échelle infranationale — modèle pour le multi-palier QC. API + bulk. |
| mySociety / TheyWorkForYou | https://www.theyworkforyou.com/ | UK | 🔵 | Suivi des élus + outils citoyens. Open source (Poplus, Pombola). |
| EveryPolitician (mySociety) | http://everypolitician.org/ | Mondial | 🔵 | Dataset normalisé d'élus (72 000+ politiciens, 233 pays). Modèle de schéma REPRESENTANT. |
| Awesome Civic Tech (liste GitHub) | https://github.com/awesomelistsio/awesome-civic-tech | Mondial | 🔵 | Liste curée d'outils/projets open source civic tech. Veille continue. |

---

## 5. GÉOSPATIAL — COUCHES PAR NIVEAU TERRITORIAL

Pipeline recommandé : télécharger GeoJSON/SHP depuis la source → importer dans PostGIS (`ogr2ogr` ou `shp2pgsql`) → exposer via l'API (couche GIL de la vision). WebFetch ne télécharge PAS ces fichiers ; prévoir un script `curl`/`ogr2ogr`.

### 5.1 Portails géospatiaux de référence

| Source | URL | Formats | Note |
|--------|-----|---------|------|
| Données Québec — Découpages administratifs | https://www.donneesquebec.ca/recherche/fr/dataset?q=decoupages-administratifs | GeoJSON, SHP, KML | Point d'entrée multi-niveaux. |
| BDGA — Base de données géographiques et administratives (MRNF) | https://mrnf.gouv.qc.ca/repertoire-geographique/carte-generale-base-donnees-geographiques-administratives/ | SHP / couches 1/20k, 1/100k, 1/1M, 1/5M | Source officielle des limites administratives QC. |
| Cartes et données géospatiales (Québec.ca) | https://www.quebec.ca/gouvernement/portrait-quebec/cartes-donnees-quebec | Visualisation + téléchargement | Portail d'orientation géospatiale. |
| Portail Gouvernement ouvert Canada — Découpages | https://ouvert.canada.ca/data/fr/dataset/eec20550-7916-4ff9-b9bf-9e07288b4a17 | GeoJSON, ESRI REST, KML, ZIP | Découpages fédéraux + ESRI REST (API live). |
| Observatoire du Grand Montréal (CMM) | https://observatoire.cmm.qc.ca/produits/donnees-georeferencees/ | GeoJSON / SHP | Données géoréférencées région métropolitaine. |

### 5.2 Couches par niveau (mapping hiérarchie 6 niveaux)

| Niveau | Couche | Source | Format |
|--------|--------|--------|--------|
| 1 — Canada / Province | Limites Canada + provinces | StatCan (sip-pis boundary 2021) | GeoJSON/SHP |
| 2 — Régions adm. | 17 régions administratives QC | Données Québec — régions-administratives | GeoJSON/SHP |
| 3 — MRC | Limites MRC | Données Québec — mrc | GeoJSON/SHP |
| 4 — Municipalités | Découpage municipal | Données Québec — decoupage-municipal | GeoJSON/SHP |
| 5 — Arrondissements | Limites agglomération Montréal | donnees.montreal.ca/dataset/limites-administratives-agglomeration | GeoJSON |
| 5 — Arrondissements | Arrondissements (jeu vque) | Données Québec — dataset/vque_2 | GeoJSON |
| 6 — Circ. provinciales | 125 circonscriptions | Données Québec — circonscriptions-electorales-provinciales | GeoJSON |
| 6 — Circ. fédérales | 338 circonscriptions | Élections Canada (open.canada.ca dataset 48f10fb9…) | GeoJSON/SHP |
| Géocodage | Adresses Québec | Données Québec — adresses-du-quebec | CSV/GeoJSON |
| Fond de carte | Tuiles OSM | openstreetmap.org | Tuiles |

---

## 6. SYNTHÈSE — PRIORITÉS RECOMMANDÉES

Sources à plus fort potentiel immédiat pour le pilote Québec ville (à valider par M. Fortin avant promotion vers SOURCES_OFFICIELLES.md) :

1. 🟢 **Polimètre** (suivi des promesses) — alignement direct avec « engagements d'élus ». Étudier partenariat/méthodo.
2. 🟢 **SEAO en format OCDS** (contrats publics) — standard mondial, données structurées exploitables.
3. 🟢 **Élections Québec — financement politique** — transparence à fort impact citoyen (sous réserve Loi 25).
4. 🟢 **Données Québec géospatial** — couches niveau 2→6 pour la carte civique.
5. 🟢 **Décrypteurs + Détecteur de rumeurs** — partenaires/références pour le volet « vérité ».
6. 🔵 **EveryPolitician / Open States** — modèles de schéma de données pour REPRESENTANT_XXXX.

---

## 7. JOURNAL

| Date | Auteur | Modification |
|------|--------|--------------|
| 2026-06-23 | Opérateur | Création V1 — recherche web 5 familles (données ouvertes, registres transparence, vérification, benchmark, géospatial). Portée Québec d'abord. |

---

*Fin du répertoire des sources potentielles — V1.*
*Toute source promue vers l'ingestion doit être recopiée dans SOURCES_OFFICIELLES.md avec décision consignée dans SYNTHESE_V3.md §22.*
