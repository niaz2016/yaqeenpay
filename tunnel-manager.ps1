# YaqeenPay Cloudflare Tunnel Management Script
# Save this as: tunnel-manager.ps1

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "status", "setup")]
    [string]$Action = "start"
)

$TunnelName = "niaz"
$ConfigPath = "$env:USERPROFILE\.cloudflared\config.yml"

function Find-CloudflaredExecutable {
    # Common locations for cloudflared
    $possiblePaths = @(
        "cloudflared",  # If in PATH
        "$env:USERPROFILE\cloudflared.exe",
        "$env:USERPROFILE\Downloads\cloudflared.exe",
        "C:\Program Files\cloudflared\cloudflared.exe",
        "$env:ProgramFiles\cloudflared\cloudflared.exe"
    )
    
    foreach ($path in $possiblePaths) {
        try {
            if (Get-Command $path -ErrorAction SilentlyContinue) {
                return $path
            }
        } catch {
            continue
        }
    }
    
    Write-Error "Cloudflared executable not found. Please ensure it's installed and in PATH."
    return $null
}

function Start-Tunnel {
    $cloudflared = Find-CloudflaredExecutable
    if (-not $cloudflared) { return }
    
    Write-Host "Starting YaqeenPay tunnel..." -ForegroundColor Green
    Write-Host "Config: $ConfigPath" -ForegroundColor Cyan
    
    # Start tunnel in background
    Start-Process -FilePath $cloudflared -ArgumentList "tunnel", "--config", $ConfigPath, "run" -NoNewWindow
    
    Start-Sleep -Seconds 3
    Write-Host "Tunnel started! Check Cloudflare dashboard for status." -ForegroundColor Green
    Write-Host "Your YaqeenPay app should be accessible via your configured domain." -ForegroundColor Yellow
}

function Stop-Tunnel {
    Write-Host "Stopping tunnel..." -ForegroundColor Yellow
    Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "Tunnel stopped." -ForegroundColor Green
}

function Show-Status {
    $cloudflared = Find-CloudflaredExecutable
    if (-not $cloudflared) { return }
    
    Write-Host "Tunnel Status:" -ForegroundColor Cyan
    
    $processes = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($processes) {
        $pids = $processes.Id -join ", "
        Write-Host "Tunnel is running (PID: $pids)" -ForegroundColor Green
    } else {
        Write-Host "Tunnel is not running" -ForegroundColor Red
    }
    
    Write-Host "`nConfiguration:" -ForegroundColor Cyan
    if (Test-Path $ConfigPath) {
        Get-Content $ConfigPath | Write-Host
    } else {
        Write-Host "Config file not found: $ConfigPath" -ForegroundColor Red
    }
}

function Setup-Domain {
    Write-Host "Domain Setup Instructions for techtorio.online:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Go to Cloudflare Dashboard -> techtorio.online -> DNS" -ForegroundColor Yellow
    Write-Host "2. Add CNAME records for your domains:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Main site:" -ForegroundColor White
    Write-Host "   - Type: CNAME" -ForegroundColor Gray
    Write-Host "   - Name: @ (or techtorio.online)" -ForegroundColor Gray
    Write-Host "   - Target: $TunnelName.cfargotunnel.com" -ForegroundColor Gray
    Write-Host "   - Proxy: Enabled (Orange cloud)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   API subdomain:" -ForegroundColor White
    Write-Host "   - Type: CNAME" -ForegroundColor Gray
    Write-Host "   - Name: api" -ForegroundColor Gray
    Write-Host "   - Target: $TunnelName.cfargotunnel.com" -ForegroundColor Gray
    Write-Host "   - Proxy: Enabled (Orange cloud)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Admin subdomain:" -ForegroundColor White
    Write-Host "   - Type: CNAME" -ForegroundColor Gray
    Write-Host "   - Name: admin" -ForegroundColor Gray
    Write-Host "   - Target: $TunnelName.cfargotunnel.com" -ForegroundColor Gray
    Write-Host "   - Proxy: Enabled (Orange cloud)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Copy the config from cloudflare-config.yml to C:\Users\Precision\.cloudflared\config.yml" -ForegroundColor Yellow
    Write-Host "4. Run: .\tunnel-manager.ps1 start" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Your YaqeenPay app will be accessible at:" -ForegroundColor Green
    Write-Host "   - https://techtorio.online (Main site)" -ForegroundColor Cyan
    Write-Host "   - https://api.techtorio.online (API)" -ForegroundColor Cyan
    Write-Host "   - https://admin.techtorio.online (Admin)" -ForegroundColor Cyan
}

# Main execution
switch ($Action) {
    "start" { Start-Tunnel }
    "stop" { Stop-Tunnel }
    "status" { Show-Status }
    "setup" { Setup-Domain }
}