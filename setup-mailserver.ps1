# Docker Mailserver Setup Script for YaqeenPay
# Run this script to initialize the mail server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "YaqeenPay Mail Server Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create config directory
Write-Host "[1/6] Creating mail server config directory..." -ForegroundColor Yellow
$configDir = ".\mailserver-config"
if (!(Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir | Out-Null
    Write-Host "✓ Created $configDir" -ForegroundColor Green
} else {
    Write-Host "✓ Directory already exists" -ForegroundColor Green
}

# Create SSL directory
Write-Host "`n[2/6] Creating SSL certificate directory..." -ForegroundColor Yellow
$sslDir = "$configDir\ssl"
if (!(Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir | Out-Null
    Write-Host "✓ Created $sslDir" -ForegroundColor Green
} else {
    Write-Host "✓ Directory already exists" -ForegroundColor Green
}

# Generate self-signed certificate (temporary - replace with Let's Encrypt later)
Write-Host "`n[3/6] Generating self-signed SSL certificate (temporary)..." -ForegroundColor Yellow
Write-Host "Note: You should replace this with Let's Encrypt certificates for production" -ForegroundColor DarkYellow

$certFile = "$sslDir\cert.pem"
$keyFile = "$sslDir\key.pem"

if (!(Test-Path $certFile) -or !(Test-Path $keyFile)) {
    # Use OpenSSL via Docker (works on Windows without OpenSSL installed)
    docker run --rm -v "${PWD}/mailserver-config/ssl:/certs" alpine/openssl req -x509 -newkey rsa:4096 -keyout /certs/key.pem -out /certs/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Techtorio/CN=mail.techtorio.online"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ SSL certificate generated" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to generate certificate" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ SSL certificates already exist" -ForegroundColor Green
}

# Start the mail server
Write-Host "`n[4/6] Starting docker-mailserver..." -ForegroundColor Yellow
docker-compose up -d mailserver

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Mail server container started" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to start mail server" -ForegroundColor Red
    exit 1
}

# Wait for mail server to initialize
Write-Host "`n[5/6] Waiting for mail server to initialize (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Setup DKIM keys
Write-Host "`n[6/6] Setting up DKIM email authentication..." -ForegroundColor Yellow
docker exec techtorio-mailserver setup config dkim
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ DKIM keys generated" -ForegroundColor Green
} else {
    Write-Host "⚠ DKIM setup failed (you can run it manually later)" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Mail Server Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor White
Write-Host "1. Create a test mailbox:" -ForegroundColor White
Write-Host "   docker exec techtorio-mailserver setup email add admin@techtorio.online YourPassword123" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Get DKIM public key for DNS:" -ForegroundColor White
Write-Host "   docker exec techtorio-mailserver cat /tmp/docker-mailserver/opendkim/keys/techtorio.online/mail.txt" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Add DNS records to Cloudflare (see mailserver-dns-records.txt)" -ForegroundColor White
Write-Host ""
Write-Host "4. List all mailboxes:" -ForegroundColor White
Write-Host "   docker exec techtorio-mailserver setup email list" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Check mail server logs:" -ForegroundColor White
Write-Host "   docker logs techtorio-mailserver" -ForegroundColor Cyan
Write-Host ""

# Create DNS records guide
$dnsGuide = @"
# DNS Records for Cloudflare
# Add these records to your Cloudflare DNS for techtorio.online

## 1. MX Record (Required for receiving emails)
Type: MX
Name: @
Mail server: mail.techtorio.online
Priority: 10
TTL: Auto

## 2. A Record for mail server (Required)
Type: A
Name: mail
IPv4 address: YOUR_PUBLIC_IP_HERE
TTL: Auto
Proxy status: DNS only (turn OFF orange cloud)

## 3. SPF Record (Anti-spam)
Type: TXT
Name: @
Content: v=spf1 mx a:mail.techtorio.online ~all
TTL: Auto

## 4. DKIM Record (Email authentication)
Type: TXT
Name: mail._domainkey
Content: [Run this command to get the value]
  docker exec techtorio-mailserver cat /tmp/docker-mailserver/opendkim/keys/techtorio.online/mail.txt
TTL: Auto

## 5. DMARC Record (Email policy)
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=quarantine; rua=mailto:admin@techtorio.online; fo=1
TTL: Auto

## IMPORTANT NOTES:
- Make sure the 'mail' A record is NOT proxied (orange cloud OFF)
- Replace YOUR_PUBLIC_IP_HERE with your actual public IP
- For Cloudflare Tunnel users: You need to expose ports 25, 587, 993 directly
- Ports cannot go through Cloudflare Tunnel - consider using a VPS or port forwarding
"@

$dnsGuide | Out-File -FilePath "mailserver-dns-records.txt" -Encoding UTF8
Write-Host "✓ DNS records guide saved to: mailserver-dns-records.txt" -ForegroundColor Green

Write-Host "`nMail server is ready! Follow the next steps above." -ForegroundColor Cyan
