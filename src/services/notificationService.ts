import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Tone } from '../store/useStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Dedicated high-priority Android channel for partner alerts so they bypass
// Do Not Disturb (when the user grants it) and use a distinct sound/vibration.
async function ensurePartnerAlertChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('partner-alerts', {
    name: 'Partner Alerts',
    description: 'Instant alerts from your accountability partner.',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#C89A3C',
    enableVibrate: true,
    bypassDnd: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async scheduleDailyReminder(time: string, tone: Tone, streak: number): Promise<void> {
    const messages: Record<string, string> = {
      harsh: `Day ${streak}. Lions don't negotiate with weakness. Stand up.`,
      gentle: `Good morning, lion. Day ${streak} — stand strong today.`,
      spiritual: `Day ${streak} — גיבור כארי. Rise like a lion today.`,
      clinical: `Day ${streak}. Check in with your patterns. Stay intentional.`,
      custom: `Day ${streak}. Stand strong.`,
    };
    const message = messages[tone || 'gentle'] || messages.gentle;
    const [hour, minute] = time.split(':').map(Number);

    await Notifications.scheduleNotificationAsync({
      content: { title: 'Gibor KeAri — Daily', body: message },
      trigger: { hour, minute, repeats: true, type: Notifications.SchedulableTriggerInputTypes.DAILY } as any,
    });
  },

  async scheduleUrgeAlert(hour: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🦁 The lion is watching',
        body: "This is your risky hour. Stand strong. You are stronger than this moment.",
      },
      trigger: { hour, minute: 0, repeats: true, type: Notifications.SchedulableTriggerInputTypes.DAILY } as any,
    });
  },

  async scheduleMilestoneNotifications(_streakStart: string | null): Promise<void> {
    // Stub — would schedule future-dated notifications for specific milestones.
  },

  async triggerPreview(id: 'daily_reminder' | 'urge_alert'): Promise<void> {
    const body =
      id === 'daily_reminder'
        ? 'Your daily Gibor KeAri reminder looks like this.'
        : '🦁 Risky hour preview — stand strong.';
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Gibor KeAri Preview', body },
      trigger: null,
    });
  },

  // ---------------------------------------------------------------------------
  // Push notifications for instant partner alerts.
  // ---------------------------------------------------------------------------

  /**
   * Request permission, ensure the high-priority channel, and return the
   * device's Expo push token (or null on web / simulator / denial).
   * Safe to call repeatedly — Expo returns the same token per install.
   */
  async registerForPushAsync(): Promise<{ token: string; platform: 'ios' | 'android' | 'web' } | null> {
    // Expo Push tokens are not issued on web; partner alerts there stay in-app.
    if (Platform.OS === 'web') return null;

    await ensurePartnerAlertChannel();

    const granted = await this.requestPermissions();
    if (!granted) return null;

    // `projectId` is required on SDK 49+ when running under EAS / dev client.
    const projectId =
      (Constants.expoConfig as any)?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId ??
      undefined;

    try {
      const res = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      if (!res?.data) return null;
      return {
        token: res.data,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      };
    } catch (err) {
      // Fails on simulators / when projectId is missing in bare dev. Non-fatal.
      console.warn('[push] getExpoPushTokenAsync failed:', err);
      return null;
    }
  },

  /**
   * Attach foreground + tap handlers. Returns a disposer.
   * The tap handler is passed a payload so navigation can jump to the partner
   * screen on the relevant alert.
   */
  attachPushListeners(onTap: (data: Record<string, any>) => void): () => void {
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      // Foreground handler above shows the banner — nothing else to do yet.
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data = (res.notification.request.content.data || {}) as Record<string, any>;
      onTap(data);
    });
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  },
};
