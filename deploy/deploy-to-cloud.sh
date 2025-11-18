#!/bin/bash
set -e

echo "=== TechTorio Cloud Deployment Script ==="
echo "Server: 34.61.87.121"
echo ""

# Check Docker
echo "[1/8] Verifying Docker installation..."
docker --version || { echo "Docker not found!"; exit 1; }
docker compose version || { echo "Docker Compose plugin missing. Installing..."; sudo apt install -y docker-compose-plugin; }

# System updates
echo "[2/8] Updating system packages..."
sudo apt update
sudo apt install -y git curl wget htop jq openssl

# Firewall setup
echo "[3/8] Configuring UFW firewall..."
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

# Create deployment directory
echo "[4/8] Setting up deployment directory..."
sudo mkdir -p /opt/techtorio
sudo chown $(whoami):$(whoami) /opt/techtorio

# Clone or update repository
echo "[5/8] Getting application code..."
cd /opt
if [ -d "techtorio/.git" ]; then
    echo "Repository exists, updating..."
    cd techtorio
    git fetch origin
    git reset --hard origin/main
else
    echo "Cloning repository..."
    rm -rf techtorio
    git clone https://github.com/niaz2016/yaqeenpay.git techtorio
    cd techtorio
fi

# Setup environment file
echo "[6/8] Configuring environment..."
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-32)
    cp .env.cloud .env
    sed -i "s/YourStrongPasswordHere123!/$DB_PASSWORD/" .env
    echo "Generated secure database password"
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
echo "[7/8] Building Docker images (this may take 5-10 minutes)..."
docker compose -f docker-compose.cloud.yml build

echo "[8/8] Starting services..."
docker compose -f docker-compose.cloud.yml up -d

# Wait for services to be ready
echo "Waiting for services to initialize..."
sleep 10

# Check status
echo ""
echo "=== Deployment Status ==="
docker compose -f docker-compose.cloud.yml ps

echo ""
echo "=== Service Logs (last 20 lines) ==="
echo "--- Backend ---"
docker logs techtorio-backend --tail=20
echo ""
echo "--- Gateway ---"
docker logs techtorio-gateway --tail=20

echo ""
echo "=== Testing Endpoints ==="
echo "Testing gateway..."
curl -s -o /dev/null -w "Gateway: HTTP %{http_code}\n" http://localhost/ || echo "Gateway: Not responding"

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
echo "To enable auto-start on boot, run:"
echo "  sudo systemctl enable docker"
echo ""
