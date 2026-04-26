import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatePresence } from 'moti';
import { Navigator } from './navigation/Navigator';
import { PunishmentModeWrapper } from './components/PunishmentModeWrapper';
import { SplashScreen } from './components/SplashScreen';
import { CheckInModal } from './components/CheckInModal';
import { ThemeManager } from './components/ThemeManager';
import { UpdateBanner } from './components/UpdateBanner';
import { AlphaBanner } from './components/AlphaBanner';
import { useCommunityStore, useCommunityConfig } from './store/useCommunityStore';
import { notificationService } from './services/notificationService';
import { savePushToken } from './services/community';

/**
 * Registers the device's Expo push token on sign-in so the Supabase
 * `urge_alerts` trigger can deliver instant partner alerts. Runs whenever
 * the authenticated user changes.
 */
function usePartnerPushRegistration() {
  const userId = useCommunityStore((s) => s.userId);
  const partnerEnabled = useCommunityStore((s) => s.toggles.partnerEnabled);
  const masterEnabled = useCommunityStore((s) => s.toggles.masterEnabled);
  const cfg = useCommunityConfig();

  useEffect(() => {
    if (!userId || !masterEnabled || !partnerEnabled) return;
    let cancelled = false;
    (async () => {
      const reg = await notificationService.registerForPushAsync();
      if (!reg || cancelled) return;
      try {
        await savePushToken(cfg, reg.token, reg.platform);
      } catch {
        /* network hiccup — we'll retry on next launch */
      }
    })();
    return () => { cancelled = true; };
  }, [userId, masterEnabled, partnerEnabled, cfg.url, cfg.anonKey]);

  // Attach tap handler so tapping an alert surfaces it (stub — navigation
  // integration lives in Navigator; data is logged for now).
  useEffect(() => {
    const detach = notificationService.attachPushListeners((data) => {
      if (data?.type === 'urge_alert') {
        // Navigator picks this up via its own listener; no-op here.
      }
    });
    return detach;
  }, []);
}

export default function App() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  usePartnerPushRegistration();

  return (
    <View className="flex-1 bg-guard-bg">
      <ThemeManager />
      <AnimatePresence exitBeforeEnter>
        {!isSplashComplete ? (
          <SplashScreen key="splash" onComplete={() => setIsSplashComplete(true)} />
        ) : (
          <PunishmentModeWrapper key="main">
            <SafeAreaView edges={['top']} className="bg-guard-bg">
              <AlphaBanner />
              <UpdateBanner />
            </SafeAreaView>
            <Navigator />
            <CheckInModal />
          </PunishmentModeWrapper>
        )}
      </AnimatePresence>
    </View>
  );
}

