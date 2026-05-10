# HTTP Security Headers — Citoyen Avisé Backend

Ce document explique les headers de sécurité HTTP implémentés dans le backend via Helmet.

---

## 🛡️ Helmet Middleware

**Helmet** aide à sécuriser une application Express en configurant divers headers HTTP.

### Installation

```bash
npm install helmet
```

### Configuration

```javascript
import helmet from 'helmet';
app.use(helmet());
```

---

## 📋 Headers Automatiques par Helmet

### 1. Content-Security-Policy (CSP)

**Objectif :** Prévenir les attaques XSS (Cross-Site Scripting)

```
Content-Security-Policy: default-src 'self'
```

**Explique :**
- `default-src 'self'` — Autorise les ressources depuis la même origine
- Bloque les scripts inline et externes non autorisés
- Prévient le chargement de ressources malveillantes

**Exemple d'attaque prévenue :**
```html
<!-- Bloqué: Script inline -->
<script>alert('XSS')</script>

<!-- Bloqué: Script depuis domaine externe -->
<script src="https://evil.com/malware.js"></script>
```

---

### 2. X-Frame-Options: DENY

**Objectif :** Prévenir le Clickjacking (UI Redressing)

```
X-Frame-Options: DENY
```

**Explique :**
- `DENY` — N'autorise pas à être affiché dans une iframe, même depuis la même origine
- Empêche un attaquant de placer le site dans une iframe transparente

**Exemple d'attaque prévenue :**
```html
<!-- Bloqué -->
<iframe src="https://citoyenavise.org"></iframe>
```

---

### 3. X-Content-Type-Options: nosniff

**Objectif :** Prévenir le MIME type sniffing

```
X-Content-Type-Options: nosniff
```

**Explique :**
- Force le navigateur à respecter le Content-Type déclaré
- Prévient l'interprétation incorrecte de fichiers

**Exemple :**
```
# Servir un fichier texte
Content-Type: text/plain
X-Content-Type-Options: nosniff
# → Navigateur affiche le texte, pas l'interprète comme script
```

---

### 4. Strict-Transport-Security (HSTS)

**Objectif :** Forcer HTTPS

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Explique :**
- `max-age=31536000` — Valide 1 an (31536000 secondes)
- `includeSubDomains` — S'applique aux sous-domaines
- Force le navigateur à utiliser HTTPS pour les requêtes futures

**Avantages :**
- Prévient les attaques Man-in-the-Middle (MITM)
- Prévient les downgrade attacks HTTP

---

### 5. X-XSS-Protection (Legacy)

**Objectif :** Support des navigateurs anciens

```
X-XSS-Protection: 1; mode=block
```

**Explique :**
- `1` — Active la protection XSS du navigateur
- `mode=block` — Bloque la page au lieu de la nettoyer
- Largement remplacée par CSP mais utilisée pour compatibilité

---

## 🔒 Custom Headers Supplémentaires

Au-delà de Helmet, nous ajoutons :

### 6. X-Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

**Objectif :** Contrôler l'information de référent

```
strict-origin-when-cross-origin:
- Envoie le referrer complet dans les requêtes du même site
- N'envoie que l'origine pour les requêtes cross-origin
- Pas de referrer pour HTTPS → HTTP
```

**Exemple :**

```
Utilisateur clique sur https://citoyenavise.org/petitions
↓
Navigue vers https://citoyenavise.org/signin
Referrer envoyé: https://citoyenavise.org/petitions ✅

Navigue vers https://other-site.com
Referrer envoyé: https://citoyenavise.org (origin seulement) ✅
```

### 7. Permissions-Policy (Feature Policy)

```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Objectif :** Contrôler les permissions du navigateur

```
geolocation=()      — Désactive l'accès à la géolocalisation
microphone=()       — Désactive l'accès au microphone
camera=()          — Désactive l'accès à la caméra
```

**Protège contre :**
- Scripts malveillants accédant au matériel
- Iframes malveillantes demandant des permissions

---

## 🧪 Test des Headers

### Vérifier les Headers

```bash
# Avec curl
curl -I http://localhost:5000

# Output:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# Content-Security-Policy: default-src 'self'
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Outils de Test

1. **OWASP Security Headers**
   - https://securityheaders.com/
   - Analyse ton site et donne une note

2. **Mozilla Observatory**
   - https://observatory.mozilla.org/
   - Scan de sécurité complet

3. **Chrome DevTools**
   - F12 → Network → Headers

---

## 🚀 Configuration Helmet Avancée

### Personnaliser Helmet

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "trusted-scripts.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,  // 1 year
    includeSubDomains: true,
    preload: true,     // HSTS Preload list
  },
  frameguard: {
    action: 'deny',
  },
}));
```

---

## 📊 Headers Résumé

| Header | Valeur | Objectif |
|--------|--------|----------|
| `Content-Security-Policy` | `default-src 'self'` | Prévenir XSS |
| `X-Frame-Options` | `DENY` | Prévenir Clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prévenir MIME sniffing |
| `Strict-Transport-Security` | `max-age=31536000` | Forcer HTTPS |
| `X-XSS-Protection` | `1; mode=block` | Support navigateurs anciens |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Contrôler referrer |
| `Permissions-Policy` | `geolocation=()` | Contrôler permissions |

---

## 🔍 Vulnérabilités Prévenues

### 1. Cross-Site Scripting (XSS)
```
Prévention: CSP + X-XSS-Protection
```

### 2. Clickjacking (UI Redressing)
```
Prévention: X-Frame-Options: DENY
```

### 3. MIME Type Sniffing
```
Prévention: X-Content-Type-Options: nosniff
```

### 4. Man-in-the-Middle (MITM)
```
Prévention: Strict-Transport-Security (HSTS)
```

### 5. Information Disclosure
```
Prévention: Referrer-Policy, Permissions-Policy
```

---

## 📚 Resources

- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [MDN: HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Security Headers](https://securityheaders.com/)

---

## ✅ Checklist Sécurité

- ✅ Helmet installé et configuré
- ✅ CSP en place
- ✅ HSTS activé
- ✅ Clickjacking prévenu
- ✅ MIME sniffing prévenu
- ✅ Headers testés avec curl/securityheaders.com
- ✅ Tests incluent vérification des headers

---

**Sécurité par défaut ! 🛡️**