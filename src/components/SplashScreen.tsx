import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { BRAND, useTheme } from '../constants/theme';

// expo-updates is imported defensively — in dev / Expo Go / older binaries
// the native side might be missing, in which case we just skip the check
// and proceed to the app normally.
type UpdatesModule = typeof import('expo-updates');
let Updates: UpdatesModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Updates = require('expo-updates') as UpdatesModule;
} catch {
  /* native module missing — no OTA support in this binary */
}

type SplashStatus =
  | 'animating'      // initial state, the regular splash is showing
  | 'downloading'    // an OTA is being fetched, show "Updating…" message
  | 'ready';         // checked, no update — about to call onComplete()

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const theme = useTheme();
  const [status, setStatus] = useState<SplashStatus>('animating');

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // In dev / Expo Go / older binaries without expo-updates: skip the
    // update check, just play the splash animation and proceed.
    const skipUpdateCheck = __DEV__ || !Updates || !Updates.isEnabled;

    const proceedToApp = () => {
      if (cancelled) return;
      setStatus('ready');
      // Keep the splash visible long enough for the entry animations to land.
      timer = setTimeout(() => {
        if (!cancelled) onComplete();
      }, 2500);
    };

    if (skipUpdateCheck) {
      proceedToApp();
      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
      };
    }

    // Production path: ask Expo whether there's a newer JS bundle on the
    // server. If yes, download it, then reloadAsync() — which tears down
    // this JS engine and boots fresh into the new bundle. If no (or the
    // check fails for any reason — bad network, channel mismatch, etc.)
    // proceed to the app with what we have.
    (async () => {
      try {
        const update = await Updates!.checkForUpdateAsync();
        if (cancelled) return;
        if (update.isAvailable) {
          setStatus('downloading');
          await Updates!.fetchUpdateAsync();
          if (cancelled) return;
          // Restart into the new bundle. Code after this never runs because
          // the JS engine is torn down by reloadAsync.
          await Updates!.reloadAsync();
          return;
        }
        proceedToApp();
      } catch {
        // Any failure (offline, server down, no matching runtime version)
        // — just boot the app with the cached bundle. Never block the user.
        proceedToApp();
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [onComplete]);

  const isDownloading = status === 'downloading';

  return (
    <View className="absolute inset-0 bg-guard-bg items-center justify-center">
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ type: 'timing', duration: 800 }}
        className="items-center"
      >
        {/* Lion mark */}
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 900 }}
          className="mb-6"
        >
          <Image
            source={require('../../assets/adaptive-icon.png')}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
        </MotiView>

        {/* Wordmark */}
        <Text
          className="text-5xl font-black text-guard-text tracking-tight"
          style={{ letterSpacing: -1 }}
        >
          {BRAND.name}
        </Text>

        {/* Hebrew */}
        <MotiText
          from={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ delay: 400, type: 'timing', duration: 700 }}
          className="text-guard-text text-2xl mt-2"
          style={{ fontFamily: 'Georgia' }}
        >
          {BRAND.hebrew}
        </MotiText>

        {/* Accent bar */}
        <MotiView
          from={{ width: 0 }}
          animate={{ width: 80 }}
          transition={{ delay: 700, type: 'timing', duration: 900 }}
          className="h-[2px] bg-guard-accent mt-6 rounded-full"
        />

        {/* Status line — swaps tagline for "Updating…" while OTA downloads */}
        {isDownloading ? (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            className="flex-row items-center mt-5"
          >
            <ActivityIndicator size="small" color={theme.accent} />
            <Text
              className="text-guard-text text-[11px] font-bold uppercase ml-3"
              style={{ letterSpacing: 4, opacity: 0.85 }}
            >
              Updating…
            </Text>
          </MotiView>
        ) : (
          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            transition={{ delay: 1100, type: 'timing', duration: 900 }}
            className="text-guard-text text-[11px] font-bold uppercase mt-5"
            style={{ letterSpacing: 4 }}
          >
            {BRAND.tagline}
          </MotiText>
        )}
      </MotiView>
    </View>
  );
};
