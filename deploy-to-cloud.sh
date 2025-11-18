#!/bin/bash
set -e
echo "=== TechTorio Deployment Script ==="
# System prep
echo "Updating system..."
sudo apt update
sudo apt install -y git curl wget htop jq docker-compose-plugin
# Firewall
echo "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable
# Clone repo
echo "Cloning repository..."
cd /opt
if [ -d "techtorio" ]; then
  cd techtorio
  git pull
else
  sudo git clone https://github.com/niaz2016/yaqeenpay.git techtorio
  sudo chown -R ubuntu:ubuntu techtorio
  cd techtorio
fi
# Setup environment
echo "Setting up environment..."
if [ ! -f ".env" ]; then
  cat > .env << EOL
POSTGRES_PASSWORD=$(openssl rand -base64 32)
SMS_BASE_URL=http://100.92.135.232:8080
SMS_SECRET_KEY=HpV9etXRFDvopdCiNpHXOpFf5x1pnThhyX42F8ZnZF1mJkdc6kV/nHWmdOGHJfjYXxmdkXWYnXYeCZsWc9qIQqMTs9QmB/Ir
EOL
fi
# Deploy
echo "Building containers..."
docker compose -f docker-compose.cloud.yml build
echo "Starting services..."
docker compose -f docker-compose.cloud.yml up -d
echo "Checking status..."
docker compose -f docker-compose.cloud.yml ps
echo "=== Deployment Complete ==="
echo "Access your application at: http://34.61.87.121"
