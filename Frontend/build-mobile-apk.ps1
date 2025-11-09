# TechTorio Mobile APK Build Script
# This script ensures proper environment configuration for mobile builds

Write-Host "=== TechTorio Mobile APK Build Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Java
Write-Host "Step 1: Checking Java installation..." -ForegroundColor Yellow
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$javaVersion = java -version 2>&1 | Select-String "version"
Write-Host "  Java: $javaVersion" -ForegroundColor Green

# Step 2: Disable production environment
Write-Host "`nStep 2: Configuring environment..." -ForegroundColor Yellow
if (Test-Path .env.production) {
    Rename-Item .env.production .env.production.backup -Force
    Write-Host "  Disabled .env.production" -ForegroundColor Green
}

# Step 3: Copy mobile environment
Copy-Item .env.mobile .env -Force
Write-Host "  Activated .env.mobile" -ForegroundColor Green

# Step 4: Display configuration
Write-Host "`nStep 3: Current Configuration:" -ForegroundColor Yellow
$apiUrl = Get-Content .env | Select-String "VITE_API_URL" | ForEach-Object { $_.Line }
$basePath = Get-Content .env | Select-String "VITE_BASE_PATH" | ForEach-Object { $_.Line }
$googleClientId = Get-Content .env | Select-String "VITE_GOOGLE_CLIENT_ID" | ForEach-Object { $_.Line }
Write-Host "  $apiUrl" -ForegroundColor Cyan
Write-Host "  $basePath" -ForegroundColor Cyan
Write-Host "  $googleClientId" -ForegroundColor Cyan

# Step 5: Clean and build
Write-Host "`nStep 4: Building frontend..." -ForegroundColor Yellow
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "  Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Build successful!" -ForegroundColor Green

# Step 6: Verify build paths
Write-Host "`nStep 5: Verifying build..." -ForegroundColor Yellow
$indexContent = Get-Content dist\index.html -Raw
if ($indexContent -match 'src="\.\/') {
    Write-Host "  Paths: Correct (relative)" -ForegroundColor Green
} else {
    Write-Host "  Paths: INCORRECT (not relative)" -ForegroundColor Red
}

# Step 7: Sync Capacitor
Write-Host "`nStep 6: Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync android
Write-Host "  Sync complete!" -ForegroundColor Green

# Step 8: Build APK
Write-Host "`nStep 7: Building APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew clean assembleDebug

if ($LASTEXITCODE -ne 0) {
    Write-Host "  APK build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "  APK build successful!" -ForegroundColor Green

# Step 9: Copy APK
Write-Host "`nStep 8: Copying APK..." -ForegroundColor Yellow
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk TechTorio-production.apk -Force
Write-Host "  APK copied!" -ForegroundColor Green

# Step 10: Restore production environment
Write-Host "`nStep 9: Restoring production environment..." -ForegroundColor Yellow
if (Test-Path .env.production.backup) {
    Rename-Item .env.production.backup .env.production -Force
}
Copy-Item .env.production .env -Force
Write-Host "  Production environment restored!" -ForegroundColor Green

# Final summary
Write-Host "`n=== BUILD COMPLETE ===" -ForegroundColor Green
$apkInfo = Get-Item TechTorio-production.apk
Write-Host "File: $($apkInfo.Name)" -ForegroundColor Cyan
Write-Host "Size: $([math]::Round($apkInfo.Length/1MB,2)) MB" -ForegroundColor Cyan
Write-Host "Time: $($apkInfo.LastWriteTime)" -ForegroundColor Cyan
Write-Host "`nInstall command:" -ForegroundColor Yellow
Write-Host 'adb install -r "D:\Work Repos\AI\techtorio\Frontend\TechTorio-production.apk"' -ForegroundColor White
