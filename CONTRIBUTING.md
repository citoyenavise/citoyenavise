# Guide de Contribution — Citoyen Avisé

Merci d'intéresser à contribuer au projet Citoyen Avisé ! Ce document explique les standards de code et le processus de contribution.

---

## 📝 Code Style Standards

Le projet utilise **ESLint** et **Prettier** pour maintenir une cohérence de code.

### ESLint (Code Quality)

```bash
# Check code
npm run lint

# Check and fix automatically
npm run lint:fix
```

**Rules principales :**
- ✅ `no-console: warn` — console.log autorisé mais signalé
- ✅ `no-unused-vars: error` — Variables non utilisées interdites
- ✅ `prefer-const: error` — Utilise const au lieu de let si possible
- ✅ `arrow-body-style: warn` — Préfère fonction concise

### Prettier (Code Formatting)

```bash
# Format all code
npm run format
```

**Configuration :**
```json
{
  "tabWidth": 2,
  "singleQuote": true,
  "trailingComma": "es5",
  "semi": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Exemple :**
```javascript
// ❌ Bad
const greeting = (name) =>{ return `Hello ${name}` }
let x = 5;

// ✅ Good
const greeting = (name) => `Hello ${name}`;
const x = 5;
```

---

## 🎯 Pre-commit Hooks avec Husky

Le projet utilise **Husky** pour exécuter automatiquement les vérifications avant chaque commit.

### Comportement Automatique

```bash
git add .
git commit -m "feat: new feature"

# Husky runs automatically:
# 1. prettier --write (format staged files)
# 2. eslint --fix (lint and fix)
# 3. git add (re-stage fixed files)
# ✅ Commit proceeds if successful
```

### Si Erreurs ESLint

```bash
# If ESLint finds errors that can't be auto-fixed:
# ❌ Commit blocked
# 📝 Fix errors manually
# 🔄 Re-run: npm run lint:fix
# ✅ Try commit again
```

### Bypass Hooks (si nécessaire)

```bash
# Skip pre-commit checks
git commit --no-verify

# ⚠️  Not recommended! Use only for:
# - Emergency hotfixes
# - Temporary work
# - CI/CD overrides
```

---

## 🔄 Workflow Contribution

### 1. Fork & Clone

```bash
git clone https://github.com/citoyenavise/citoyenavise.git
cd citoyenavise
```

### 2. Setup Environment

```bash
# Install all dependencies + Husky hooks
npm run install:all

# Or manually:
npm install
npm --prefix backend install
npm --prefix frontend install
npx husky install
```

### 3. Create Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Naming convention:
# feature/add-user-auth
# fix/button-styling
# docs/readme-update
```

### 4. Development

```bash
# Start dev server
npm run dev

# During development:
npm run lint        # Check code
npm run lint:fix    # Auto-fix issues
npm run format      # Format code
npm run test        # Run tests
npm run security:check  # Check vulnerabilities
```

### 5. Commit

```bash
git add .
git commit -m "feat: description of changes"

# Commit message format:
# feat: new feature
# fix: bug fix
# docs: documentation
# style: formatting/whitespace (auto-handled by Prettier)
# refactor: code reorganization
# test: test additions
# chore: dependencies/build changes

# Husky runs automatically:
# ✅ Prettier formats code
# ✅ ESLint fixes issues
# ✅ Commit succeeds
```

### 6. Push & Create PR

```bash
git push origin feature/your-feature-name

# On GitHub:
# 1. Create Pull Request
# 2. Describe changes
# 3. Wait for CI/CD checks
# 4. Address review comments
# 5. Merge after approval
```

---

## ✅ Pre-Commit Checklist

Avant chaque commit, vérifiez :

- [ ] `npm run lint:fix` — Code conforme aux règles
- [ ] `npm run format` — Code bien formaté
- [ ] `npm run test` — Tests réussissent
- [ ] `npm run security:check` — Pas de vulnérabilités
- [ ] Commit message clair et descriptif
- [ ] Pas de fichiers sensibles (.env, clés privées)

---

## 🧪 Tests

```bash
# Run tests
npm run test

# With coverage
npm run test:coverage

# Watch mode (during development)
npm run test -- --watch
```

**Requirement :** Minimum 80% coverage requis pour CI/CD

---

## 🔒 Security

```bash
# Check vulnerabilities
npm run security:check

# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## 📋 Code Review Checklist

### Pour les Reviewers

- [ ] Code follows ESLint rules
- [ ] Tests are included
- [ ] Coverage >= 80%
- [ ] No console.log left (except logging services)
- [ ] Commit messages are clear
- [ ] No breaking changes without discussion
- [ ] Documentation updated if needed

---

## 🛠 Useful Commands

```bash
# Root level
npm run lint          # Lint both projects
npm run lint:fix      # Auto-fix both projects
npm run format        # Format both projects
npm run test          # Run backend tests
npm run security:check # Check vulnerabilities
npm run dev           # Start dev servers

# Backend
cd backend
npm run lint          # Check code
npm run lint:fix      # Auto-fix
npm run format        # Format
npm run test          # Run tests
npm run dev           # Start server

# Frontend
cd frontend
npm run lint          # Check code
npm run lint:fix      # Auto-fix
npm run format        # Format
npm run test          # Run tests
npm run dev           # Start dev server
```

---

## 📞 Questions or Issues?

- 📧 Email: infocitoyenavise@gmail.com
- 💬 GitHub Discussions: [Link](https://github.com/citoyenavise/citoyenavise/discussions)
- 🐛 Report Bugs: [Create Issue](https://github.com/citoyenavise/citoyenavise/issues)

---

## 📚 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)

---

**Thanks for contributing to Citoyen Avisé! 🙏**