# Guard Build & Deployment Guide

This document outlines the steps to build your Android APK for Guard using EAS (Expo Application Services).

## 🛠 Building Your APK (Non-Technical Guide)

If you are a non-technical founder looking to get a test version of Guard on your phone, follow these simplified steps. This process turns our code into a real file (`.apk`) that you can install directly on an Android device.

1. **The Tool**: We use a tool called **EAS CLI**. It handles the complex "cooking" phase of turning code into an app in the cloud.
2. **The Goal**: We want a "Preview" build. This produces an APK file that you can send to your phone via a link or download.
3. **The Result**: You will get a download link once the build finishes. Open this link on your Android phone to install Guard.

---

## 💻 Terminal Commands

Run these commands in your project terminal to start the build process.

### 1. Install EAS CLI
First, you need the build tool installed globally on your machine.
```bash
npm install -g eas-cli
```

### 2. Login to Expo
Log in with your Expo account credentials.
```bash
eas login
```

### 3. Start the Production-Ready Build
This command sends the code to Expo's servers to build the APK. 
*Note: This may take 5-10 minutes.*
```bash
eas build --platform android --profile preview
```

### 4. Download and Install
Once the terminal shows `Build finished!`, it will provide a **Download Link**.
1. Copy that link and open it on your Android device's browser.
2. Download the `.apk` file.
3. If your phone warns about "Install from Unknown Sources," go to Settings and allow your browser to install apps.
4. Open the APK and tap **Install**.

---

## 🏗 Build Profiles Reference

Our `eas.json` is configured with three modes:

| Profile | Output | Use Case |
| :--- | :--- | :--- |
| `development` | Development APK | Used by developers to test features with hot-reloading. |
| `preview` | **Standard APK** | For testing on real devices before App Store submission. |
| `production` | Play Store AAB | The final file format required for Google Play Store upload. |

To build for production (Play Store), use:
```bash
eas build --platform android --profile production
```

---

## 🎨 Asset Configuration Note

The app is currently configured to look for the following branding assets in the `/assets` folder:
- **Icon**: `assets/icon.png` (Gold Sword on Navy Background)
- **Splash**: `assets/splash.png` (Guard Branding)
- **Adaptive Icon**: `assets/adaptive-icon.png` (Android-specific icon layer)

*Ensure these images are uploaded to the project before running a native build.*
