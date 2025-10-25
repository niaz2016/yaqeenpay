# TechTorio Deployment - PowerShell Script
# Run this from your local Windows machine

param(
    [string]$ServerIP = "16.170.233.86",
    [string]$KeyPath = "C:\Users\Precision\Downloads\firstKey.pem",
    [string]$User = "ubuntu"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TechTorio Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectPath = "D:\Work Repos\AI\yaqeenpay"

# Step 1: Test SSH Connection
Write-Host "1. Testing SSH connection..." -ForegroundColor Yellow
try {
    ssh -i $KeyPath -o ConnectTimeout=10 -o StrictHostKeyChecking=no $User@$ServerIP "echo 'Connection successful'"
    Write-Host "   ✅ SSH connection successful" -ForegroundColor Green
} catch {
    Write-Host "   ❌ SSH connection failed!" -ForegroundColor Red
    Write-Host "   Make sure the server is running and the key path is correct." -ForegroundColor Red
    exit 1
}

# Step 2: Create directory structure
Write-Host ""
Write-Host "2. Creating directory structure on server..." -ForegroundColor Yellow
ssh -i $KeyPath $User@$ServerIP @"
    sudo mkdir -p /opt/techtorio/gateway/html /opt/techtorio/nginx/conf.d /opt/techtorio/logs
    sudo chown -R ubuntu:ubuntu /opt/techtorio
"@
Write-Host "   ✅ Directory structure created" -ForegroundColor Green

# Step 3: Copy gateway files
Write-Host ""
Write-Host "3. Copying landing page files..." -ForegroundColor Yellow
scp -i $KeyPath -r "$ProjectPath\gateway\html\*" ${User}@${ServerIP}:/opt/techtorio/gateway/html/
Write-Host "   ✅ Landing page files copied" -ForegroundColor Green

# Step 4: Create nginx configuration
Write-Host ""
Write-Host "4. Creating nginx configuration..." -ForegroundColor Yellow
$nginxConfig = @"
server {
    listen 80;
    server_name techtorio.online www.techtorio.online;

    root /opt/techtorio/gateway/html;
    index index.html;

    access_log /opt/techtorio/logs/access.log;
    error_log /opt/techtorio/logs/error.log;

    location / {
        try_files `$uri `$uri/ =404;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
"@

$nginxConfig | ssh -i $KeyPath $User@$ServerIP "cat > /opt/techtorio/nginx/techtorio.conf"
Write-Host "   ✅ Nginx configuration created" -ForegroundColor Green

# Step 5: Setup nginx
Write-Host ""
Write-Host "5. Configuring nginx on server..." -ForegroundColor Yellow
ssh -i $KeyPath $User@$ServerIP @"
    sudo cp /opt/techtorio/nginx/techtorio.conf /etc/nginx/sites-available/techtorio.conf
    sudo ln -sf /etc/nginx/sites-available/techtorio.conf /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl restart nginx
"@
Write-Host "   ✅ Nginx configured and restarted" -ForegroundColor Green

# Step 6: Test deployment
Write-Host ""
Write-Host "6. Testing deployment..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your landing page should now be accessible at:" -ForegroundColor White
Write-Host "  http://techtorio.online" -ForegroundColor Cyan
Write-Host "  http://$ServerIP" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Configure your DNS A records to point to $ServerIP" -ForegroundColor White
Write-Host "  2. Wait 5-10 minutes for DNS propagation" -ForegroundColor White
Write-Host "  3. Setup SSL certificate (run: .\setup-ssl.ps1)" -ForegroundColor White
Write-Host ""
Write-Host "To check server logs, run:" -ForegroundColor Yellow
Write-Host "  ssh -i $KeyPath $User@$ServerIP 'sudo tail -f /var/log/nginx/error.log'" -ForegroundColor White
Write-Host ""
