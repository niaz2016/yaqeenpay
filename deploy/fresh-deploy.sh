#!/bin/bash
#===============================================================================
# TechTorio Fresh Deployment Script
# 
# This script automates the complete deployment of TechTorio on a fresh Ubuntu VM
# 
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/niaz2016/yaqeenpay/main/deploy/fresh-deploy.sh | bash
# 
# Or download and run:
#   wget https://raw.githubusercontent.com/niaz2016/yaqeenpay/main/deploy/fresh-deploy.sh
#   chmod +x fresh-deploy.sh
#   ./fresh-deploy.sh
#===============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ████████╗███████╗ ██████╗██╗  ██╗████████╗ ██████╗ ██████╗ ██╗ ██████╗ 
║    ╚══██╔══╝██╔════╝██╔════╝██║  ██║╚══██╔══╝██╔═══██╗██╔══██╗██║██╔═══██╗
║       ██║   █████╗  ██║     ███████║   ██║   ██║   ██║██████╔╝██║██║   ██║
║       ██║   ██╔══╝  ██║     ██╔══██║   ██║   ██║   ██║██╔══██╗██║██║   ██║
║       ██║   ███████╗╚██████╗██║  ██║   ██║   ╚██████╔╝██║  ██║██║╚██████╔╝
║       ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝ 
║                                                              ║
║              Fresh VM Deployment Script v1.0                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_error "Please DO NOT run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Confirm deployment
log_warning "This script will install Docker, configure firewall, and deploy TechTorio."
read -p "Continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Deployment cancelled."
    exit 0
fi

#===============================================================================
# STEP 1: System Update
#===============================================================================
log_info "Step 1/10: Updating system packages..."
sudo apt update -qq
sudo apt upgrade -y -qq
log_success "System updated"

#===============================================================================
# STEP 2: Install Docker
#===============================================================================
log_info "Step 2/10: Installing Docker..."

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    log_success "Docker already installed ($(docker --version))"
else
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    log_success "Docker installed successfully"
fi

# Install Docker Compose plugin
if docker compose version &> /dev/null; then
    log_success "Docker Compose already installed ($(docker compose version))"
else
    sudo apt install -y docker-compose-plugin
    log_success "Docker Compose plugin installed"
fi

#===============================================================================
# STEP 3: Install Additional Tools
#===============================================================================
log_info "Step 3/10: Installing additional tools..."
sudo apt install -y git curl wget unzip openssl jq -qq
log_success "Additional tools installed"

#===============================================================================
# STEP 4: Configure Firewall (UFW)
#===============================================================================
log_info "Step 4/10: Configuring firewall..."

# Check if UFW is active
if sudo ufw status | grep -q "Status: active"; then
    log_info "UFW already active"
else
    # Enable UFW
    sudo ufw --force enable
fi

# Allow ports
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow 8080/tcp comment 'Alternative HTTP'

log_success "Firewall configured"
log_info "Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8080 (Alt HTTP)"

#===============================================================================
# STEP 5: Clone Repository
#===============================================================================
log_info "Step 5/10: Cloning TechTorio repository..."

# Set deployment directory
DEPLOY_DIR="$HOME/techtorio"

# Remove old directory if exists
if [ -d "$DEPLOY_DIR" ]; then
    log_warning "Existing deployment found, removing..."
    rm -rf "$DEPLOY_DIR"
fi

# Clone repository
git clone https://github.com/niaz2016/yaqeenpay.git "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

log_success "Repository cloned to $DEPLOY_DIR"

#===============================================================================
# STEP 6: Generate Secure Credentials
#===============================================================================
log_info "Step 6/10: Generating secure credentials..."

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
SMS_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Create .env.cloud file
cat > .env.cloud << EOF
# PostgreSQL Database Configuration
POSTGRES_PASSWORD=${DB_PASSWORD}

# SMS Service Configuration
SMS_BASE_URL=https://your-sms-service.com
SMS_SECRET_KEY=${SMS_SECRET}

# Auto-generated on $(date)
# Keep these credentials secure!
EOF

log_success "Secure credentials generated and saved to .env.cloud"
log_warning "IMPORTANT: Save these credentials in a secure location!"
echo -e "${YELLOW}Database Password: ${DB_PASSWORD}${NC}"
echo -e "${YELLOW}SMS Secret Key: ${SMS_SECRET}${NC}"

#===============================================================================
# STEP 7: Build Docker Images
#===============================================================================
log_info "Step 7/10: Building Docker images (this may take 5-10 minutes)..."

# Build all images
docker compose -f docker-compose.cloud.yml --env-file .env.cloud build --no-cache

log_success "Docker images built successfully"

#===============================================================================
# STEP 8: Start Services
#===============================================================================
log_info "Step 8/10: Starting all services..."

# Start all containers
docker compose -f docker-compose.cloud.yml --env-file .env.cloud up -d

# Wait for services to be ready
log_info "Waiting for services to initialize (30 seconds)..."
sleep 30

log_success "Services started"

#===============================================================================
# STEP 9: Verify Deployment
#===============================================================================
log_info "Step 9/10: Verifying deployment..."

# Check container status
RUNNING_CONTAINERS=$(docker compose -f docker-compose.cloud.yml ps --filter "status=running" -q | wc -l)
EXPECTED_CONTAINERS=4  # postgres, backend, frontend, gateway

if [ "$RUNNING_CONTAINERS" -eq "$EXPECTED_CONTAINERS" ]; then
    log_success "All $EXPECTED_CONTAINERS containers are running"
else
    log_warning "Expected $EXPECTED_CONTAINERS containers, but $RUNNING_CONTAINERS are running"
    docker compose -f docker-compose.cloud.yml ps
fi

# Test local access
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/escrow-market/ | grep -q "200"; then
    log_success "Local HTTP test passed (HTTP 200)"
else
    log_warning "Local HTTP test failed - check logs"
fi

# Get external IP
EXTERNAL_IP=$(curl -s ifconfig.me)
if [ -n "$EXTERNAL_IP" ]; then
    log_success "External IP detected: $EXTERNAL_IP"
else
    log_warning "Could not detect external IP"
fi

#===============================================================================
# STEP 10: Display Access Information
#===============================================================================
log_info "Step 10/10: Deployment Summary"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║            🎉 DEPLOYMENT SUCCESSFUL! 🎉                  ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📍 Access URLs:${NC}"
echo -e "   Local:    http://localhost:8080/escrow-market/"
if [ -n "$EXTERNAL_IP" ]; then
    echo -e "   External: http://${EXTERNAL_IP}:8080/escrow-market/"
fi
echo ""

echo -e "${BLUE}🔐 Default Admin Credentials:${NC}"
echo -e "   Email:    admin@techtorio.com"
echo -e "   Password: Admin@123456"
echo -e "   ${YELLOW}⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER LOGIN${NC}"
echo ""

echo -e "${BLUE}🔑 Generated Secrets (SAVE THESE):${NC}"
echo -e "   Database Password: ${DB_PASSWORD}"
echo -e "   SMS Secret Key:    ${SMS_SECRET}"
echo -e "   Location:          $DEPLOY_DIR/.env.cloud"
echo ""

echo -e "${BLUE}🐳 Docker Commands:${NC}"
echo -e "   View logs:    docker compose -f docker-compose.cloud.yml logs -f"
echo -e "   Stop:         docker compose -f docker-compose.cloud.yml down"
echo -e "   Restart:      docker compose -f docker-compose.cloud.yml restart"
echo -e "   Status:       docker compose -f docker-compose.cloud.yml ps"
echo ""

echo -e "${BLUE}📊 Running Containers:${NC}"
docker compose -f docker-compose.cloud.yml ps

echo ""
echo -e "${BLUE}📖 Next Steps:${NC}"
echo "   1. Update your DNS A record to point to: ${EXTERNAL_IP}"
echo "   2. Wait 5-10 minutes for DNS propagation"
echo "   3. Access the application via your domain"
echo "   4. Login and change the admin password"
echo "   5. Configure SMS service in .env.cloud (SMS_BASE_URL)"
echo "   6. Optionally setup Cloudflare for SSL"
echo ""

echo -e "${BLUE}📚 Documentation:${NC}"
echo "   Full guide: $DEPLOY_DIR/deploy/FRESH_DEPLOYMENT.md"
echo "   Troubleshooting: Check logs with 'docker compose logs -f'"
echo ""

log_success "Deployment complete! 🚀"

# Save deployment info
cat > "$DEPLOY_DIR/deployment-info.txt" << EOF
TechTorio Deployment Information
================================
Deployment Date: $(date)
External IP: ${EXTERNAL_IP}
Database Password: ${DB_PASSWORD}
SMS Secret: ${SMS_SECRET}
Deployment Directory: ${DEPLOY_DIR}

Access URLs:
- Local: http://localhost:8080/escrow-market/
- External: http://${EXTERNAL_IP}:8080/escrow-market/

Default Admin:
- Email: admin@techtorio.com
- Password: Admin@123456
EOF

log_info "Deployment info saved to: $DEPLOY_DIR/deployment-info.txt"

# Reminder about Docker group
echo ""
log_warning "IMPORTANT: To use Docker without sudo, you may need to:"
log_warning "  1. Log out of your SSH session"
log_warning "  2. Log back in"
log_warning "  3. Then run: docker ps"
echo ""

exit 0
