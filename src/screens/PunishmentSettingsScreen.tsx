import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { ArrowLeft, ShieldOff } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';

interface Props {
  onBack?: () => void;
}

const OPTIONS: { label: string; value: number | 'tomorrow'; desc: string }[] = [
  { label: '2 Hours', value: 2, desc: 'Short cooling off.' },
  { label: '6 Hours', value: 6, desc: 'Half a day locked down.' },
  { label: '24 Hours', value: 24, desc: 'Full day reset.' },
  { label: 'Until Tomorrow 9 AM', value: 'tomorrow', desc: 'Lock out for the night.' },
];

export const PunishmentSettingsScreen: React.FC<Props> = ({ onBack }) => {
  const { activatePunishmentMode, punishmentModeActive, deactivatePunishmentMode } = useStore();
  const theme = useTheme();

  const activate = (value: number | 'tomorrow', label: string) => {
    Alert.alert(
      'Activate focus mode?',
      `The app will enter restricted mode for ${label}. You won't be able to disable it early.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          style: 'destructive',
          onPress: () => activatePunishmentMode(value),
        },
      ]
    );
  };

  return (
    <Screen>
      <View className="flex-row items-center mb-6">
        {onBack && (
          <Pressable onPress={onBack} className="w-10 h-10 rounded-xl bg-guard-surface items-center justify-center mr-3">
            <ArrowLeft size={18} color={theme.text} />
          </Pressable>
        )}
        <Text className="text-2xl font-black text-white">Focus Mode</Text>
      </View>

      <View className="bg-guard-danger/10 border border-guard-danger/30 rounded-3xl p-5 mb-6">
        <View className="flex-row items-center mb-2">
          <ShieldOff size={18} color={theme.danger} />
          <Text className="text-guard-danger font-black uppercase tracking-widest text-xs ml-2">
            Consequence mode
          </Text>
        </View>
        <Text className="text-white/80 leading-6">
          A self-imposed lockdown after a fall. Reduces app functionality until the timer ends.
        </Text>
      </View>

      {punishmentModeActive ? (
        <View className="bg-guard-surface border border-guard-primary/30 rounded-3xl p-5">
          <Text className="text-white font-black mb-3">Focus mode is active.</Text>
          <Pressable
            onPress={deactivatePunishmentMode}
            className="py-3 rounded-2xl bg-white/5 items-center"
          >
            <Text className="text-white/70 font-bold uppercase">End early</Text>
          </Pressable>
        </View>
      ) : (
        OPTIONS.map((o) => (
          <Pressable
            key={o.label}
            onPress={() => activate(o.value, o.label)}
            className="bg-guard-surface border border-guard-primary/30 rounded-2xl p-5 mb-3"
          >
            <Text className="text-white font-black text-lg">{o.label}</Text>
            <Text className="text-white/50 text-sm mt-1">{o.desc}</Text>
          </Pressable>
        ))
      )}
    </Screen>
  );
};
