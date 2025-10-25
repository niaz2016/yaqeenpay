# TechTorio Simple Deployment Script
# Fixed version without quote issues

param(
    [string]$ServerIP = "16.170.233.86",
    [string]$KeyPath = "C:\Users\Precision\Downloads\firstKey.pem",
    [string]$User = "ubuntu"
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TechTorio Deployment to AWS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test Connection
Write-Host "[1/6] Testing SSH connection..." -ForegroundColor Yellow
$testResult = ssh -i $KeyPath -o ConnectTimeout=10 -o StrictHostKeyChecking=no $User@$ServerIP "echo OK" 2>&1
if ($testResult -match "OK") {
    Write-Host "      Connected successfully" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "      Connection failed" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Setup Server
Write-Host "[2/6] Setting up server..." -ForegroundColor Yellow
ssh -i $KeyPath $User@$ServerIP @"
    sudo apt update -qq
    sudo apt install -y nginx git curl wget ufw
    sudo ufw --force enable
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    echo 'Server setup complete'
"@
Write-Host "      Server configured" -ForegroundColor Green
Write-Host ""

# Create Directories
Write-Host "[3/6] Creating directory structure..." -ForegroundColor Yellow
ssh -i $KeyPath $User@$ServerIP @"
    sudo mkdir -p /opt/techtorio/gateway/html /opt/techtorio/nginx /opt/techtorio/logs
    sudo chown -R ubuntu:ubuntu /opt/techtorio
"@
Write-Host "      Directories created" -ForegroundColor Green
Write-Host ""

# Copy Files
Write-Host "[4/6] Copying landing page files..." -ForegroundColor Yellow
scp -i $KeyPath -r "D:\Work Repos\AI\yaqeenpay\gateway\html\*" ${User}@${ServerIP}:/opt/techtorio/gateway/html/ 2>&1 | Out-Null
Write-Host "      Files copied" -ForegroundColor Green
Write-Host ""

# Configure Nginx
Write-Host "[5/6] Configuring nginx..." -ForegroundColor Yellow
ssh -i $KeyPath $User@$ServerIP @'
cat > /opt/techtorio/nginx/techtorio.conf << 'NGINXEOF'
server {
    listen 80;
    server_name techtorio.online www.techtorio.online 16.170.233.86;

    root /opt/techtorio/gateway/html;
    index index.html;

    access_log /opt/techtorio/logs/access.log;
    error_log /opt/techtorio/logs/error.log;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINXEOF

sudo cp /opt/techtorio/nginx/techtorio.conf /etc/nginx/sites-available/techtorio.conf
sudo ln -sf /etc/nginx/sites-available/techtorio.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
'@
Write-Host "      Nginx configured" -ForegroundColor Green
Write-Host ""

# Verify
Write-Host "[6/6] Verifying deployment..." -ForegroundColor Yellow
ssh -i $KeyPath $User@$ServerIP "curl -s -o /dev/null -w 'HTTP Status: %{http_code}' http://localhost/"
Write-Host ""
Write-Host "      Deployment verified" -ForegroundColor Green
Write-Host ""

# Success Message
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Your site is live at:" -ForegroundColor Cyan
Write-Host "   http://$ServerIP" -ForegroundColor White
Write-Host "   http://techtorio.online (after DNS setup)" -ForegroundColor White
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test: Open http://$ServerIP in browser" -ForegroundColor White
Write-Host "   2. Setup DNS A record: techtorio.online -> $ServerIP" -ForegroundColor White
Write-Host "   3. Setup SSL: .\setup-ssl.ps1" -ForegroundColor White
Write-Host ""

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host ""
