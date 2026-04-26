import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { BUILD_COMMIT, BUILD_TIME_ISO } from '../buildInfo';

export const FEEDBACK_PHONE = '972539304786'; // E.164 without leading +
const FEEDBACK_PHONE_DISPLAY = '+972 53-930-4786';

function buildDiagnostics(): string {
  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const platform = `${Platform.OS} ${Platform.Version}`;
  return [
    `App: Gibor KeAri v${appVersion}`,
    `Build: ${BUILD_COMMIT} @ ${BUILD_TIME_ISO}`,
    `Device: ${platform}`,
  ].join('\n');
}

async function openWhatsApp(message: string): Promise<boolean> {
  const text = encodeURIComponent(message);
  const appUrl = `whatsapp://send?phone=${FEEDBACK_PHONE}&text=${text}`;
  const webUrl = `https://wa.me/${FEEDBACK_PHONE}?text=${text}`;
  try {
    const canOpenApp = await Linking.canOpenURL(appUrl);
    await Linking.openURL(canOpenApp ? appUrl : webUrl);
    return true;
  } catch {
    try {
      await Linking.openURL(webUrl);
      return true;
    } catch {
      return false;
    }
  }
}

export function sendFeedback(): Promise<boolean> {
  const message = [
    "Hi! I'm using the Gibor KeAri *alpha* and I want to help make it perfect.",
    '',
    'My idea / feedback:',
    '(write here)',
    '',
    'What would make this app perfect for me:',
    '(write here)',
    '',
    '— sent from app —',
    buildDiagnostics(),
  ].join('\n');
  return openWhatsApp(message);
}

export function reportBug(): Promise<boolean> {
  const message = [
    "Hi! I hit a bug in Gibor KeAri. Here's what happened:",
    '',
    'What I was doing: ',
    'What I expected: ',
    'What actually happened: ',
    '',
    '— sent from app —',
    buildDiagnostics(),
  ].join('\n');
  return openWhatsApp(message);
}

export const FEEDBACK_DISPLAY_NUMBER = FEEDBACK_PHONE_DISPLAY;
