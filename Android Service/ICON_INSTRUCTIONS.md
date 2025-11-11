# App Icon Setup Instructions

## Current Setup
I've created the adaptive icon structure for Android 8.0+ (API 26+). The app will use:
- **Adaptive Icon** (Android 8.0+): Uses vector drawable with purple background
- **Fallback**: Will use default Android icon if PNGs are not provided

## To Add Your Custom Icon

### Option 1: Use Android Studio Image Asset Studio (Recommended)
1. Right-click on `app` folder in Android Studio
2. Select **New > Image Asset**
3. Choose **Launcher Icons (Adaptive and Legacy)**
4. Upload your icon image (1024x1024px recommended)
5. Configure foreground and background layers
6. Click **Next** and **Finish**

### Option 2: Manual PNG Icons
Replace the placeholder files in these directories with your actual PNG icons:
- `app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48px)
- `app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72px)
- `app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96px)
- `app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144px)
- `app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192px)

Also create round versions:
- `app/src/main/res/mipmap-mdpi/ic_launcher_round.png` (48x48px)
- `app/src/main/res/mipmap-hdpi/ic_launcher_round.png` (72x72px)
- `app/src/main/res/mipmap-xhdpi/ic_launcher_round.png` (96x96px)
- `app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png` (144x144px)
- `app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png` (192x192px)

### Option 3: Customize the Vector Icon
Edit `app/src/main/res/drawable/ic_launcher_foreground.xml` to customize the vector icon design.

## Current Icon Design
The current adaptive icon shows:
- SMS message bubble (left)
- Arrow pointing to webhook endpoint (right)
- Purple background (#6200EE)

You can customize the colors in `app/src/main/res/values/colors.xml` by changing `ic_launcher_background`.

