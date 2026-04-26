import React from 'react';
import { View, Text } from 'react-native';
import { Lock } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

interface Props {
  message?: string;
  tone?: 'subtle' | 'prominent';
}

/**
 * Inline reassurance note used near sensitive inputs
 * (AI chat, journal, partner setup, trigger logs).
 * Reinforces: nothing leaves the device.
 */
export const PrivacyNote: React.FC<Props> = ({
  message = 'Saved on this phone only. Nothing leaves your device.',
  tone = 'subtle',
}) => {
  const isProminent = tone === 'prominent';
  return (
    <View
      className="flex-row items-center rounded-xl px-3 py-2"
      style={{
        backgroundColor: isProminent
          ? 'rgba(30, 138, 74, 0.18)'
          : 'rgba(30, 138, 74, 0.08)',
        borderWidth: 1,
        borderColor: isProminent
          ? 'rgba(30, 138, 74, 0.5)'
          : 'rgba(30, 138, 74, 0.2)',
      }}
    >
      <Lock size={14} color={COLORS.success} />
      <Text
        className="ml-2 flex-1 text-xs"
        style={{
          color: isProminent ? COLORS.text : COLORS.textMuted,
          fontFamily: 'Inter',
        }}
      >
        {message}
      </Text>
    </View>
  );
};
