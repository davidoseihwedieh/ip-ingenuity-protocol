#!/bin/bash

set -e

echo "🚀 Deploying IP Ingenuity Platform (Native)..."

# Install dependencies
echo "Installing Node.js dependencies..."
npm install
cd security && npm install && cd ..

# Setup environment
export NODE_ENV=production
export JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 32)}
export REFRESH_SECRET=${REFRESH_SECRET:-$(openssl rand -base64 32)}

# Start PostgreSQL (if installed via Homebrew)
if command -v brew &> /dev/null; then
    echo "Starting PostgreSQL..."
    brew services start postgresql@15 || brew services start postgresql
fi

# Start Redis (if installed via Homebrew)
if command -v redis-server &> /dev/null; then
    echo "Starting Redis..."
    redis-server --daemonize yes
fi

# Run database migrations (if psql available)
if command -v psql &> /dev/null; then
    echo "Running database migrations..."
    createdb ip_ingenuity 2>/dev/null || true
    psql -d ip_ingenuity -f infrastructure/database/migrations.sql
fi

# Start application
echo "Starting IP Ingenuity application..."
npm start &

echo "✅ Deployment complete!"
echo "🌐 Application: http://localhost:3000"