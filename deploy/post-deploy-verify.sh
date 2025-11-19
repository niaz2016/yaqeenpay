#!/bin/bash
#===============================================================================
# TechTorio Post-Deployment Verification Script
# 
# Usage: ./post-deploy-verify.sh
#===============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   TechTorio Deployment Verification     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

DEPLOY_DIR="$HOME/techtorio"
cd "$DEPLOY_DIR"

# Test 1: Check Docker service
echo -e "${BLUE}[1/8]${NC} Checking Docker service..."
if systemctl is-active --quiet docker; then
    echo -e "${GREEN}✓${NC} Docker service is running"
else
    echo -e "${RED}✗${NC} Docker service is not running"
    exit 1
fi

# Test 2: Check container status
echo -e "${BLUE}[2/8]${NC} Checking container status..."
RUNNING=$(docker compose -f docker-compose.cloud.yml ps --filter "status=running" -q | wc -l)
if [ "$RUNNING" -eq 4 ]; then
    echo -e "${GREEN}✓${NC} All 4 containers are running"
else
    echo -e "${RED}✗${NC} Only $RUNNING/4 containers are running"
    docker compose -f docker-compose.cloud.yml ps
fi

# Test 3: Check PostgreSQL
echo -e "${BLUE}[3/8]${NC} Checking PostgreSQL database..."
if docker exec techtorio-postgres pg_isready -U postgres &> /dev/null; then
    echo -e "${GREEN}✓${NC} PostgreSQL is ready"
else
    echo -e "${RED}✗${NC} PostgreSQL is not ready"
fi

# Test 4: Check backend API
echo -e "${BLUE}[4/8]${NC} Checking backend API..."
if curl -s -f http://localhost:8080/api/health &> /dev/null; then
    echo -e "${GREEN}✓${NC} Backend API is responding"
else
    echo -e "${YELLOW}⚠${NC} Backend API health check unavailable (may be normal)"
fi

# Test 5: Check frontend
echo -e "${BLUE}[5/8]${NC} Checking frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/escrow-market/)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Frontend is accessible (HTTP 200)"
else
    echo -e "${RED}✗${NC} Frontend returned HTTP $HTTP_CODE"
fi

# Test 6: Check nginx gateway
echo -e "${BLUE}[6/8]${NC} Checking nginx gateway..."
if docker exec techtorio-gateway nginx -t &> /dev/null; then
    echo -e "${GREEN}✓${NC} Nginx configuration is valid"
else
    echo -e "${RED}✗${NC} Nginx configuration has errors"
fi

# Test 7: Check disk space
echo -e "${BLUE}[7/8]${NC} Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✓${NC} Disk usage: ${DISK_USAGE}%"
else
    echo -e "${YELLOW}⚠${NC} Disk usage high: ${DISK_USAGE}%"
fi

# Test 8: Check memory
echo -e "${BLUE}[8/8]${NC} Checking memory usage..."
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -lt 90 ]; then
    echo -e "${GREEN}✓${NC} Memory usage: ${MEM_USAGE}%"
else
    echo -e "${YELLOW}⚠${NC} Memory usage high: ${MEM_USAGE}%"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Verification Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""

# Show container stats
echo -e "${BLUE}Container Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo -e "${BLUE}Quick Commands:${NC}"
echo "  View logs:       docker compose -f docker-compose.cloud.yml logs -f"
echo "  Restart all:     docker compose -f docker-compose.cloud.yml restart"
echo "  Stop all:        docker compose -f docker-compose.cloud.yml down"
echo ""

# Get external IP
EXTERNAL_IP=$(curl -s ifconfig.me)
echo -e "${BLUE}Access URL:${NC}"
echo "  http://${EXTERNAL_IP}:8080/escrow-market/"
echo ""
