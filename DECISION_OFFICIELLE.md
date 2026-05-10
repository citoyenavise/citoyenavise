# 📌 DÉCISION OFFICIELLE — Restart Architecture

**Date** : 2026-05-09  
**Décision Maker** : Dave (Citoyen Avisé)  
**Architecture Choisie** : **Option A — Restart Minimal**

---

## ✅ DÉCISION PRISE

### Ce Qui Reste

```
BACKEND :
✅ src/server.js        (Express simple — 64 lignes)
✅ src/config/env.js    (Configuration)
✅ src/middlewares/     (auth, logger, validation)
✅ src/routes/          (API endpoints — À implémenter)
✅ Node.js 18+
✅ Express 4.18+
✅ PostgreSQL 12+
✅ JWT + bcrypt

FRONTEND :
✅ React 18.2
✅ Vite 5.0
✅ TailwindCSS 3.3
✅ Zustand (state)

PAGES STATIQUES :
✅ 40 fichiers HTML (gouvernement, droits, etc.)
```

### Ce Qui Est Supprimé

```
❌ app.js (440 lignes hyper-complexe)
❌ core/ (50+ modules inutiles)
❌ Orchestrator, StateMachine, CAAGS
❌ 11 PHASES de spécifications
❌ 300+ documents de phases
❌ SystemBootstrap, bootstrap.js
❌ moduleLoader.js
❌ database/ complexity
❌ events/, handlers/, system/, phases/
```

---

## 🎯 Objectifs

| Objectif | Status | Target |
|---|---|---|
| **MVP Fonctionnel** | 🔄 En cours | Jour 30 |
| **Authentification** | ⏳ À faire | Jour 10 |
| **CRUD Métier** | ⏳ À faire | Jour 17 |
| **Frontend Basique** | ⏳ À faire | Jour 23 |
| **Tests + Docs** | ⏳ À faire | Jour 28 |
| **Lancement Beta** | ⏳ À faire | Jour 30 |

---

## 📊 Bénéfices Attendus

| Métrique | Avant | Après | Gain |
|---|---|---|---|
| **Fichiers JS** | 683 | ~50 | -92% ✅ |
| **Dépendances** | 200+ | 15 | -90% ✅ |
| **Lignes code** | 50,000+ | ~3,000 | -94% ✅ |
| **Démarrage** | 5-10s | <1s | 5-10x ✅ |
| **Ajout feature** | 2-3 jours | 2-3 heures | 10x ✅ |
| **Onboarding** | 3 semaines | 3 jours | 7x ✅ |
| **Maintenance** | 🔴 Impossible | 🟢 Facile | ∞ ✅ |

---

## 📝 Git Commits Effectués

```
✅ cc5e6eb — chore: restart with minimal server.js architecture
   - Supprime app.js, core/, 5 fichiers complexes
   - Met à jour package.json (type=module, main=server.js)
   - Met à jour CLAUDE.md avec nouvelle architecture
```

---

## 🚀 Prochaines Étapes (Immédiat)

### Jour 1 : Setup Backend (Commencer MAINTENANT)

```bash
cd backend

# 1. Créer .env
cat > .env << EOF
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/citoyenavise_dev
JWT_SECRET=$(openssl rand -hex 32)
EOF

# 2. Installer dépendances
npm install

# 3. Tester serveur
npm run dev
# → Doit afficher :
# ╔════════════════════════════════════════╗
# ║  Citoyen Avisé - Backend API           ║
# ║  Port: 5000                            ║
# ╚════════════════════════════════════════╝

# 4. Tester en autre terminal
curl http://localhost:5000/health
# Doit retourner : {"status":"ok",...}
```

### Jour 1-2 : Setup PostgreSQL

```bash
# 1. Créer base
createdb citoyenavise_dev

# 2. Activer PostGIS
psql citoyenavise_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 3. Tester connexion
psql citoyenavise_dev -c "SELECT 1;"
# Doit retourner : 1
```

### Jour 2-3 : Créer Routes Stubs

```
backend/src/routes/
├── index.js       (importer toutes les routes)
├── auth.js        (POST /register, POST /login)
├── users.js       (GET, POST, PUT, DELETE)
├── posts.js       (GET, POST, PUT, DELETE)
└── votes.js       (POST /vote, GET /results)
```

---

## 📚 Documents de Référence

| Document | Lien | Usage |
|---|---|---|
| **CLAUDE.md** | `.claude/CLAUDE.md` | Guide développement |
| **Roadmap** | `ROADMAP_EXECUTION_30JOURS.md` | Plan détaillé |
| **Audit** | `AUDIT_STRATEGIQUE_OFFICIEL.md` | Contexte décision |
| **Rapport Complet** | `RAPPORT_COMPLET_CITOYENAVISE.md` | Analyse initiale |

---

## ✋ Point d'Arrêt : Validez Avant Jour 4

**Avant de continuer, validez** :

- [ ] `npm run dev` démarre sans erreur
- [ ] `curl http://localhost:5000/health` retourne 200
- [ ] Base PostgreSQL créée et connectée
- [ ] Fichier `.env` configuré
- [ ] Routes stubs créées (5 fichiers)
- [ ] Tous les fichiers compileront sans erreurs

**Si tous les points sont ✅** : Continuez avec Jour 4 (AuthService)

**Si blocage** : Demandez support à Claude

---

## 🎓 Principes de Développement

```
1. Simple > Complexe
   └─ Préférer 50 lignes claires à 1 ligne "intelligente"

2. Fonctionnel > Parfait
   └─ MVP qui marche > architecture parfaite qui ne marche pas

3. Itératif > En bloc
   └─ Commit quotidien > 1 gros commit à la fin

4. Testé > Non-testé
   └─ Tester en Postman avant committer

5. Documenté > Opaque
   └─ Chaque route documentée = pas de questions
```

---

## 📞 Escalation & Support

**Problème ?** Niveaux de support :

1. **Erreur simple** (npm install failed) → Relire message d'erreur + Google
2. **Architecture question** (comment structurer X ?) → Demander à Claude
3. **Bug vrai** (route retourne 500) → Déboguer localement, partager stacktrace
4. **Performance** (serveur lent) → Partager metrics

---

## 🎯 Vision Finale

```
Jour 1  ┤ Server démarre, BD connectée
        │
Jour 10 ├ Utilisateurs peuvent se connecter
        │
Jour 17 ├ Utilisateurs peuvent créer posts, voter
        │
Jour 23 ├ Interface Web fonctionnelle
        │
Jour 28 ├ Tests + Documentation
        │
Jour 30 └ 🚀 Citoyen Avisé LIVE avec utilisateurs réels

Au lieu de :

PHASE 1 ┤ Governance framework (...)
        │ PHASE 2.1 ┤ SystemBootstrap
        │ PHASE 3 ┤ Resilience
        │ PHASE 5 ┤ Control plane
        │ ... 11 PHASES ...
        │
PHASE 11.7 └ "Architecture complète" (personne ne l'utilise)
```

---

## ✍️ Signature

**Décision prise le** : 2026-05-09  
**Par** : Dave (Citoyen Avisé)  
**Architecture** : Option A — Restart Minimal  
**Deadline** : 30 jours vers MVP  

**Engagement** : ✅ Pas de retour en arrière, pas d'ajout de complexity

---

**Status** : 🟢 **PRÊT POUR JOUR 1 — COMMENCEZ MAINTENANT**
