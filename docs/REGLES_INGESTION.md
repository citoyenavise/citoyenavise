# RÈGLES D'INGESTION — citoyenavise.org
Protocole absolu que Claude Code doit suivre pour remplir les fiches territoire.
Version 1.0 — 2026-06-23
Ces règles ont priorité sur toute instruction contraire. Elles ne s'adaptent pas au contexte.


---

## PRINCIPE FONDATEUR

Le territoire est l'unité fondamentale du système.
Toute information ingérée doit être rattachée à un territoire parent avant d'être insérée.
Une information sans territoire va dans l'INBOX. Elle n'est jamais insérée directement dans une fiche.

---

## LES 3 PASSES — ORDRE ABSOLU

PASS 1 → STRUCTURE      (squelette vide)
PASS 2 → INGESTION      (données brutes classées)
PASS 3 → SYNTHÈSE       (liens, cohérence, validation)

Ces 3 passes ne se mélangent jamais.
Claude Code ne peut pas passer à la PASS 2 si la PASS 1 n'est pas confirmée complète.
Claude Code ne peut pas passer à la PASS 3 si toutes les catégories de la PASS 2 ne sont pas traitées.

---

## PASS 1 — STRUCTURE

### Objectif
Créer le fichier territoire avec toutes les sections vides.
Aucune donnée. Aucun contenu. Structure uniquement.

### Commande type
PASS 1 — Créer squelette
Territoire : [NOM]
Code : TERRITOIRE_XXXX
Niveau : [1 à 6]
Parent : TERRITOIRE_XXXX
Template : TERRITOIRE_TEMPLATE.md

### Règles PASS 1
- Copier le TERRITOIRE_TEMPLATE.md sans modifier la structure.
- Remplir uniquement : Code, Nom, Niveau, Territoire parent, Date de création.
- Tous les autres champs = vides (ne pas écrire NULL, ne pas écrire « À compléter »).
- Le fichier est créé. La PASS 1 est terminée.

### Validation PASS 1
Claude Code doit confirmer :
✅ PASS 1 COMPLÈTE
Fichier : TERRITOIRE_XXXX_[NOM].md
Sections créées : 13
Données insérées : 0
Prêt pour PASS 2.

---

## PASS 2 — INGESTION

### Objectif
Remplir le fichier territoire catégorie par catégorie.
Une seule catégorie par commande. Jamais deux à la fois.

### Commande type
PASS 2 — Ingestion
Territoire : [NOM]
Catégorie : [UNE SEULE CATÉGORIE]
Source : [URL EXACTE depuis SOURCES_OFFICIELLES.md]

### Catégories dans l'ordre d'ingestion

| Ordre | Catégorie | Source principale |
|-------|-----------|------------------|
| 1 | GÉOGRAPHIE | Données QC / StatCan GeoJSON |
| 2 | IDENTITÉ administrative | MAMH / StatCan codes |
| 3 | POPULATION | StatCan recensement 2021 |
| 4 | REPRÉSENTANTS | ANQ / Chambre des communes / MAMH |
| 5 | CIRCONSCRIPTIONS | DGEQ / Élections Canada |
| 6 | INSTITUTIONS — Éducation | MEES |
| 7 | INSTITUTIONS — Santé | MSSS |
| 8 | INSTITUTIONS — Services | MAMH / Ville |
| 9 | INSTITUTIONS — Organismes | SACAIS / Ville |
| 10 | FINANCES | MAMH / Budget ville |
| 11 | PROJETS | Ville / SEAO |
| 12 | DÉCISIONS | ANQ / Conseil municipal |
| 13 | CONSULTATIONS | BAPE / OCPM / Ville |
| 14 | STATISTIQUES | StatCan / ISQ |
| 15 | ENJEUX | Sources thématiques |

### Règles PASS 2 — ABSOLUES

*RÈGLE 1 — Une catégorie = une commande = une sortie.*
Claude Code traite une catégorie. Produit le contenu de cette section. S'arrête.
Jamais deux catégories dans la même commande.

*RÈGLE 2 — Toute donnée doit avoir une source.*
Format obligatoire pour chaque entrée :
[Donnée] | Source : [URL] | Année : [AAAA]
Si la source est absente : la donnée n'est pas insérée.

*RÈGLE 3 — Donnée absente = champ vide.*
Si une donnée n'est pas trouvée dans les sources officielles :
- Ne pas inventer.
- Ne pas estimer.
- Ne pas interpoler.
- Laisser le champ vide.

*RÈGLE 4 — Donnée incertaine = INBOX.*
Si Claude Code n'est pas certain à 100% de l'exactitude d'une donnée :
INBOX → [NOM TERRITOIRE] → [CATÉGORIE] → [DONNÉE] → [RAISON DE L'INCERTITUDE]

*RÈGLE 5 — Conflit entre sources = INBOX.*
Si deux sources officielles donnent des informations contradictoires :
INBOX → [NOM TERRITOIRE] → [CATÉGORIE] → CONFLIT
Source A : [URL] → [VALEUR A]
Source B : [URL] → [VALEUR B]
Action requise : arbitrage opérateur

*RÈGLE 6 — Jamais de synthèse en PASS 2.*
Claude Code ne doit pas :
- Résumer
- Analyser
- Commenter
- Relier des entités entre elles
- Détecter des tendances
Uniquement : classer les données dans les bonnes sections.

*RÈGLE 7 — Jamais écrire hors de la section cible.*
Si la donnée appartient à une autre section que celle en cours :
- Ne pas l'insérer dans la section en cours.
- La mettre dans l'INBOX avec la mention de la bonne section.

*RÈGLE 8 — Confirmer après chaque catégorie.*
À la fin de chaque ingestion, Claude Code produit :
CHECKLIST INGESTION
─────────────────────────────
Territoire     : [NOM]
Catégorie      : [CATÉGORIE]
Source utilisée: [URL]
Données ajoutées : [N]
Champs vides   : [N]
Éléments → INBOX : [N]
Aucun doublon  : ✅ / ⚠️
Aucune invention: ✅ / ⚠️
Aucune synthèse : ✅ / ⚠️
─────────────────────────────
Prêt pour catégorie suivante : [CATÉGORIE SUIVANTE]

---

## PASS 3 — SYNTHÈSE

### Objectif
Relier les entités, détecter les incohérences, créer les liens internes.
Aucune nouvelle donnée n'est ajoutée en PASS 3.

### Commande type
PASS 3 — Synthèse
Territoire : [NOM]
Action : [validation / liens / cohérence / détecter trous]

### Ce que Claude Code PEUT faire en PASS 3
- Relier les représentants à leur territoire (lien REPRESENTANT_XXXX → TERRITOIRE_XXXX).
- Relier les institutions à leur territoire.
- Détecter les champs encore vides après PASS 2.
- Détecter les doublons.
- Détecter les incohérences internes (ex. élu dont la circonscription ne correspond pas au territoire).
- Marquer le niveau de complétude de la fiche (0 % → 100 %).
- Envoyer les problèmes détectés vers l'INBOX.

### Ce que Claude Code NE PEUT PAS faire en PASS 3
- Inventer des données pour combler les trous.
- Ajouter des données non présentes en PASS 2.
- Modifier des données déjà insérées sans source.
- Émettre des opinions sur les données.

### Validation PASS 3
RAPPORT SYNTHÈSE
─────────────────────────────
Territoire     : [NOM]
Complétude     : [XX %]
Liens créés    : [N]
Doublons détectés : [N]
Incohérences   : [N]
Éléments → INBOX : [N]
Champs vides restants : [N] (liste)
─────────────────────────────
Fiche prête pour publication : OUI / NON
Si NON → raisons listées

---

## RÈGLES GLOBALES — TOUJOURS ACTIVES

### Le territoire d'abord
Avant toute insertion, Claude Code répond mentalement :
« À quel territoire appartient cette information ? »


Si territoire trouvé → insérer dans le bon territoire.
Si territoire non trouvé → INBOX immédiatement.

### L'INBOX
L'INBOX est une section dans chaque fiche territoire ET un fichier central INBOX_GLOBAL.md.

Tout élément qui ne peut pas être classé directement va dans l'INBOX.
L'INBOX n'est jamais ignorée. Elle est traitée par l'opérateur humain.

Format d'entrée INBOX :
DATE     : [JJ-MM-AAAA]
TERRITOIRE : [NOM ou INCONNU]
CATÉGORIE  : [CATÉGORIE ou INCONNUE]
DONNÉE    : [description de l'information]
SOURCE    : [URL ou INCONNUE]
RAISON    : [doublon / conflit / territoire inconnu / source manquante / incertitude]
ACTION    : [classer / valider / rejeter / arbitrer]

### Sources
Claude Code ne consulte que les sources listées dans SOURCES_OFFICIELLES.md.
Toute source non listée est refusée sauf instruction explicite de l'opérateur.
Si une URL est inaccessible → INBOX avec note « URL inaccessible le [DATE] ».

### Intégrité des données
| Situation | Action |
|-----------|--------|
| Donnée trouvée, source fiable | Insérer avec source + année |
| Donnée trouvée, source non listée | INBOX |
| Donnée non trouvée | Champ vide |
| Donnée contradictoire | INBOX — conflit |
| Donnée incertaine | INBOX — incertitude |
| Donnée inventée | INTERDIT |
| Donnée estimée | INTERDIT |

### Doublons
Si une donnée est déjà présente dans la fiche :
- Ne pas écraser.
- Comparer les deux versions.
- Si identiques → conserver, ignorer le doublon.
- Si différentes → INBOX — conflit.

### Jamais en même temps
Claude Code ne fait jamais simultanément :
- Deux catégories d'ingestion.
- Une ingestion et une synthèse.
- Une création de squelette et une ingestion.

---

## FLUX D'INGESTION COMPLET (résumé)

SOURCES_OFFICIELLES.md
        ↓
    Téléchargement
        ↓
    PASS 1 — Squelette vide
        ↓
    PASS 2 — Géographie
        ↓ CHECKLIST ✅
    PASS 2 — Identité
        ↓ CHECKLIST ✅
    PASS 2 — Population
        ↓ CHECKLIST ✅
    PASS 2 — Représentants
        ↓ CHECKLIST ✅
    PASS 2 — Circonscriptions
        ↓ CHECKLIST ✅
    PASS 2 — Institutions (x4)
        ↓ CHECKLIST ✅
    PASS 2 — Finances
        ↓ CHECKLIST ✅
    PASS 2 — Projets
        ↓ CHECKLIST ✅
    PASS 2 — Décisions
        ↓ CHECKLIST ✅
    PASS 2 — Consultations
        ↓ CHECKLIST ✅
    PASS 2 — Statistiques
        ↓ CHECKLIST ✅
    PASS 2 — Enjeux
        ↓ CHECKLIST ✅
    PASS 3 — Synthèse
        ↓ RAPPORT ✅
    Fiche publiée OU INBOX si incomplète

---

## PRIORITÉ D'INGESTION — ORDRE DES TERRITOIRES

Suivre exactement les phases définies dans SYNTHESE_V3.md §25.4.

PHASE 1 (maintenant)
→ TERRITOIRE_0001_Canada
→ TERRITOIRE_0002_Quebec_Province
→ TERRITOIRE_0003 à 0019 — 17 régions administratives

PHASE 2 (après validation Phase 1)
→ 10 grandes villes
   Montréal, Québec, Laval, Longueuil, Gatineau,
   Sherbrooke, Lévis, Trois-Rivières, Saguenay, Terrebonne

PHASE 3 (après validation Phase 2)
→ Toutes les MRC (~97)
→ Toutes les municipalités (~1100)

PHASE 4
→ Arrondissements
→ Quartiers officiels
→ Secteurs reconnus
→ Niveau 5 vide si territoire sans quartiers officiels

PHASE 5
→ Districts municipaux
→ Circonscriptions provinciales (125)
→ Circonscriptions fédérales (78 au Québec)

Ne jamais sauter une phase.
Ne jamais commencer une phase si la précédente n'est pas validée par l'opérateur.

---

## COMMANDES TYPES POUR CLAUDE CODE

### Démarrer une fiche
Lance PASS 1 pour le territoire suivant :
Nom : Québec (Province)
Niveau : 1
Parent : Canada (TERRITOIRE_0001)
Template : /citoyenavise/docs/TERRITOIRE_TEMPLATE.md

### Ingérer une catégorie
Lance PASS 2 — catégorie REPRÉSENTANTS
Territoire : Québec Province (TERRITOIRE_0002)
Source : https://www.assnat.qc.ca/fr/deputes/index.html
Extraire : nom, circonscription, parti, photo URL, date entrée en fonction

### Lancer la synthèse
Lance PASS 3 — Synthèse complète
Territoire : Québec Province (TERRITOIRE_0002)
Vérifier : liens représentants, institutions, cohérence interne
Produire : rapport de complétude + liste INBOX

### Traiter l'INBOX
Traite l'INBOX du territoire : Québec Province
Affiche tous les éléments en attente
Pour chaque élément : propose une action (classer / valider / rejeter)
Attends confirmation opérateur avant toute action

---

## VIOLATIONS — CE QUI DÉCLENCHE UN ARRÊT IMMÉDIAT

Si Claude Code détecte l'une de ces situations, il s'arrête et signale à l'opérateur :

| Violation | Signal |
|-----------|--------|
| Donnée inventée détectée | 🔴 ARRÊT — INVENTION DÉTECTÉE |
| Source non listée utilisée | 🔴 ARRÊT — SOURCE NON AUTORISÉE |
| Deux catégories mélangées | 🔴 ARRÊT — MÉLANGE DE CATÉGORIES |
| Synthèse pendant PASS 2 | 🔴 ARRÊT — SYNTHÈSE PRÉMATURÉE |
| Territoire parent absent | 🔴 ARRÊT — TERRITOIRE PARENT MANQUANT |
| PASS 2 sans PASS 1 validée | 🔴 ARRÊT — PASS 1 NON CONFIRMÉE |
| PASS 3 sans PASS 2 complète | 🔴 ARRÊT — PASS 2 INCOMPLÈTE |

---

*Fin des règles d'ingestion — V1.0*
*Ces règles sont permanentes. Toute modification doit être approuvée par M. Fortin et consignée dans SYNTHESE_V3.md §22.*
