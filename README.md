# Guard

A private, offline-first recovery and streak-tracking app. Built with Expo + React Native so it runs on Android and previews on your computer during development.

## Prerequisites

- Node.js 20+
- Android Studio (only needed if you want to run on an Android emulator — not required for web preview or EAS builds)
- An [Expo](https://expo.dev) account (free)

## Setup

```bash
npm install
```

## Running it

### Preview on your computer (fastest iteration)
```bash
npm run web
```
Opens the app in your browser. Hot-reloads on file save. This is the recommended way to develop — you see exactly what your UI looks like without plugging in a phone.

### Run on an Android emulator or device
```bash
npm run android
```
Launches the app in an emulator, or on a physical device via USB debugging.

### Run in Expo Go on your phone
```bash
npm start
```
Scan the QR code with the Expo Go app on your phone. Useful for quick mobile testing without building an APK.

## Building an APK to share with friends

Guard is meant to be sideloaded — no Play Store required.

1. Install the EAS CLI once:
   ```bash
   npm install -g eas-cli
   ```
2. Log in with your Expo account:
   ```bash
   eas login
   ```
3. Build the APK in the cloud:
   ```bash
   npm run build:apk
   ```
4. When the build finishes (~10 min), EAS prints a download link. Open it on your Android phone, download the `.apk`, and install it. Your phone may warn about "unknown sources" — allow it in Settings.

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for more detail.

## Data & Privacy

- All data is stored **locally on the device** using AsyncStorage.
- No servers, no accounts, no telemetry.
- Uninstalling the app erases all data.
- The Coach screen is currently a local journal stub. Wiring up an AI provider (your choice — e.g. OpenAI, Claude, Groq) is a future step; keys would be entered per-user in Settings and stored on device.

## Project Structure

```
App.tsx                Root: gesture handler, safe area, status bar
index.js               Entry point (registerRootComponent)
src/
  App.tsx              Splash + punishment wrapper
  store/useStore.ts    Zustand store persisted to AsyncStorage
  navigation/          Tab navigator
  screens/             12 screens (Home, Calendar, Coach, Learn, Profile, etc.)
  components/          Reusable UI + modals
  hooks/useStreak.ts   Derived streak data
  services/            Notification service (expo-notifications)
  utils/               Pattern engine + formatters
  constants/           Theme, metadata
```

## Tech Stack

- **Expo SDK 52** — managed workflow, web + native from one codebase
- **NativeWind v4** — Tailwind CSS classes on RN components
- **Moti** — declarative animations
- **lucide-react-native** — icons
- **react-native-svg** — streak rings, countdown rings
- **Zustand + AsyncStorage** — state + persistence
- **expo-notifications** — scheduled reminders
- **date-fns** — date math

## License

Private / personal use.
