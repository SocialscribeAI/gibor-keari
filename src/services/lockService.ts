// =============================================================================
// lockService — PIN + biometric lock for the Guard app.
//
// Privacy model:
//   - PIN hash + salt live in expo-secure-store (encrypted, hardware-backed via
//     iOS Keychain / Android Keystore). They NEVER touch AsyncStorage and are
//     never written to Zustand.
//   - The Zustand store mirrors only booleans (pinEnabled, pinHashPresent,
//     biometricEnabled, lockTimeoutMode) so the UI can render without
//     unlocking SecureStore on every render.
//   - PIN itself is never persisted in plaintext, even briefly.
// =============================================================================

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import { useStore } from '../store/useStore';
import type { LockTimeoutMode } from '../store/useStore';

const PIN_HASH_KEY = 'guard.pin.hash';
const PIN_SALT_KEY = 'guard.pin.salt';

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

function randomSalt(): string {
  // 16 random bytes, hex-encoded — plenty of entropy for a per-device PIN salt.
  const bytes = Crypto.getRandomBytes(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  );
}

// ---------------------------------------------------------------------------
// PIN management
// ---------------------------------------------------------------------------

export interface PinResult {
  ok: boolean;
  error?: string;
}

export const lockService = {
  /**
   * Set a fresh PIN. Generates a new salt, hashes the PIN, writes both to
   * SecureStore. Updates store mirrors. Use for first-time setup AND when
   * disabling+re-enabling.
   */
  async setupPin(pin: string): Promise<PinResult> {
    if (!isValidPin(pin)) {
      return { ok: false, error: 'PIN must be 4–6 digits.' };
    }
    try {
      const salt = randomSalt();
      const hash = await hashPin(pin, salt);
      await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
      await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
      const s = useStore.getState();
      s.setPinEnabled(true);
      s.setPinHashPresent(true);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: String(e?.message ?? e) };
    }
  },

  /**
   * Replace an existing PIN. Verifies the old one first.
   */
  async changePin(oldPin: string, newPin: string): Promise<PinResult> {
    const ok = await this.verifyPin(oldPin);
    if (!ok) return { ok: false, error: 'Current PIN is wrong.' };
    return this.setupPin(newPin);
  },

  /**
   * Remove the PIN entirely. Clears SecureStore and resets store mirrors.
   */
  async disablePin(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(PIN_HASH_KEY);
      await SecureStore.deleteItemAsync(PIN_SALT_KEY);
    } catch {
      // SecureStore delete throws if the key doesn't exist on some platforms;
      // either way we proceed to clear state.
    }
    const s = useStore.getState();
    s.setPinEnabled(false);
    s.setPinHashPresent(false);
    s.setBiometricEnabled(false);
  },

  /**
   * Check a PIN attempt against the stored hash. Returns true on match.
   */
  async verifyPin(pin: string): Promise<boolean> {
    if (!isValidPin(pin)) return false;
    try {
      const [salt, expected] = await Promise.all([
        SecureStore.getItemAsync(PIN_SALT_KEY),
        SecureStore.getItemAsync(PIN_HASH_KEY),
      ]);
      if (!salt || !expected) return false;
      const got = await hashPin(pin, salt);
      // Constant-time-ish: lengths always match for SHA-256, do char-by-char.
      if (got.length !== expected.length) return false;
      let mismatch = 0;
      for (let i = 0; i < got.length; i++) {
        mismatch |= got.charCodeAt(i) ^ expected.charCodeAt(i);
      }
      return mismatch === 0;
    } catch {
      return false;
    }
  },

  /**
   * True if a PIN has been set (SecureStore has a hash).
   */
  async isPinSet(): Promise<boolean> {
    try {
      const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
      return !!hash;
    } catch {
      return false;
    }
  },

  /**
   * Sync the in-memory `pinHashPresent` flag with SecureStore reality. Call
   * once at app boot so a fresh install / cleared SecureStore can't leave
   * stale Zustand state claiming a PIN exists.
   */
  async syncPinPresentFlag(): Promise<void> {
    const present = await this.isPinSet();
    const s = useStore.getState();
    if (s.pinHashPresent !== present) s.setPinHashPresent(present);
    // If hash got wiped externally but pinEnabled was true, force-disable.
    if (s.pinEnabled && !present) s.setPinEnabled(false);
  },

  // -------------------------------------------------------------------------
  // Biometric
  // -------------------------------------------------------------------------

  async isBiometricAvailable(): Promise<boolean> {
    try {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  },

  async authenticateWithBiometric(): Promise<boolean> {
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Guard',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true, // we run our own PIN UI
      });
      return res.success;
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // Lock-on-foreground decision
  // -------------------------------------------------------------------------

  /**
   * Given the timestamp the app was last active (foreground) and the user's
   * timeout setting, return true if the app should re-lock.
   */
  shouldLockOnForeground(lastActiveAt: number | null, mode: LockTimeoutMode): boolean {
    if (mode === 'never') return false;
    if (lastActiveAt === null) return true; // cold start always locks
    const elapsedMs = Date.now() - lastActiveAt;
    const thresholds: Record<LockTimeoutMode, number> = {
      immediate: 0,
      '1min': 60_000,
      '5min': 5 * 60_000,
      '15min': 15 * 60_000,
      never: Number.POSITIVE_INFINITY,
    };
    return elapsedMs >= thresholds[mode];
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;
