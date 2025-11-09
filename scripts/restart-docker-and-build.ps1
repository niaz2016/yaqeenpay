<#
restart-docker-and-build.ps1

Safely restarts Docker Desktop / WSL if needed and runs frontend & backend builds
Logs build output to .\.build-logs\frontend.log and backend.log for inspection.

Run as Administrator in PowerShell. Usage:
    .\scripts\restart-docker-and-build.ps1
#>

param(
    [string]$RepoRoot = 'D:\Work Repos\AI\techtorio',
    [int]$WaitSeconds = 180
)

function Assert-Admin {
    $current = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($current)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Error "This script should be run from an elevated (Administrator) PowerShell. Exiting."
        exit 2
    }
}

try {
    Assert-Admin
} catch {
    exit 2
}

Write-Output "[1/8] Shutting down WSL..."
wsl --shutdown 2>$null

Write-Output "[2/8] Killing lingering Docker Desktop / backend processes (if any)..."
$procNames = @('Docker Desktop','com.docker.backend','Docker')
Get-Process | Where-Object { $procNames -contains $_.ProcessName } -ErrorAction SilentlyContinue | ForEach-Object {
    try { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue } catch { }
}

Start-Sleep -Seconds 2

Write-Output "[3/8] Starting Docker Desktop (if installed) ..."
$dockerExe = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
if (Test-Path $dockerExe) {
    Start-Process -FilePath $dockerExe
    Write-Output "Started Docker Desktop from $dockerExe"
} else {
    Write-Output "Docker Desktop executable not found at $dockerExe. Please start Docker Desktop manually and re-run this script."
}

Write-Output "[4/8] Waiting up to $WaitSeconds seconds for Docker to respond..."
$start = Get-Date
$dockerReady = $false
while (((Get-Date) - $start).TotalSeconds -lt $WaitSeconds) {
    try {
        docker info > $null 2>&1
        $dockerReady = $true
        break
    } catch {
        $elapsed = [int](((Get-Date) - $start).TotalSeconds)
        Write-Output "  Waiting for Docker... ${elapsed}s"
        Start-Sleep -Seconds 3
    }
}

if (-not $dockerReady) {
    Write-Error "Docker did not become ready within $WaitSeconds seconds. Check Docker Desktop UI, then re-run this script."
    # collect last Docker Desktop logs (best-effort)
    try {
        $logDir = Join-Path $env:APPDATA 'Docker'
        if (Test-Path $logDir) {
            Write-Output "--- Recent Docker logs (tail 200) ---"
            Get-ChildItem -Path $logDir -Recurse -Include *.log -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 3 | ForEach-Object {
                Write-Output "--- $($_.FullName) ---"
                Get-Content -Path $_.FullName -Tail 200 -ErrorAction SilentlyContinue
            }
        }
    } catch { }
    exit 3
}

Write-Output "[5/8] Docker is responsive. Version: $(docker version --format '{{.Server.Version}}' 2>$null)"

# Enable BuildKit for this session
$Env:DOCKER_BUILDKIT = '1'

# prepare log directory
$logDir = Join-Path $RepoRoot '.build-logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

# Build frontend
Write-Output "[6/8] Building frontend (logged to $logDir\frontend.log)"
Push-Location -Path (Join-Path $RepoRoot 'Frontend')
$frontendLog = Join-Path $logDir 'frontend.log'
try {
    docker build -t techtorio-frontend:dev -f .\Dockerfile --progress=plain . 2>&1 | Tee-Object -FilePath $frontendLog
} catch {
    Write-Output "Frontend build command exited with non-zero status. See $frontendLog"
}
Pop-Location

# Build backend
Write-Output "[7/8] Building backend (logged to $logDir\backend.log)"
Push-Location -Path (Join-Path $RepoRoot 'Backend')
$backendLog = Join-Path $logDir 'backend.log'
try {
    docker build -t techtorio-backend:dev -f .\Dockerfile --progress=plain . 2>&1 | Tee-Object -FilePath $backendLog
} catch {
    Write-Output "Backend build command exited with non-zero status. See $backendLog"
}
Pop-Location

# cleanup
Remove-Item Env:\DOCKER_BUILDKIT -ErrorAction SilentlyContinue

Write-Output "[8/8] Done. Logs: $logDir\frontend.log and $logDir\backend.log"
Write-Output "If a step hung, open the corresponding log and paste the tail (last ~200 lines) here and I'll analyze."