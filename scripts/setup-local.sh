#!/bin/bash
set -e

echo "============================================"
echo "  Hotel Ops — Local Development Setup"
echo "============================================"
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker is required. Install from https://docker.com"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js 20+ is required. Install from https://nodejs.org"; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "ERROR: Node.js 20+ required. You have $(node -v)"
  exit 1
fi

echo "[1/5] Starting PostgreSQL via Docker..."
docker compose up -d postgres
echo "  Waiting for PostgreSQL to be ready..."
sleep 3
until docker compose exec -T postgres pg_isready -U hotel_api_user -d hotel_ops >/dev/null 2>&1; do
  sleep 1
done
echo "  PostgreSQL is ready."
echo ""

echo "[2/5] Running database migrations..."
node infrastructure/sql/run-migrations.js
echo ""

echo "[3/5] Installing npm dependencies..."
npm install
echo ""

echo "[4/5] Setting up API environment..."
if [ ! -f packages/api/.env ]; then
  cp packages/api/.env.example packages/api/.env
  echo "  Created packages/api/.env from .env.example"
else
  echo "  packages/api/.env already exists, skipping"
fi
echo ""

echo "[5/5] Verifying setup..."
echo "  Database: postgresql://localhost:5432/hotel_ops"
echo "  API will run on: http://localhost:8080"
echo "  Web will run on: http://localhost:3000"
echo ""
echo "============================================"
echo "  Setup complete!"
echo ""
echo "  To start development servers:"
echo "    npm run dev:api     (in one terminal)"
echo "    npm run dev:web     (in another terminal)"
echo ""
echo "  Or use: npm run dev   (both at once)"
echo ""
echo "  Default login:"
echo "    Email: admin@gardenshotel.com"
echo "    Password: admin123"
echo "============================================"
