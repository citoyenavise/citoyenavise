# DOCUMENT DE DÉCISION — Q6 (PILOTE GÉOGRAPHIQUE) + O5 (MÉTRIQUES DE SUCCÈS MVP)

> **Date** : 2026-05-14
> **Statut** : Décision en cours
> **Décideur** : M. Fortin
> **Référence synthèse** : §23 (questions ouvertes) + §16 (priorités)
> **Pré-requis** : MVP citoyenavise.org en production (Phase E terminée)

---

## 0. POURQUOI MAINTENANT

Le MVP est techniquement en ligne, mais **rien ne peut avancer sereinement en Phase G** sans répondre à 2 questions :

1. **Q6** : où concentre-t-on les efforts ? (Quelle ville/province/pays ?)
2. **O5** : comment mesure-t-on le succès ? (Quels KPIs ? Quels seuils ?)

Sans ces 2 décisions :
- Aucune stratégie d'acquisition de données réaliste.
- Aucune stratégie de recrutement utilisateur ciblée.
- Aucun moyen objectif de juger si la Phase G fonctionne.
- Risque de **disperser les ressources** sur un périmètre trop large.

---

## 1. QUESTION Q6 — PRIORISATION GÉOGRAPHIQUE

### 1.1 Énoncé

Quelle stratégie géographique adopter pour lancer et faire grandir la plateforme citoyenavise.org ?

### 1.2 Vision long terme (synthèse §1.3)

> « Construire l'infrastructure civique numérique vivante du **Canada** »

→ La vision est **nationale**. La question est la **trajectoire** pour y arriver.

### 1.3 Options envisagées

#### Option A — Hyper-local (1 ville pilote)

**Exemples** : Québec, Sherbrooke, Trois-Rivières, Saguenay.

| Critère | Évaluation |
|---------|------------|
| Densité utilisateur potentielle | Très forte sur une zone restreinte |
| Acquisition de données | ~5-50 élus à cataloguer (municipal) |
| Effet réseau local | Très rapide (le voisin parle au voisin) |
| Modération | Simple (une seule communauté) |
| Cold start | Très court (Citizen Awakening System efficace) |
| Représentativité | Faible (1 ville ≠ Canada) |
| Risque de plafonnement | Élevé (saturation rapide) |
| Coût marketing | Très faible (canal local) |
| Temps avant signaux | 1-2 mois |

#### Option B — Provincial (1 province)

**Exemples** : Québec ou Ontario.

| Critère | Évaluation |
|---------|------------|
| Densité utilisateur potentielle | Bonne (population significative) |
| Acquisition de données | ~125-180 circonscriptions, ~1000 élus (QC) |
| Effet réseau | Régional, hétérogène |
| Modération | Modérée (1 cadre légal — Loi 25 ou LPRPDE) |
| Cold start | Modéré (plusieurs régions à amorcer) |
| Représentativité | Bonne pour la province |
| Plafond | Élevé (millions d'habitants) |
| Coût marketing | Modéré |
| Temps avant signaux | 3-6 mois |

**Variante B.1 — Québec** : alignement linguistique FR (mission), une seule loi (Loi 25), forte tradition civique, ~8 M habitants.
**Variante B.2 — Ontario** : marché anglophone, plus grand (~15 M), plus de pétitions en circulation, mais infra Brevo + DKIM actuellement orientée FR.

#### Option C — National d'emblée

**Exemple** : ouvrir 10 provinces + 3 territoires simultanément.

| Critère | Évaluation |
|---------|------------|
| Densité utilisateur | Très diluée |
| Acquisition de données | ~338 circonscriptions féd. + ~700 prov. + milliers d'élus municipaux |
| Effet réseau | Inexistant au début (utilisateurs isolés) |
| Modération | Complexe (cultures, langues, lois différentes) |
| Cold start | Très long et coûteux |
| Représentativité | Maximale dès le jour 1 |
| Plafond | Inexistant (cible totale) |
| Coût marketing | Très élevé |
| Temps avant signaux | 12-24 mois |

#### Option D — Bi-provincial (QC + ON)

**Exemple** : valider FR et EN simultanément, 2 marchés mais avec un effort réduit par marché.

| Critère | Évaluation |
|---------|------------|
| Densité | Modérée par province |
| Effort ressources | Doublé vs Option B |
| Bénéfice : validation bilingue | Précoce et précieux |
| Risque : dispersion | Réel |

### 1.4 Critères de décision pondérés

| Critère | Poids | A (ville) | B-QC | C (Canada) | D (QC+ON) |
|---------|-------|-----------|------|------------|-----------|
| Vitesse cold start (Citizen Awakening) | 25 % | 9/10 | 7/10 | 2/10 | 5/10 |
| Effort acquisition données | 20 % | 9/10 | 6/10 | 2/10 | 4/10 |
| Alignement mission long terme | 15 % | 4/10 | 7/10 | 10/10 | 8/10 |
| Effet réseau réel | 15 % | 9/10 | 6/10 | 2/10 | 4/10 |
| Complexité légale | 10 % | 8/10 | 7/10 | 3/10 | 5/10 |
| Plafond de croissance | 10 % | 4/10 | 8/10 | 10/10 | 9/10 |
| Coût marketing | 5 % | 9/10 | 7/10 | 3/10 | 5/10 |
| **TOTAL pondéré** | 100 % | **7,55** | **6,75** | **4,15** | **5,55** |

### 1.5 Recommandation pour Q6

**Option A — Hyper-local, ville pilote** ✅

**Choix recommandé : Québec (ville)**

Justifications :
1. **Citizen Awakening System** : le « cold start » est l'enjeu central. Une seule ville = densité maximale.
2. **Données acquérables rapidement** : ~21 conseillers municipaux + maire + députés provinciaux + député fédéral. Inventaire bouclable en 1-2 semaines.
3. **Effet boule de neige** : les Pionniers se reconnaissent, parlent entre eux, créent l'« éveil » documenté en §7.
4. **Mission FR-first** : Québec ville = francophone à 95 %, aligné avec ton SMTP, ton UI, ta culture produit.
5. **Tradition civique** : forte participation aux pétitions municipales (ex. consultations sur le tramway).
6. **Validation économe** : 1-2 mois pour des signaux clairs, vs 12-24 mois pour Option C.
7. **Migration future facile** : Phase H (NPKI national) peut commencer pendant la traction locale.

**Trajectoire suggérée** :
```
Mois 1-3   : Québec ville (Pionniers)
Mois 4-6   : Élargissement à Québec + Lévis + Saguenay (zone QC-Est)
Mois 7-12  : Province de Québec complète
Mois 13-24 : Ontario + autres provinces francophones (NB, MB, ON-Est)
Année 2+   : Pan-Canada (Phase H pleinement opérationnelle)
```

### 1.6 Implications opérationnelles si Option A retenue

| Domaine | Action |
|---------|--------|
| Seed des données | Cataloguer les ~25 élus de Québec ville + 5-6 circonscriptions féd./prov. |
| Marketing | Acquisition via réseaux locaux : universités Laval, ULaval, médias locaux (Le Soleil, Radio-Canada Québec) |
| Pétitions seed | 3-5 pétitions thématiques locales (transport, logement, environnement) |
| Modération | 1 personne (M. Fortin ou volontaire) suffit pour la phase pilote |
| Awakening System | Activer Brouillard civique sur la carte avec point d'origine = Québec |
| Tests utilisateurs | 10-20 Pionniers identifiés et invités personnellement |

---

## 2. QUESTION O5 — MÉTRIQUES DE SUCCÈS DU MVP

### 2.1 Énoncé

Quelles métriques utiliser pour juger objectivement si la plateforme « fonctionne » ?

### 2.2 Cadre proposé — Modèle HEART × FUNNEL

**HEART** (Google framework) :
- **H**appiness
- **E**ngagement
- **A**doption
- **R**etention
- **T**ask success

**FUNNEL** :
- Visiteur → Inscrit → Activé → Engagé → Rétenu

### 2.3 Métriques proposées par étape

#### Acquisition

| Métrique | Définition | Seuil MVP réussi (mois 3) |
|----------|------------|---------------------------|
| Visiteurs uniques / mois | Sessions distinctes | 1 000 |
| Inscriptions / mois | Comptes créés via Magic Link | 100 |
| Coût d'acquisition (CAC) | Si payant : € par inscrit | < 5 $ |
| Taux de conversion visiteur → inscrit | % | 10 % |

#### Activation

| Métrique | Définition | Seuil MVP |
|----------|------------|-----------|
| % inscrits complétant le profil | Code postal + langue | 70 % |
| Première action signifiante < 7 jours | Signature OU création pétition OU exploration carte | 50 % |
| Taux d'envoi Magic Link réussi | % emails reçus | 95 % |

#### Engagement

| Métrique | Définition | Seuil MVP |
|----------|------------|-----------|
| DAU (Daily Active Users) | Utilisateurs actifs / jour | 30 (≈ 3 % du base inscrits) |
| WAU (Weekly Active Users) | Actifs / 7 jours | 100 |
| Signatures de pétitions / semaine | Total | 50 |
| Pétitions créées / mois | Total | 5 |
| Visites de fiches élus / utilisateur / mois | Profondeur exploration | 3 |

#### Rétention

| Métrique | Définition | Seuil MVP |
|----------|------------|-----------|
| D7 retention | % revenus J+7 | 25 % |
| D30 retention | % revenus J+30 | 15 % |
| Sessions / utilisateur / mois | Fréquence | 4 |

#### Impact civique (qualité)

| Métrique | Définition | Seuil MVP |
|----------|------------|-----------|
| Pétitions > 50 signatures | Effet de levier réel | 2 |
| Pétitions adressées à un élu identifié | Couplage entité-action | 80 % des nouvelles |
| Engagements suivis | Promesses suivies par citoyens | 30 |
| Corrections de données | Contributions citoyennes | 10 / mois |

#### Qualité & sécurité

| Métrique | Définition | Seuil MVP |
|----------|------------|-----------|
| Incidents de modération | Spam, contenu inapproprié | < 5 / mois |
| Erreur 5xx backend | Robustesse | < 0,1 % requêtes |
| Disponibilité (uptime) | Render free tier honorable | > 99 % |
| Temps de chargement page principale | Performance perçue | < 2 s |

### 2.4 North Star Metric proposée

> **Citoyens ayant signé au moins 1 pétition dans les 30 derniers jours, dans Québec ville**

Pourquoi cette métrique ?
- **Capture l'engagement réel** : signer = action concrète, pas juste « inscription ».
- **Aligne mission** : participation citoyenne directe.
- **Mesurable en temps réel** : count distinct user_id sur table signatures avec date filter.
- **Croissance saine** : impossible de la faire monter sans (1) acquérir, (2) activer, (3) retenir.

**Seuils** :
- **MVP minimal** (mois 3) : 30 signataires actifs
- **Traction** (mois 6) : 150 signataires actifs
- **Product-Market Fit signal** (mois 12) : 500 signataires actifs

### 2.5 Métriques anti-vanité (à éviter)

| Métrique trompeuse | Pourquoi éviter |
|--------------------|-----------------|
| « Total visiteurs depuis lancement » | Cumulatif → masque les baisses |
| « Total inscriptions » | Idem |
| Vues de page | Ne capture pas l'action |
| Likes / shares sociaux | Pas notre vecteur |

### 2.6 Outils techniques recommandés

| Besoin | Outil suggéré | Gratuit ? |
|--------|---------------|-----------|
| Analytics anonymes | **Plausible** ou **Umami** | Plausible payant / Umami gratuit auto-hébergé |
| Funnel + cohortes | **PostHog** (auto-hébergé free) | Oui |
| Error monitoring | **Sentry** (déjà dispo, à réactiver) | Oui (5K events/mois) |
| Dashboards opérateur | Page `/fr/admin` avec stats personnalisées | Déjà à demi-bâti |
| Alertes Slack | `SLACK_WEBHOOK` déjà configuré | Oui |

**Recommandation court terme** : **Plausible** (RGPD-compliant, propre, simple).
**Recommandation moyen terme** : ajouter **PostHog** pour analyse de funnel + cohortes utilisateurs.

### 2.7 Cadence de revue

| Cadence | Action |
|---------|--------|
| Quotidien | Coup d'œil dashboard (5 min) |
| Hebdomadaire | Revue des seuils, identifier blocages (30 min) |
| Mensuel | Synthèse écrite : avancement / 30 jours, décisions Phase G suivante (1 h) |
| Trimestriel | Bilan stratégique : seuils tenus ? pivots nécessaires ? (1 demi-journée) |

---

## 3. SYNTHÈSE DES DÉCISIONS À PRENDRE

### Décision 1 — Pilote géographique

```
[ ] Option A — Québec ville (recommandée)
[ ] Option B — Province de Québec
[ ] Option C — National d'emblée
[ ] Option D — Bi-provincial QC + ON
```

### Décision 2 — North Star Metric

```
[ ] Adopter : « Signataires actifs / 30j à Québec ville »
[ ] Ajuster (préciser)
[ ] Choisir une autre NSM (préciser)
```

### Décision 3 — Seuils MVP (3 mois)

```
[ ] Adopter le tableau §2.3 tel quel
[ ] Ajuster certains seuils (préciser)
```

### Décision 4 — Outil analytics

```
[ ] Plausible (court terme)
[ ] Umami (auto-hébergé)
[ ] PostHog (puissant mais plus lourd)
[ ] Ne rien installer pour l'instant (compter manuellement via SQL)
```

---

## 4. RÉPONSE AUTOMATIQUE AUX QUESTIONS LIÉES (§23)

Une fois Q6 + O5 tranchées, les questions liées trouvent leurs réponses :

| Question | Statut après Q6 + O5 |
|----------|----------------------|
| **Q7** — Stratégie d'acquisition de données | Limitée à la zone pilote → catalogage manuel possible |
| **Q9 / O8** — Recrutement utilisateurs | Canaux locaux de la zone pilote |
| **O5** — Métriques de succès | Tranchée ici |
| **O6** — Plan de lancement géographique | Tranché par Q6 |
| **O7** — Stratégie de seed initial | Découle de Q6 |

**Restent à traiter séparément** :
- **O1** — Modèle économique
- **O2** — Cadre légal (Loi 25, LPRPDE)
- **Q2-Q5** — Modération, gouvernance, score d'influence

---

## 5. ACTIONS IMMÉDIATES POST-DÉCISION

Une fois Q6 + O5 actées, le **plan de Phase G** peut être tracé :

1. **Semaine 1** :
   - Catalogage manuel des élus de la zone pilote (Q6).
   - Installation de l'outil analytics (O5).
   - Suppression des données seed génériques (élus de Vancouver, etc.).

2. **Semaine 2** :
   - Création de 3-5 pétitions seed thématiques locales.
   - Configuration du dashboard admin avec les KPIs O5.
   - Page d'accueil (`/fr/`) construite avec contexte de la zone pilote.

3. **Semaine 3-4** :
   - Implémentation du Citizen Awakening System (Brouillard civique centré sur la zone).
   - Recrutement des **20 premiers Pionniers** (contacts personnels, réseau local).

4. **Mois 2** :
   - Première mesure du NSM.
   - Ajustement Phase G en fonction des signaux.

---

## 6. JOURNAL DES DÉCISIONS

| Date | Décision | Choix | Justification |
|------|----------|-------|---------------|
| 2026-05-14 | **Q6 — Pilote géographique** | ✅ **Québec ville** | Densité, mission FR-first, Citizen Awakening efficace, données acquérables en 1-2 semaines. |
| 2026-05-14 | **O5 — North Star Metric** | ✅ **Signataires actifs / 30j à Québec ville** | Capture l'engagement réel, alignement mission civique. Seuils MVP : 30 (3 mois) / 150 (6 mois) / 500 (12 mois). |
| 2026-05-14 | **Outil analytics** | _à confirmer_ — recommandation Plausible | Phase F |
| 2026-05-14 | **Trajectoire** | Québec ville (3m) → Province QC (m4-12) → Pan-Canada (an 2+) | Cohérence avec vision §1.3 |

---

**Document à valider par M. Fortin.**
Une fois validé, mettre à jour la synthèse officielle §23 + §16 + §20 avec les choix retenus.
