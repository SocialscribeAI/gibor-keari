import React from 'react';
import { View, Text } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { Star } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';
import { LionMark } from './LionMark';

const MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365];

export const StreakIncentiveBar: React.FC = () => {
  const { currentStreak } = useStore();
  const theme = useTheme();

  const nextMilestone = MILESTONES.find((m) => m > currentStreak) || MILESTONES[MILESTONES.length - 1];
  const lastMilestone = [...MILESTONES].reverse().find((m) => m <= currentStreak) || 0;

  const progress = ((currentStreak - lastMilestone) / (nextMilestone - lastMilestone)) * 100;
  const daysRemaining = nextMilestone - currentStreak;
  const isClose = daysRemaining <= 2;

  return (
    <View className="w-full px-6 mt-6">
      <View className={`p-5 rounded-3xl bg-guard-surface border ${isClose ? 'border-guard-accent/40' : 'border-guard-primary/30'}`}>
        <View className="flex-row justify-between items-end mb-4">
          <View className="flex-row items-center gap-2">
            <View className={`w-9 h-9 rounded-xl items-center justify-center ${isClose ? 'bg-guard-accent' : 'bg-guard-accent/10'}`}>
              <LionMark size={22} color={isClose ? theme.onAccent : theme.accent} accentColor={theme.text} />
            </View>
            <View>
              <Text className="text-[9px] font-black uppercase text-white/40" style={{ letterSpacing: 2 }}>Next Milestone</Text>
              <Text className="text-xs font-black text-white uppercase">Day {nextMilestone}</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className={`text-lg font-black ${isClose ? 'text-guard-accent' : 'text-white'}`}>{daysRemaining}</Text>
            <Text className="text-[9px] font-bold text-white/30 uppercase">Days to go</Text>
          </View>
        </View>

        <View className="h-2 bg-guard-bg rounded-full overflow-hidden mb-3">
          <MotiView
            from={{ width: '0%' as any }}
            animate={{ width: `${progress}%` as any }}
            transition={{ type: 'timing', duration: 800 }}
            className="h-full bg-guard-accent rounded-full"
          />
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-1">
            <Star size={10} color={theme.accent} />
            <Text className="text-[8px] font-bold text-white/30 uppercase" style={{ letterSpacing: 2 }}>Day {lastMilestone}</Text>
          </View>
          {isClose && (
            <MotiText
              from={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', loop: true, duration: 1500 }}
              className="text-[9px] font-black text-guard-accent uppercase"
              style={{ letterSpacing: 2 }}
            >
              Roar closer
            </MotiText>
          )}
          <View className="flex-row items-center gap-1">
            <Text className="text-[8px] font-bold text-white/30 uppercase" style={{ letterSpacing: 2 }}>Day {nextMilestone}</Text>
            <Star size={10} color={theme.accent} />
          </View>
        </View>
      </View>
    </View>
  );
};
