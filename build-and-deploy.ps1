# Build and Deploy Docker Images for Production Testing
# This script builds the latest backend and frontend images and updates the running containers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TechTorio - Build & Deploy to Production" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "Step 2: Building Backend image..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
docker build -t techtorio-backend:latest ./Backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend image built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Building Frontend image..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
docker build -t techtorio-frontend:latest ./Frontend
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend image built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Starting containers..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "Step 5: Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check backend health
Write-Host "Checking backend status..." -ForegroundColor Gray
$backendStatus = docker inspect --format='{{.State.Status}}' techtorio-backend
if ($backendStatus -eq "running") {
    Write-Host "✓ Backend is running" -ForegroundColor Green
} else {
    Write-Host "✗ Backend status: $backendStatus" -ForegroundColor Red
}

# Check frontend health
Write-Host "Checking frontend status..." -ForegroundColor Gray
$frontendStatus = docker inspect --format='{{.State.Status}}' techtorio-frontend
if ($frontendStatus -eq "running") {
    Write-Host "✓ Frontend is running" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend status: $frontendStatus" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get container info
Write-Host ""
Write-Host "Running Containers:" -ForegroundColor Yellow
docker ps --filter "name=techtorio" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Image Information:" -ForegroundColor Yellow
docker images --filter "reference=techtorio-*" --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Access URLs:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost (or your configured domain)" -ForegroundColor White
Write-Host "  Backend API: http://localhost/api" -ForegroundColor White
Write-Host "  Swagger: http://localhost/api/swagger" -ForegroundColor White

Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  View logs:        docker-compose logs -f" -ForegroundColor White
Write-Host "  Backend logs:     docker logs -f techtorio-backend" -ForegroundColor White
Write-Host "  Frontend logs:    docker logs -f techtorio-frontend" -ForegroundColor White
Write-Host "  Restart:          docker-compose restart" -ForegroundColor White
Write-Host "  Stop:             docker-compose down" -ForegroundColor White

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Build and deployment complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to view logs
$viewLogs = Read-Host "Do you want to view the logs? (y/n)"
if ($viewLogs -eq 'y') {
    Write-Host ""
    Write-Host "Opening logs (Press Ctrl+C to exit)..." -ForegroundColor Yellow
    docker-compose logs -f
}
