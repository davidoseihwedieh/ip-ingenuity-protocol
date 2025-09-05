#!/bin/bash

set -e

echo "🚀 Deploying IP Ingenuity Platform..."

# Environment setup
export NODE_ENV=production
export JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 32)}
export REFRESH_SECRET=${REFRESH_SECRET:-$(openssl rand -base64 32)}
export DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 16)}

# Build and deploy
echo "Building Docker images..."
docker-compose build

echo "Starting database migration..."
docker-compose run --rm app npm run migrate

echo "Starting services..."
docker-compose up -d

echo "Starting monitoring..."
docker-compose -f infrastructure/monitoring/docker-compose.monitoring.yml up -d

# Health check
echo "Waiting for services to start..."
sleep 30

if curl -f http://localhost:3000/health; then
    echo "✅ Deployment successful!"
    echo "🌐 Application: http://localhost:3000"
    echo "📊 Monitoring: http://localhost:3001"
else
    echo "❌ Deployment failed - check logs"
    docker-compose logs
    exit 1
fi