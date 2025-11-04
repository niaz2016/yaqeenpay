# Mailbox Management Script for YaqeenPay Mail Server
# This script helps you create, list, and manage email accounts

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("add", "list", "delete", "passwd", "info", "dkim")]
    [string]$Action = "list",
    
    [Parameter(Mandatory=$false)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [string]$Password
)

$containerName = "techtorio-mailserver"

function Show-Usage {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "YaqeenPay Mailbox Management" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor White
    Write-Host "  .\manage-mailbox.ps1 -Action <action> [-Email <email>] [-Password <password>]" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  list      - List all mailboxes" -ForegroundColor White
    Write-Host "  add       - Create a new mailbox (requires -Email and -Password)" -ForegroundColor White
    Write-Host "  delete    - Delete a mailbox (requires -Email)" -ForegroundColor White
    Write-Host "  passwd    - Change mailbox password (requires -Email and -Password)" -ForegroundColor White
    Write-Host "  info      - Show mailserver information" -ForegroundColor White
    Write-Host "  dkim      - Show DKIM public key for DNS" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  # List all mailboxes" -ForegroundColor Gray
    Write-Host "  .\manage-mailbox.ps1 -Action list" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  # Create a new mailbox" -ForegroundColor Gray
    Write-Host "  .\manage-mailbox.ps1 -Action add -Email user@techtorio.online -Password MySecurePass123!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  # Delete a mailbox" -ForegroundColor Gray
    Write-Host "  .\manage-mailbox.ps1 -Action delete -Email user@techtorio.online" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  # Change password" -ForegroundColor Gray
    Write-Host "  .\manage-mailbox.ps1 -Action passwd -Email user@techtorio.online -Password NewPass456!" -ForegroundColor Cyan
    Write-Host ""
}

function Test-MailserverRunning {
    $running = docker ps --filter "name=$containerName" --filter "status=running" --format "{{.Names}}"
    if ($running -ne $containerName) {
        Write-Host "✗ Mail server is not running!" -ForegroundColor Red
        Write-Host "Start it with: docker-compose up -d mailserver" -ForegroundColor Yellow
        exit 1
    }
    return $true
}

function Add-Mailbox {
    if (-not $Email -or -not $Password) {
        Write-Host "✗ Email and Password are required for adding a mailbox!" -ForegroundColor Red
        Show-Usage
        exit 1
    }
    
    Write-Host "Creating mailbox: $Email" -ForegroundColor Yellow
    docker exec $containerName setup email add $Email $Password
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Mailbox created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Mailbox Details:" -ForegroundColor Cyan
        Write-Host "  Email: $Email" -ForegroundColor White
        Write-Host "  Password: $Password" -ForegroundColor White
        Write-Host ""
        Write-Host "Client Settings:" -ForegroundColor Cyan
        Write-Host "  IMAP Server: mail.techtorio.online" -ForegroundColor White
        Write-Host "  IMAP Port: 993 (SSL/TLS)" -ForegroundColor White
        Write-Host "  SMTP Server: mail.techtorio.online" -ForegroundColor White
        Write-Host "  SMTP Port: 587 (STARTTLS) or 465 (SSL/TLS)" -ForegroundColor White
        Write-Host "  Username: $Email" -ForegroundColor White
        Write-Host "  Password: $Password" -ForegroundColor White
    } else {
        Write-Host "✗ Failed to create mailbox!" -ForegroundColor Red
    }
}

function Remove-Mailbox {
    if (-not $Email) {
        Write-Host "✗ Email is required for deleting a mailbox!" -ForegroundColor Red
        Show-Usage
        exit 1
    }
    
    Write-Host "Deleting mailbox: $Email" -ForegroundColor Yellow
    Write-Host "Are you sure? (Y/N): " -ForegroundColor Red -NoNewline
    $confirm = Read-Host
    
    if ($confirm -eq "Y" -or $confirm -eq "y") {
        docker exec $containerName setup email del $Email
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Mailbox deleted successfully!" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to delete mailbox!" -ForegroundColor Red
        }
    } else {
        Write-Host "Cancelled." -ForegroundColor Yellow
    }
}

function Update-Password {
    if (-not $Email -or -not $Password) {
        Write-Host "✗ Email and Password are required for changing password!" -ForegroundColor Red
        Show-Usage
        exit 1
    }
    
    Write-Host "Updating password for: $Email" -ForegroundColor Yellow
    docker exec $containerName setup email update $Email $Password
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Password updated successfully!" -ForegroundColor Green
        Write-Host "  New Password: $Password" -ForegroundColor White
    } else {
        Write-Host "✗ Failed to update password!" -ForegroundColor Red
    }
}

function Get-MailboxList {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Current Mailboxes" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    docker exec $containerName setup email list
    Write-Host ""
}

function Get-MailserverInfo {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Mail Server Information" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    $containerStatus = docker ps --filter "name=$containerName" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    Write-Host $containerStatus
    
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor Yellow
    Write-Host "  Domain: techtorio.online" -ForegroundColor White
    Write-Host "  Hostname: mail.techtorio.online" -ForegroundColor White
    Write-Host "  SMTP Ports: 25, 587, 465" -ForegroundColor White
    Write-Host "  IMAP Ports: 143, 993" -ForegroundColor White
    Write-Host "  POP3 Ports: 110, 995" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Logs:" -ForegroundColor Yellow
    Write-Host "  View logs: docker logs $containerName" -ForegroundColor Gray
    Write-Host "  Tail logs: docker logs $containerName -f" -ForegroundColor Gray
    Write-Host ""
}

function Get-DkimKey {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "DKIM Public Key for DNS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Add this TXT record to your DNS:" -ForegroundColor Yellow
    Write-Host "  Name: mail._domainkey" -ForegroundColor White
    Write-Host "  Type: TXT" -ForegroundColor White
    Write-Host "  Value: (see below)" -ForegroundColor White
    Write-Host ""
    
    docker exec $containerName cat /tmp/docker-mailserver/opendkim/keys/techtorio.online/mail.txt
    
    Write-Host ""
    Write-Host "Copy the content between quotes and paste as a single line in Cloudflare" -ForegroundColor Yellow
}

# Main script execution
Test-MailserverRunning

switch ($Action) {
    "add" { Add-Mailbox }
    "delete" { Remove-Mailbox }
    "passwd" { Update-Password }
    "list" { Get-MailboxList }
    "info" { Get-MailserverInfo }
    "dkim" { Get-DkimKey }
    default { Show-Usage }
}
