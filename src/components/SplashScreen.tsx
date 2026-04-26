import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { LionMark } from './LionMark';
import { BRAND, useTheme } from '../constants/theme';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => onComplete(), 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View className="absolute inset-0 bg-guard-bg items-center justify-center">
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ type: 'timing', duration: 800 }}
        className="items-center"
      >
        {/* Lion mark */}
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 900 }}
          className="mb-6"
        >
          <LionMark size={120} color={theme.accent} accentColor={theme.text} />
        </MotiView>

        {/* Wordmark */}
        <Text
          className="text-5xl font-black text-guard-text tracking-tight"
          style={{ letterSpacing: -1 }}
        >
          {BRAND.name}
        </Text>

        {/* Hebrew */}
        <MotiText
          from={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ delay: 400, type: 'timing', duration: 700 }}
          className="text-guard-text text-2xl mt-2"
          style={{ fontFamily: 'Georgia' }}
        >
          {BRAND.hebrew}
        </MotiText>

        {/* Accent bar */}
        <MotiView
          from={{ width: 0 }}
          animate={{ width: 80 }}
          transition={{ delay: 700, type: 'timing', duration: 900 }}
          className="h-[2px] bg-guard-accent mt-6 rounded-full"
        />

        {/* Tagline */}
        <MotiText
          from={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          transition={{ delay: 1100, type: 'timing', duration: 900 }}
          className="text-guard-text text-[11px] font-bold uppercase mt-5"
          style={{ letterSpacing: 4 }}
        >
          {BRAND.tagline}
        </MotiText>
      </MotiView>
    </View>
  );
};

