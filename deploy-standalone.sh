#!/bin/bash
# Standalone TechTorio Deployment Script
# Run this on the server after extracting deployment files

set -e

echo "=== TechTorio Standalone Deployment ==="
echo "Server: 34.61.87.121"
echo ""

# Check we're in the right directory
if [ ! -f "docker-compose.cloud.yml" ]; then
    echo "ERROR: docker-compose.cloud.yml not found!"
    echo "Please run this script from the deployment directory"
    exit 1
fi

# Check Docker
echo "[1/7] Verifying Docker installation..."
docker --version || { echo "Docker not found!"; exit 1; }
docker compose version || { echo "Installing Docker Compose plugin..."; sudo apt install -y docker-compose-plugin; }

# System updates
echo "[2/7] Updating system packages..."
sudo apt update
sudo apt install -y git curl wget htop jq openssl

# Firewall setup
echo "[3/7] Configuring UFW firewall..."
if ! sudo ufw status | grep -q "Status: active"; then
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow OpenSSH
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    echo "y" | sudo ufw enable
    echo "Firewall enabled!"
else
    echo "Firewall already configured"
fi
sudo ufw status verbose

# Setup environment file
echo "[4/7] Configuring environment..."
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-32)
    cp .env.cloud .env
    sed -i "s/YourStrongPasswordHere123!/$DB_PASSWORD/" .env
    echo "Generated secure database password: $DB_PASSWORD"
    echo "IMPORTANT: Save this password!"
else
    echo ".env already exists, keeping current configuration"
fi

# Optional: Add swap if needed
FREE_MEM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$FREE_MEM" -lt 2048 ] && [ ! -f "/swapfile" ]; then
    echo "Low memory detected ($FREE_MEM MB), adding 2GB swap..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    if ! grep -q "/swapfile" /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    echo "Swap added!"
fi

# Build and deploy
echo "[5/7] Building Docker images (this may take 5-10 minutes)..."
docker compose -f docker-compose.cloud.yml build

echo "[6/7] Starting services..."
docker compose -f docker-compose.cloud.yml up -d

# Wait for services to be ready
echo "Waiting for services to initialize..."
sleep 10

# Check status
echo ""
echo "[7/7] Verifying deployment..."
docker compose -f docker-compose.cloud.yml ps

echo ""
echo "=== Service Logs (last 20 lines) ==="
echo "--- Backend ---"
docker logs techtorio-backend --tail=20 2>&1 || echo "Backend not ready yet"
echo ""
echo "--- Gateway ---"
docker logs techtorio-gateway --tail=20 2>&1 || echo "Gateway not ready yet"

echo ""
echo "=== Testing Endpoints ==="
sleep 5
curl -s -o /dev/null -w "Gateway: HTTP %{http_code}\n" http://localhost/ 2>/dev/null || echo "Gateway: Not responding yet (may need more time)"

echo ""
echo "=== Deployment Complete! ==="
echo "Application URL: http://34.61.87.121"
echo ""
echo "Useful commands:"
echo "  View logs:     docker compose -f docker-compose.cloud.yml logs -f"
echo "  Restart:       docker compose -f docker-compose.cloud.yml restart"
echo "  Stop:          docker compose -f docker-compose.cloud.yml down"
echo "  Rebuild:       docker compose -f docker-compose.cloud.yml up -d --build"
echo ""
