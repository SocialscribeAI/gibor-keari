import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, AppState, type AppStateStatus } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatePresence } from 'moti';
import { Navigator } from './navigation/Navigator';
import { PunishmentModeWrapper } from './components/PunishmentModeWrapper';
import { SplashScreen } from './components/SplashScreen';
import { CheckInModal } from './components/CheckInModal';
import { DangerModeBanner, DangerModeReentryLock } from './components/DangerMode';
import { Walkthrough } from './components/Walkthrough';
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

/**
 * Re-schedule local notifications whenever any input that affects them changes.
 * Runs on every mount and whenever the user toggles notifications, edits the
 * reminder time, shifts the danger hour, or changes a ritual's scheduled time.
 * Idempotent — cancels all first, then re-schedules.
 */
function useNotificationBootstrap() {
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);
  const dailyReminderTime = useStore((s) => s.dailyReminderTime);
  const dangerHour = useStore((s) => s.dangerHour);
  const tone = useStore((s) => s.personalityProfile.tone);
  const currentStreak = useStore((s) => s.currentStreak);
  const rituals = useStore((s) => s.rituals);
  const setRitualNotificationId = useStore((s) => s.setRitualNotificationId);

  // We hash the rituals' (id, scheduledTime, enabled, text) into a string so
  // the effect only refires when something relevant to scheduling changes —
  // not on every store write (e.g. reordering by drag would not retrigger).
  const ritualSchedKey = rituals
    .map((r) => `${r.id}:${r.enabled ? r.scheduledTime ?? '' : ''}:${r.text}`)
    .join('|');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await notificationService.bootstrap({
        enabled: notificationsEnabled,
        dailyReminderTime,
        dangerHour,
        tone,
        streak: currentStreak,
      });
      if (cancelled) return;

      // After bootstrap, refresh each ritual's scheduled reminder. Bootstrap
      // cancel-all wipes their previous notification ids, so we re-schedule
      // every enabled ritual that has a time.
      if (!notificationsEnabled) {
        // Clear stale ids so the store reflects reality.
        for (const r of rituals) {
          if (r.notificationId) setRitualNotificationId(r.id, null);
        }
        return;
      }
      for (const r of rituals) {
        if (!r.enabled || !r.scheduledTime) {
          if (r.notificationId) setRitualNotificationId(r.id, null);
          continue;
        }
        const newId = await notificationService.scheduleRitualReminder(r.text, r.scheduledTime);
        if (cancelled) return;
        setRitualNotificationId(r.id, newId);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsEnabled, dailyReminderTime, dangerHour, tone, currentStreak, ritualSchedKey]);
}

export default function App() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const { locked, unlock } = useLockGate();
  usePartnerPushRegistration();
  useNotificationBootstrap();

  return (
    <View className="flex-1 bg-guard-bg dark">
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
              <DangerModeBanner />
            </SafeAreaView>
            <Navigator />
            <CheckInModal />
            <DangerModeReentryLock />
            <Walkthrough />
          </PunishmentModeWrapper>
        )}
      </AnimatePresence>
    </View>
  );
}

