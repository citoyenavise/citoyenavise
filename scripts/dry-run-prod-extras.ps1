# Citoyen Avise - Dry-run PROD avec extras
#
# Lance un dry-run de import-federal en PROD (cible Render) avec extras CSV.
# Lit ADMIN_SEED_TOKEN depuis $env. Aucune ecriture en BD prod (dry_run:true).
#
# Usage :
#   .\scripts\dry-run-prod-extras.ps1

$ErrorActionPreference = "Stop"

if (-not $env:ADMIN_SEED_TOKEN) {
    Write-Host "ERREUR : `$env:ADMIN_SEED_TOKEN absent." -ForegroundColor Red
    Write-Host "Pose-le d'abord :" -ForegroundColor Yellow
    Write-Host "  `$env:ADMIN_SEED_TOKEN = '<token-render>'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Token detecte (longueur $($env:ADMIN_SEED_TOKEN.Length))" -ForegroundColor DarkGray
Write-Host "Appel PROD en cours (peut prendre 20-40s si cold-start Render)..." -ForegroundColor Cyan

$body = @{
    purge       = $false
    dry_run     = $true
    with_extras = $true
} | ConvertTo-Json -Compress

$headers = @{
    Authorization  = "Bearer $env:ADMIN_SEED_TOKEN"
    "Content-Type" = "application/json"
}

$uri = "https://citoyenavise-backend-1.onrender.com/api/v1/admin/import-federal"

try {
    $start = Get-Date
    $r = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body -TimeoutSec 180
    $duration = ((Get-Date) - $start).TotalSeconds

    Write-Host ""
    Write-Host "=== REPONSE PROD (en $([math]::Round($duration, 1)) s) ===" -ForegroundColor Green
    Write-Host "success                  = $($r.success)"
    Write-Host "dry_run                  = $($r.dry_run)"
    Write-Host ""
    Write-Host "deputes.preview.to_create = $($r.deputes.preview.to_create.Count)" -ForegroundColor Yellow
    Write-Host "deputes.preview.to_update = $($r.deputes.preview.to_update.Count)"
    Write-Host "deputes.errors            = $($r.deputes.errors.Count)"
    Write-Host ""
    if ($r.extras) {
        Write-Host "extras.preview.to_create  = $($r.extras.preview.to_create.Count)" -ForegroundColor Yellow
        Write-Host "extras.preview.to_update  = $($r.extras.preview.to_update.Count)"
        Write-Host "extras.errors             = $($r.extras.errors.Count)"
    } else {
        Write-Host "extras                    = NULL" -ForegroundColor Red
    }
    Write-Host ""
    $totalCreate = $r.deputes.preview.to_create.Count + $r.extras.preview.to_create.Count
    Write-Host "=== TOTAL a creer : $totalCreate elus ===" -ForegroundColor Green
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
