# Setup SSL Certificate for TechTorio
# Run this AFTER DNS is configured and propagated

param(
    [string]$ServerIP = "16.170.233.86",
    [string]$KeyPath = "C:\Users\Precision\Downloads\firstKey.pem",
    [string]$User = "ubuntu",
    [string]$Email = "admin@techtorio.online"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TechTorio SSL Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test DNS first
Write-Host "Testing DNS resolution..." -ForegroundColor Yellow
$dnsTest = Resolve-DnsName -Name "techtorio.online" -ErrorAction SilentlyContinue

if ($dnsTest -and $dnsTest.IPAddress -contains $ServerIP) {
    Write-Host "✅ DNS is correctly configured" -ForegroundColor Green
    Write-Host "   techtorio.online -> $ServerIP" -ForegroundColor Gray
} else {
    Write-Host "⚠️  DNS may not be propagated yet" -ForegroundColor Yellow
    Write-Host "   Current resolution: $($dnsTest.IPAddress)" -ForegroundColor Gray
    Write-Host "   Expected: $ServerIP" -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Host "Exiting. Please wait for DNS propagation." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Setting up SSL certificate with Let's Encrypt..." -ForegroundColor Yellow
Write-Host ""

# Install certbot and get certificate
ssh -i $KeyPath $User@$ServerIP @"
    # Install certbot if not already installed
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx

    # Get certificate
    sudo certbot --nginx \
        -d techtorio.online \
        -d www.techtorio.online \
        --non-interactive \
        --agree-tos \
        --email $Email \
        --redirect

    # Test auto-renewal
    sudo certbot renew --dry-run
"@

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ SSL Certificate Installed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your site should now be accessible via HTTPS:" -ForegroundColor White
Write-Host "  https://techtorio.online" -ForegroundColor Cyan
Write-Host "  https://www.techtorio.online" -ForegroundColor Cyan
Write-Host ""
Write-Host "Certificate will auto-renew every 90 days." -ForegroundColor Gray
Write-Host ""
