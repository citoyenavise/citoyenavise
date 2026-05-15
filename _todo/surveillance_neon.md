# Surveillance post-migration Neon — 7 jours

> **Migration effectuée** : 2026-05-14 22:06 EDT (commit `44f3e80`)
> **Cible** : 2026-05-21 — feu vert pour suppression BD Render Free
> **Référence** : SYNTHESE_OFFICIELLE.md §14 #23

---

## Checkpoints

### J+1 — 2026-05-16 (vendredi)
**Type** : check rapide (~5 min)

Commandes :
- `Invoke-RestMethod -Uri "https://api.citoyenavise.org/health" -Method GET -TimeoutSec 30`
  → attendu : `status: ok`, `database.status: connected`, `responseTime < 200ms`
- Ouvrir https://dashboard.render.com/web/srv-d7tq5p6gvqtc73brefcg/logs → filtrer dernière 24h
  → attendu : 0 `SequelizeConnectionError` / 0 `Connection terminated unexpectedly`

Critère pass : pas d'erreur BD + /health OK.

---

### J+3 — 2026-05-18 (dimanche)
**Type** : check approfondi (~15 min)

Commandes :
- `/health` + `/api/v1/petitions` (count=3) + `/api/v1/elus` (count=6) + `/api/v1/circonscriptions`
- Render logs : recherche `error`, `terminated`, `Sequelize`, `ECONNREFUSED` sur 48h
- Neon dashboard : Usage → compute hours (attendu < 5 % du quota mensuel)
- Neon SQL Editor : `SELECT COUNT(*) FROM petitions WHERE status = 'published';` → 3
- Neon SQL Editor : `SELECT COUNT(*) FROM elus;` → 6

Critère pass : counts identiques + 0 erreur 48h + usage Neon raisonnable.

---

### J+7 — 2026-05-21 (jeudi)
**Type** : audit final + décision suppression Render BD (~30 min)

Vérifications complètes :
- Mêmes checks que J+3
- Render logs 7 jours : 0 erreur fatale
- Neon Monitoring → graphes connexions, requêtes/s, latence (rien d'anormal)
- Confirmation backup local : `_brouillons/backup_render_20260514.sql` (64 KB) toujours présent

**Action si pass** :
1. Dashboard Render → Database `dpg-d7tvmg1kh4rs738bk0h0-a` (Citoyenavise DB)
2. Settings → Delete database (confirmation manuelle, type nom complet)
3. Mettre à jour SYNTHESE_OFFICIELLE.md §14 #23 + §16 priorité immédiate (retirer la ligne 🟡)
4. Mettre à jour journal §22 avec date suppression effective

---

## Critères de ROLLBACK (si Neon plante avant J+7)

**Symptômes déclencheurs** :
- `/health` répond `database.status != connected` plusieurs minutes consécutives
- Logs Render répétés `SequelizeConnectionError` ou `Connection terminated unexpectedly`
- Latence DB > 500 ms soutenue (Neon Frankfurt → Render Frankfurt devrait être < 50 ms)
- Neon dashboard montre dépassement quota ou suspension projet

**Procédure rollback** (la BD Render Free est encore vivante jusqu'au 2026-06-05) :

1. Dashboard Render BD `dpg-d7tvmg1kh4rs738bk0h0-a` → onglet **Info**
2. Copier l'**Internal Database URL** (jamais External — règle §6.4 CLAUDE.md)
3. Dashboard Render backend `citoyenavise-backend-1` → Environment
4. Remplacer `DATABASE_URL` par l'Internal URL Render copiée
5. Save Changes → Manual Deploy
6. Vérifier `/health` après ~3 min
7. Si rollback nécessaire avant J+7 : la BD Render est encore à jour (Neon ne reçoit que des changements minimes en pilote)
8. Si rollback nécessaire après J+7 et BD Render supprimée : restore depuis `_brouillons/backup_render_20260514.sql` vers une nouvelle BD Render ou re-création Neon (procédure plus longue)

**Note** : tout rollback doit être consigné en journal §22 SYNTHESE_OFFICIELLE.md.

---

## Statut courant

| Date | Check | Résultat | Notes |
|------|-------|----------|-------|
| 2026-05-14 22:06 EDT | T+0 migration | ✅ OK | dump 64 KB, restore 54s, /health OK, /petitions 3 items |
| 2026-05-14 22:43 EDT | T+0 post-commit `44f3e80` | ✅ OK | redeploy backend, /health 200, latence 27 ms, Neon usage 0.02 % |
| 2026-05-16 | J+1 | _en attente_ | — |
| 2026-05-18 | J+3 | _en attente_ | — |
| 2026-05-21 | J+7 | _en attente_ | — |
