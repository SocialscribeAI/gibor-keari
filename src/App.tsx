import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, AppState, type AppStateStatus } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatePresence } from 'moti';
import { Navigator } from './navigation/Navigator';
import { PunishmentModeWrapper } from './components/PunishmentModeWrapper';
import { SplashScreen } from './components/SplashScreen';
import { CheckInModal } from './components/CheckInModal';
import { ThemeManager } from './components/ThemeManager';
import { UpdateBanner } from './components/UpdateBanner';
import { AlphaBanner } from './components/AlphaBanner';
import { LockScreen } from './screens/LockScreen';
import { useStore } from './store/useStore';
import { useCommunityStore, useCommunityConfig } from './store/useCommunityStore';
import { notificationService } from './services/notificationService';
import { savePushToken } from './services/community';
import { lockService } from './services/lockService';

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

/**
 * Lock-gate hook. When the user has a PIN set:
 *   - Cold start → app is locked.
 *   - Background → foreground transitions check elapsed time vs. lockTimeoutMode.
 *
 * The LockScreen component renders when `locked === true` and intercepts ALL
 * input until PIN / biometric verification calls `unlock()`.
 */
function useLockGate() {
  const pinEnabled = useStore((s) => s.pinEnabled);
  const pinHashPresent = useStore((s) => s.pinHashPresent);
  const lockTimeoutMode = useStore((s) => s.lockTimeoutMode);

  const protectionOn = pinEnabled && pinHashPresent;
  // Initial state: if PIN protection is on, we boot LOCKED.
  const [locked, setLocked] = useState<boolean>(protectionOn);
  const lastActiveAtRef = useRef<number | null>(null);

  // Sync the SecureStore presence flag once on mount — a fresh install or
  // wiped keychain shouldn't leave us locked with no way in.
  useEffect(() => {
    void lockService.syncPinPresentFlag();
  }, []);

  // If protection turned on/off mid-session, reflect it immediately.
  useEffect(() => {
    if (!protectionOn) setLocked(false);
  }, [protectionOn]);

  // AppState — start a timer when going to background; on return, decide
  // whether to lock based on lockTimeoutMode.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        if (!protectionOn) {
          lastActiveAtRef.current = Date.now();
          return;
        }
        const should = lockService.shouldLockOnForeground(lastActiveAtRef.current, lockTimeoutMode);
        if (should) setLocked(true);
        lastActiveAtRef.current = Date.now();
      } else if (next === 'background' || next === 'inactive') {
        // Stamp time of leaving; the test on next 'active' decides.
        lastActiveAtRef.current = Date.now();
      }
    });
    return () => sub.remove();
  }, [protectionOn, lockTimeoutMode]);

  const unlock = useCallback(() => setLocked(false), []);

  return { locked: protectionOn && locked, unlock };
}

export default function App() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const { locked, unlock } = useLockGate();
  usePartnerPushRegistration();

  return (
    <View className="flex-1 bg-guard-bg">
      <ThemeManager />
      <AnimatePresence exitBeforeEnter>
        {!isSplashComplete ? (
          <SplashScreen key="splash" onComplete={() => setIsSplashComplete(true)} />
        ) : locked ? (
          <LockScreen key="lock" onUnlock={unlock} />
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

