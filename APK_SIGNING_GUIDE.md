# Android APK Signing Guide for YaqeenPay

## Generate Debug Keystore (if not exists)
```bash
# Navigate to Android project
cd "D:\Work Repos\AI\yaqeenpay\Frontend\android"

# Generate debug keystore
keytool -genkey -v -keystore debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Android Debug,O=Android,C=US"
```

## Sign APK Manually
```bash
# Build unsigned APK
.\gradlew.bat assembleDebug

# Sign the APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore debug.keystore -storepass android -keypass android "app\build\outputs\apk\debug\app-debug.apk" androiddebugkey

# Verify signing
jarsigner -verify -verbose -certs "app\build\outputs\apk\debug\app-debug.apk"
```

## Build Signed APK Automatically
Add to `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
    }
}
```

## Commands to Build Signed APK
```bash
# Set JAVA_HOME if needed
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# Build signed debug APK
cd "D:\Work Repos\AI\yaqeenpay\Frontend\android"
.\gradlew.bat assembleDebug

# APK location: app\build\outputs\apk\debug\app-debug.apk
```