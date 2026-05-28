# Citoyen Avise - Test endpoint /admin/import-federal (local OU prod)
#
# Lance un curl vers POST /api/v1/admin/import-federal avec le bon header
# d'auth, en mode dry-run par defaut. Mode apply explicite pour ecrire en BD.
#
# Usage :
#   .\scripts\dev-curl-import-federal.ps1 dry-run                  (local, dry-run, sans extras)
#   .\scripts\dev-curl-import-federal.ps1 dry-run -WithExtras       (local, dry-run, avec CSV)
#   .\scripts\dev-curl-import-federal.ps1 apply -WithExtras -Purge  (local, ECRITURE reelle)
#   .\scripts\dev-curl-import-federal.ps1 dry-run -Prod -WithExtras (prod, dry-run safe)
#   .\scripts\dev-curl-import-federal.ps1 apply -Prod -Purge -WithExtras  (prod, IMPORT REEL)

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet("dry-run", "apply")]
    [string]$Mode,

    [switch]$Prod,
    [switch]$Purge,
    [switch]$WithExtras
)

$ErrorActionPreference = "Stop"

# Determination URL + token
if ($Prod) {
    $baseUrl = "https://citoyenavise-backend-1.onrender.com"
    if (-not $env:ADMIN_SEED_TOKEN) {
        throw "ADMIN_SEED_TOKEN absent. Fais : `$env:ADMIN_SEED_TOKEN = '<token-render>'  AVANT de relancer."
    }
    $token = $env:ADMIN_SEED_TOKEN
    Write-Host "Cible : PROD ($baseUrl)" -ForegroundColor Yellow
} else {
    $baseUrl = "http://localhost:5000"
    $token = "dev_token_local_only"
    Write-Host "Cible : LOCAL ($baseUrl, token=dev_token_local_only)" -ForegroundColor Green
}

$dryRun = ($Mode -eq "dry-run")

# Confirmation explicite si apply + prod
if ($Mode -eq "apply" -and $Prod) {
    Write-Host ""
    Write-Host "ATTENTION : Tu vas APPLIQUER en PROD." -ForegroundColor Red
    if ($Purge) {
        Write-Host "  -Purge active : TRUNCATE elus + import (irreversible)." -ForegroundColor Red
    }
    $confirm = Read-Host "Tape 'oui-en-prod' pour confirmer"
    if ($confirm -ne "oui-en-prod") {
        Write-Host "Annule." -ForegroundColor Yellow
        exit 1
    }
}

# Body JSON
$body = @{
    purge       = [bool]$Purge
    dry_run     = $dryRun
    with_extras = [bool]$WithExtras
} | ConvertTo-Json -Compress

Write-Host ""
Write-Host "Body envoye : $body" -ForegroundColor DarkGray
Write-Host "Appel : POST $baseUrl/api/v1/admin/import-federal" -ForegroundColor DarkGray
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type"  = "application/json"
    }
    $response = Invoke-RestMethod `
        -Uri "$baseUrl/api/v1/admin/import-federal" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -TimeoutSec 180
    Write-Host "=== REPONSE ===" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5
} catch {
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
