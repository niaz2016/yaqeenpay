# YaqeenPay Deployment Script (PowerShell)
# This script deploys the YaqeenPay application using Docker Compose

param(
    [string]$Environment = "development",
    [string]$Registry = "localhost:5000",
    [string]$Tag = "latest",
    [string]$FrontendPort = "3000",
    [string]$BackendPort = "5000",
    [switch]$Down,
    [switch]$Logs,
    [switch]$Status,
    [switch]$Help
)

# Function to show usage
function Show-Usage {
    Write-Host ""
    Write-Host "YaqeenPay Deployment Script" -ForegroundColor Blue
    Write-Host "Usage: .\deploy.ps1 [OPTIONS]" -ForegroundColor Green
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Environment ENV     Deployment environment (development/production, default: development)"
    Write-Host "  -Registry REGISTRY   Docker registry URL (default: localhost:5000)"
    Write-Host "  -Tag TAG            Image tag (default: latest)"
    Write-Host "  -FrontendPort PORT  Frontend port (default: 3000)"
    Write-Host "  -BackendPort PORT   Backend port (default: 5000)"
    Write-Host "  -Down               Stop and remove containers"
    Write-Host "  -Logs               Show container logs"
    Write-Host "  -Status             Show container status"
    Write-Host "  -Help               Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\deploy.ps1                                    # Deploy in development mode"
    Write-Host "  .\deploy.ps1 -Environment production -Tag v1.0.0"
    Write-Host "  .\deploy.ps1 -Down                             # Stop containers"
    Write-Host "  .\deploy.ps1 -Logs                             # View logs"
    exit
}

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Show help if requested
if ($Help) {
    Show-Usage
}

# Set environment variables
$env:REGISTRY = $Registry
$env:TAG = $Tag
$env:FRONTEND_PORT = $FrontendPort
$env:BACKEND_PORT = $BackendPort

# Determine compose file
$ComposeFile = if ($Environment -eq "production") { "docker-compose.prod.yml" } else { "docker-compose.yml" }

Write-Status "YaqeenPay Deployment Script"
Write-Status "Environment: $Environment"
Write-Status "Compose File: $ComposeFile"
Write-Status "Registry: $Registry"
Write-Status "Tag: $Tag"
Write-Status "Frontend Port: $FrontendPort"
Write-Status "Backend Port: $BackendPort"

# Handle different actions
try {
    if ($Down) {
        Write-Status "Stopping and removing containers..."
        docker-compose -f $ComposeFile down --remove-orphans
        Write-Success "Containers stopped successfully"
    }
    elseif ($Logs) {
        Write-Status "Showing container logs..."
        docker-compose -f $ComposeFile logs -f
    }
    elseif ($Status) {
        Write-Status "Container status:"
        docker-compose -f $ComposeFile ps
        Write-Host ""
        Write-Status "Health status:"
        docker-compose -f $ComposeFile exec backend curl -f http://localhost:8080/health 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend is healthy"
        } else {
            Write-Warning "Backend health check failed"
        }
        
        docker-compose -f $ComposeFile exec frontend curl -f http://localhost:80 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Frontend is healthy"
        } else {
            Write-Warning "Frontend health check failed"
        }
    }
    else {
        Write-Status "Starting YaqeenPay application..."
        
        # Pull latest images if using production environment
        if ($Environment -eq "production") {
            Write-Status "Pulling latest images..."
            docker-compose -f $ComposeFile pull
        }
        
        # Start services
        docker-compose -f $ComposeFile up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Application started successfully!"
            Write-Host ""
            Write-Status "Application URLs:"
            Write-Host "  - Frontend: http://localhost:$FrontendPort" -ForegroundColor Cyan
            Write-Host "  - Backend API: http://localhost:$BackendPort" -ForegroundColor Cyan
            Write-Host ""
            Write-Status "Useful commands:"
            Write-Host "  - View logs: .\deploy.ps1 -Logs"
            Write-Host "  - Check status: .\deploy.ps1 -Status"
            Write-Host "  - Stop application: .\deploy.ps1 -Down"
        } else {
            Write-Error "Failed to start application"
            exit 1
        }
    }
}
catch {
    Write-Error "Deployment failed: $_"
    exit 1
}