# Configure Windows Firewall for Mail Server Ports
# Run this script as Administrator

Write-Host "Configuring Windows Firewall for Email Ports..." -ForegroundColor Cyan
Write-Host ""

# SMTP ports
Write-Host "[1/7] Allowing SMTP port 25 (incoming mail)..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Mail Server - SMTP (25)" -Direction Inbound -Protocol TCP -LocalPort 25 -Action Allow -ErrorAction SilentlyContinue

Write-Host "[2/7] Allowing SMTP port 587 (submission)..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Mail Server - Submission (587)" -Direction Inbound -Protocol TCP -LocalPort 587 -Action Allow -ErrorAction SilentlyContinue

Write-Host "[3/7] Allowing SMTPS port 465..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Mail Server - SMTPS (465)" -Direction Inbound -Protocol TCP -LocalPort 465 -Action Allow -ErrorAction SilentlyContinue

# IMAP ports
Write-Host "[4/7] Allowing IMAP port 143..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Mail Server - IMAP (143)" -Direction Inbound -Protocol TCP -LocalPort 143 -Action Allow -ErrorAction SilentlyContinue

Write-Host "[5/7] Allowing IMAPS port 993..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Mail Server - IMAPS (993)" -Direction Inbound -Protocol TCP -LocalPort 993 -Action Allow -ErrorAction SilentlyContinue

# POP3 ports (optional)
Write-Host "[6/7] Allowing POP3 port 110..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Mail Server - POP3 (110)" -Direction Inbound -Protocol TCP -LocalPort 110 -Action Allow -ErrorAction SilentlyContinue

Write-Host "[7/7] Allowing POP3S port 995..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Mail Server - POP3S (995)" -Direction Inbound -Protocol TCP -LocalPort 995 -Action Allow -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✓ Windows Firewall configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Ports allowed:" -ForegroundColor Cyan
Write-Host "  - TCP 25  (SMTP - incoming mail)" -ForegroundColor White
Write-Host "  - TCP 587 (Submission - authenticated sending)" -ForegroundColor White
Write-Host "  - TCP 465 (SMTPS - SSL/TLS)" -ForegroundColor White
Write-Host "  - TCP 993 (IMAPS - secure IMAP)" -ForegroundColor White
Write-Host "  - TCP 143 (IMAP)" -ForegroundColor White
Write-Host "  - TCP 995 (POP3S)" -ForegroundColor White
Write-Host "  - TCP 110 (POP3)" -ForegroundColor White
Write-Host ""
Write-Host "Next Step: Configure port forwarding on your router" -ForegroundColor Yellow
Write-Host "  Your local IP: 192.168.43.48" -ForegroundColor Cyan
Write-Host "  Forward the ports above to this IP" -ForegroundColor Cyan
