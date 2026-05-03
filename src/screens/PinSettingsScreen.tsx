import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, TextInput } from 'react-native';
import {
  ChevronLeft,
  Lock,
  Unlock,
  Fingerprint,
  Clock,
  ShieldCheck,
  KeyRound,
  X,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import { lockService, PIN_MIN_LENGTH, PIN_MAX_LENGTH } from '../services/lockService';
import type { LockTimeoutMode } from '../store/useStore';
import { useTheme } from '../constants/theme';

// =============================================================================
// PinSettingsScreen — set up, change, or remove the PIN; toggle biometric;
// pick the lock-on-foreground timeout.
// =============================================================================

interface Props {
  onBack: () => void;
}

type Flow =
  | { kind: 'main' }
  | { kind: 'setup'; step: 'enter' | 'confirm'; firstPin?: string }
  | { kind: 'change'; step: 'verify-old' | 'enter-new' | 'confirm-new'; oldPin?: string; firstPin?: string }
  | { kind: 'disable'; step: 'verify' };

const TIMEOUT_OPTIONS: { value: LockTimeoutMode; label: string; desc: string }[] = [
  { value: 'immediate', label: 'Immediately', desc: 'Lock the moment the app goes to background.' },
  { value: '1min', label: '1 minute', desc: 'Brief grace period for quick app-switching.' },
  { value: '5min', label: '5 minutes', desc: 'Comfortable for normal multi-tasking.' },
  { value: '15min', label: '15 minutes', desc: 'Looser — for trusted devices.' },
  { value: 'never', label: 'Never auto-lock', desc: 'Only locks on app restart. PIN still required at launch.' },
];

export const PinSettingsScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const {
    pinEnabled,
    pinHashPresent,
    biometricEnabled,
    lockTimeoutMode,
    setBiometricEnabled,
    setLockTimeoutMode,
  } = useStore();

  const [flow, setFlow] = useState<Flow>({ kind: 'main' });
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);

  useEffect(() => {
    void lockService.syncPinPresentFlag();
    void lockService.isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const onToggleBiometric = async () => {
    if (!biometricAvailable) {
      Alert.alert(
        'Biometric not available',
        'Your device either has no fingerprint / face ID hardware or you haven\'t enrolled any.',
      );
      return;
    }
    if (!biometricEnabled) {
      // Sanity-check that biometric works before turning it on.
      const ok = await lockService.authenticateWithBiometric();
      if (!ok) return;
    }
    setBiometricEnabled(!biometricEnabled);
  };

  if (flow.kind === 'setup') {
    return (
      <PinEntryFlow
        title={flow.step === 'enter' ? 'Choose a PIN' : 'Confirm your PIN'}
        subtitle={
          flow.step === 'enter'
            ? `${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} digits. Don\'t use your phone passcode.`
            : 'Enter the same PIN once more.'
        }
        onCancel={() => setFlow({ kind: 'main' })}
        onSubmit={async (pin) => {
          if (flow.step === 'enter') {
            setFlow({ kind: 'setup', step: 'confirm', firstPin: pin });
            return { ok: true };
          }
          if (pin !== flow.firstPin) {
            return { ok: false, error: 'PINs don\'t match. Try again.' };
          }
          const result = await lockService.setupPin(pin);
          if (result.ok) {
            setFlow({ kind: 'main' });
            Alert.alert('PIN set', 'Your app is now protected.');
          }
          return result;
        }}
        theme={theme}
      />
    );
  }

  if (flow.kind === 'change') {
    return (
      <PinEntryFlow
        title={
          flow.step === 'verify-old'
            ? 'Enter current PIN'
            : flow.step === 'enter-new'
              ? 'Choose a new PIN'
              : 'Confirm new PIN'
        }
        subtitle={
          flow.step === 'verify-old'
            ? 'Verify it\'s really you.'
            : flow.step === 'enter-new'
              ? `${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} digits.`
              : 'Re-enter the new PIN.'
        }
        onCancel={() => setFlow({ kind: 'main' })}
        onSubmit={async (pin) => {
          if (flow.step === 'verify-old') {
            const ok = await lockService.verifyPin(pin);
            if (!ok) return { ok: false, error: 'Wrong PIN.' };
            setFlow({ kind: 'change', step: 'enter-new', oldPin: pin });
            return { ok: true };
          }
          if (flow.step === 'enter-new') {
            setFlow({ kind: 'change', step: 'confirm-new', oldPin: flow.oldPin, firstPin: pin });
            return { ok: true };
          }
          if (pin !== flow.firstPin) {
            return { ok: false, error: 'PINs don\'t match. Try again.' };
          }
          const result = await lockService.setupPin(pin);
          if (result.ok) {
            setFlow({ kind: 'main' });
            Alert.alert('PIN updated', 'Your new PIN is active.');
          }
          return result;
        }}
        theme={theme}
      />
    );
  }

  if (flow.kind === 'disable') {
    return (
      <PinEntryFlow
        title="Verify PIN to disable"
        subtitle="Confirm it's you before removing PIN protection."
        onCancel={() => setFlow({ kind: 'main' })}
        onSubmit={async (pin) => {
          const ok = await lockService.verifyPin(pin);
          if (!ok) return { ok: false, error: 'Wrong PIN.' };
          await lockService.disablePin();
          setFlow({ kind: 'main' });
          Alert.alert('PIN removed', 'Your app no longer requires a PIN at launch.');
          return { ok: true };
        }}
        theme={theme}
      />
    );
  }

  // ---- Main view ---------------------------------------------------------

  const hasPin = pinEnabled && pinHashPresent;

  return (
    <Screen>
      <View className="flex-row items-center mb-4">
        <Pressable onPress={onBack} className="flex-row items-center">
          <ChevronLeft size={20} color={theme.muted} />
          <Text className="text-sm ml-1" style={{ color: theme.muted }}>
            About Me
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-black mb-2" style={{ color: theme.text, fontFamily: 'Outfit' }}>
          Lock & PIN
        </Text>
        <Text className="leading-6 mb-6" style={{ color: theme.muted }}>
          Add a PIN so only you can open Guard. The PIN is hashed and stored in your phone&apos;s
          encrypted keychain — even we can&apos;t see it.
        </Text>

        {/* Status hero */}
        <View
          className="rounded-3xl p-5 mb-6 flex-row items-start"
          style={{
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: hasPin ? theme.accent + '60' : theme.hairline,
          }}
        >
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
            style={{ backgroundColor: hasPin ? `${theme.accent}20` : theme.surface2 }}
          >
            {hasPin ? <Lock size={22} color={theme.accent} /> : <Unlock size={22} color={theme.muted} />}
          </View>
          <View className="flex-1">
            <Text className="font-black text-base mb-1" style={{ color: theme.text }}>
              {hasPin ? 'PIN protection is on' : 'No PIN set'}
            </Text>
            <Text className="text-sm leading-5" style={{ color: theme.muted }}>
              {hasPin
                ? 'Guard will ask for your PIN at launch and after the app sits in the background past your timeout.'
                : 'Anyone with your phone can open Guard. Set a PIN to require it at launch.'}
            </Text>
          </View>
        </View>

        {/* Setup / Change / Remove buttons */}
        {!hasPin ? (
          <Pressable
            onPress={() => setFlow({ kind: 'setup', step: 'enter' })}
            className="rounded-2xl py-4 items-center mb-6 flex-row justify-center"
            style={{ backgroundColor: theme.accent }}
          >
            <ShieldCheck size={16} color={theme.onAccent} />
            <Text className="ml-2 font-black uppercase tracking-widest" style={{ color: theme.onAccent }}>
              Set up PIN
            </Text>
          </Pressable>
        ) : (
          <View className="mb-6">
            <Pressable
              onPress={() => setFlow({ kind: 'change', step: 'verify-old' })}
              className="rounded-2xl py-4 items-center mb-2 flex-row justify-center"
              style={{ backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.hairline }}
            >
              <KeyRound size={16} color={theme.text} />
              <Text className="ml-2 font-bold" style={{ color: theme.text }}>
                Change PIN
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFlow({ kind: 'disable', step: 'verify' })}
              className="rounded-2xl py-4 items-center flex-row justify-center"
              style={{
                backgroundColor: 'rgba(232,80,80,0.10)',
                borderWidth: 1,
                borderColor: 'rgba(232,80,80,0.35)',
              }}
            >
              <X size={16} color="#E85050" />
              <Text className="ml-2 font-bold" style={{ color: '#E85050' }}>
                Remove PIN
              </Text>
            </Pressable>
          </View>
        )}

        {/* Biometric toggle */}
        <Text className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
          Faster unlock
        </Text>
        <Pressable
          onPress={onToggleBiometric}
          disabled={!hasPin}
          className="rounded-2xl p-4 mb-6 flex-row items-center"
          style={{
            backgroundColor: theme.surface2,
            borderWidth: 1,
            borderColor: theme.hairline,
            opacity: hasPin ? 1 : 0.5,
          }}
        >
          <Fingerprint size={18} color={theme.accent} />
          <View className="flex-1 ml-3">
            <Text className="font-bold text-sm" style={{ color: theme.text }}>
              Biometric unlock
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: theme.muted }}>
              {!biometricAvailable
                ? 'Not available on this device.'
                : !hasPin
                  ? 'Set a PIN first.'
                  : biometricEnabled
                    ? 'On — Face ID / fingerprint / iris will unlock.'
                    : 'Off — only PIN unlocks.'}
            </Text>
          </View>
          <View
            className="w-12 h-7 rounded-full"
            style={{
              backgroundColor: biometricEnabled ? theme.accent : theme.hairline,
              padding: 2,
            }}
          >
            <View
              className="w-5 h-5 rounded-full bg-white"
              style={{ marginLeft: biometricEnabled ? 18 : 0 }}
            />
          </View>
        </Pressable>

        {/* Timeout selector */}
        <Text className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
          Auto-lock timing
        </Text>
        <Text className="text-xs mb-3" style={{ color: theme.muted }}>
          How long Guard waits after going to background before re-locking.
        </Text>
        {TIMEOUT_OPTIONS.map((opt) => {
          const active = lockTimeoutMode === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setLockTimeoutMode(opt.value)}
              disabled={!hasPin}
              className="rounded-2xl p-4 mb-2 flex-row items-start"
              style={{
                backgroundColor: active ? theme.accent : theme.surface2,
                borderWidth: 1,
                borderColor: active ? theme.accent : theme.hairline,
                opacity: hasPin ? 1 : 0.5,
              }}
            >
              <Clock size={16} color={active ? theme.onAccent : theme.accent} style={{ marginTop: 2 }} />
              <View className="flex-1 ml-3">
                <Text
                  className="font-black text-sm"
                  style={{ color: active ? theme.onAccent : theme.text }}
                >
                  {opt.label}
                </Text>
                <Text
                  className="text-xs mt-0.5"
                  style={{
                    color: active ? theme.onAccent : theme.muted,
                    opacity: active ? 0.85 : 1,
                  }}
                >
                  {opt.desc}
                </Text>
              </View>
            </Pressable>
          );
        })}

        <View className="h-12" />
      </ScrollView>
    </Screen>
  );
};

// ---------------------------------------------------------------------------
// PinEntryFlow — shared screen for enter / verify / confirm steps in setup,
// change, and disable flows.
// ---------------------------------------------------------------------------

const PinEntryFlow: React.FC<{
  title: string;
  subtitle: string;
  onCancel: () => void;
  onSubmit: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  theme: any;
}> = ({ title, subtitle, onCancel, onSubmit, theme }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (pin.length < PIN_MIN_LENGTH) return;
    setSubmitting(true);
    setError(null);
    const res = await onSubmit(pin);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? 'Try again.');
      setPin('');
    }
  };

  return (
    <Screen>
      <View className="flex-row items-center mb-6">
        <Pressable onPress={onCancel} className="flex-row items-center">
          <ChevronLeft size={20} color={theme.muted} />
          <Text className="text-sm ml-1" style={{ color: theme.muted }}>
            Cancel
          </Text>
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-black mb-2 text-center" style={{ color: theme.text, fontFamily: 'Outfit' }}>
          {title}
        </Text>
        <Text className="text-center mb-8 leading-6" style={{ color: theme.muted }}>
          {subtitle}
        </Text>

        <TextInput
          value={pin}
          onChangeText={(v) => {
            const onlyDigits = v.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH);
            setPin(onlyDigits);
            setError(null);
          }}
          keyboardType="number-pad"
          secureTextEntry
          autoFocus
          maxLength={PIN_MAX_LENGTH}
          placeholder="••••"
          placeholderTextColor={theme.textDim}
          className="text-center rounded-2xl py-4 mb-4"
          style={{
            width: 200,
            fontSize: 28,
            letterSpacing: 12,
            backgroundColor: theme.surface2,
            borderWidth: 1,
            borderColor: error ? '#E85050' : theme.hairline,
            color: theme.text,
            fontFamily: 'Outfit',
          }}
        />

        {error && (
          <Text className="text-sm mb-4" style={{ color: '#E85050' }}>
            {error}
          </Text>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={pin.length < PIN_MIN_LENGTH || submitting}
          className="rounded-2xl py-4 px-8 items-center mt-2"
          style={{
            backgroundColor: pin.length >= PIN_MIN_LENGTH && !submitting ? theme.accent : theme.surface2,
            minWidth: 200,
          }}
        >
          <Text
            className="font-black uppercase tracking-widest"
            style={{
              color: pin.length >= PIN_MIN_LENGTH && !submitting ? theme.onAccent : theme.muted,
            }}
          >
            {submitting ? 'Working…' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
};
