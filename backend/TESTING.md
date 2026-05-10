# 🧪 Guide de Test — Citoyen Avisé Backend

Ce guide explique comment exécuter les tests du backend, notamment les tests CI/CD et E2E.

---

## 📊 Types de Tests

### **1. Tests Unitaires & Intégration**
Tests des fonctionnalités API individuelles.

```bash
npm test                  # Exécute tous les tests
npm run test:coverage     # Génère un rapport de couverture
```

**Fichiers de test :**
- `__tests__/api.test.js` — Tests API généraux
- `__tests__/petitions.test.js` — Tests pétitions
- `__tests__/auth.test.js` — Tests authentification
- etc.

**Couverture requise :** ≥ 80%

---

### **2. Tests CI/CD Pipeline**
Valide que tout le pipeline d'intégration continue fonctionne.

```bash
npm run test:ci          # Exécute les tests CI
```

**Tests inclus :**
- ✅ Linting avec ESLint
- ✅ Formatage avec Prettier
- ✅ Couverture de code > 80%
- ✅ Sécurité (npm audit)
- ✅ Qualité SonarQube
- ✅ Configuration de workflow

**Fichier :** `__tests__/ci.test.js`

---

### **3. Tests End-to-End (E2E)**
Teste les workflows complets utilisateur.

```bash
npm run test:e2e         # Exécute tous les tests E2E
```

**Tests inclus :**
- ✅ User can sign up via magic link
- ✅ User can create petition
- ✅ User can sign petition
- ✅ Duplicate signature rejected (409)
- ✅ Rate limiting works

**Fichier :** `__tests__/e2e.test.js`
**Framework :** Playwright (chromium, firefox, webkit, mobile)

---

## 🚀 Exécution

### **Tous les tests**
```bash
npm run test:all         # Tests unitaires + CI + E2E
```

### **Tests en mode CI**
```bash
CI=true npm run test     # Mode CI (sans cache, verbeux)
```

### **Tests avec couverture détaillée**
```bash
npm run test:coverage    # Génère: coverage/index.html
open coverage/index.html # Voir le rapport visuel
```

---

## 🔍 Tests E2E Détaillés

### **Prérequis**

1. **Backend en cours d'exécution :**
```bash
npm run start            # Port 5000
```

2. **Frontend en cours d'exécution :**
```bash
cd ../frontend
npm run dev              # Port 3001
```

3. **Base de données configurée :**
- PostgreSQL running
- `.env` properly configured
- Migrations exécutées

### **Exécuter les tests E2E**

```bash
# Mode normal
npm run test:e2e

# Mode verbose
npm run test:e2e -- --verbose

# Un seul test
npm run test:e2e -- --grep "sign petition"

# Mode headed (voir le navigateur)
npm run test:e2e -- --headed

# Un seul navigateur
npm run test:e2e -- --project chromium

# Déboguer
npm run test:e2e -- --debug
```

### **Voir les résultats**

```bash
# Après exécution, voir le rapport HTML
open test-results/index.html

# Ou relire les vidéos
npx playwright show-trace test-results/*.trace
```

---

## 📊 Rapports de Couverture

### **Générer le rapport**
```bash
npm run test:coverage
```

### **Consulter le rapport**
```bash
# HTML report
open coverage/index.html

# LCOV report
open coverage/lcov-report/index.html

# JSON format
cat coverage/coverage-final.json
```

### **Seuils minimum**
- **Lines** : 80%
- **Functions** : 80%
- **Branches** : 80%
- **Statements** : 80%

---

## 🔒 Tests de Sécurité

### **Audit npm**
```bash
npm run security:check   # Cherche les vulnérabilités

npm audit fix            # Corriger les vulnérabilités
npm audit fix --force    # Forcer la correction (risqué)
```

### **Vérifier Helmet & CORS**

Les tests CI/CD vérifient automatiquement :
- ✅ Helmet installé et configuré
- ✅ CORS sécurisé
- ✅ Rate limiting actif
- ✅ Headers HTTP de sécurité

---

## 🐛 Déboguer les Tests

### **Afficher les logs**
```bash
npm test -- --verbose
npm run test:ci -- --verbose
npm run test:e2e -- --debug
```

### **Exécuter un seul test**
```bash
# Jest
npm test -- --testNamePattern="should validate email"

# Playwright
npx playwright test __tests__/e2e.test.js -g "magic link"
```

### **Déboguer avec VS Code**
```bash
# Jest
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Playwright
npx playwright test --debug
```

---

## 📈 Métriques de Qualité

### **Coverage par module**
```bash
npm run test:coverage -- --verbose
# Vérifier coverage/index.html
```

### **Linting**
```bash
npm run lint             # Chercher les erreurs
npm run lint:fix         # Corriger automatiquement
```

### **Formatage**
```bash
npm run format           # Formater le code
```

---

## 🔗 Pipeline CI/CD (GitHub Actions)

Les tests s'exécutent automatiquement sur :
- Push sur `main` ou `develop`
- Pull requests

**Voir `.github/workflows/ci.yml`**

Tests exécutés :
1. ✅ Linting (ESLint)
2. ✅ Tests (Jest)
3. ✅ Coverage (>80%)
4. ✅ Security (Snyk, npm audit)
5. ✅ Code Quality (SonarQube)

---

## 📝 Écrire de Nouveaux Tests

### **Test unitaire (Jest)**
```javascript
describe('My feature', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

### **Test E2E (Playwright)**
```javascript
test('user can do something', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.fill('input[name="email"]', 'test@test.com');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('http://localhost:3001/success');
});
```

---

## 🆘 Troubleshooting

### **Tests timeout**
```bash
npm test -- --testTimeout=10000    # 10 secondes
```

### **E2E ne démarre pas**
```bash
# Vérifier que le backend tourne
curl http://localhost:5000/health

# Vérifier que le frontend tourne
curl http://localhost:3001
```

### **Couverture incomplète**
```bash
# Vérifier quels fichiers ne sont pas testés
npm run test:coverage
# Voir coverage/index.html pour les lignes non couvertes
```

### **Tests flaky (instables)**
- Augmenter les timeouts
- Ajouter des retries
- Utiliser waitFor au lieu de delay

---

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Testing](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Bonne chance avec les tests ! 🎉**
