# TechTorio Master Deployment Script
# This will deploy the entire platform step by step

param(
    [string]$ServerIP = "16.170.233.86",
    [string]$KeyPath = "C:\Users\Precision\Downloads\firstKey.pem",
    [string]$User = "ubuntu",
    [string]$Email = "admin@techtorio.online"
)

$ErrorActionPreference = "Stop"

Write-Host @"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         TechTorio Platform Deployment                 ║
║                                                            ║
║  Server IP: $ServerIP                          ║
║  Domain: techtorio.online                                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host ""

# Function to run a step
function Run-Step {
    param([string]$Title, [ScriptBlock]$Action)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
    Write-Host "▶ $Title" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
    & $Action
    Write-Host " Completed: $Title" -ForegroundColor Green
}

# Step 1: Test Connection
Run-Step "Testing SSH Connection" {
    Write-Host "Attempting to connect to $ServerIP..." -ForegroundColor White
    $result = ssh -i $KeyPath -o ConnectTimeout=10 -o StrictHostKeyChecking=no $User@$ServerIP "echo 'OK'" 2>&1
    if ($result -notmatch "OK") {
        throw "Failed to connect to server"
    }
    Write-Host "Connection successful!" -ForegroundColor Green
}

# Step 2: Check DNS Configuration
Run-Step "Checking DNS Configuration" {
    Write-Host "Checking DNS for techtorio.online..." -ForegroundColor White
    try {
        $dns = Resolve-DnsName -Name "techtorio.online" -ErrorAction SilentlyContinue
        if ($dns.IPAddress -contains $ServerIP) {
            Write-Host " DNS correctly points to $ServerIP" -ForegroundColor Green
        } else {
            Write-Host "  DNS not configured or not propagated yet" -ForegroundColor Yellow
            Write-Host "   Please add A record: techtorio.online -> $ServerIP" -ForegroundColor Yellow
            Write-Host "   Current IP: $($dns.IPAddress)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  DNS lookup failed. Please configure DNS records." -ForegroundColor Yellow
    }
}

# Step 3: Server Setup
Run-Step "Setting Up Server (Docker, Nginx, etc.)" {
    ssh -i $KeyPath $User@$ServerIP @"
        set -e
        echo "Updating system..."
        sudo apt update -qq
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo "Installing Docker..."
            curl -fsSL https://get.docker.com | sudo sh
            sudo usermod -aG docker ubuntu
        else
            echo "Docker already installed"
        fi
        
        # Check if Nginx is installed
        if ! command -v nginx &> /dev/null; then
            echo "Installing Nginx and Certbot..."
            sudo apt install -y nginx certbot python3-certbot-nginx
        else
            echo "Nginx already installed"
        fi
        
        echo "Installing additional tools..."
        sudo apt install -y git curl wget ufw -qq
        
        echo "Configuring firewall..."
        sudo ufw --force enable
        sudo ufw allow OpenSSH
        sudo ufw allow 'Nginx Full'
"@
}

# Step 4: Create Directory Structure
Run-Step "Creating Directory Structure" {
    ssh -i $KeyPath $User@$ServerIP @"
        sudo mkdir -p /opt/techtorio/gateway/html /opt/techtorio/nginx/conf.d /opt/techtorio/logs
        sudo chown -R ubuntu:ubuntu /opt/techtorio
        echo "Directory structure created"
"@
}

# Step 5: Copy Landing Page Files
Run-Step "Deploying Landing Page Files" {
    Write-Host "Copying files from: D:\Work Repos\AI\yaqeenpay\gateway\html" -ForegroundColor White
    scp -i $KeyPath -r "D:\Work Repos\AI\yaqeenpay\gateway\html\*" ${User}@${ServerIP}:/opt/techtorio/gateway/html/ 2>&1 | Out-Null
    Write-Host "Files copied successfully" -ForegroundColor Green
}

# Step 6: Configure Nginx
Run-Step "Configuring Nginx" {
    ssh -i $KeyPath $User@$ServerIP @"
        cat > /opt/techtorio/nginx/techtorio.conf << 'NGINXEOF'
server {
    listen 80;
    server_name techtorio.online www.techtorio.online $ServerIP;

    root /opt/techtorio/gateway/html;
    index index.html;

    access_log /opt/techtorio/logs/access.log;
    error_log /opt/techtorio/logs/error.log;

    location / {
        try_files \$uri \$uri/ =404;
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
        
        echo "Testing Nginx configuration..."
        sudo nginx -t
        
        echo "Restarting Nginx..."
        sudo systemctl restart nginx
        sudo systemctl enable nginx
"@
}

# Step 7: Verify Deployment
Run-Step "Verifying Deployment" {
    ssh -i $KeyPath $User@$ServerIP @"
        echo "Checking Nginx status..."
        sudo systemctl status nginx --no-pager | head -n 3
        
        echo ""
        echo "Checking if files exist..."
        ls -lh /opt/techtorio/gateway/html/ | head -n 5
        
        echo ""
        echo "Testing HTTP response..."
        curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/
"@
}

# Final Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║             DEPLOYMENT SUCCESSFUL!                     ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your landing page is now accessible at:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   HTTP:  http://$ServerIP" -ForegroundColor White
Write-Host "   HTTP:  http://techtorio.online (if DNS is configured)" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Test in browser: http://$ServerIP" -ForegroundColor White
Write-Host ""
Write-Host "   2. If DNS is configured, test: http://techtorio.online" -ForegroundColor White
Write-Host ""
Write-Host "   3. Setup SSL certificate (HTTPS):" -ForegroundColor White
Write-Host "      .\setup-ssl.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "   4. Deploy YaqeenPay application (coming next)" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "🔍 Useful Commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Check nginx logs:" -ForegroundColor White
Write-Host ('   ssh -i "' + $KeyPath + '" ' + $User + '@' + $ServerIP + ' "sudo tail -f /opt/techtorio/logs/error.log"') -ForegroundColor Gray
Write-Host ""
Write-Host "   Restart nginx:" -ForegroundColor White
Write-Host ('   ssh -i "' + $KeyPath + '" ' + $User + '@' + $ServerIP + ' "sudo systemctl restart nginx"') -ForegroundColor Gray
Write-Host ""
Write-Host "   Check server status:" -ForegroundColor White
Write-Host ('   ssh -i "' + $KeyPath + '" ' + $User + '@' + $ServerIP + ' "sudo systemctl status nginx"') -ForegroundColor Gray
Write-Host ""
