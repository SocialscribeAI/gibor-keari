// Skip native autolinking for react-native-worklets on Android.
// We only need the package's JS for the reanimated babel plugin shim;
// its native C++ code is incompatible with RN 0.76 (uses jsi::UUID added in RN 0.81+).
// Reanimated 3.16 ships its own worklets runtime, so the native module isn't needed.
module.exports = {
  dependencies: {
    'react-native-worklets': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
