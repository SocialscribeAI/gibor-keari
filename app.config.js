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

      // Omit runtimeVersion + EAS Update when running in Expo Go
      ...(!isExpoGo && {
        runtimeVersion: { policy: 'appVersion' },
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
      },
      web: { bundler: 'metro' },
      plugins: [
        ['expo-notifications', { color: '#C89A3C' }],
        ['expo-build-properties', { android: { kotlinVersion: '1.9.25' } }],
      ],
      extra: {
        eas: { projectId: '258cd0b4-3baf-4834-9e56-1459dd1fa95e' },
      },
      owner: 'shlomoisaacs79',
    },
  };
};
