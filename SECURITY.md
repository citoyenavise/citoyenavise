# Security Policy

## 🔒 Vulnerability Disclosure

Si vous découvrez une vulnérabilité de sécurité dans Citoyen Avisé, **ne créez pas d'issue publique**. 

Veuillez envoyer un email à : **infocitoyenavise@gmail.com** avec les détails :
- Description de la vulnérabilité
- Étapes pour reproduire
- Impact potentiel
- Votre nom/organisation (optionnel)

Nous remercions la communauté de sécurité pour son aide responsable.

---

## 🛡️ Snyk Security Scanning

### Configuration

Le projet utilise **Snyk** pour scanner automatiquement les vulnérabilités dans les dépendances npm.

#### 1. Authentification Snyk

Ajoute le secret `SNYK_TOKEN` dans GitHub :

```bash
# Login sur Snyk
snyk auth

# La CLI affichera ton token, copie-le

# Dans GitHub Settings → Secrets and variables → Actions
# Crée un nouveau secret:
# Name: SNYK_TOKEN
# Value: [ton token snyk]
```

#### 2. Configuration Locale

```bash
# Login localement
snyk auth

# Scan backend
cd backend
snyk test

# Scan frontend
cd frontend
snyk test

# Monitor dependencies (sauvegarde snapshot dans Snyk dashboard)
snyk monitor
```

#### 3. Policy File (.snyk)

Le fichier `.snyk` contient :
- ✅ Seuils de sévérité (high/medium/low)
- ✅ Vulnérabilités ignorées (faux positifs)
- ✅ Dates d'expiration pour re-évaluation
- ✅ Configurations par projet

Pour **ignorer une vulnérabilité** :

```yaml
# .snyk
- SNYK-JS-PACKAGENAME-XXXXXX:
    - reason: Explication du faux positif
    - expires: 2026-06-10
```

Puis relance `snyk test`.

---

## 🚀 CI/CD Security & Quality Gates

### Workflow GitHub Actions Complet

La CI exécute automatiquement plusieurs gates en parallèle :

```
Push to develop → GitHub Actions triggered
   ├─ Backend Tests (Jest + Coverage)
   ├─ Frontend Tests (Vitest + Coverage)
   ├─ Snyk Security Scan
   │  ├─ Vulnerability detection (HIGH threshold)
   │  └─ Dependency monitoring
   ├─ SonarQube Code Quality
   │  ├─ Bug detection
   │  ├─ Coverage verification (≥80%)
   │  ├─ Quality gates enforcement
   │  └─ Code smell analysis
   └─ Codecov Upload (depends on all above)

All jobs must pass ✅ → Ready to merge
```

### Snyk Vulnerability Detection

```yaml
snyk auth $SNYK_TOKEN           # Authentication
snyk test --severity-threshold=high  # Détect vulnérabilités críticas
snyk monitor                    # Suivi dependencies sur dashboard
```

**Comportement :**
- ❌ **FAIL** : Vulnérabilités **HIGH** détectées
- ⚠️ **WARN** : Vulnérabilités MEDIUM/LOW (continue)
- ✅ **PASS** : Aucune vulnérabilité HIGH

### SonarQube Code Quality

```yaml
sonar-scanner \
  -Dsonar.projectKey=citoyenavise-backend \
  -Dsonar.login=$SONARQUBE_TOKEN
```

**Comportement :**
- ❌ **FAIL** : Quality gate échoue (coverage <80%, bugs détectés, etc.)
- ✅ **PASS** : Quality gate réussi

---

## 🔍 SonarQube Code Quality Analysis

### Configuration

Le projet utilise **SonarQube** pour analyser la qualité du code, détecter les bugs et les vulnérabilités.

#### 1. Setup SonarQube Server

**Option A : SonarQube Cloud (Recommandé)**

```bash
# Crée un compte sur SonarQube Cloud
# https://sonarcloud.io

# Génère un token d'authentification
# Settings → Security → Tokens
```

**Option B : SonarQube Server (Self-hosted)**

```bash
# Installation locale
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest

# Login sur http://localhost:9000
# Admin / admin (default)

# Crée un nouveau projet
# Administration → Projects → Create Project
```

#### 2. Authentification GitHub Secrets

Ajoute les secrets dans GitHub :

```
Settings → Secrets and variables → Actions → New repository secret

Name: SONARQUBE_HOST_URL
Value: https://sonarcloud.io  # ou ton serveur self-hosted

Name: SONARQUBE_TOKEN
Value: [token généré dans SonarQube]
```

#### 3. Configuration Locale

```bash
# Scan backend
cd backend
npm install -g sonarqube-scanner
sonar-scanner \
  -Dsonar.projectKey=citoyenavise-backend \
  -Dsonar.sources=src \
  -Dsonar.tests=__tests__ \
  -Dsonar.login=$SONARQUBE_TOKEN

# Scan frontend
cd ../frontend
sonar-scanner \
  -Dsonar.projectKey=citoyenavise-frontend \
  -Dsonar.sources=src \
  -Dsonar.tests=__tests__ \
  -Dsonar.login=$SONARQUBE_TOKEN
```

#### 4. Fichiers de Configuration

Les fichiers `sonar-project.properties` contiennent :

**Backend (`backend/sonar-project.properties`):**
- ✅ `sonar.projectKey=citoyenavise-backend`
- ✅ `sonar.sources=src` — Code source
- ✅ `sonar.tests=__tests__` — Tests
- ✅ `sonar.javascript.lcov.reportPaths=coverage/lcov.info` — Coverage
- ✅ `sonar.coverage.exclusions=**/*.test.js` — Exclure tests
- ✅ `sonar.qualitygate.wait=true` — Attendre quality gate

**Frontend (`frontend/sonar-project.properties`):**
- ✅ `sonar.projectKey=citoyenavise-frontend`
- ✅ `sonar.sources=src` — Code React
- ✅ `sonar.tests=__tests__` — Tests Vitest
- ✅ `sonar.javascript.file.suffixes=.js,.jsx` — Support JSX

### Quality Gates

SonarQube applique automatiquement des "Quality Gates" :

```
✅ Code Coverage      ≥ 80%
✅ Maintainability    A (excellent)
✅ Reliability        A (no bugs)
✅ Security Rating    A (no vulnerabilities)
❌ Technical Debt     < 5 jours
```

**Comportement CI/CD :**
- ✅ Quality gate **PASSED** → Merge autorisé
- ❌ Quality gate **FAILED** → Merge bloqué

---

## 📊 SonarQube Dashboard

Accède à ton [SonarQube Dashboard](https://sonarcloud.io) pour :

- 📊 Analyse détaillée du code
- 🐛 Détection des bugs
- 🔒 Vulnérabilités de sécurité
- 📈 Tendances de qualité
- 🔄 Historique des analyses
- ⚠️ Code smells et duplications

### Exemple de Rapport

```
Project: citoyenavise-backend
├─ Quality Gate: PASSED ✅
├─ Coverage: 85% (target: 80%)
├─ Bugs: 0
├─ Vulnerabilities: 0
├─ Code Smells: 12
├─ Duplicated Lines: 2.5%
└─ Maintainability Rating: A
```

---

## 📊 Snyk Dashboard

Accède au [Snyk Dashboard](https://app.snyk.io) pour :

- 📈 Historique des vulnérabilités
- 📅 Timeline des menaces
- 🔔 Alertes automatiques
- 🔧 Recommendations de patches
- 📋 Reports pour compliance

---

## 🔄 Dependency Updates

### Patches Automatiques

Snyk propose automatiquement des PR pour :
- ✅ Patches de sécurité
- ✅ Minor version updates
- ✅ Dependency upgrades

### Processus

1. Snyk crée une PR avec les mises à jour
2. Tests CI passent ✅
3. Review et merge
4. Snyk ferme l'issue

---

## 📋 Supported Versions

| Version | Support | Patch |
|---------|---------|-------|
| 1.x.x   | ✅ LTS  | Security patches |
| 0.x.x   | ❌ EOL  | No support |

---

## 🎯 Security Best Practices

### Code Review
- ✅ Require 2 approvals pour merge
- ✅ Run all security checks
- ✅ No secrets in commits

### Dependencies
- ✅ Keep npm packages à jour
- ✅ Audit regulièrement : `npm audit`
- ✅ Snyk monitoring actif

### Environment Variables
- ✅ `.env` never committed
- ✅ Secrets in GitHub Secrets
- ✅ Rotate tokens regulièrement

### Database
- ✅ PostgreSQL connection sécurisée
- ✅ SQL injection prevention (Sequelize ORM)
- ✅ Encrypted sensitive fields

### API
- ✅ JWT authentication
- ✅ CORS properly configured
- ✅ Rate limiting (to implement)
- ✅ Input validation (Zod)

---

## 🔗 Resources

- [Snyk Documentation](https://docs.snyk.io)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [GitHub Security](https://github.com/features/security)

---

## 📞 Support

- 🐛 Report bugs: [Create Issue](https://github.com/citoyenavise/citoyenavise/security/advisories)
- 💬 Questions: [Discussions](https://github.com/citoyenavise/citoyenavise/discussions)
- 📧 Email: infocitoyenavise@gmail.com

---

**Last Updated:** 2026-05-10  
**Maintained by:** Citoyen Avisé Team
