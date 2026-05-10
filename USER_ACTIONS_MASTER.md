# 🎯 LISTE MAÎTRESSE — ACTIONS UTILISATEUR CITOYENAVISE

**Version 1.0 — Exhaustive, Modulaire, Exploitable**  
**Date:** 2026-05-10  
**Statut:** Production Ready

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble](#vue-densemble)
2. [Actions par Module](#actions-par-module)
3. [Actions par Complexité](#actions-par-complexité)
4. [Actions par Récompense](#actions-par-récompense)
5. [Missions Hebdomadaires](#missions-hebdomadaires)
6. [Parcours d'Onboarding](#parcours-donboarding)
7. [Progression & Niveaux](#progression--niveaux)
8. [Badges & Achievements](#badges--achievements)

---

## 🎭 VUE D'ENSEMBLE

### **Catégories Principales**

```
🔍 Découverte           — Apprendre, explorer, consulter
💬 Social              — Interagir avec d'autres citoyens
🎨 Créatif            — Publier, créer, documenter
🏛️  Public Data        — Consulter données, établissements
🗳️  Civique            — Pétitions, idées, participation
🎮 Gamification        — Missions, badges, progression
🔧 Contribution        — Améliorer le site
📈 Analytics           — Explorer statistiques
🎓 Éducation          — Parcours, vidéos, apprentissage
⭐ Avancé             — Pour utilisateurs engagés
🔐 Admin              — Modération, gestion
```

---

## 📦 ACTIONS PAR MODULE

### **🔍 MODULE DÉCOUVERTE (Beginner)**

#### **Carte Interactive**
- [ ] Ouvrir la carte
- [ ] Zoomer sur sa ville
- [ ] Zoomer sur sa région
- [ ] Décenter la carte
- [ ] Afficher/masquer les couches (healthcare, education, etc.)
- [ ] Cliquer sur un point
- [ ] Filtrer par type d'établissement
- [ ] Afficher les résultats en liste
- [ ] Exporter une vue (screenshot, PDF)

**Points:** 5-10 pts  
**Dépend de:** Aucun  
**Requis pour:** Missions d'exploration

#### **Établissements (PUBLIC_DATA)**
- [ ] Consulter la fiche d'un établissement
- [ ] Lire la description
- [ ] Consulter les horaires
- [ ] Consulter le numéro de téléphone
- [ ] Consulter l'adresse complète
- [ ] Consulter le site web
- [ ] Consulter les services offerts
- [ ] Consulter les avis citoyens
- [ ] Consulter les photos citoyennes
- [ ] Consulter les photos officielles
- [ ] Consulter les statistiques (budget, employés, capacité)
- [ ] Consulter les coordonnées GPS
- [ ] Consulter les événements associés
- [ ] Afficher sur la carte

**Points:** 5 pts par consultation  
**Dépend de:** Aucun  
**Requis pour:** Actions d'établissement

#### **Élus**
- [ ] Consulter la fiche d'un élu
- [ ] Lire sa biographie
- [ ] Consulter son niveau (fédéral, provincial, municipal)
- [ ] Consulter sa région/circonscription
- [ ] Consulter son contact
- [ ] Consulter son site web
- [ ] Consulter ses engagements (promesses)
- [ ] Consulter ses statuts de promesses
- [ ] Consulter ses taux de réussite
- [ ] Consulter ses pétitions

**Points:** 5 pts par consultation  
**Dépend de:** Aucun  
**Requis pour:** Actions civiques

#### **Institutions**
- [ ] Consulter une institution
- [ ] Lire sa description
- [ ] Consulter ses services
- [ ] Consulter ses coordonnées
- [ ] Consulter ses institutions enfants (si applicable)

**Points:** 5 pts  
**Dépend de:** PUBLIC_DATA  

#### **Vidéos & Éducation**
- [ ] Visionner 1 vidéo civique
- [ ] Visionner 1 vidéo sur un établissement
- [ ] Visionner 1 vidéo sur un sujet local
- [ ] Compléter un parcours éducatif
- [ ] Lire un article éducatif

**Points:** 10-25 pts  
**Dépend de:** Aucun  
**Requis pour:** Missions éducatives

#### **Statistiques & Données**
- [ ] Consulter les statistiques de sa ville
- [ ] Consulter les statistiques de sa région
- [ ] Consulter le budget municipal
- [ ] Consulter les données démographiques
- [ ] Consulter les données de santé
- [ ] Consulter les données d'éducation
- [ ] Consulter les données de transport
- [ ] Consulter les données environnementales
- [ ] Consulter les données électorales
- [ ] Créer un graphique personnalisé
- [ ] Exporter des données (CSV, JSON)

**Points:** 10 pts par consultation  
**Dépend de:** PUBLIC_DATA  
**Requis pour:** Module ANALYTICS

---

### **💬 MODULE SOCIAL (Beginner)**

#### **Suivi & Réseautage**
- [ ] Suivre un autre citoyen
- [ ] Suivre une institution
- [ ] Suivre un établissement
- [ ] Suivre un élu
- [ ] Suivre un sujet (tag, catégorie)
- [ ] Suivre une région
- [ ] Suivre une enquête
- [ ] Arrêter de suivre quelqu'un/quelque chose

**Points:** 5 pts par follow  
**Dépend de:** Aucun  
**Requis pour:** Interactions sociales

#### **Interactions (Likes, Comments, Shares)**
- [ ] Aimer une idée
- [ ] Aimer un établissement
- [ ] Aimer une photo
- [ ] Commenter une idée
- [ ] Répondre à un commentaire
- [ ] Partager une idée
- [ ] Partager une photo
- [ ] Partager un établissement
- [ ] Partager un élu
- [ ] Retirer un like/commentaire

**Points:** 2-5 pts par interaction  
**Dépend de:** Avoir le contenu  
**Requis pour:** Missions sociales

#### **Networking**
- [ ] Ajouter un ami
- [ ] Inviter un ami (email)
- [ ] Inviter un ami (lien de parrainage)
- [ ] Rejoindre un groupe local
- [ ] Créer un groupe local
- [ ] Participer à un groupe

**Points:** 10-25 pts  
**Dépend de:** Account créé  
**Requis pour:** Rôle modérateur

---

### **🎨 MODULE CRÉATIF (Intermediate)**

#### **Idées & Propositions**
- [ ] Publier une idée
- [ ] Éditer une idée
- [ ] Supprimer une idée
- [ ] Épingler une idée personnelle
- [ ] Ajouter une vidéo à une idée
- [ ] Ajouter une photo à une idée
- [ ] Ajouter une source à une idée
- [ ] Associer une idée à un établissement
- [ ] Associer une idée à un élu
- [ ] Associer une idée à une région
- [ ] Éditer la catégorie d'une idée
- [ ] Éditer les tags d'une idée

**Points:** 25 pts pour création  
**Dépend de:** Profil complet  
**Récompense bonus:** 5 pts par 10 likes

#### **Photographies & Contenu Visuel**
- [ ] Publier une photo d'un établissement
- [ ] Publier une photo d'un problème local (nid-de-poule, etc.)
- [ ] Publier une photo d'un succès local
- [ ] Publier une photo d'un lieu public
- [ ] Publier une photo de son vote
- [ ] Publier une photo d'un événement
- [ ] Ajouter une description à une photo
- [ ] Ajouter une localisation à une photo
- [ ] Ajouter des tags à une photo
- [ ] Associer une photo à un établissement

**Points:** 15 pts pour publication  
**Dépend de:** Compte actif  
**Récompense bonus:** +2 pts par like

#### **Reportages & Documentations**
- [ ] Publier un reportage citoyen
- [ ] Publier un résumé de conseil municipal
- [ ] Publier une capsule informative
- [ ] Publier une analyse locale
- [ ] Publier une enquête citoyenne
- [ ] Publier une critique constructive
- [ ] Publier une suggestion d'amélioration
- [ ] Publier un dossier complet (multi-pages)

**Points:** 50-100 pts  
**Dépend de:** Rôle contributeur  
**Requis pour:** Rôle ambassadeur

---

### **🏛️ MODULE PUBLIC_DATA (Intermediate)**

#### **Contribution aux Fiches d'Établissements**
- [ ] Ajouter une description citoyenne
- [ ] Ajouter un avis citoyen
- [ ] Corriger les horaires
- [ ] Corriger l'adresse
- [ ] Corriger le numéro de téléphone
- [ ] Corriger le site web
- [ ] Ajouter un service manquant
- [ ] Supprimer une information obsolète
- [ ] Confirmer une information (vérification)
- [ ] Signaler une erreur
- [ ] Signaler un doublon
- [ ] Proposer une fusion

**Points:** 5-10 pts par contribution  
**Dépend de:** Compte actif  
**Récompense bonus:** +5 pts si acceptée

#### **Propositions de Nouveaux Établissements**
- [ ] Proposer un nouvel établissement
- [ ] Proposer un établissement manquant
- [ ] Fournir les informations complètes
- [ ] Ajouter une photo
- [ ] Voir sa proposition acceptée

**Points:** 50 pts pour proposition + 25 si acceptée  
**Dépend de:** Contributeur confirmé  
**Requis pour:** Rôle modérateur

#### **Linking & Associations**
- [ ] Associer une idée à un établissement
- [ ] Associer un événement à un établissement
- [ ] Associer une photo à un établissement
- [ ] Associer un élu à une région
- [ ] Créer une relation parent-enfant (institutions)

**Points:** 10 pts par association  
**Dépend de:** Modérateur  

---

### **🗳️ MODULE CIVIQUE (Beginner)**

#### **Pétitions**
- [ ] Signer une pétition
- [ ] Créer une pétition
- [ ] Signer 3 pétitions (mission)
- [ ] Signer 10 pétitions (mission)
- [ ] Inviter quelqu'un à signer une pétition
- [ ] Partager une pétition
- [ ] Voir sa pétition créée (X jours)
- [ ] Voir sa pétition atteindre 100 signatures
- [ ] Voir sa pétition atteindre 1000 signatures

**Points:** 5 pts pour signature  
**Dépend de:** Compte actif  
**Récompense bonus:** +10 pts si création acceptée

#### **Idées & Soutien**
- [ ] Soutenir une idée
- [ ] Proposer une idée
- [ ] Débattre sur une idée
- [ ] Voir son idée avoir 10 soutiens
- [ ] Voir son idée avoir 100 soutiens
- [ ] Voir son idée avoir 1000 soutiens

**Points:** 5-25 pts  
**Dépend de:** Compte actif  

#### **Sondages & Débats**
- [ ] Participer à un sondage
- [ ] Participer à un débat
- [ ] Répondre à un questionnaire civique
- [ ] Créer un sondage
- [ ] Créer un débat
- [ ] Voir son sondage atteindre 100 réponses

**Points:** 5-25 pts  
**Dépend de:** Compte actif  

#### **Participation Électorale**
- [ ] Consulter un programme d'élu
- [ ] Lire un résumé de séance municipale
- [ ] Consulter un budget municipal
- [ ] Lire une consultation publique
- [ ] Participer à une consultation publique
- [ ] Confirmer sa participation à un événement
- [ ] Confirmer son vote (sans orientation)
- [ ] Vérifier ses informations électorales

**Points:** 10-25 pts  
**Dépend de:** Compte citoyen  
**Requis pour:** Missions civiques

#### **Engagement avec Élus**
- [ ] Suivre un élu
- [ ] Envoyer une question à un élu
- [ ] Consulter la réponse d'un élu
- [ ] Suivre les promesses d'un élu
- [ ] Vérifier la complétude des promesses d'un élu
- [ ] Noter un élu (satisfaction)
- [ ] Donner un feedback constructif

**Points:** 10 pts par action  
**Dépend de:** Compte actif  

---

### **🎮 MODULE GAMIFICATION**

#### **Missions Quotidiennes**
- [ ] Lire 1 idée locale (5 pts)
- [ ] Explorer 1 établissement (5 pts)
- [ ] Visionner 1 vidéo civique (10 pts)
- [ ] Aimer 3 idées (5 pts)
- [ ] Commenter 1 idée (5 pts)
- [ ] Consulter 1 statistique (5 pts)
- [ ] Revenir au site (2 pts - bonus)

**Récompense:** Streak +1, Achievement quotidienne

#### **Missions Hebdomadaires**
- [ ] Signer 3 pétitions (25 pts)
- [ ] Explorer 5 établissements (25 pts)
- [ ] Publier 1 photo citoyenne (25 pts)
- [ ] Participer à 1 débat (25 pts)
- [ ] Lire 1 résumé de séance municipale (25 pts)
- [ ] Compléter 1 parcours éducatif (50 pts)
- [ ] Contribuer 1 nouvelle fiche (50 pts)
- [ ] Inviter 1 ami (25 pts)

**Récompense:** Badge "Citoyen Actif", 100 pts bonus si complétée

#### **Missions Mensuelles**
- [ ] Publier 1 idée originale (75 pts)
- [ ] Inviter 3 amis (75 pts)
- [ ] Participer à 4 événements (100 pts)
- [ ] Contribuer 5 contenus (100 pts)
- [ ] Atteindre 100 followers (100 pts)
- [ ] Voir son contenu atteindre 500 interactions (100 pts)

**Récompense:** Badge spécial, promotion possible

#### **Missions Spéciales (Saisonnières)**
- [ ] Participer aux élections (50 pts)
- [ ] Documenter ta région (100 pts)
- [ ] Créer un parcours éducatif (150 pts)
- [ ] Organiser un événement (200 pts)

**Récompense:** Badge rare, titre spécial

---

### **📈 MODULE PROGRESSION & NIVEAUX**

#### **Progression XP**

```
Niveau 1: Apprenti Citoyen (0-500 XP)
  └─ Actions: Découvrir, explorer, consulter
  └─ Déblocage: Suivi, création de contenu

Niveau 2: Citoyen Actif (500-1500 XP)
  └─ Actions: Publier idées, photos, commentaires
  └─ Déblocage: Missions hebdomadaires, création pétitions

Niveau 3: Contributeur (1500-3500 XP)
  └─ Actions: Contribuer aux fiches, signaler erreurs
  └─ Déblocage: Proposer établissements, modération

Niveau 4: Ambassadeur (3500-7500 XP)
  └─ Actions: Créer parcours, événements
  └─ Déblocage: Rôle d'ambassadeur régional

Niveau 5: Champion Local (7500-15000 XP)
  └─ Actions: Leadership communautaire, mentoring
  └─ Déblocage: Rôle de modérateur

Niveau 6: Gardien de Données (15000+ XP)
  └─ Actions: Curation de données massives
  └─ Déblocage: Admin, partenariats
```

#### **Progression par Domaine**

```
Domaine Carte:
  ├─ Explorer 5 villes (Niveau 2)
  ├─ Explorer 10 villes (Niveau 3)
  ├─ Explorer 50 villes (Niveau 4)
  └─ Explorer 200 villes (Niveau 5)

Domaine Civique:
  ├─ Signer 5 pétitions (Niveau 2)
  ├─ Signer 25 pétitions (Niveau 3)
  ├─ Signer 100 pétitions (Niveau 4)
  └─ Créer 10 pétitions (Niveau 5)

Domaine Créatif:
  ├─ Publier 1 contenu (Niveau 2)
  ├─ Publier 5 contenus (Niveau 3)
  ├─ Publier 25 contenus (Niveau 4)
  └─ Publier 100 contenus (Niveau 5)

Domaine Données:
  ├─ Consulter 10 établissements (Niveau 2)
  ├─ Contribuer 5 corrections (Niveau 3)
  ├─ Proposer 3 établissements (Niveau 4)
  └─ Modérer 50 contributions (Niveau 5)

Domaine Social:
  ├─ Suivre 10 comptes (Niveau 2)
  ├─ Avoir 50 followers (Niveau 3)
  ├─ Avoir 200 followers (Niveau 4)
  └─ Avoir 1000 followers (Niveau 5)
```

---

### **⭐ BADGES & ACHIEVEMENTS**

#### **Badges de Découverte**
```
🔍 Explorateur de Villes (explorer 5+ villes)
🗺️  Maître de Carte (explorer 25+ villes)
🏛️  Connaisseur d'Établissements (consulter 50+ fiches)
🎓 Apprenant Civique (visionner 5+ vidéos)
📊 Chercheur de Données (consulter 10+ statistiques)
```

#### **Badges de Contribution**
```
📸 Photographe Citoyen (publier 5+ photos)
✍️  Écrivain Local (publier 3+ idées/reportages)
🔧 Correcteur de Données (corriger 10+ fiches)
🎯 Proposant d'Établissements (proposer 3+ nouveaux)
⭐ Modérateur Reconnu (modérer 50+ contenus)
```

#### **Badges Civiques**
```
🗳️  Pétitionnaire (signer 10+ pétitions)
💡 Champion d'Idées (publier 3+ idées populaires)
🎤 Débatteur Constructif (participer 5+ débats)
🤝 Citoyen Engagé (avoir 5 actions civiques/mois)
👑 Leader Communautaire (organiser 3+ événements)
```

#### **Badges de Fidélisation**
```
🔥 Streak de 7 jours (revenir 7 jours d'affilée)
🏆 Streak de 30 jours (revenir 30 jours d'affilée)
💎 Contributeur Rare (être dans les top 1% contributeurs)
🌟 Ambassadeur Régional (avoir +500 followers)
👸 Legend Local (avoir +5000 interactions totales)
```

#### **Badges Saisonniers**
```
🗽 Votant Informé (participer aux élections)
🍂 Documentaliste d'Automne (documenter sa région en automne)
❄️  Champion Hivernal (compléter mission hiver)
🌸 Ambassadeur du Printemps (inviter 10+ amis au printemps)
☀️  Guerrier de l'Été (avoir streak 60 jours en été)
```

---

## 🎯 MISSIONS HEBDOMADAIRES (Structurées)

### **Semaine Type**

```
🎮 Mission Quotidienne
   └─ Lire 1 idée + Explorer 1 établissement + Visionner 1 vidéo
   └─ Récompense: 15 XP + 1 point Streak

📋 Mission Hebdo Niveau 1 (Beginner)
   ├─ Signer 3 pétitions (25 XP)
   ├─ Explorer 5 établissements (25 XP)
   └─ Aimer 10 contenus (15 XP)
   └─ Récompense: 65 XP + Badge "Semaine Active"

📋 Mission Hebdo Niveau 2 (Intermediate)
   ├─ Publier 1 photo citoyenne (25 XP)
   ├─ Contribuer 1 correction de fiche (25 XP)
   ├─ Participer 1 débat (25 XP)
   └─ Récompense: 75 XP + Badge "Contributeur Confirmé"

📋 Mission Hebdo Niveau 3 (Advanced)
   ├─ Publier 1 reportage/idée (50 XP)
   ├─ Inviter 1 ami + voir il complète onboarding (50 XP)
   ├─ Proposer 1 amélioration (25 XP)
   └─ Récompense: 125 XP + Badge "Leader Hebdo"

🎯 Bonus Hebdo
   ├─ Si 7/7 jours de missions quotidiennes: +50 XP
   ├─ Si tous niveaux complétés: +100 XP
   └─ Si parrainage réussi: +100 XP
```

---

## 🚀 PARCOURS D'ONBOARDING

### **Jour 1: Découverte (30-45 min)**
```
Step 1: Bienvenue (2 min)
  └─ Créer compte
  └─ Compléter profil (nom, ville, intérêts)
  └─ Vérifier email

Step 2: Exploration Guidée (10 min)
  ├─ Tour de la carte
  ├─ Cliquer sur 3 établissements
  ├─ Lire 1 idée populaire
  └─ Récompense: +50 XP

Step 3: Première Action Sociale (5 min)
  ├─ Suivre 1 compte
  ├─ Aimer 1 idée
  ├─ Commenter 1 idée
  └─ Récompense: +50 XP

Step 4: Découvrir la Gamification (3 min)
  ├─ Voir son profil
  ├─ Voir ses missions quotidiennes
  ├─ Comprendre le système de points
  └─ Badge "Apprenti Citoyen" débloqué
```

### **Jour 2-7: Engagement Progressif**
```
Jour 2: Première Publication
  ├─ Publier 1 photo (guide pas-à-pas)
  ├─ Ajouter description et localisation
  ├─ Voir les premiers likes
  └─ Récompense: +100 XP + Badge

Jour 3: Première Contribution
  ├─ Corriger une fiche d'établissement
  ├─ Voir sa correction acceptée
  └─ Récompense: +50 XP

Jour 4: Civique
  ├─ Signer 1ère pétition
  ├─ Lire 1 programme d'élu
  └─ Récompense: +50 XP

Jour 5-7: Autonomie Guidée
  ├─ Libre exploration
  ├─ Notifications pour missions
  ├─ Encouragement à revenir
  └─ Récompense: +25 XP/jour si revient
```

### **Semaine 2-4: Consolidation**
```
Objectif: Habituer l'utilisateur à revenir régulièrement

Actions:
  ├─ Missions quotidiennes/hebdos
  ├─ Notifications personnalisées
  ├─ Succès visibles (streaks, badges)
  ├─ Suggestion de contenu par intérêt
  └─ Invitations amis
```

---

## 🔑 ACTIONS INVISIBLES (Tracking)**

Ces actions sont comptées mais pas visibles à l'utilisateur:

```
Temps passé:
  ├─ Sur une fiche (5s min → +1 XP)
  ├─ Sur la carte (10s min → +1 XP)
  ├─ À lire un contenu (30s min → +1 XP)
  └─ Sur le site/jour (+2 XP si >5 min)

Interactions Silencieuses:
  ├─ Scroll d'une fiche (vue complète)
  ├─ Ouverture d'onglet
  ├─ Exploration sans action (discovery)
  └─ Recherche effectuée (+1 XP)

Engagements Subconscients:
  ├─ Retour après X jours (2 XP)
  ├─ Consultation répétée d'une fiche
  ├─ Suivi de région/sujet
  └─ Patterns d'usage (early bird, night owl, etc.)
```

---

## 🎯 SYSTÈME DE POINTS - RÉCAPITULATIF

| Action | Type | XP | Dépend | Récompense |
|--------|------|-----|--------|-----------|
| **Consulter fiche** | Découverte | 5 | - | - |
| **Visionner vidéo** | Éducation | 10 | - | - |
| **Suivre compte** | Social | 5 | Compte | - |
| **Aimer contenu** | Social | 2 | Contenu | - |
| **Commenter** | Social | 5 | Contenu | - |
| **Publier idée** | Créatif | 25 | Profil | +5 par like |
| **Publier photo** | Créatif | 15 | Profil | +2 par like |
| **Signer pétition** | Civique | 5 | Compte | - |
| **Créer pétition** | Civique | 50 | Contributeur | +5 par signature |
| **Corriger fiche** | Contribution | 10 | Modéré | +5 si acceptée |
| **Proposer établ.** | Contribution | 50 | Contributeur | +25 si acceptée |
| **Participer débat** | Civique | 25 | Compte | - |
| **Mission quotidienne** | Gamification | 15 | Actif | - |
| **Mission hebdo** | Gamification | 65-125 | Actif | Badge |
| **Streak 7 jours** | Fidélisation | 50 | Consistent | Badge |
| **Inviter ami** | Parrainage | 25 | Compte | +100 si inscrip |

---

## 🎪 MODULES D'INTÉGRATION

### **Comment Utiliser Cette Liste**

#### **Pour le Frontend (UX/Gamification)**
```javascript
// Points system
const pointsByAction = {
  'view_establishment': 5,
  'create_idea': 25,
  'sign_petition': 5,
  'publish_photo': 15,
  ...
}

// Missions
const dailyMission = {
  actions: ['view_establishment', 'like_idea', 'watch_video'],
  reward: 15,
  streak: true
}

// Progression
const xpToLevel = {
  1: 500,
  2: 1500,
  3: 3500,
  4: 7500,
  5: 15000
}
```

#### **Pour le Backend (Database)**
```sql
-- User actions table
CREATE TABLE user_actions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action_type VARCHAR(50),
  target_id INTEGER,
  xp_earned INTEGER,
  created_at TIMESTAMP
);

-- Missions table
CREATE TABLE missions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  mission_type VARCHAR(50), -- daily, weekly, monthly
  status VARCHAR(20), -- active, completed, failed
  progress INTEGER,
  target INTEGER,
  xp_reward INTEGER,
  deadline DATE
);

-- User stats
CREATE TABLE user_stats (
  user_id INTEGER PRIMARY KEY,
  total_xp INTEGER,
  level INTEGER,
  current_streak INTEGER,
  best_streak INTEGER,
  actions_count INTEGER,
  last_action TIMESTAMP
);
```

#### **Pour l'Analytics**
```
Metrics à Suivre:
├─ Daily Active Users (par action)
├─ Retention (jour 7, 30, 90)
├─ XP moyen par utilisateur
├─ Actions les plus populaires
├─ Taux de complétude de missions
├─ Progression moyenne par niveau
├─ Temps moyen par utilisateur
└─ Conversion (découverte → contributeur)
```

---

## 📱 INTÉGRATION AVEC MODULES EXISTANTS

```
IDEAS Module:
  ├─ Publier idée (+25 XP)
  ├─ Débattre idée (+25 XP)
  ├─ Voir idée acceptée (+50 XP)
  └─ Voir idée populaire (+100 XP)

PUBLIC_DATA Module:
  ├─ Consulter fiche (+5 XP)
  ├─ Corriger fiche (+10 XP)
  ├─ Proposer établ. (+50 XP)
  └─ Modérer contenu (+25 XP)

FEED Module:
  ├─ Lire actualité (+5 XP)
  ├─ Partager actualité (+10 XP)
  └─ Voir actualité virale (+50 XP)

ANALYTICS Module:
  ├─ Consulter statistiques (+10 XP)
  ├─ Créer graphique perso (+25 XP)
  └─ Trouver insight local (+50 XP)

MAP Module:
  ├─ Utiliser carte (+1 XP)
  ├─ Partager point (#10 XP)
  └─ Créer itinéraire (+25 XP)

DEPUTY Module:
  ├─ Consulter élu (+5 XP)
  ├─ Suivre promesses (+10 XP)
  ├─ Envoyer question (+25 XP)
  └─ Voir promesse complétée (+50 XP)
```

---

## 🚀 PROCHAINES ÉTAPES

1. **Database Schema** — Créer tables user_actions, missions, user_stats
2. **Action Logger** — Service central d'enregistrement d'actions
3. **Mission Engine** — Système automatisé de génération/vérification missions
4. **Points Calculator** — Service d'agrégation XP et progression
5. **Notification System** — Alertes pour missions, badges, streaks
6. **Frontend Integration** — UI pour afficher points, badges, missions
7. **Analytics Dashboard** — Voir engagement par action/utilisateur/cohort
8. **Reward System** — Cadeaux virtuels ou réels pour niveaux élevés

---

## ✅ CHECKLIST IMPLÉMENTATION

- [ ] Schema SQL des tables
- [ ] Service d'enregistrement d'actions
- [ ] Système de calcul XP
- [ ] Moteur de missions
- [ ] UI Gamification
- [ ] Notifications
- [ ] Analytics
- [ ] A/B Testing (ajuster points)
- [ ] Documentation utilisateur
- [ ] Tutorial & Onboarding

---

**LISTE MAÎTRESSE COMPLÈTE ET EXPLOITABLE — PRÊTE POUR IMPLÉMENTATION 🎯**
