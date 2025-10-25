#!/usr/bin/env pwsh
# Deploy gateway landing page to server

$serverIP = "16.170.233.86"
$keyPath = "C:\Users\Precision\Downloads\firstKey.pem"
$localPath = Join-Path $PSScriptRoot "gateway\html"
$remotePath = "/var/www/techtorio"

Write-Host "Deploying gateway landing page to server..." -ForegroundColor Cyan

# Create remote directory if it doesn't exist
Write-Host "`nCreating remote directory..." -ForegroundColor Yellow
ssh -i $keyPath ubuntu@$serverIP "sudo mkdir -p $remotePath && sudo chown www-data:www-data $remotePath"

# Upload all files
Write-Host "`nUploading files..." -ForegroundColor Yellow
scp -i $keyPath "$localPath\index.html" ubuntu@$serverIP:/tmp/
scp -i $keyPath "$localPath\styles.css" ubuntu@$serverIP:/tmp/
scp -i $keyPath "$localPath\logo.svg" ubuntu@$serverIP:/tmp/
scp -i $keyPath "$localPath\favicon.svg" ubuntu@$serverIP:/tmp/

# Move files to the web directory with correct permissions
Write-Host "`nSetting up files..." -ForegroundColor Yellow
ssh -i $keyPath ubuntu@$serverIP @"
sudo mv /tmp/index.html $remotePath/
sudo mv /tmp/styles.css $remotePath/
sudo mv /tmp/logo.svg $remotePath/
sudo mv /tmp/favicon.svg $remotePath/
sudo chown -R www-data:www-data $remotePath
sudo chmod -R 755 $remotePath
"@

# Check nginx configuration for the landing page
Write-Host "`nChecking nginx configuration..." -ForegroundColor Yellow
ssh -i $keyPath ubuntu@$serverIP "sudo cat /etc/nginx/sites-enabled/default | grep -A 5 'root' | head -n 10"

Write-Host "`nDeployment complete!" -ForegroundColor Green
Write-Host "Landing page should be accessible at: http://16.170.233.86 or https://techtorio.online" -ForegroundColor Cyan
