---
name: Guide de prompting IA pour diriger le projet
description: Comment utiliser Claude pour développer de manière cohérente et rapide
type: reference
---

# Guide de Prompting — Citoyen Avisé

## 🎯 Principes clés

1. **Référencez l'architecture** : Pointez les fichiers _ai/ pertinents
2. **Soyez précis** : Une tâche = un livrable concret (code, doc, test)
3. **Validez** : Tests, linting, aucun console.log
4. **Documentez** : Mise à jour CLAUDE.md et _ai/ après chaque étape

## 📝 Template de prompt efficace

```
Je suis en [Phase X.Y] ([Module/Étape]).

📚 CONTEXTE :
- Lire : _ai/02_architecture_modules.md (section "[Module]")
- Lire : _ai/01_contraintes_generales.md
- Lire : database/schema.sql (tables pertinentes)
- Code existant : [fichiers affectés, s'il y en a]

🎯 TÂCHE :
Implémenter [QUOI] : [Description brève]
  - Routes API : [lister]
  - Tables DB : [lister]
  - Fichiers à créer : [liste]
  - Fichiers à modifier : [liste]

✅ LIVRABLES ATTENDUS :
  - [ ] Code backend (controllers, services, routes)
  - [ ] Code frontend (pages, composants)
  - [ ] Tests (au moins routes API + un service)
  - [ ] Migrations DB
  - [ ] Mise à jour CLAUDE.md et _ai/40_journal_sessions/
  - [ ] Pas de console.log, pas de TODO flottants

🔒 CONTRAINTES :
  - Respecter conventions de nommage (_ai/01)
  - Zéro duplication (DRY)
  - Erreurs claires et loggées
  - Aucun secret en dur (utiliser process.env)

📊 Exemple AVANT de demander :
Si tu dois implémenter authentification :
  ✅ "Phase 2.1 : Implémenter auth backend. 
      Lire _ai/02 section 'Module 1', 
      Routes POST /auth/register et POST /auth/login, 
      Tables users et profiles, 
      Utiliser bcrypt + JWT, 
      Tests avec Supertest"
  
  ❌ "Fais l'authentification"
```

## 💡 Patterns de prompts par cas d'usage

### Pattern 1 : Ajouter une route API

```
Je veux ajouter la route [METHOD] [/api/v1/path].

📚 Contexte : [Module, point 02_architecture_modules.md]

🎯 Détails :
- Input : { field1: string, field2: number }
- Output : { id, field1, field2, created_at }
- Erreurs : Si field1 vide → 400 + message clair
- Authentification : [oui/non + rôle]

✅ Livrables :
- [ ] Controller + service
- [ ] Validation input (Zod/Joi)
- [ ] Test Supertest
- [ ] Logs structurés
```

### Pattern 2 : Créer un composant HTML réutilisable

```
Je veux créer le composant [NOM] (ex: Button, Card, Modal).

🎯 Détails :
- Props : [liste des paramètres]
- États : [list des states, ex: loading, disabled, error]
- Événements : [quels events émettre]
- Accessible : ARIA labels, keyboard navigation si applicable

✅ Livrables :
- [ ] Fichier HTML + CSS encapsulé
- [ ] JavaScript pour interactions
- [ ] Exemples d'utilisation (3 variantes)
- [ ] Tests d'accessibilité (au moins une)
```

### Pattern 3 : Migrer une page HTML existante

```
Je dois migrer la page [PATH] de statique vers composants.

📚 Contexte : [Lire la page actuelle, identifier patterns]

🎯 Plan :
- [ ] Analyser la page
- [ ] Identifier composants réutilisables
- [ ] Extraire contenu (séparation données/HTML)
- [ ] Créer composants dans src/components/
- [ ] Tester bilinguisme FR/EN
- [ ] Valider SEO (meta tags)

✅ Livrables :
- [ ] Composants créés/modifiés
- [ ] Page refactorisée
- [ ] Tests : page charge, composants se rendent
```

### Pattern 4 : Implémenter un module complet

```
Je vais implémenter le module [NOM] (ex: Posts & Idées).

📚 Contexte : 
- Lire : _ai/02 section [Module]
- Lire : database/schema.sql (tables pertinentes)
- Lire : _ai/03_prompts_modules/[module].md

🎯 Tâche :
Implémenter ce module en [N] routes API.
  Routes : [lister les endpoints]
  Tables : [lister les tables affectées]
  Tests : [types de tests]

✅ Livrables (chaque étape) :
  1. Migrations DB
  2. Routes + controllers + services
  3. Validation + erreurs
  4. Tests API
  5. Frontend pages + composants
  6. Docs dans _ai/40_journal_sessions/YYYY-MM-DD_[module].md
```

## ⚙️ Commandes de vérification

Avant de merger, lance :

```bash
# Linting
npm run lint

# Tests
npm run test

# Build (frontend)
npm run build

# Type check (si TypeScript future)
npm run type-check

# DB migrations status
npm run db:status

# Logs pour erreurs
npm run dev 2>&1 | grep -i error
```

## 🔄 Workflow typique

```
1. Prompt = tâche précise + références (_ai/)
   ↓
2. Claude lit fichiers, implemente
   ↓
3. Code livré : tests + docs + zéro console.log
   ↓
4. Tu valides : npm test, npm run lint
   ↓
5. Tu commits + mets à jour journal (_ai/40/)
   ↓
6. Prochain prompt = étape suivante (avec nouveaux fichiers en contexte)
```

## 🎯 Checklist avant chaque prompt

- [ ] Référencé les fichiers _ai/ (vision, contraintes, modules, prompts)
- [ ] Décrit la phase et l'étape (ex: "Phase 3.2")
- [ ] Listé les tables DB affectées
- [ ] Listé les fichiers à créer/modifier
- [ ] Demandé tests + docs
- [ ] Précisé format de réponse (code + tests + md)
- [ ] Pas de console.log, pas de TODOs
- [ ] Validé que aucun secret ne sera hard-codé

## 📊 Exemple complet : Phase 2.1 (Auth)

```
Je suis en Phase 2.1 (Authentification Backend).

📚 CONTEXTE :
Lire _ai/02_architecture_modules.md — Module 1 (Authentification & Utilisateurs)
Lire _ai/01_contraintes_generales.md — sections Auth, Backend API, Conventions
Lire database/schema.sql — table users

🎯 TÂCHE :
Implémenter routes auth backend (Node/Express).

Routes à créer :
  POST /api/v1/auth/register — Inscription
  POST /api/v1/auth/login — Connexion
  GET /api/v1/auth/me — Utilisateur actuel (protégé)

Tables : users, profiles (créées en Phase 1 → migrations)

✅ LIVRABLES ATTENDUS :
1. backend/src/routes/auth.js — Routes
2. backend/src/controllers/authController.js — Logique
3. backend/src/services/authService.js — Hash + JWT
4. backend/src/middleware/auth.js — Validation JWT
5. Tests : backend/tests/auth.test.js (Supertest)
6. Pas de console.log
7. Logs structurés (Winston)
8. Zéro credentials en dur

Documentation :
  - Mise à jour _ai/40_journal_sessions/YYYY-MM-DD_phase2_auth.md
  - Mise à jour CLAUDE.md avec instructions de setup
```

Avec ce template, tu obtiendras :
✅ Code structuré, testable
✅ Documentation à jour
✅ Prêt à merger
✅ Phase suivante claire
