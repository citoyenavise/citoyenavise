# Citoyen Avise - APPLY PROD : import federal avec purge + extras
#
# IRREVERSIBLE :
#   1. TRUNCATE TABLE elus RESTART IDENTITY CASCADE (supprime les 6 seeds)
#   2. Import ~343 deputes via openparliament.ca
#   3. Import 106 extras via data/federal-extras.csv (senateurs, GG, juges)
#   4. Total cible : 449 elus federaux 45e legislature
#
# Confirmation interactive obligatoire : taper 'oui-en-prod'
#
# Usage :
#   .\scripts\apply-prod-extras.ps1

$ErrorActionPreference = "Stop"

if (-not $env:ADMIN_SEED_TOKEN) {
    Write-Host "ERREUR : `$env:ADMIN_SEED_TOKEN absent." -ForegroundColor Red
    Write-Host "Pose-le d'abord : `$env:ADMIN_SEED_TOKEN = '<token-render>'" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Red
Write-Host " APPLY PROD - IRREVERSIBLE" -ForegroundColor Red
Write-Host "===========================================================" -ForegroundColor Red
Write-Host ""
Write-Host " Cible    : https://citoyenavise-backend-1.onrender.com" -ForegroundColor Yellow
Write-Host " Action   : TRUNCATE elus + import 449 federaux 45e legislature" -ForegroundColor Yellow
Write-Host " Va ecraser : 6 seeds (Belleville, Pepin, Goyette, Lamproze, Matte x2)" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Tape 'oui-en-prod' pour confirmer (n'importe quoi d'autre annule)"
if ($confirm -ne "oui-en-prod") {
    Write-Host "Annule." -ForegroundColor Cyan
    exit 0
}

Write-Host ""
Write-Host "Token detecte (longueur $($env:ADMIN_SEED_TOKEN.Length))" -ForegroundColor DarkGray
Write-Host "Appel PROD en cours (peut prendre 10-60s)..." -ForegroundColor Cyan

$body = @{
    purge       = $true
    dry_run     = $false
    with_extras = $true
} | ConvertTo-Json -Compress

$headers = @{
    Authorization  = "Bearer $env:ADMIN_SEED_TOKEN"
    "Content-Type" = "application/json"
}

$uri = "https://citoyenavise-backend-1.onrender.com/api/v1/admin/import-federal"

try {
    $start = Get-Date
    $r = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body -TimeoutSec 300
    $duration = ((Get-Date) - $start).TotalSeconds

    Write-Host ""
    Write-Host "=== REPONSE PROD (en $([math]::Round($duration, 1)) s) ===" -ForegroundColor Green
    Write-Host "success                  = $($r.success)"
    Write-Host "dry_run                  = $($r.dry_run)"
    Write-Host ""
    Write-Host "purge.requested          = $($r.purge.requested)"
    Write-Host "purge.applied            = $($r.purge.applied)"
    Write-Host "purge.count (avant)      = $($r.purge.count)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "deputes.created          = $($r.deputes.created)" -ForegroundColor Yellow
    Write-Host "deputes.updated          = $($r.deputes.updated)"
    Write-Host "deputes.errors           = $($r.deputes.errors.Count)"
    Write-Host ""
    if ($r.extras) {
        Write-Host "extras.created           = $($r.extras.created)" -ForegroundColor Yellow
        Write-Host "extras.updated           = $($r.extras.updated)"
        Write-Host "extras.errors            = $($r.extras.errors.Count)"
    }
    Write-Host ""
    Write-Host "TOTAL FINAL en BD        = $($r.total)" -ForegroundColor Green
    Write-Host ""
    if ($r.bilan) {
        Write-Host "=== Repartition par niveau/statut ===" -ForegroundColor Cyan
        $r.bilan | Format-Table niveau, statut, c -AutoSize
    }
} catch {
    Write-Host ""
    Write-Host "ECHEC :" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Body erreur :" -ForegroundColor Red
        Write-Host $errorBody -ForegroundColor Red
    }
    exit 1
}
