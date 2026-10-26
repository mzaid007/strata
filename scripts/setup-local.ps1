# Run in PowerShell on DESKTOP-1J4BR2Q when the agent shell cannot spawn.
# Usage:  powershell -ExecutionPolicy Bypass -File f:\Strata\scripts\setup-local.ps1

$ErrorActionPreference = "Stop"
Set-Location f:\Strata

if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host "Created .env from .env.example — edit DATABASE_URL and BETTER_AUTH_SECRET before continuing." -ForegroundColor Yellow
  Write-Host "Then re-run this script."
  exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js not found on PATH. Install Node 20+ and re-open the terminal."
}

if (-not (Test-Path .git)) {
  git init
}

npm install
npx prisma db push
# Sample seed is opt-in (DEMO_SEED=1 + SEED_PASSWORD). Default path is register-first.
npm run db:seed
Write-Host ""
Write-Host "Setup OK. Start with:  npm run dev" -ForegroundColor Green
Write-Host "Register at http://localhost:3000/register"
Write-Host "Optional demo seed: set DEMO_SEED=1 and SEED_PASSWORD in .env, then npm run db:seed"
