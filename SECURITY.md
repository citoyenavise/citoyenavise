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

## 🚀 CI/CD Security Gates

### Workflow GitHub Actions

La CI exécute automatiquement :

```yaml
snyk auth $SNYK_TOKEN           # Authentication
snyk test --severity-threshold=high  # Détect vulnérabilités críticas
snyk monitor                    # Suivi dependencies sur dashboard
```

**Comportement :**
- ❌ **FAIL** : Vulnérabilités **HIGH** détectées
- ⚠️ **WARN** : Vulnérabilités MEDIUM/LOW (continue)
- ✅ **PASS** : Aucune vulnérabilité HIGH

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
