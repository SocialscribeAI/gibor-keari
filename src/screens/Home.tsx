import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MotiView } from 'moti';
import Svg, { Circle } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { Check, X, AlertTriangle, Shield, Siren } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import { useStreak } from '../hooks/useStreak';
import { useTheme } from '../constants/theme';
import { VowScreen } from './VowScreen';
import { PostFallProtocol } from '../components/PostFallProtocol';
import { CloseCallProtocol } from '../components/CloseCallProtocol';
import { PanicButton } from '../components/PanicButton';
import { MilestoneCelebration } from '../components/MilestoneCelebration';
import { EmergencyCountdown } from '../components/EmergencyCountdown';
import { CheckInModal } from '../components/CheckInModal';
import { StreakIncentiveBar } from '../components/StreakIncentiveBar';

const MILESTONES = [7, 14, 30, 60, 90, 180, 365];

export const Home: React.FC = () => {
  const {
    streakStart,
    syncStreak,
    logWin,
    calendarLog,
    mantras,
    dailyMantraIndex,
    lastCelebratedMilestone,
    setLastCelebratedMilestone,
  } = useStore();
  const { currentStreak, level } = useStreak();
  const theme = useTheme();
  const [showFall, setShowFall] = useState(false);
  const [showCloseCall, setShowCloseCall] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [urgeLevel, setUrgeLevel] = useState(0);
  const [milestoneToCelebrate, setMilestoneToCelebrate] = useState<number | null>(null);

  useEffect(() => {
    syncStreak();
  }, [syncStreak]);

  useEffect(() => {
    const hit = MILESTONES.find((m) => currentStreak === m && lastCelebratedMilestone !== m);
    if (hit) {
      setMilestoneToCelebrate(hit);
      setLastCelebratedMilestone(hit);
    }
  }, [currentStreak, lastCelebratedMilestone, setLastCelebratedMilestone]);

  if (!streakStart) return <VowScreen />;

  const nextMilestone = MILESTONES.find((m) => m > currentStreak) || 365;
  const prevMilestone = [...MILESTONES].reverse().find((m) => m <= currentStreak) || 0;
  const progress = (currentStreak - prevMilestone) / (nextMilestone - prevMilestone);

  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = calendarLog[today];

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const mantra =
    dailyMantraIndex !== null ? mantras[dailyMantraIndex] : mantras[0] || 'I am my choices.';

  const handleWin = () => {
    if (todayEntry !== 'win') logWin();
  };
  const handleClose = () => setShowCloseCall(true);

  return (
    <Screen>
      <View className="items-center mb-2 mt-2">
        <Text className="text-guard-accent text-xs font-black uppercase tracking-widest mb-2">
          {level}
        </Text>
      </View>

      <View className="items-center justify-center my-4">
        <View style={{ width: 260, height: 260 }} className="items-center justify-center relative">
          <Svg width={260} height={260}>
            <Circle
              cx={130}
              cy={130}
              r={radius}
              stroke={theme.hairline}
              strokeWidth={10}
              fill="none"
            />
            <Circle
              cx={130}
              cy={130}
              r={radius}
              stroke={theme.accent}
              strokeWidth={10}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 130 130)"
            />
          </Svg>
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-7xl font-black text-white">{currentStreak}</Text>
            <Text className="text-white/50 text-xs uppercase tracking-widest mt-1">days standing</Text>
            <Text className="text-white/30 text-[10px] mt-2">next: {nextMilestone}d</Text>
          </View>
        </View>
      </View>

      <StreakIncentiveBar />

      <View className="bg-guard-surface border border-guard-primary/30 rounded-3xl p-5 mt-6">
        <Text className="text-white/50 text-xs uppercase tracking-widest mb-2">Daily Mantra</Text>
        <Text className="text-white text-lg leading-7">{mantra}</Text>
      </View>

      <View className="flex-row gap-3 mt-6">
        <Pressable
          onPress={handleWin}
          className={`flex-1 p-4 rounded-2xl border items-center ${
            todayEntry === 'win'
              ? 'bg-guard-success/20 border-guard-success'
              : 'bg-guard-surface border-guard-primary/30'
          }`}
        >
          <Check size={22} color={todayEntry === 'win' ? theme.success : theme.text} />
          <Text className="text-white text-xs font-bold mt-2">STOOD</Text>
        </Pressable>
        <Pressable
          onPress={handleClose}
          className="flex-1 p-4 rounded-2xl border bg-guard-surface border-guard-primary/30 items-center"
        >
          <Shield size={22} color={theme.accent} />
          <Text className="text-white text-xs font-bold mt-2">CLOSE CALL</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowFall(true)}
          className="flex-1 p-4 rounded-2xl border bg-guard-danger/10 border-guard-danger/40 items-center"
        >
          <X size={22} color={theme.danger} />
          <Text className="text-white text-xs font-bold mt-2">STUMBLED</Text>
        </Pressable>
      </View>

      <View className="bg-guard-surface border border-guard-primary/30 rounded-3xl p-5 mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white/70 text-xs uppercase tracking-widest">Urge Level</Text>
          <Text className="text-guard-accent font-black">{urgeLevel}/10</Text>
        </View>
        <Slider
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={urgeLevel}
          onValueChange={setUrgeLevel}
          minimumTrackTintColor={theme.accent}
          maximumTrackTintColor={theme.hairline}
          thumbTintColor={theme.accent}
        />
        {urgeLevel >= 7 && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex-row items-center"
          >
            <AlertTriangle size={14} color={theme.danger} />
            <Text className="text-guard-danger text-xs ml-2 font-bold uppercase">The lion is restless — act now</Text>
          </MotiView>
        )}
      </View>

      <Pressable
        onPress={() => setShowEmergency(true)}
        className="mt-6 p-5 rounded-2xl bg-guard-danger/10 border border-guard-danger/40 flex-row items-center justify-center"
      >
        <Siren size={18} color={theme.danger} />
        <Text className="text-guard-danger font-black uppercase tracking-widest ml-2">
          Emergency — 60s pause
        </Text>
      </Pressable>

      <PostFallProtocol
        isOpen={showFall}
        onClose={() => setShowFall(false)}
      />
      <CloseCallProtocol
        isOpen={showCloseCall}
        onClose={() => setShowCloseCall(false)}
      />
      {showEmergency && (
        <EmergencyCountdown
          appName="Pause"
          onComplete={() => setShowEmergency(false)}
          onCancel={() => setShowEmergency(false)}
        />
      )}
      {milestoneToCelebrate && (
        <MilestoneCelebration day={milestoneToCelebrate} onClose={() => setMilestoneToCelebrate(null)} />
      )}
      <CheckInModal />
      <PanicButton />
    </Screen>
  );
};
