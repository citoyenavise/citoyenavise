# 🔐 REVERSE PROXY & SSL SETUP

**Production HTTPS Configuration for Citoyenavise.org**

---

## 📋 DEPLOYMENT SCENARIO

### Current: Render (Managed)
- ✅ **HTTPS:** Automatic (Let's Encrypt, Render-managed)
- ✅ **Reverse Proxy:** Render CDN (no config needed)
- ✅ **Redirects:** HTTP → HTTPS (automatic)
- ✅ **HSTS:** Render applies (auto)
- ✅ **Domains:** Custom domain via CNAME to Render

**Result:** citoyenavise.org automatically HTTPS with valid certificate.

### Future: Self-Hosted (VPS)
- If migrating to VPS/Docker Swarm:
  - Use Caddy (auto-HTTPS) or Nginx (manual config)
  - Frontend: Static files
  - Backend: Node.js :5000 (internal)

---

## 🚀 RENDER SSL SETUP (CURRENT)

### Domain Configuration

**1. Render Dashboard**
```
Service → Settings → Custom Domains
  Add: citoyenavise.org
  → Render provides CNAME target
```

**2. DNS Registrar**
```
Create CNAME record:
  Domain: citoyenavise.org
  Type: CNAME
  Value: [service-id].onrender.com
  TTL: 3600
```

**3. Verification**
```bash
# Wait 10-30 min for DNS propagation
nslookup citoyenavise.org
# → Resolves to Render IP

curl -I https://citoyenavise.org
# → HTTP/2 200
# → Certificate: Let's Encrypt
# → HSTS header present
```

### SSL Certificate Details
```
Provider: Let's Encrypt
Renewal: Automatic (90 days)
Chain: Full (no mixed content)
TLS Version: 1.2+
Ciphers: Modern (TLS 1.3)
```

---

## 🛡️ SECURITY HEADERS (Render Automatic)

**Render applies automatically:**

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Application-level (Backend Helmet):**

Already configured in `backend/src/core/middleware/securityHeaders.js`:
```javascript
helmet({
  contentSecurityPolicy: { ... },
  hsts: { maxAge: 31536000 },
  frameguard: { action: 'deny' },
  ...
})
```

---

## 🔄 REDIRECT HTTP → HTTPS

**Render automatic:**
- All `http://` requests → `https://`
- No config needed
- Transparent to backend

**Verify:**
```bash
curl -I http://citoyenavise.org
# → HTTP/1.1 308 Permanent Redirect
# → Location: https://citoyenavise.org
```

---

## 📋 FUTURE: CADDY SETUP (VPS Migration)

### If scaling to VPS: Caddy Configuration

**File:** `infra/proxy/Caddyfile`

```caddy
citoyenavise.org {
  # Auto HTTPS (Let's Encrypt)
  
  # Reverse proxy to backend
  reverse_proxy localhost:5000 {
    # Pass original headers
    header_up X-Forwarded-For {http.request.remote.host}
    header_up X-Forwarded-Proto {http.request.proto}
    header_up X-Forwarded-Host {http.request.host}
  }
  
  # Security headers
  header / Strict-Transport-Security "max-age=31536000; includeSubDomains"
  header / X-Frame-Options "DENY"
  header / X-Content-Type-Options "nosniff"
  header / Referrer-Policy "strict-origin-when-cross-origin"
  
  # Logging
  log {
    output file /var/log/caddy/access.log
    format json
  }
  
  # Compression
  encode gzip
}

# Redirect www
www.citoyenavise.org {
  redir https://citoyenavise.org{uri} permanent
}
```

### Docker Compose with Caddy (Reference)

```yaml
version: '3.8'
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/proxy/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - citoyenavise

  backend:
    # ... existing config
    networks:
      - citoyenavise

volumes:
  caddy_data:
  caddy_config:

networks:
  citoyenavise:
```

---

## 📋 FUTURE: NGINX SETUP (VPS)

### If preferring Nginx: Configuration

**File:** `infra/proxy/nginx.conf`

```nginx
upstream backend {
  least_conn;
  server localhost:5000 max_fails=3 fail_timeout=30s;
  keepalive 32;
}

# Redirect HTTP → HTTPS
server {
  listen 80 default_server;
  server_name citoyenavise.org www.citoyenavise.org;
  return 301 https://$host$request_uri;
}

# HTTPS
server {
  listen 443 ssl http2;
  server_name citoyenavise.org;
  
  # SSL certificates (Let's Encrypt via Certbot)
  ssl_certificate /etc/letsencrypt/live/citoyenavise.org/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/citoyenavise.org/privkey.pem;
  
  # SSL configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;
  
  # HSTS
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  
  # Security headers
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  
  # Gzip compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss;
  
  # Reverse proxy
  location / {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    
    # Headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Keep-alive
    proxy_set_header Connection "";
  }
  
  # API rate limiting
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
  limit_req zone=api_limit burst=10 nodelay;
  
  # Logging
  access_log /var/log/nginx/citoyenavise.access.log combined;
  error_log /var/log/nginx/citoyenavise.error.log warn;
}

# Redirect www → naked domain
server {
  listen 443 ssl http2;
  server_name www.citoyenavise.org;
  ssl_certificate /etc/letsencrypt/live/citoyenavise.org/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/citoyenavise.org/privkey.pem;
  return 301 https://citoyenavise.org$request_uri;
}
```

---

## 🔐 SSL CERTIFICATE MANAGEMENT

### Render (Current)
- ✅ **Auto-renewal:** 30 days before expiry
- ✅ **No action needed:** Render manages everything
- ✅ **Monitoring:** Render alerts on issues

### VPS (Certbot)
```bash
# Install
sudo apt-get install certbot python3-certbot-nginx

# Initial cert
sudo certbot certonly --standalone -d citoyenavise.org

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Manual renewal
sudo certbot renew --dry-run
```

---

## ✅ DEPLOYMENT CHECKLIST

### Render (Current)
- [x] Domain citoyenavise.org DNS configured (CNAME)
- [x] Custom domain added in Render dashboard
- [x] SSL certificate auto-generated
- [x] HTTP → HTTPS redirect working
- [x] Security headers present
- [x] No mixed content (all HTTPS)

### Pre-Launch
```bash
# Verify HTTPS
curl -I https://citoyenavise.org/

# Verify certificate
openssl s_client -connect citoyenavise.org:443 | grep -A 2 "Issuer"
# → Issuer should be: Let's Encrypt

# Verify no warnings
curl -vvv https://citoyenavise.org/ 2>&1 | grep -i "warning\|error"
# → Should have none

# Test API endpoint
curl -I https://citoyenavise.org/api/v1/health
# → HTTP/2 200
```

---

## 📊 MONITORING SSL

### Render Dashboard
- Service → Overview
- Shows: Certificate expiry, TLS version, chain status

### External Monitoring (Optional)
```bash
# SSL Labs (qualitative)
https://www.ssllabs.com/ssltest/analyze.html?d=citoyenavise.org

# Cert transparency logs
https://crt.sh/?q=citoyenavise.org

# Certificate validity
curl -s "https://citoyenavise.org" | openssl x509 -noout -dates
```

---

**Reverse Proxy & SSL automatically configured via Render.** ✅

