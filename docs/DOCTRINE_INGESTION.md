# DOCTRINE D'INGESTION — citoyenavise.org
Principe directeur : **maximum de données publiques récupérées, minimum de tokens consommés.**
Version 1.0 — 2026-06-23 — directive M. Fortin
S'applique à toute collecte de données (territoires, élus, finances, institutions).
Complète REGLES_INGESTION.md (intégrité) et PIPELINE_INGESTION.md (outils).


---

## ARCHITECTURE EN 4 COUCHES

### Couche 1 — Sources officielles (PRIORITÉ ABSOLUE)

Toujours commencer ici. Raison : données fiables, peu de recherche, peu de tokens, peu d'hallucinations.

Méthode : **1 requête → 1 source officielle → extraction structurée.**
Jamais : 10 recherches Google pour une information disponible directement à la source.

Sources officielles de référence :
- Assemblée nationale du Québec
- Chambre des communes
- Élections Canada
- Directeur général des élections du Québec (DGEQ)
- Municipalités
- MRC
- Régions administratives
- Données Québec
- Statistique Canada
- Conseil du Trésor
- SEAO
- Registre des entreprises du Québec (REQ)
- Gazette officielle du Québec

(URLs exactes : SOURCES_OFFICIELLES.md — canon d'ingestion.)

### Couche 2 — Extraction ciblée

Toujours formuler : **ENTITÉ + INFORMATION**. Plus la requête est précise, moins de pages ouvertes, moins de tokens, meilleur résultat.

| ✅ Faire | ❌ Éviter |
|---------|----------|
| « Laval budget 2025 » | « Parle-moi de Laval » |
| « Laval contrats 2025 » | « Trouve les projets municipaux de Laval » |
| « Laval conseil municipal » | « Analyse le site complet de Laval » |
| « Laval consultations publiques » | recherche large non bornée |

Règle d'extraction : demander **uniquement les champs voulus** (maire, conseillers, budget total, projets actifs, consultations), pas « analyse tout le site ». Claude lit alors quelques pages au lieu de centaines.

### Couche 3 — Outils de recherche/scraping

| Niveau | Outil | Usage | Statut dans le projet |
|--------|-------|-------|-----------------------|
| 1 | **Firecrawl** | Scrape propre → markdown, extraction rapide (villes, élus, budgets, pages gouv.) | À provisionner (clé API / VPS) |
| 2 | **Jina Reader** | `https://r.jina.ai/https://cible` → page nettoyée, presque aucun bruit, très peu de tokens | ✅ Utilisable maintenant via `curl` (sans clé) |
| 3 | **Tavily** | Recherche web intelligente multi-sources, bon ratio coût/résultat | À provisionner (clé API) |
| 4 | **Exa** | Trouver vite des documents précis (rapports, PDF, docs gouvernementaux) | À provisionner (clé API) |

En attendant le provisionnement : combiner `curl` + API CKAN Données Québec (Canal A), WFS GeoJSON (Canal B), Jina Reader via `curl` (Couche 3 niv. 2) et WebFetch (Canal C). Cf. PIPELINE_INGESTION.md.

### Couche 4 — Base de connaissance (le vrai gain)

**Ne jamais refaire une recherche.** Quand une donnée est trouvée (élu, ville, budget, institution) → la sauvegarder. Recherche 1 fois, utilisation 100 fois.

Cible : stockage brut en **PostgreSQL** + recherche sémantique **Qdrant**. En attendant : sauvegarde dans les fiches territoire (`territoires/`) + INBOX pour le brut non validé.

---

## STACK CIBLE (VPS)

| Composant | Rôle | Statut |
|-----------|------|--------|
| Firecrawl | Scraping | À provisionner |
| PostgreSQL | Stockage | ✅ en prod (Neon) — VPS à confirmer |
| Qdrant | Recherche sémantique | À provisionner |
| N8N | Automatisation des collecteurs | À provisionner |
| Claude Code | Analyse / orchestration | ✅ en main |
| Obsidian | Documentation | Local M. Fortin |

Principe : suffisant et non sur-complexe. Objectif final : ingérer les 1200+ municipalités du Québec puis le Canada, au meilleur rapport coût / tokens / qualité / automatisation.

---

## MÉTHODE D'INGESTION (6 ÉTAPES)

1. **Identifier** le territoire (ex. Laval).
2. **Créer** la fiche territoire (PASS 1 — squelette, cf. REGLES_INGESTION.md).
3. **Lancer les collecteurs** ciblés : élus, budget, projets, contrats, institutions.
4. **Stockage brut** (jamais directement dans la fiche/Obsidian — d'abord brut, puis validé).
5. **Validation**.
6. **Publication** dans la fiche territoire (PASS 3 — synthèse).

Cette méthode est cohérente avec les 3 passes : étape 2 = PASS 1 ; étapes 3-4 = PASS 2 (ingestion brute par catégorie) ; étapes 5-6 = PASS 3 (validation + publication).

---

## RÈGLE TOKENS — RÉSUMÉ OPÉRATOIRE

1. Source officielle d'abord, 1 requête ciblée.
2. Requête = ENTITÉ + INFORMATION.
3. Extraire seulement les champs demandés.
4. Nettoyer la page (Jina/Firecrawl) avant de lire — moins de bruit, moins de tokens.
5. Sauvegarder pour ne jamais refaire la recherche.
6. Donnée absente → champ vide / INBOX. Jamais d'invention (REGLES_INGESTION.md).

---

## JOURNAL

| Date | Auteur | Modification |
|------|--------|--------------|
| 2026-06-23 | Opérateur | Création V1 — doctrine 4 couches (directive M. Fortin) : sources officielles d'abord, extraction ciblée ENTITÉ+INFORMATION, outils Firecrawl/Jina/Tavily/Exa, base de connaissance PostgreSQL/Qdrant. Méthode 6 étapes alignée sur les 3 passes. Jina Reader notée utilisable immédiatement via curl. |

---

*Fin de la doctrine d'ingestion — V1.*
