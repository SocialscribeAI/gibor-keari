import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { MotiView } from 'moti';
import { Delete, Fingerprint } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { LionMark } from '../components/LionMark';
import { useStore } from '../store/useStore';
import { lockService, PIN_MIN_LENGTH, PIN_MAX_LENGTH } from '../services/lockService';
import { useTheme, BRAND } from '../constants/theme';

// =============================================================================
// LockScreen — full-screen PIN keypad shown when the app is locked.
//
// Mounted by App.tsx via the lock-gate when state.pinEnabled is true and the
// app is in `locked` state (cold start or returned-from-background past timeout).
// =============================================================================

interface Props {
  onUnlock: () => void;
}

const COOLDOWN_AFTER = [
  { afterFails: 5, ms: 30_000 },   // 5 wrong → 30s lockout
  { afterFails: 10, ms: 5 * 60_000 }, // 10 wrong → 5m lockout
];

// Haptics are not wired up yet (expo-haptics not installed). Stubbed so the
// call sites stay clean — swap to a real implementation later if desired.
const haptic = (_kind: 'light' | 'success' | 'error') => {
  /* no-op */
};

export const LockScreen: React.FC<Props> = ({ onUnlock }) => {
  const theme = useTheme();
  const { biometricEnabled, deleteAllData } = useStore();
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [shake, setShake] = useState(0);

  // Try biometric on mount if enabled.
  useEffect(() => {
    if (!biometricEnabled) return;
    let cancelled = false;
    (async () => {
      const ok = await lockService.authenticateWithBiometric();
      if (!cancelled && ok) {
        haptic('success');
        onUnlock();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [biometricEnabled, onUnlock]);

  // Cooldown ticker — re-render every second while locked-out.
  useEffect(() => {
    if (cooldownUntil === null) return;
    const id = setInterval(() => {
      if (Date.now() >= cooldownUntil) {
        setCooldownUntil(null);
        clearInterval(id);
      } else {
        // force re-render
        setCooldownUntil((c) => c);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const inCooldown = cooldownUntil !== null && Date.now() < cooldownUntil;
  const cooldownLeft = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)) : 0;

  const tryVerify = useCallback(
    async (candidate: string) => {
      setVerifying(true);
      const ok = await lockService.verifyPin(candidate);
      setVerifying(false);
      if (ok) {
        haptic('success');
        setAttempts(0);
        setPin('');
        onUnlock();
        return;
      }
      haptic('error');
      setShake((n) => n + 1);
      setPin('');
      const next = attempts + 1;
      setAttempts(next);
      // Apply cooldown if we crossed a threshold.
      const rule = [...COOLDOWN_AFTER].reverse().find((r) => next >= r.afterFails);
      if (rule && next % rule.afterFails === 0) {
        setCooldownUntil(Date.now() + rule.ms);
      }
    },
    [attempts, onUnlock],
  );

  const onDigit = (d: string) => {
    if (inCooldown || verifying) return;
    if (pin.length >= PIN_MAX_LENGTH) return;
    haptic('light');
    const next = pin + d;
    setPin(next);
    if (next.length >= PIN_MIN_LENGTH) {
      // Auto-verify at min length AND when user reaches the max.
      // Actually: only auto-verify when user reaches max OR explicitly submits.
      // For UX we'll auto-verify only at PIN_MAX_LENGTH; otherwise wait for the
      // submit logic below — except we also want 4-digit PINs to work, so
      // verify at min length too if no further input arrives. Simpler: always
      // try-verify at exactly min and max — at min if it works, great; if not,
      // user keeps typing.
      if (next.length === PIN_MAX_LENGTH) {
        void tryVerify(next);
      }
    }
  };

  const onBackspace = () => {
    if (inCooldown || verifying) return;
    haptic('light');
    setPin((p) => p.slice(0, -1));
  };

  const onSubmit = () => {
    if (pin.length >= PIN_MIN_LENGTH) void tryVerify(pin);
  };

  const onForgotPin = () => {
    Alert.alert(
      'Forgot your PIN?',
      'Because all data lives on this phone (no cloud), the only way to get back in is to wipe everything. Your streak, logs, mantras, and chart will be gone — permanently.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe everything',
          style: 'destructive',
          onPress: async () => {
            await lockService.disablePin();
            deleteAllData();
            onUnlock(); // clears the lock; user lands in a fresh app state
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-6">
        <View
          className="w-20 h-20 rounded-3xl items-center justify-center mb-6"
          style={{
            backgroundColor: `${theme.accent}15`,
            borderWidth: 1,
            borderColor: `${theme.accent}40`,
          }}
        >
          <LionMark size={48} color={theme.accent} accentColor={theme.text} />
        </View>
        <Text className="text-xs uppercase tracking-[3px] mb-2" style={{ color: theme.accent }}>
          {BRAND.hebrew}
        </Text>
        <Text className="text-3xl font-black mb-1" style={{ color: theme.text, fontFamily: 'Outfit' }}>
          Locked
        </Text>
        <Text className="text-center mb-8" style={{ color: theme.muted }}>
          {inCooldown
            ? `Too many wrong tries. Wait ${cooldownLeft}s.`
            : 'Enter your PIN to continue.'}
        </Text>

        {/* PIN dots */}
        <MotiView
          key={shake}
          from={{ translateX: 0 }}
          animate={{ translateX: 0 }}
          transition={{
            type: 'timing',
            duration: 80,
            // Manual shake: trigger via key change
          }}
        >
          <View className="flex-row gap-3 mb-10">
            {Array.from({ length: PIN_MAX_LENGTH }).map((_, i) => {
              const filled = i < pin.length;
              return (
                <View
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: filled ? theme.accent : 'transparent',
                    borderWidth: 1.5,
                    borderColor: filled ? theme.accent : theme.muted,
                  }}
                />
              );
            })}
          </View>
        </MotiView>

        {/* Number pad */}
        <View style={{ width: 280 }}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
          ].map((row, ri) => (
            <View key={ri} className="flex-row justify-between mb-3">
              {row.map((d) => (
                <Key key={d} label={d} onPress={() => onDigit(d)} disabled={inCooldown || verifying} theme={theme} />
              ))}
            </View>
          ))}
          {/* Bottom row: biometric / 0 / backspace */}
          <View className="flex-row justify-between mb-3">
            {biometricEnabled ? (
              <BiometricKey
                onPress={async () => {
                  if (inCooldown || verifying) return;
                  const ok = await lockService.authenticateWithBiometric();
                  if (ok) {
                    haptic('success');
                    onUnlock();
                  }
                }}
                disabled={inCooldown || verifying}
                theme={theme}
              />
            ) : (
              <View style={{ width: 72, height: 72 }} />
            )}
            <Key label="0" onPress={() => onDigit('0')} disabled={inCooldown || verifying} theme={theme} />
            <BackspaceKey onPress={onBackspace} disabled={inCooldown || verifying || pin.length === 0} theme={theme} />
          </View>
        </View>

        {/* Submit (for 4-5 digit PINs that don't auto-verify) */}
        {pin.length >= PIN_MIN_LENGTH && pin.length < PIN_MAX_LENGTH && !inCooldown && (
          <Pressable
            onPress={onSubmit}
            className="mt-4 px-6 py-3 rounded-full"
            style={{ backgroundColor: theme.accent }}
          >
            <Text className="text-xs font-black uppercase tracking-widest" style={{ color: theme.onAccent }}>
              Unlock
            </Text>
          </Pressable>
        )}

        <Pressable onPress={onForgotPin} className="mt-8 py-2">
          <Text className="text-xs underline" style={{ color: theme.muted }}>
            Forgot PIN?
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
};

// ---------------------------------------------------------------------------
// Keypad keys
// ---------------------------------------------------------------------------

const Key: React.FC<{ label: string; onPress: () => void; disabled: boolean; theme: any }> = ({
  label,
  onPress,
  disabled,
  theme,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    className="rounded-full items-center justify-center"
    style={{
      width: 72,
      height: 72,
      backgroundColor: theme.surface2,
      borderWidth: 1,
      borderColor: theme.hairline,
      opacity: disabled ? 0.4 : 1,
    }}
  >
    <Text className="text-3xl font-light" style={{ color: theme.text }}>
      {label}
    </Text>
  </Pressable>
);

const BackspaceKey: React.FC<{ onPress: () => void; disabled: boolean; theme: any }> = ({
  onPress,
  disabled,
  theme,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    className="items-center justify-center"
    style={{ width: 72, height: 72, opacity: disabled ? 0.3 : 1 }}
  >
    <Delete size={24} color={theme.muted} />
  </Pressable>
);

const BiometricKey: React.FC<{ onPress: () => void; disabled: boolean; theme: any }> = ({
  onPress,
  disabled,
  theme,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    className="items-center justify-center"
    style={{ width: 72, height: 72, opacity: disabled ? 0.3 : 1 }}
  >
    <Fingerprint size={28} color={theme.accent} />
  </Pressable>
);
