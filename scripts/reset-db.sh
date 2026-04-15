#!/bin/bash
set -e

echo "Resetting local database..."

# Drop and recreate the database
docker compose exec -T postgres psql -U hotel_api_user -d postgres -c "DROP DATABASE IF EXISTS hotel_ops;"
docker compose exec -T postgres psql -U hotel_api_user -d postgres -c "CREATE DATABASE hotel_ops;"

echo "Database dropped and recreated."
echo "Running migrations..."

node infrastructure/sql/run-migrations.js

echo ""
echo "Database reset complete with fresh seed data."
echo "  Login: admin@gardenshotel.com / admin123"
