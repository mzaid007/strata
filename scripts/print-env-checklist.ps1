# Validates f:\Strata\.env for common setup mistakes (no secrets printed).
# Usage:  powershell -ExecutionPolicy Bypass -File f:\Strata\scripts\print-env-checklist.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "Strata .env checklist" -ForegroundColor Cyan
Write-Host "--------------------"

if (-not (Test-Path ".env")) {
  Write-Host "[FAIL] .env missing. Run:  copy .env.example .env" -ForegroundColor Red
  Write-Host "Then create a Neon DB and paste DATABASE_URL + a 32+ char BETTER_AUTH_SECRET."
  exit 1
}

$raw = Get-Content ".env" -Raw
$issues = @()

function Get-EnvValue([string]$name) {
  $m = [regex]::Match($raw, "(?m)^\s*$([regex]::Escape($name))\s*=\s*(.*)$")
  if (-not $m.Success) { return $null }
  $v = $m.Groups[1].Value.Trim()
  if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length - 2) }
  if ($v.StartsWith("'") -and $v.EndsWith("'")) { $v = $v.Substring(1, $v.Length - 2) }
  return $v
}

$db = Get-EnvValue "DATABASE_URL"
$secret = Get-EnvValue "BETTER_AUTH_SECRET"
$authUrl = Get-EnvValue "BETTER_AUTH_URL"
$appUrl = Get-EnvValue "NEXT_PUBLIC_APP_URL"

if ([string]::IsNullOrWhiteSpace($db)) {
  $issues += "DATABASE_URL is missing"
} else {
  if ($db -match "@HOST(/|$)" -or $db -match "://USER:PASSWORD@" -or $db -match "ep-xxxxxxxx") {
    $issues += "DATABASE_URL still looks like a placeholder (HOST / USER:PASSWORD / ep-xxxxxxxx). Paste the real Neon connection string."
  }
  if ($db -notmatch "^postgres(ql)?://") {
    $issues += "DATABASE_URL should start with postgresql://"
  }
  Write-Host "[ok] DATABASE_URL is set (value not shown)" -ForegroundColor Green
}

if ([string]::IsNullOrWhiteSpace($secret)) {
  $issues += "BETTER_AUTH_SECRET is missing"
} elseif ($secret.Length -lt 32) {
  $issues += "BETTER_AUTH_SECRET is $($secret.Length) chars; need >= 32. Run: openssl rand -base64 32"
} elseif ($secret -match "PASTE_OUTPUT|replace-with|MIN_32|CHANGE_ME") {
  $issues += "BETTER_AUTH_SECRET still looks like a placeholder text"
} else {
  Write-Host "[ok] BETTER_AUTH_SECRET length = $($secret.Length)" -ForegroundColor Green
}

if ([string]::IsNullOrWhiteSpace($authUrl)) {
  $issues += "BETTER_AUTH_URL is missing"
} else {
  Write-Host "[ok] BETTER_AUTH_URL = $authUrl" -ForegroundColor Green
}

if ([string]::IsNullOrWhiteSpace($appUrl)) {
  $issues += "NEXT_PUBLIC_APP_URL is missing"
} else {
  Write-Host "[ok] NEXT_PUBLIC_APP_URL = $appUrl" -ForegroundColor Green
}

if ($issues.Count -gt 0) {
  Write-Host ""
  Write-Host "Problems:" -ForegroundColor Yellow
  foreach ($i in $issues) { Write-Host "  - $i" -ForegroundColor Yellow }
  Write-Host ""
  Write-Host "After fixing .env:" -ForegroundColor Cyan
  Write-Host "  npx prisma db push"
  Write-Host "  npm run db:seed"
  Write-Host "  npm run dev"
  exit 1
}

Write-Host ""
Write-Host "All checks passed. Next:" -ForegroundColor Green
Write-Host "  npx prisma db push"
Write-Host "  npm run db:seed"
Write-Host "  npm run dev"
exit 0
