import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Sparkles, X } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';

/**
 * One-time banner shown on Home for users who completed the legacy 5-step
 * onboarding before the deep intake (v2) shipped. Tapping it re-runs the new
 * onboarding with existing answers pre-filled; dismissing it silences the
 * prompt permanently.
 */
export const OnboardingUpgradeBanner: React.FC = () => {
  const theme = useTheme();
  const hasCompletedOnboarding = useStore((s) => s.hasCompletedOnboarding);
  const onboardingVersion = useStore((s) => s.onboardingVersion);
  const requestOnboardingRerun = useStore((s) => s.requestOnboardingRerun);
  const dismissOnboardingUpgrade = useStore((s) => s.dismissOnboardingUpgrade);

  if (!hasCompletedOnboarding) return null;
  if (onboardingVersion >= 2) return null;

  return (
    <View
      className="mb-3 p-4 rounded-2xl flex-row items-center"
      style={{
        backgroundColor: 'rgba(232,160,32,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(232,160,32,0.30)',
      }}
    >
      <View className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: 'rgba(232,160,32,0.15)' }}>
        <Sparkles size={18} color={theme.accent} />
      </View>
      <View className="flex-1">
        <Text className="font-black text-sm mb-1" style={{ color: theme.text }}>
          We expanded onboarding
        </Text>
        <Text className="text-xs leading-5" style={{ color: theme.muted }}>
          New questions help the coach really know you. ~5 min, fully editable later.
        </Text>
        <View className="flex-row gap-2 mt-3">
          <Pressable
            onPress={requestOnboardingRerun}
            className="px-4 py-2 rounded-xl"
            style={{ backgroundColor: theme.accent }}
          >
            <Text className="text-xs font-black uppercase tracking-widest" style={{ color: theme.onAccent }}>
              Take 5 min
            </Text>
          </Pressable>
          <Pressable onPress={dismissOnboardingUpgrade} className="px-4 py-2 rounded-xl"
            style={{ backgroundColor: theme.surface2 }}>
            <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.muted }}>
              Not now
            </Text>
          </Pressable>
        </View>
      </View>
      <Pressable onPress={dismissOnboardingUpgrade} className="ml-2 p-1">
        <X size={16} color={theme.muted} />
      </Pressable>
    </View>
  );
};
