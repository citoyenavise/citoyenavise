# 🏛️ Système de Tutoriels Civiques Interactifs (TCI)

**Module éducatif + interactif + pratique pour l'empowerment civique des citoyens**

---

## 📖 Vision du TCI

Transformer la peur civique en participation réelle en :

1. **Éduquant** — Expliquer comment participer, pourquoi c'est important
2. **Montrant** — Donner des exemples concrets, neutres, respectueux
3. **Testant** — Faire faire un test (ex: écrire un brouillon de lettre)
4. **Guidant** — Montrer le lien officiel, les étapes exactes
5. **Confirmant** — Valider que l'action réelle a été prise
6. **Récompensant** — Points, badges, progression, empowerment

---

## 🎯 Objectifs Pédagogiques

Chaque parcours enseigne :

✅ **Comprendre** — Qui? Quoi? Pourquoi? Comment?

✅ **Démystifier** — C'est plus simple qu'on pense

✅ **Pratiquer** — Test dans le système (zéro risque)

✅ **Agir** — Action réelle guidée (très bas risque)

✅ **Valider** — Confirmation que c'est fait

✅ **Empowerer** — "Tu as participé à la démocratie"

---

## 🗂️ Structure TCI

### Parcours (Civic Tutorial)

Chaque parcours = mini‑cours complet.

**Exemple :** "Comment écrire à ton député"

**Propriétés :**
- `slug` : identifiant unique
- `titleFr` : titre français
- `descriptionFr` : description
- `category` : civic, education, participation, skills
- `difficultyLevel` : beginner, intermediate, advanced, expert
- `estimatedDurationMinutes` : 5-30 minutes
- `prerequisites` : tutoriels à faire avant

### Étapes (Tutorial Step)

Chaque parcours contient 4-7 étapes.

**Types d'étapes :**
- **Education** — Expliquer les concepts
- **Example** — Montrer des exemples
- **Test** — Faire un exercice pratique
- **Guide** — Instructions pour action réelle
- **Confirmation** — Vérifier que l'action est prise
- **Reflection** — Retour d'expérience

### Actions Civiques Réelles (Civic Action)

Chaque étape "Guide" ou "Confirmation" enregistre une **action civique réelle** :

- Écrire à un élu
- Signer une pétition
- Contacter un service public
- Participer à une consultation
- Assister à une séance
- Signaler un problème
- Voter
- Documenter son territoire (photo + description)

---

## 📦 Fichiers Créés

### Migration
```
✅ V007_civic_tutorials.sql
   └─ 8 tables pour TCI complet
```

### Modèles Sequelize (8)
```
✅ CivicTutorial.js        — Parcours pédagogiques
✅ TutorialStep.js         — Étapes dans un parcours
✅ UserTutorialProgress.js — Suivi de progression
✅ UserStepProgress.js     — Suivi des étapes
✅ CivicAction.js          — Actions civiques réelles
✅ TutorialResource.js     — Ressources officielles
✅ TutorialExample.js      — Exemples pour chaque étape
✅ TutorialStats.js        — Statistiques d'engagement
```

### Service
```
✅ CivicTutorialService.js — Logique métier complète
```

### Routes
```
✅ civic-tutorials.js      — 8 endpoints API
```

---

## 🔌 API Endpoints

### GET /api/v1/tutorials
Lister tous les tutoriels disponibles

**Query Params:**
- `category` — Filtrer par catégorie (civic, skills, etc.)

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "slug": "write-to-deputy",
      "title": "Comment écrire à ton député",
      "category": "civic",
      "difficulty": "beginner",
      "estimatedDuration": 15,
      "stats": {
        "totalCompleted": 245,
        "completionRatePercent": 68.5
      }
    }
  ]
}
```

---

### GET /api/v1/tutorials/:id
Détail d'un tutoriel (avec toutes les étapes)

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "write-to-deputy",
    "title": "Comment écrire à ton député",
    "description": "Apprenez à communiquer directement avec vos élus...",
    "difficulty": "beginner",
    "estimatedDuration": 15,
    "steps": [
      {
        "stepNumber": 1,
        "title": "Qui est ton député?",
        "description": "Trouvez l'informations...",
        "contentType": "education",
        "examples": [
          {
            "title": "Exemple: Jean Martin",
            "exampleContent": "Jean Martin est votre député..."
          }
        ]
      },
      {
        "stepNumber": 2,
        "title": "Voir un exemple de lettre",
        "contentType": "example"
      },
      {
        "stepNumber": 3,
        "title": "Écrivez votre lettre",
        "contentType": "test"
      },
      {
        "stepNumber": 4,
        "title": "Envoyez votre lettre",
        "contentType": "guide",
        "actionType": "contact_official"
      },
      {
        "stepNumber": 5,
        "title": "Confirmez l'envoi",
        "contentType": "confirmation"
      }
    ],
    "resources": [
      {
        "title": "Contact officiel du Parlement",
        "url": "https://...",
        "source": "Gouvernement du Québec",
        "isOfficial": true
      }
    ]
  }
}
```

---

### POST /api/v1/tutorials/:id/start
Commencer un tutoriel

**Réponse (201):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "status": "in_progress",
    "startedAt": "2026-05-10T15:30:00Z",
    "currentStep": 1
  }
}
```

---

### POST /api/v1/tutorials/:tutorialId/steps/:stepId/complete
Compléter une étape

**Request Body:**
```json
{
  "userResponse": {
    "letterText": "Bonjour Monsieur le Député..."
  }
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": 12,
    "status": "completed",
    "completedAt": "2026-05-10T15:45:00Z"
  }
}
```

---

### POST /api/v1/tutorials/:id/complete
Compléter un tutoriel entier

**Réponse:**
```json
{
  "success": true,
  "data": {
    "completed": true,
    "xpEarned": 100,
    "newBadges": [
      {
        "id": 3,
        "name": "Premier contact civique",
        "icon": "..."
      }
    ]
  }
}
```

---

### POST /api/v1/tutorials/:id/civic-action
Enregistrer une action civique réelle

**Request Body:**
```json
{
  "actionType": "contact_official",
  "actionData": {
    "officialId": 42,
    "messageText": "Lettre envoyée au député...",
    "sentMethod": "email",
    "sentDate": "2026-05-10"
  }
}
```

**Réponse (201):**
```json
{
  "success": true,
  "data": {
    "civicActionId": 128,
    "actionType": "contact_official",
    "recordedAt": "2026-05-10T15:50:00Z",
    "newBadges": []
  }
}
```

---

### GET /api/v1/tutorials/dashboard/user (Protected)
Tableau de bord personnel

**Réponse:**
```json
{
  "success": true,
  "data": {
    "tutorials": [
      {
        "id": 1,
        "slug": "write-to-deputy",
        "title": "Comment écrire à ton député",
        "userProgress": {
          "status": "in_progress",
          "currentStep": 3,
          "startedAt": "2026-05-09T10:00:00Z"
        }
      }
    ],
    "stats": {
      "totalTutorials": 12,
      "completedTutorials": 3,
      "inProgressTutorials": 2,
      "totalCivicActions": 8
    }
  }
}
```

---

## 📚 Exemples de Parcours

### 1️⃣ "Écrire à ton Député"

**Étape 1 — Comprendre**
```
Qui est ton député?
- Représente votre circonscription
- Peut vous aider, vous écouter
- Obligé de répondre (dans les 30 jours)

Pourquoi écrire?
- Exprimer tes préoccupations
- Demander son aide
- Montrer que tu te soucies

Ce que tu peux demander:
- Aide administrative
- Information sur une loi
- Support pour un projet
- Action sur une pétition

Ce que tu ne dois pas faire:
- Menaces ou insultes
- Messages offensants
- Partis politiques (neutre!)
```

**Étape 2 — Exemple**
```
Cher Monsieur Martin,

Je suis citoyen de votre circonscription
(votre adresse). Je vous écris pour
exprimer mes préoccupations concernant...

[Description neutre du problème]

J'aimerais connaître votre position sur...
Je vous remercie de votre attention.

Respectueusement,
[Votre nom]
```

**Étape 3 — Test**
```
Écrivez un brouillon de lettre
(dans le système, pas d'envoi encore)
```

**Étape 4 — Guide**
```
Voici comment envoyer:

Option 1: Email
- Adresse: martin@parliament.qc.ca
- Sujet: "Préoccupation citoyenne"

Option 2: Courrier postal
- Adresse: ...
- Délai: 1-2 semaines

Option 3: Site officiel
- URL: parliament.qc.ca/contact
- Remplir formulaire en ligne

⚠️ Vérifier toujours auprès de
   la source officielle!
```

**Étape 5 — Confirmation**
```
✅ J'ai envoyé mon message
   [Bouton de confirmation]
```

**Récompenses**
```
+ 50 XP
+ Badge "Premier contact civique"
+ Déblocage du parcours suivant
```

---

### 2️⃣ "Signer une Pétition"

**Étape 1** — Comprendre (qu'est-ce qu'une pétition?)
**Étape 2** — Voir un exemple
**Étape 3** — Signer une fausse pétition interne
**Étape 4** — Lien vers pétitions officielles
**Étape 5** — Confirmation
**Récompenses** — 30 XP + Badge

---

### 3️⃣ "Photographier et Partager ton Quartier"

**Étape 1** — Pourquoi documenter son territoire?
**Étape 2** — Voir des exemples de photos civiques
**Étape 3** — Prendre une photo
**Étape 4** — L'ajouter à une fiche d'établissement
**Étape 5** — Ajouter une description
**Récompenses** — 40 XP + Badge

---

### 4️⃣ "Participer à une Consultation Publique"

**Étape 1** — Qu'est-ce qu'une consultation?
**Étape 2** — Où les trouver?
**Étape 3** — Comment préparer un commentaire?
**Étape 4** — Soumettre via site officiel
**Récompenses** — 75 XP + Badge

---

## 💾 Données de Seed (Exemples)

```javascript
// seed-tutorials.js
const tutorials = [
  {
    slug: 'write-to-deputy',
    titleFr: '✉️ Écrire à ton député',
    category: 'civic',
    difficultyLevel: 'beginner',
    estimatedDurationMinutes: 15,
  },
  {
    slug: 'sign-petition',
    titleFr: '📝 Signer une pétition',
    category: 'civic',
    difficultyLevel: 'beginner',
    estimatedDurationMinutes: 10,
  },
  {
    slug: 'photo-territory',
    titleFr: '📸 Photographier ton quartier',
    category: 'skills',
    difficultyLevel: 'beginner',
    estimatedDurationMinutes: 20,
  },
  // ... plus
];
```

---

## 🎓 Intégration Onboarding

Le TCI s'intègre au flux onboarding :

```
1. Premier login
   → Bienvenue! Commençons par...
   
2. Complete profile
   → Génial! Veux-tu apprendre à participer?
   
3. Choose interests
   → Quels sujets t'intéressent?
   
4. Get first task
   → "Essaie: Écrire à ton député"
   → Tutoriel + action réelle
   
5. Celebrate success
   → "Tu as participé à la démocratie! 🎉"
   → Badge + XP
   
6. More actions
   → "Découvre d'autres façons de participer..."
```

---

## 🏆 Progression et Récompenses

Chaque tutoriel complété :

✅ **XP Variable** (50-200 selon difficulté)
✅ **Badges** — Thématiques (civic, skills, discovery)
✅ **Progression** — Vers nouveau niveau
✅ **Déblocage** — Tutoriels suivants

---

## ✅ Checklist Implémentation

- [x] Migration V007 créée
- [x] 8 modèles Sequelize
- [x] Service CivicTutorialService
- [x] 8 endpoints API
- [x] Routes intégrées
- [ ] Seed data (tutoriels par défaut)
- [ ] Frontend React (pages tutoriels)
- [ ] Intégration avec notifications
- [ ] Tests complets
- [ ] Documentation utilisateur

---

## 🚀 Prochaines Étapes

1. **Créer les données de seed**
   - 8-10 tutoriels complets
   - Tous les étapes, exemples, ressources

2. **Frontend React**
   - Page tutoriels (list)
   - Page détail tutoriel
   - Composant étapes interactive
   - Afficher ressources officielles

3. **Notifications**
   - Célébrer completion
   - Notifier nouveaux tutoriels disponibles
   - Streak notifications

4. **Analytics**
   - Taux de completion par tutoriel
   - Actions civiques les plus courantes
   - Impact sur engagement global

5. **Admin Panel**
   - CRUD tutoriels
   - Voir les civic actions
   - Voir les stats d'engagement

---

## 🔒 Principes Éthiques

Toujours garder en tête :

✅ **Neutre** — Aucune orientation politique
✅ **Éducatif** — Pas de persuasion, juste de l'info
✅ **Confidentiel** — Les actions civiques sont privées
✅ **Officiel** — Toujours lier vers sources gouvernementales
✅ **Respectueux** — Jamais de pression

---

## 📞 Support

- Service: `backend/src/services/CivicTutorialService.js`
- Routes: `backend/src/routes/civic-tutorials.js`
- Modèles: `backend/src/models/CivicTutorial*.js`
- Migration: `backend/src/database/migrations/V007_civic_tutorials.sql`
- Docs: `backend/CIVIC_TUTORIALS.md`

---

**Tutoriels Civiques Interactifs — Ready for Impact! 🏛️**
