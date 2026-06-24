# SOURCES OFFICIELLES — citoyenavise.org
Répertoire de toutes les URLs nécessaires à la production des fiches territoire.
Version 1.0 — 2026-06-23
Règle absolue : Claude Code ne consulte que ces sources. Jamais d'invention. Donnée absente = NULL.


---

## RÈGLES D'UTILISATION

| Règle | Description |
|-------|-------------|
| Source absente | Champ = NULL dans la fiche. Jamais inventé. |
| Source inaccessible | → INBOX avec note « URL inaccessible le JJ-MM-AAAA » |
| Conflit entre sources | → INBOX avec les deux versions pour arbitrage |
| Donnée périmée | Indiquer l'année de la source dans chaque champ |
| Format prioritaire | API JSON > CSV > HTML scraping |

---

## NIVEAU 1 — CANADA

### Gouvernement fédéral

| Catégorie | Source | URL | Format |
|-----------|--------|-----|--------|
| Portail données ouvertes | Gouvernement du Canada | https://ouvert.canada.ca/fr | API + CSV |
| Parlement — Députés actifs | Chambre des communes | https://www.noscommunes.ca/membres/fr/recherche | HTML |
| Parlement — API officielle | Chambre des communes | https://api.parliament.ca | JSON |
| Parlement — Votes | Chambre des communes | https://www.noscommunes.ca/membres/fr/votes | HTML |
| Parlement — Projets de loi | Chambre des communes | https://www.parl.ca/LegisInfo/fr/legislation | HTML |
| Sénat — Sénateurs | Sénat du Canada | https://sencanada.ca/fr/senateurs/ | HTML |
| Circonscriptions fédérales | Élections Canada | https://www.elections.ca/content.aspx?section=res&dir=cir/list&document=index&lang=f | HTML |
| Limites circonscriptions fédérales | Élections Canada | https://open.canada.ca/data/fr/dataset/48f10fb9-78a2-43a9-8b9a-ef5e00055c8f | GeoJSON/SHP |
| Résultats élections fédérales | Élections Canada | https://www.elections.ca/content.aspx?section=res&dir=rep/off/ovr2021app&document=index&lang=f | HTML + CSV |
| Statistiques Canada — Recensement | StatCan | https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm?Lang=F | HTML + CSV |
| Statistiques Canada — Données ouvertes | StatCan | https://www150.statcan.gc.ca/n1/fr/type/donnees | CSV + JSON |
| Divisions de recensement | StatCan | https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/index2021-fra.cfm | GeoJSON/SHP |
| Profils communautaires | StatCan | https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm | HTML + CSV |
| Budget fédéral | Finances Canada | https://www.canada.ca/fr/ministere-finances/nouvelles/2024/04/budget-2024.html | PDF + HTML |
| Contrats publics fédéraux | SPAC | https://www.tpsgc-pwgsc.gc.ca/comm/index-fra.html | HTML |
| Registre des lobbyistes | Commissariat | https://lobbycanada.gc.ca/fr/ | HTML |
| Accès à l'information | Gouvernement Canada | https://www.canada.ca/fr/secretariat-conseil-tresor/services/acces-information-protection-reseignements-personnels.html | HTML |

---

## NIVEAU 2 — QUÉBEC (PROVINCE)

### Gouvernement provincial

| Catégorie | Source | URL | Format |
|-----------|--------|-----|--------|
| Portail données ouvertes QC | Données Québec | https://www.donneesquebec.ca/ | API + CSV + GeoJSON |
| Assemblée nationale — Députés | ANQ | https://www.assnat.qc.ca/fr/deputes/index.html | HTML |
| Assemblée nationale — API | ANQ | https://www.assnat.qc.ca/fr/deputes/index.html | HTML (scraping) |
| Assemblée nationale — Votes | ANQ | https://www.assnat.qc.ca/fr/travaux-parlementaires/assemblee-nationale/votes.html | HTML |
| Assemblée nationale — Projets de loi | ANQ | https://www.assnat.qc.ca/fr/travaux-parlementaires/projets-loi/index.html | HTML |
| Circonscriptions provinciales — Liste | DGEQ | https://www.dgeq.org/circonscriptions.html | HTML |
| Circonscriptions provinciales — Limites | DGEQ / Données QC | https://www.donneesquebec.ca/recherche/dataset/circonscriptions-electorales-provinciales | GeoJSON |
| Résultats élections provinciales | DGEQ | https://www.dgeq.org/resultats.html | HTML + CSV |
| Résultats élections municipales | DGEQ | https://www.dgeq.org/elections-municipales.html | HTML + CSV |
| Calendrier électoral | DGEQ | https://www.dgeq.org | HTML |
| Municipalités du Québec — Liste officielle | MAMH | https://www.mamh.gouv.qc.ca/organisation-municipale/organisation-territoriale/municipalites/ | HTML + CSV |
| MRC — Liste officielle | MAMH | https://www.mamh.gouv.qc.ca/organisation-municipale/organisation-territoriale/municipalites-regionales-de-comte/ | HTML |
| Élus municipaux — Répertoire | MAMH | https://www.electionsmunicipales.gouv.qc.ca/resultats.html | HTML + CSV |
| Régions administratives | MAMH | https://www.mamh.gouv.qc.ca/organisation-municipale/organisation-territoriale/regions-administratives/ | HTML |
| Limites territoriales municipales | Données QC | https://www.donneesquebec.ca/recherche/dataset/decoupage-municipal | GeoJSON/SHP |
| Limites MRC | Données QC | https://www.donneesquebec.ca/recherche/dataset/mrc | GeoJSON/SHP |
| Limites régions administratives | Données QC | https://www.donneesquebec.ca/recherche/dataset/regions-administratives | GeoJSON/SHP |
| Budget du Québec | Finances QC | https://www.budget.finances.gouv.qc.ca/ | PDF + HTML |
| Comptes publics QC | Finances QC | https://www.finances.gouv.qc.ca/fr/document/affichage.asp?sect=PUBLICATION&type=COMPTESPUBLICS | PDF |
| Contrats publics provinciaux | SEAO | https://www.seao.ca/ | HTML |
| Registre des entreprises | REQ | https://www.registreentreprises.gouv.qc.ca/ | HTML |
| Institutions d'enseignement | MEES | https://www.education.gouv.qc.ca/references/publications/resultats-de-la-recherche/detail/article/repertoire-des-etablissements/ | CSV |
| Cégeps et collèges | MEES | https://www.education.gouv.qc.ca/colleges/ | HTML |
| Universités | MEES | https://www.education.gouv.qc.ca/universites/ | HTML |
| CLSC et établissements santé | MSSS | https://www.msss.gouv.qc.ca/professionnels/repertoire-des-ressources/ | HTML + CSV |
| Hôpitaux | MSSS | https://www.msss.gouv.qc.ca/reseau/index.php | HTML |
| GMF (groupes médecine familiale) | MSSS | https://www.msss.gouv.qc.ca/professionnels/gmf/ | HTML |
| CISSS / CIUSSS | MSSS | https://www.msss.gouv.qc.ca/reseau/cisss-ciusss/ | HTML |
| Organismes communautaires | SACAIS | https://www.sacais.gouv.qc.ca/index.asp | HTML |
| Centres de services scolaires | MEES | https://www.education.gouv.qc.ca/references/publications/resultats-de-la-recherche/detail/article/centres-de-services-scolaires/ | HTML |
| Lois et règlements QC | LégisQuébec | https://www.legisquebec.gouv.qc.ca/ | HTML |
| Consultations publiques QC | BAPE | https://www.bape.gouv.qc.ca/fr/consultations/ | HTML |
| Registre foncier | MRNF | https://www.registrefoncier.gouv.qc.ca/ | HTML |

---

## NIVEAU 3 — MRC

### Sources par MRC (exemples — même logique pour toutes les MRC)

| Catégorie | Source | URL | Format |
|-----------|--------|-----|--------|
| Liste complète MRC avec codes | MAMH | https://www.mamh.gouv.qc.ca/organisation-municipale/organisation-territoriale/municipalites-regionales-de-comte/ | HTML |
| Codes géographiques MRC | StatCan | https://www12.statcan.gc.ca/census-recensement/2021/geo/ref/geos-fra.cfm | CSV |
| Données socioéconomiques MRC | StatCan | https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm | CSV |
| Profils MRC | Institut de la statistique QC | https://statistique.quebec.ca/fr/document/profil-statistique-regions-mrc-municipalites | HTML + CSV |
| Budgets MRC | MAMH (rapports financiers) | https://www.mamh.gouv.qc.ca/finances-et-fiscalite/information-financiere-des-organismes-municipaux/ | CSV |
| Élus MRC (préfets) | MAMH | https://www.electionsmunicipales.gouv.qc.ca/ | HTML |

---

## NIVEAU 4 — MUNICIPALITÉS

### Sources municipales

| Catégorie | Source | URL | Format |
|-----------|--------|-----|--------|
| Répertoire complet municipalités | MAMH | https://www.mamh.gouv.qc.ca/organisation-municipale/organisation-territoriale/municipalites/ | HTML + CSV |
| Finances municipales | MAMH | https://www.mamh.gouv.qc.ca/finances-et-fiscalite/information-financiere-des-organismes-municipaux/donnees-financieres-des-municipalites/ | CSV |
| Rôles d'évaluation | MAMH | https://www.mamh.gouv.qc.ca/evaluation-fonciere/role-evaluation/ | HTML |
| Règlements municipaux | MAMH | https://www.mamh.gouv.qc.ca/amenagement-du-territoire/amenagement-et-urbanisme/ | HTML |
| Consultations publiques municipales | MAMH / OCPM | https://ocpm.qc.ca/fr/consultations | HTML |
| Plans d'urbanisme | Municipalités (variable) | URL propre à chaque ville | HTML/PDF |

### Grandes villes — Sources directes

| Ville | Données ouvertes | Conseil municipal | Budget |
|-------|-----------------|-------------------|--------|
| Montréal | https://donnees.montreal.ca/ | https://montreal.ca/conseil-municipal | https://montreal.ca/budget |
| Québec | https://www.ville.quebec.qc.ca/gens-affaires/donnees-ouvertes/ | https://www.ville.quebec.qc.ca/citoyens/conseil-municipal/ | https://www.ville.quebec.qc.ca/gens-affaires/budget/ |
| Laval | https://www.laval.ca/Pages/Fr/Citoyens/donnees-ouvertes.aspx | https://www.laval.ca/Pages/Fr/Ville/conseil-municipal.aspx | https://www.laval.ca/Pages/Fr/Ville/budget.aspx |
| Longueuil | https://www.longueuil.quebec/fr/donnees-ouvertes | https://www.longueuil.quebec/fr/conseil | https://www.longueuil.quebec/fr/budget |
| Gatineau | https://www.gatineau.ca/portail/default.aspx?p=guichet_municipal/donnees_ouvertes | https://www.gatineau.ca/portail/default.aspx?p=conseil_municipal | https://www.gatineau.ca/portail/default.aspx?p=budget |
| Sherbrooke | https://www.sherbrooke.ca/fr/administration-municipale/donnees-ouvertes | https://www.sherbrooke.ca/fr/administration-municipale/conseil-municipal | https://www.sherbrooke.ca/fr/administration-municipale/budget |
| Lévis | https://www.ville.levis.qc.ca/ville-et-services/donnees-ouvertes/ | https://www.ville.levis.qc.ca/ville-et-services/conseil-municipal/ | https://www.ville.levis.qc.ca/ville-et-services/budget/ |
| Trois-Rivières | https://www.v3r.net/transparence/donnees-ouvertes | https://www.v3r.net/administration/conseil-municipal | https://www.v3r.net/transparence/budget |
| Saguenay | https://www.saguenay.ca/fr/donnees-ouvertes | https://www.saguenay.ca/fr/conseil-municipal | https://www.saguenay.ca/fr/budget |
| Terrebonne | https://www.ville.terrebonne.qc.ca/donnees-ouvertes | https://www.ville.terrebonne.qc.ca/conseil-municipal | https://www.ville.terrebonne.qc.ca/budget |

---

## NIVEAU 5 — ARRONDISSEMENTS / QUARTIERS

### Montréal (19 arrondissements)

| Catégorie | Source | URL | Format |
|-----------|--------|-----|--------|
| Liste des arrondissements | Montréal | https://montreal.ca/arrondissements | HTML |
| Limites arrondissements | Données Montréal | https://donnees.montreal.ca/dataset/limites-administratives-agglomeration | GeoJSON |
| Élus par arrondissement | Montréal | https://montreal.ca/conseil-municipal/membres | HTML |
| Budgets arrondissements | Montréal | https://montreal.ca/budget | PDF |
| Projets par arrondissement | Montréal | https://montreal.ca/projets | HTML |
| Consultations par arrondissement | OCPM | https://ocpm.qc.ca/fr/consultations | HTML |

### Laval (pas d'arrondissements — niveau 5 vide)
Laval est une ville unifiée sans arrondissements. Le niveau 5 est vide pour Laval. On passe directement au niveau 6 (districts municipaux + circonscriptions).


---

## NIVEAU 6 — DISTRICTS / CIRCONSCRIPTIONS

### Districts municipaux

| Catégorie | Source | URL | Format |
|-----------|--------|-----|--------|
| Districts municipaux Montréal | Élections Montréal | https://election.montreal.ca/fr/districts | HTML + GeoJSON |
| Districts municipaux Québec | Ville de Québec | https://www.ville.quebec.qc.ca/citoyens/conseil-municipal/districts/ | HTML |
| Districts municipaux Laval | Ville de Laval | https://www.laval.ca/Pages/Fr/Citoyens/districts-electoraux.aspx | HTML |
| Résultats élections municipales | DGEQ | https://www.electionsmunicipales.gouv.qc.ca/resultats.html | HTML + CSV |

### Circonscriptions provinciales

| Catégorie | Source | URL | Format |
|-----------|--------|-----|--------|
| Liste complète (125 circ.) | DGEQ | https://www.dgeq.org/circonscriptions.html | HTML |
| Limites géographiques | Données QC | https://www.donneesquebec.ca/recherche/dataset/circonscriptions-electorales-provinciales | GeoJSON |
| Député par circonscription | ANQ | https://www.assnat.qc.ca/fr/deputes/index.html | HTML |
| Résultats par circonscription | DGEQ | https://www.dgeq.org/resultats.html | CSV |
| Historique électoral | DGEQ | https://www.dgeq.org/historique-elections.html | HTML |

### Circonscriptions fédérales

| Catégorie | Source | URL | Format |
|-----------|--------|-----|--------|
| Liste complète (338 circ.) | Élections Canada | https://www.elections.ca/content.aspx?section=res&dir=cir/list&document=index&lang=f | HTML |
| Limites géographiques | Élections Canada | https://open.canada.ca/data/fr/dataset/48f10fb9-78a2-43a9-8b9a-ef5e00055c8f | GeoJSON/SHP |
| Député par circonscription | Chambre des communes | https://www.noscommunes.ca/membres/fr/recherche | HTML |
| Résultats par circonscription | Élections Canada | https://www.elections.ca/content.aspx?section=res&dir=rep/off&document=index&lang=f | CSV |

---

## SOURCES PAR CATÉGORIE DE DONNÉES

### Population et statistiques

| Indicateur | Source | URL | Fréquence |
|------------|--------|-----|-----------|
| Population totale | StatCan recensement 2021 | https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm | 5 ans |
| Densité | StatCan | https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm | 5 ans |
| Revenu médian | StatCan | https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm | 5 ans |
| Taux de chômage | StatCan EERH | https://www150.statcan.gc.ca/n1/fr/subjects-sujets/labour-travail | mensuel |
| Langue | StatCan | https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm | 5 ans |
| Scolarité | StatCan | https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm | 5 ans |
| Logement | StatCan | https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm | 5 ans |
| Indice de défavorisation | ISQ | https://statistique.quebec.ca/fr/document/indice-de-defavorisation-materielle-et-sociale | 5 ans |
| Profils régionaux | ISQ | https://statistique.quebec.ca/fr/document/profil-statistique-regions-mrc-municipalites | annuel |

### Institutions — Éducation

| Type | Source | URL | Format |
|------|--------|-----|--------|
| Écoles primaires et secondaires | MEES | https://www.education.gouv.qc.ca/references/publications/resultats-de-la-recherche/detail/article/repertoire-des-etablissements/ | CSV |
| Résultats scolaires | MEES | https://www.education.gouv.qc.ca/references/publications/ | HTML + CSV |
| Taux de diplomation | MEES | https://www.education.gouv.qc.ca/references/publications/resultats-de-la-recherche/ | HTML |
| Centres de services scolaires | MEES | https://www.education.gouv.qc.ca/references/publications/resultats-de-la-recherche/detail/article/centres-de-services-scolaires/ | HTML |
| Cégeps | MEES | https://www.education.gouv.qc.ca/colleges/cegeps/ | HTML |
| Universités | MEES | https://www.education.gouv.qc.ca/universites/liste-des-etablissements/ | HTML |

### Institutions — Santé

| Type | Source | URL | Format |
|------|--------|-----|--------|
| CLSC | MSSS | https://www.msss.gouv.qc.ca/professionnels/repertoire-des-ressources/ | HTML + CSV |
| Hôpitaux | MSSS | https://www.msss.gouv.qc.ca/reseau/index.php | HTML |
| GMF | MSSS | https://www.msss.gouv.qc.ca/professionnels/gmf/liste-gmf/ | HTML |
| CISSS / CIUSSS (9 régions) | MSSS | https://www.msss.gouv.qc.ca/reseau/cisss-ciusss/ | HTML |
| Délais d'attente urgences | MSSS | https://www.msss.gouv.qc.ca/professionnels/statistiques-donnees-sante-bien-etre/statistiques-sur-les-services-relatifs-aux-personnes-agees/ | HTML |
| Médecins par région | MSSS / CMQ | https://www.cmq.org/page/fr/trouver-un-medecin.aspx | HTML |

### Finances et budgets

| Type | Source | URL | Format |
|------|--------|-----|--------|
| Finances municipales détaillées | MAMH | https://www.mamh.gouv.qc.ca/finances-et-fiscalite/information-financiere-des-organismes-municipaux/donnees-financieres-des-municipalites/ | CSV |
| Taux de taxation foncière | MAMH | https://www.mamh.gouv.qc.ca/finances-et-fiscalite/fiscalite-municipale/ | HTML + CSV |
| Subventions aux municipalités | MAMH | https://www.mamh.gouv.qc.ca/finances-et-fiscalite/programmes-daide-financiere/ | HTML |
| Contrats municipaux | SEAO | https://www.seao.ca/ | HTML |
| Transferts fédéraux | Finances Canada | https://www.canada.ca/fr/ministere-finances/nouvelles/2024/transferts.html | HTML |
| Dépenses infrastructure | Infrastructure Canada | https://www.infrastructure.gc.ca/prog/index-fra.html | HTML |

### Projets et consultations

| Type | Source | URL | Format |
|------|--------|-----|--------|
| Consultations BAPE | BAPE | https://www.bape.gouv.qc.ca/fr/consultations/ | HTML |
| Consultations OCPM (Montréal) | OCPM | https://ocpm.qc.ca/fr/consultations | HTML |
| Projets infrastructure | Infrastructure Canada | https://www.infrastructure.gc.ca/prog/index-fra.html | HTML |
| Appels d'offres publics | SEAO | https://www.seao.ca/ | HTML |
| Plans directeurs | Municipalités (variable) | URL propre à chaque ville | PDF/HTML |
| Registres d'urbanisme | Municipalités | Variable par ville | HTML |

### Enjeux — Sources thématiques

| Enjeu | Source nationale | Source provinciale | URL |
|-------|-----------------|-------------------|-----|
| Logement | SCHL | SHQ | https://www.schl.ca/fr + https://www.habitation.gouv.qc.ca/ |
| Transport | Transports Canada | MTQ | https://tc.canada.ca/fr + https://www.transports.gouv.qc.ca/ |
| Environnement | ECCC | MELCCFP | https://www.canada.ca/fr/environnement-changement-climatique + https://www.environnement.gouv.qc.ca/ |
| Santé | Santé Canada | MSSS | https://www.canada.ca/fr/sante-canada + https://www.msss.gouv.qc.ca/ |
| Éducation | EDSC | MEES | https://www.canada.ca/fr/emploi-developpement-social + https://www.education.gouv.qc.ca/ |
| Sécurité publique | Sécurité publique Canada | MSP QC | https://www.securitepublique.gc.ca/fr + https://www.securitepublique.gouv.qc.ca/ |
| Fiscalité | ARC | Revenu QC | https://www.canada.ca/fr/agence-revenu + https://www.revenuquebec.ca/ |
| Infrastructure | Infrastructure Canada | MTQ | https://www.infrastructure.gc.ca/fr + https://www.transports.gouv.qc.ca/ |

---

## SOURCES GÉOSPATIALES (PRIORITÉ HAUTE)

| Couche | Source | URL | Format | Usage |
|--------|--------|-----|--------|-------|
| Limites Canada | StatCan | https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/index2021-fra.cfm | GeoJSON/SHP | Niveau 1 |
| Limites provinces | StatCan | https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/index2021-fra.cfm | GeoJSON/SHP | Niveau 1 |
| Limites régions adm. QC | Données QC | https://www.donneesquebec.ca/recherche/dataset/regions-administratives | GeoJSON | Niveau 2 |
| Limites MRC | Données QC | https://www.donneesquebec.ca/recherche/dataset/mrc | GeoJSON | Niveau 3 |
| Limites municipalités | Données QC | https://www.donneesquebec.ca/recherche/dataset/decoupage-municipal | GeoJSON | Niveau 4 |
| Limites arrondissements MTL | Données Montréal | https://donnees.montreal.ca/dataset/limites-administratives-agglomeration | GeoJSON | Niveau 5 |
| Limites circ. provinciales | Données QC / DGEQ | https://www.donneesquebec.ca/recherche/dataset/circonscriptions-electorales-provinciales | GeoJSON | Niveau 6 |
| Limites circ. fédérales | Élections Canada | https://open.canada.ca/data/fr/dataset/48f10fb9-78a2-43a9-8b9a-ef5e00055c8f | GeoJSON/SHP | Niveau 6 |
| Adresses QC | Données QC | https://www.donneesquebec.ca/recherche/dataset/adresses-du-quebec | CSV/GeoJSON | Géocodage |
| Fond de carte | OpenStreetMap | https://www.openstreetmap.org | Tuiles | Carte Leaflet |
| Géocodage | Nominatim (OSM) | https://nominatim.openstreetmap.org/ | JSON API | Coordonnées |

---

## FRÉQUENCE DE MISE À JOUR PAR TYPE DE DONNÉE

| Type | Fréquence recommandée | Source principale |
|------|----------------------|-------------------|
| Élus (après élection) | Immédiatement après scrutin | DGEQ / Chambre des communes / ANQ |
| Population | Tous les 5 ans (recensement) | StatCan |
| Budget municipal | Annuel (automne) | MAMH / Ville |
| Contrats publics | Continue | SEAO |
| Projets en cours | Trimestriel | Ville / Ministères |
| Consultations | Continue | BAPE / OCPM / Villes |
| Statistiques socioéconomiques | Annuel | ISQ / StatCan |
| Limites territoriales | Rare (fusion/séparation) | MAMH / DGEQ |
| Institutions (ouvertures/fermetures) | Semestriel | MEES / MSSS |

---

## ORDRE D'INGESTION RECOMMANDÉ (POUR CLAUDE CODE)

ÉTAPE 1 — Géographie (avant tout le reste)
→ Télécharger tous les GeoJSON de limites territoriales
→ Créer les squelettes de territoire avec coordonnées

ÉTAPE 2 — Identité administrative
→ MAMH : liste officielle municipalités + MRC + régions
→ StatCan : codes géographiques officiels
→ Créer les codes TERRITOIRE_XXXX

ÉTAPE 3 — Population
→ StatCan recensement 2021 par territoire
→ ISQ profils régionaux

ÉTAPE 4 — Représentants
→ ANQ : 125 députés provinciaux
→ Chambre des communes : députés fédéraux (Québec)
→ MAMH : maires et conseillers municipaux

ÉTAPE 5 — Circonscriptions
→ DGEQ : limites provinciales + résultats
→ Élections Canada : limites fédérales + résultats

ÉTAPE 6 — Institutions
→ MEES : écoles par territoire
→ MSSS : établissements santé par territoire
→ MAMH : services municipaux

ÉTAPE 7 — Finances
→ MAMH : données financières municipales
→ Villes directement : budgets

ÉTAPE 8 — Projets et consultations
→ BAPE / OCPM / Villes
→ SEAO : contrats publics

ÉTAPE 9 — Statistiques socioéconomiques
→ StatCan profils complets
→ ISQ indicateurs régionaux

ÉTAPE 10 — Validation et liens
→ Vérifier que chaque entité est reliée à un territoire
→ Détecter les champs NULL
→ Envoyer les conflits vers INBOX

---

## NOTES IMPORTANTES

*Licences* : toutes ces sources sont en accès public. Les données ouvertes gouvernementales canadiennes et québécoises sont sous licence ouverte (Licence du gouvernement ouvert — Canada, Licence ouverte Québec).

*Stabilité des URLs* : les URLs gouvernementales peuvent changer lors de refonte de sites. En cas d'URL morte → chercher sur donneesquebec.ca ou ouvert.canada.ca avec les mots-clés du dataset.

*Robots.txt* : toujours vérifier le fichier robots.txt d'un site avant de scraper. Les données ouvertes (CSV, API, GeoJSON) n'ont jamais de restriction de scraping.

*Priorité absolue* : API et CSV structurés > HTML scraping. Le HTML est un dernier recours.
