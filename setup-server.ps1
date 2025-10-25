# Server Initial Setup - Run on AWS Server
# This prepares the server for TechTorio deployment

param(
    [string]$ServerIP = "16.170.233.86",
    [string]$KeyPath = "C:\Users\Precision\Downloads\firstKey.pem",
    [string]$User = "ubuntu"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TechTorio Server Initial Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Connecting to server and running setup..." -ForegroundColor Yellow
Write-Host ""

ssh -i $KeyPath $User@$ServerIP @"
    set -e
    
    echo "📦 Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
    rm -f get-docker.sh
    
    echo "📦 Installing Docker Compose..."
    sudo apt install -y docker-compose-plugin
    
    echo "🌐 Installing Nginx..."
    sudo apt install -y nginx
    
    echo "🔒 Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
    
    echo "🔧 Installing essential tools..."
    sudo apt install -y git curl wget ufw htop
    
    echo "🔥 Configuring firewall..."
    sudo ufw --force enable
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    
    echo "✅ Server setup complete!"
    echo ""
    echo "Installed versions:"
    docker --version
    docker compose version
    nginx -v
    certbot --version
"@

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Server Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next step: Run .\deploy-landing-page.ps1" -ForegroundColor Yellow
Write-Host ""
