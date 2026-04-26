import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { MotiView } from 'moti';
import Svg, { Circle } from 'react-native-svg';
import { Timer, ChevronRight, X } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';

interface Props {
  appName: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const EmergencyCountdown: React.FC<Props> = ({ appName, onComplete, onCancel }) => {
  const { mantras, dailyMantraIndex } = useStore();
  const theme = useTheme();
  const [timeLeft, setTimeLeft] = useState(60);

  const activeMantra =
    dailyMantraIndex !== null ? mantras[dailyMantraIndex] : mantras[0] || 'I am stronger than my urges.';

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - timeLeft / 60);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-guard-bg items-center justify-center px-6">
        <View className="w-full max-w-sm items-center">
          <View className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 items-center justify-center mb-6">
            <Timer size={40} color={theme.danger} />
          </View>
          <Text className="text-2xl font-black text-white uppercase mb-2">The Lion's Pause</Text>
          <Text className="text-xs text-white/40 uppercase mb-10" style={{ letterSpacing: 2 }}>
            Sixty seconds before: {appName}
          </Text>

          <View className="relative mb-12 w-48 h-48 items-center justify-center">
            <Svg width={192} height={192} style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={96} cy={96} r={radius} stroke={theme.hairline} strokeWidth={8} fill="none" />
              <Circle
                cx={96}
                cy={96}
                r={radius}
                stroke={theme.accent}
                strokeWidth={8}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </Svg>
            <View className="absolute inset-0 items-center justify-center">
              <Text className="text-5xl font-black text-white">{timeLeft}</Text>
              <Text className="text-[10px] font-bold text-white/30 uppercase" style={{ letterSpacing: 2 }}>Seconds</Text>
            </View>
          </View>

          <View className="mb-12 p-8 bg-guard-surface border border-guard-primary/30 rounded-[40px] w-full">
            <Text className="text-lg font-bold text-white leading-6 italic text-center">"{activeMantra}"</Text>
          </View>

          {timeLeft > 0 ? (
            <Pressable
              onPress={onCancel}
              className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 flex-row items-center justify-center gap-2"
            >
              <X size={16} color={theme.text} />
              <Text className="text-white font-black uppercase text-[10px]" style={{ letterSpacing: 2 }}>Stand down. Turn back.</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onComplete}
              className="w-full py-5 rounded-2xl bg-guard-accent flex-row items-center justify-center gap-2"
            >
              <Text className="text-guard-on-accent font-black uppercase text-[10px]" style={{ letterSpacing: 2 }}>
                Continue to {appName}
              </Text>
              <ChevronRight size={16} color={theme.onAccent} />
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};
