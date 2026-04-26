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

  const mantra =
    dailyMantraIndex !== null ? mantras[dailyMantraIndex] : mantras[0] || 'I am my choices.';

  const handleWin = () => {
    if (todayEntry !== 'win') logWin();
  };
  const handleClose = () => setShowCloseCall(true);

  return (
    <Screen>
      {/* Streak ring + level — at-a-glance status */}
      <View className="items-center mt-2">
        <Text className="text-guard-accent text-[11px] font-black uppercase tracking-widest">
          {level}
        </Text>
      </View>

      <View className="items-center justify-center mt-3 mb-4">
        <View style={{ width: 220, height: 220 }} className="items-center justify-center relative">
          <Svg width={220} height={220}>
            <Circle
              cx={110}
              cy={110}
              r={92}
              stroke={theme.hairline}
              strokeWidth={9}
              fill="none"
            />
            <Circle
              cx={110}
              cy={110}
              r={92}
              stroke={theme.accent}
              strokeWidth={9}
              fill="none"
              strokeDasharray={`${2 * Math.PI * 92} ${2 * Math.PI * 92}`}
              strokeDashoffset={(2 * Math.PI * 92) * (1 - progress)}
              strokeLinecap="round"
              transform="rotate(-90 110 110)"
            />
          </Svg>
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-6xl font-black text-white">{currentStreak}</Text>
            <Text className="text-white/60 text-[11px] uppercase tracking-widest mt-1">
              days standing
            </Text>
            <Text className="text-white/40 text-[10px] mt-1">next: {nextMilestone}d</Text>
          </View>
        </View>
      </View>

      {/* PRIMARY ACTIONS — visible without scrolling */}
      <View className="flex-row gap-2.5">
        <Pressable
          onPress={handleWin}
          className={`flex-1 py-3.5 rounded-2xl border items-center ${
            todayEntry === 'win'
              ? 'bg-guard-success/20 border-guard-success'
              : 'bg-guard-surface border-guard-primary/30'
          }`}
        >
          <Check size={20} color={todayEntry === 'win' ? theme.success : theme.text} />
          <Text className="text-white text-[11px] font-black mt-1.5 uppercase tracking-wider">
            Stood
          </Text>
        </Pressable>
        <Pressable
          onPress={handleClose}
          className="flex-1 py-3.5 rounded-2xl border bg-guard-surface border-guard-primary/30 items-center"
        >
          <Shield size={20} color={theme.accent} />
          <Text className="text-white text-[11px] font-black mt-1.5 uppercase tracking-wider">
            Close call
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setShowFall(true)}
          className="flex-1 py-3.5 rounded-2xl border bg-guard-danger/15 border-guard-danger/50 items-center"
        >
          <X size={20} color={theme.danger} />
          <Text className="text-white text-[11px] font-black mt-1.5 uppercase tracking-wider">
            Stumbled
          </Text>
        </Pressable>
      </View>

      {/* EMERGENCY — large, primary call-to-action when in danger */}
      <Pressable
        onPress={() => setShowEmergency(true)}
        className="mt-3 p-4 rounded-2xl bg-guard-danger border border-guard-danger flex-row items-center justify-center"
      >
        <Siren size={20} color="#FFFFFF" />
        <Text className="font-black uppercase tracking-widest ml-2.5 text-white text-base">
          Help me now — 60s pause
        </Text>
      </Pressable>

      {/* Urge slider — quick triage */}
      <View className="bg-guard-surface border border-guard-primary/30 rounded-2xl p-4 mt-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-white/70 text-[11px] uppercase tracking-widest">Urge level</Text>
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
            className="mt-2 flex-row items-center"
          >
            <AlertTriangle size={14} color={theme.danger} />
            <Text className="text-guard-danger text-xs ml-2 font-bold uppercase">
              The lion is restless — act now
            </Text>
          </MotiView>
        )}
      </View>

      {/* Mantra — supporting */}
      <View className="bg-guard-surface border border-guard-primary/30 rounded-2xl p-4 mt-3">
        <Text className="text-white/50 text-[10px] uppercase tracking-widest mb-1.5">
          Daily mantra
        </Text>
        <Text className="text-white text-base leading-6">{mantra}</Text>
      </View>

      {/* Streak progress — supporting */}
      <StreakIncentiveBar />

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
