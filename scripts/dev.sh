#!/bin/bash
# Start both API and web dev servers concurrently

echo "Starting Hotel Ops development servers..."
echo "  API: http://localhost:8080"
echo "  Web: http://localhost:3000"
echo ""

# Start API in background
npm run dev:api &
API_PID=$!

# Start web in background
npm run dev:web &
WEB_PID=$!

# Trap to kill both on exit
trap "kill $API_PID $WEB_PID 2>/dev/null; exit" INT TERM

# Wait for either to exit
wait
