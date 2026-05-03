const pkg = require('./package.json');

/**
 * Expo Go dev:  EXPO_GO=1 npx expo start  →  runtimeVersion/updates omitted → Expo Go works
 * Normal dev:   npx expo start            →  runtimeVersion included (dev build or web)
 * EAS build:    eas build ...             →  runtimeVersion included → OTA works
 * EAS update:   eas update ...            →  runtimeVersion included → correct manifest
 */
module.exports = () => {
  const isExpoGo = process.env.EXPO_GO === '1';

  return {
    expo: {
      name: 'Gibor KeAri',
      slug: 'gibur-keari',
      version: pkg.version,
      orientation: 'portrait',
      userInterfaceStyle: 'automatic',
      newArchEnabled: true,
      scheme: 'giborkeari',
      assetBundlePatterns: ['**/*'],

      // App icon — used by iOS directly and as Android fallback (when the
      // device doesn't support adaptive icons). Square, 1024+, baked into
      // the binary at build time. OTA cannot change icons.
      icon: './assets/icon.png',

      // Splash screen — shown while the JS bundle loads (before any React
      // code runs). The transparent lion is centered on the navy bg, which
      // matches guard-bg so the transition into the app feels seamless.
      splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#0F1120',
      },

      // Omit runtimeVersion + EAS Update when running in Expo Go
      ...(!isExpoGo && {
        // ───────────────────────────────────────────────────────────────────
        // runtimeVersion: 'fingerprint' policy
        //
        // Computes runtimeVersion as a hash of every native input (deps,
        // plugins, native config). Adding a native module → fingerprint
        // changes → runtimeVersion changes → old binaries STOP fetching the
        // new OTA bundle automatically. This is the safety rail for the
        // native↔JS compatibility boundary; without it (e.g. on the old
        // 'appVersion' policy), forgetting to bump the version while adding
        // a native module ships a JS bundle that crashes old APKs on launch.
        //
        // History: switched here on 2026-05-03 after expo-secure-store +
        // expo-local-authentication + expo-crypto were added for PIN lock
        // and the old 'appVersion' policy delivered the new bundle to old
        // APKs that didn't have the native side compiled in.
        // ───────────────────────────────────────────────────────────────────
        runtimeVersion: { policy: 'fingerprint' },
        updates: {
          url: 'https://u.expo.dev/258cd0b4-3baf-4834-9e56-1459dd1fa95e',
          checkAutomatically: 'ON_LOAD',
          fallbackToCacheTimeout: 0,
          requestHeaders: { 'expo-channel-name': 'preview' },
        },
      }),

      ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.guard.app',
      },
      android: {
        package: 'com.guard.app',
        permissions: ['NOTIFICATIONS', 'VIBRATE', 'RECEIVE_BOOT_COMPLETED'],
        // Adaptive icon — Android dynamically masks the foreground (the
        // transparent lion) into circle / squircle / rounded-square based
        // on launcher theme. backgroundColor fills behind it so the lion
        // never floats over a wrong-color shape.
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#0F1120',
        },
      },
      web: { bundler: 'metro' },
      plugins: [
        ['expo-notifications', { color: '#C89A3C' }],
        ['expo-build-properties', { android: { kotlinVersion: '1.9.25' } }],
        // PIN lock — secure storage + biometric unlock
        'expo-secure-store',
        [
          'expo-local-authentication',
          { faceIDPermission: 'Allow Guard to unlock with Face ID.' },
        ],
      ],
      extra: {
        eas: { projectId: '258cd0b4-3baf-4834-9e56-1459dd1fa95e' },
      },
      owner: 'shlomoisaacs79',
    },
  };
};
