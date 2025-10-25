#!/bin/bash

# Quick Deployment Script for TechTorio Platform
# Usage: ./quick-deploy.sh [app-name]

APP_NAME=${1:-all}
COMPOSE_FILE="docker-compose.prod-master.yml"

echo "🚀 TechTorio Deployment Script"
echo "================================"

# Function to check if service is running
check_service() {
    local service=$1
    if docker-compose -f $COMPOSE_FILE ps | grep -q "$service.*Up"; then
        echo "✅ $service is running"
        return 0
    else
        echo "❌ $service is not running"
        return 1
    fi
}

# Function to deploy specific app
deploy_app() {
    local app=$1
    echo ""
    echo "📦 Deploying $app..."
    
    case $app in
        gateway)
            docker-compose -f $COMPOSE_FILE up -d --build nginx-gateway
            ;;
        yaqeenpay)
            docker-compose -f $COMPOSE_FILE up -d --build yaqeenpay-backend yaqeenpay-frontend
            ;;
        database)
            docker-compose -f $COMPOSE_FILE up -d postgres redis
            ;;
        all)
            docker-compose -f $COMPOSE_FILE up -d --build
            ;;
        *)
            echo "❌ Unknown app: $app"
            echo "Available: gateway, yaqeenpay, database, all"
            exit 1
            ;;
    esac
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if [ ! -f .env ]; then
    echo "❌ .env file not found! Copy .env.production.example to .env and configure it."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    exit 1
fi

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main || echo "⚠️  Git pull failed or not a repository"

# Deploy
deploy_app $APP_NAME

# Wait for services to start
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Health check
echo ""
echo "🏥 Health Check:"
check_service "postgres"
check_service "redis"
check_service "nginx-gateway"

# Show logs
echo ""
echo "📋 Recent logs:"
docker-compose -f $COMPOSE_FILE logs --tail=50

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Useful commands:"
echo "  View logs:    docker-compose -f $COMPOSE_FILE logs -f [service-name]"
echo "  Restart:      docker-compose -f $COMPOSE_FILE restart [service-name]"
echo "  Stop all:     docker-compose -f $COMPOSE_FILE down"
echo "  Check status: docker-compose -f $COMPOSE_FILE ps"
echo ""
