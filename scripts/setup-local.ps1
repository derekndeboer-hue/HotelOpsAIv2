# Hotel Ops - Local Development Setup (Windows PowerShell)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Hotel Ops - Local Development Setup"
Write-Host "============================================"
Write-Host ""

# Check Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker is required. Install Docker Desktop from https://docker.com" -ForegroundColor Red
    exit 1
}

# Check Node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js 20+ is required. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

$nodeVersion = (node -v) -replace 'v(\d+)\..*', '$1'
if ([int]$nodeVersion -lt 20) {
    Write-Host "ERROR: Node.js 20+ required. You have $(node -v)" -ForegroundColor Red
    exit 1
}

Write-Host "[1/5] Starting PostgreSQL via Docker..." -ForegroundColor Yellow
docker compose up -d postgres
Write-Host "  Waiting for PostgreSQL to be ready..."
Start-Sleep -Seconds 5

$retries = 0
do {
    $ready = docker compose exec -T postgres pg_isready -U hotel_api_user -d hotel_ops 2>$null
    if ($LASTEXITCODE -ne 0) {
        Start-Sleep -Seconds 1
        $retries++
    }
} while ($LASTEXITCODE -ne 0 -and $retries -lt 30)

if ($retries -ge 30) {
    Write-Host "ERROR: PostgreSQL did not become ready in time." -ForegroundColor Red
    exit 1
}
Write-Host "  PostgreSQL is ready." -ForegroundColor Green
Write-Host ""

Write-Host "[2/5] Running database migrations..." -ForegroundColor Yellow
node infrastructure/sql/run-migrations.js
Write-Host ""

Write-Host "[3/5] Installing npm dependencies..." -ForegroundColor Yellow
npm install
Write-Host ""

Write-Host "[4/5] Setting up API environment..." -ForegroundColor Yellow
if (-not (Test-Path "packages/api/.env")) {
    Copy-Item "packages/api/.env.example" "packages/api/.env"
    Write-Host "  Created packages/api/.env from .env.example"
} else {
    Write-Host "  packages/api/.env already exists, skipping"
}
Write-Host ""

Write-Host "[5/5] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  To start development servers:"
Write-Host "    npm run dev:api     (in one terminal)"
Write-Host "    npm run dev:web     (in another terminal)"
Write-Host ""
Write-Host "  Default login:"
Write-Host "    Email: admin@gardenshotel.com"
Write-Host "    Password: admin123"
Write-Host "============================================" -ForegroundColor Cyan
