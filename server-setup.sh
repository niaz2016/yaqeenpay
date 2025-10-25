#!/bin/bash

# TechTorio Platform - Server Setup Script
# Run this script on a fresh Ubuntu 22.04 server

set -e

echo "=========================================="
echo "TechTorio Platform - Server Setup"
echo "=========================================="

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential tools
echo "🔧 Installing essential tools..."
sudo apt install -y curl wget git ufw fail2ban htop

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo apt install -y docker-compose-plugin

# Configure Firewall
echo "🔥 Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable

# Install Certbot for SSL
echo "🔒 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Create directory structure
echo "📁 Creating directory structure..."
sudo mkdir -p /opt/techtorio/{nginx/{conf.d,ssl},gateway/html,database/{init,backups},monitoring,logs}
sudo chown -R $USER:$USER /opt/techtorio

# Install monitoring tools (optional)
echo "📊 Installing monitoring tools..."
sudo apt install -y prometheus prometheus-node-exporter

# Configure Fail2Ban
echo "🛡️ Configuring Fail2Ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Setup automatic security updates
echo "🔄 Setting up automatic security updates..."
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Create backup script
echo "💾 Creating backup script..."
cat > /opt/techtorio/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/techtorio/database/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup all databases
docker exec techtorio-postgres pg_dumpall -U techtorio_admin | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
EOF

chmod +x /opt/techtorio/backup.sh

# Add backup cron job (daily at 2 AM)
echo "⏰ Setting up daily backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/techtorio/backup.sh >> /opt/techtorio/logs/backup.log 2>&1") | crontab -

# Create deployment script
cat > /opt/techtorio/deploy.sh << 'EOF'
#!/bin/bash
cd /opt/techtorio

echo "🔄 Pulling latest changes..."
git pull origin main

echo "🏗️ Building containers..."
docker-compose -f docker-compose.prod-master.yml build

echo "🚀 Deploying..."
docker-compose -f docker-compose.prod-master.yml up -d

echo "🧹 Cleaning up..."
docker system prune -f

echo "✅ Deployment complete!"
EOF

chmod +x /opt/techtorio/deploy.sh

# Setup Git repository
echo "📚 Cloning repository..."
cd /opt/techtorio
# git clone https://github.com/niaz2016/yaqeenpay.git .

# Print summary
echo ""
echo "=========================================="
echo "✅ Server setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Copy your project files to /opt/techtorio"
echo "2. Create .env file: cp .env.production.example .env"
echo "3. Edit .env and set your passwords and configuration"
echo "4. Generate SSL certificates:"
echo "   sudo certbot certonly --standalone -d techtorio.online -d *.techtorio.online"
echo "5. Start services:"
echo "   cd /opt/techtorio"
echo "   docker-compose -f docker-compose.prod-master.yml up -d"
echo ""
echo "Important commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Restart: docker-compose restart"
echo "  - Stop: docker-compose down"
echo "  - Backup: /opt/techtorio/backup.sh"
echo "  - Deploy: /opt/techtorio/deploy.sh"
echo ""
echo "⚠️  Remember to:"
echo "  - Change all default passwords in .env"
echo "  - Configure your DNS records"
echo "  - Setup SSH key authentication"
echo "  - Disable root login"
echo ""
