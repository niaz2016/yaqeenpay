# YaqeenPay Android APK Build Script for Production
# This script builds the Android APK configured to connect to the production backend

Write-Host "=== YaqeenPay Android APK Production Build ===" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Java
try {
    $javaVersion = & java -version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Host "checkmark Java found: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "X Java not found - Please install Java JDK 17" -ForegroundColor Red
    Write-Host "Download from: https://adoptium.net/" -ForegroundColor Yellow
    exit 1
}

# Check/Set JAVA_HOME
if (-not $env:JAVA_HOME) {
    Write-Host "Warning: JAVA_HOME not set, attempting to find Java..." -ForegroundColor Yellow
    
    $javaPaths = @(
        "C:\Program Files\Eclipse Adoptium\jdk-17*",
        "C:\Program Files\Java\jdk-17*",
        "C:\Program Files\Java\jdk-11*"
    )
    
    $javaHome = $null
    foreach ($path in $javaPaths) {
        $found = Get-Item $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $javaHome = $found.FullName
            break
        }
    }
    
    if ($javaHome) {
        $env:JAVA_HOME = $javaHome
        Write-Host "checkmark Found Java at: $javaHome" -ForegroundColor Green
    } else {
        Write-Host "X Could not find Java installation" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "checkmark JAVA_HOME is set: $env:JAVA_HOME" -ForegroundColor Green
}

Write-Host ""

# Step 1: Clean previous builds
Write-Host "Step 1: Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "checkmark Cleaned dist folder" -ForegroundColor Green
}

if (Test-Path "android/app/build") {
    Remove-Item -Recurse -Force "android/app/build"
    Write-Host "checkmark Cleaned Android build folder" -ForegroundColor Green
}

# Step 2: Copy mobile environment configuration
Write-Host ""
Write-Host "Step 2: Configuring environment for mobile..." -ForegroundColor Yellow
Copy-Item ".env.mobile" ".env" -Force
Write-Host "checkmark Using .env.mobile configuration" -ForegroundColor Green
Write-Host "  - API URL: https://techtorio.online/api" -ForegroundColor Gray
Write-Host "  - Base Path: /" -ForegroundColor Gray

# Step 3: Install dependencies
Write-Host ""
Write-Host "Step 3: Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "X npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "checkmark Dependencies installed" -ForegroundColor Green

# Step 4: Build frontend with mobile config
Write-Host ""
Write-Host "Step 4: Building frontend for mobile..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "X Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "checkmark Frontend built successfully" -ForegroundColor Green

# Step 5: Sync with Capacitor
Write-Host ""
Write-Host "Step 5: Syncing with Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "X Capacitor sync failed" -ForegroundColor Red
    exit 1
}
Write-Host "checkmark Capacitor sync completed" -ForegroundColor Green

# Step 6: Build Android APK
Write-Host ""
Write-Host "Step 6: Building Android APK..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

Set-Location android
.\gradlew assembleDebug
$buildSuccess = ($LASTEXITCODE -eq 0)
Set-Location ..

if (-not $buildSuccess) {
    Write-Host "X Android build failed" -ForegroundColor Red
    Copy-Item ".env.production" ".env" -Force
    exit 1
}

Write-Host "checkmark Android APK built successfully" -ForegroundColor Green

# Step 7: Locate APK
Write-Host ""
Write-Host "Step 7: Locating APK file..." -ForegroundColor Yellow
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "checkmark APK found: $apkPath" -ForegroundColor Green
    Write-Host "  Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Gray
    
    # Copy to root for easy access
    Copy-Item $apkPath "YaqeenPay-production.apk" -Force
    Write-Host "checkmark Copied to: YaqeenPay-production.apk" -ForegroundColor Green
    
    # Step 8: Restore production .env
    Write-Host ""
    Write-Host "Step 8: Restoring production environment..." -ForegroundColor Yellow
    Copy-Item ".env.production" ".env" -Force
    Write-Host "checkmark Restored .env.production" -ForegroundColor Green
    
    # Summary
    Write-Host ""
    Write-Host "=== Build Complete ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "checkmark APK Location: YaqeenPay-production.apk" -ForegroundColor Green
    Write-Host "checkmark APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend Configuration:" -ForegroundColor Yellow
    Write-Host "  - API URL: https://techtorio.online/api" -ForegroundColor Gray
    Write-Host "  - SSL: Enabled (HTTPS)" -ForegroundColor Gray
    Write-Host "  - Database: Production" -ForegroundColor Gray
    Write-Host "  - Mock Services: Disabled" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Install APK on Android device" -ForegroundColor Gray
    Write-Host "  2. Grant all required permissions" -ForegroundColor Gray
    Write-Host "  3. Login with production credentials" -ForegroundColor Gray
    Write-Host "  4. Test SMS reading wallet and marketplace" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To install on device:" -ForegroundColor Yellow
    Write-Host "  adb install -r YaqeenPay-production.apk" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "X APK not found at expected path" -ForegroundColor Red
    Copy-Item ".env.production" ".env" -Force
    exit 1
}
