#!/bin/bash

set -e

echo "🚀 Starting IP Ingenuity Platform (Simple Mode)..."

# Setup environment
export NODE_ENV=development
export JWT_SECRET="dev-jwt-secret-key-change-in-production"
export REFRESH_SECRET="dev-refresh-secret-key-change-in-production"

# Start application without database dependency
echo "Starting IP Ingenuity application..."
cd security
node secure-server.js &
SERVER_PID=$!

echo "✅ Application started!"
echo "🌐 Server: http://localhost:3001"
echo "🔒 Security endpoints ready"
echo ""
echo "Press Ctrl+C to stop the server"

# Wait for interrupt
trap "kill $SERVER_PID; exit" INT
wait $SERVER_PID