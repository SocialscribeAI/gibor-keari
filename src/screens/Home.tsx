import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MotiView } from 'moti';
import Svg, { Circle } from 'react-native-svg';
import { Check, X, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import { useStreak } from '../hooks/useStreak';
import { useTheme } from '../constants/theme';
import { VowScreen } from './VowScreen';
import { PostFallProtocol } from '../components/PostFallProtocol';
import { MilestoneCelebration } from '../components/MilestoneCelebration';
import { EmergencyCountdown } from '../components/EmergencyCountdown';
import { CheckInModal } from '../components/CheckInModal';
import { PanicButton } from '../components/PanicButton';
import { StreakIncentiveBar } from '../components/StreakIncentiveBar';
import { DangerMode } from '../components/DangerMode';

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
    likeMantra,
    dislikeMantra,
    coachStylePrefs,
  } = useStore();
  const { currentStreak, level } = useStreak();
  const theme = useTheme();

  const [showFall, setShowFall] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [milestoneToCelebrate, setMilestoneToCelebrate] = useState<number | null>(null);
  const [mantraRated, setMantraRated] = useState<'liked' | 'disliked' | null>(null);

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
  const progress = Math.max(0, Math.min(1, (currentStreak - prevMilestone) / (nextMilestone - prevMilestone)));

  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = calendarLog[today];

  const mantra = dailyMantraIndex !== null ? mantras[dailyMantraIndex] : mantras[0] || 'I am my choices.';

  const handleWin = () => {
    if (todayEntry !== 'win') logWin();
  };

  const handleLikeMantra = () => {
    likeMantra(mantra);
    setMantraRated('liked');
  };
  const handleDislikeMantra = () => {
    dislikeMantra(mantra);
    setMantraRated('disliked');
  };

  return (
    <Screen>
      {/* Level label */}
      <View className="items-center mt-2 mb-1">
        <Text className="text-guard-accent text-[11px] font-black uppercase tracking-widest">{level}</Text>
      </View>

      {/* Streak ring */}
      <View className="items-center justify-center mt-2 mb-5">
        <View style={{ width: 200, height: 200 }} className="items-center justify-center relative">
          <Svg width={200} height={200}>
            <Circle cx={100} cy={100} r={84} stroke={theme.hairline} strokeWidth={8} fill="none" />
            <Circle
              cx={100}
              cy={100}
              r={84}
              stroke={theme.accent}
              strokeWidth={8}
              fill="none"
              strokeDasharray={`${2 * Math.PI * 84} ${2 * Math.PI * 84}`}
              strokeDashoffset={(2 * Math.PI * 84) * (1 - progress)}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
            />
          </Svg>
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-5xl font-black text-white">{currentStreak}</Text>
            <Text className="text-white/60 text-[10px] uppercase tracking-widest mt-1">days</Text>
            <Text className="text-white/35 text-[10px] mt-0.5">→ {nextMilestone}d</Text>
          </View>
        </View>
      </View>

      {/* ─── THREE PRIMARY ACTIONS ─── */}
      <View className="flex-row gap-2.5 mb-3">
        {/* STOOD — daily win */}
        <Pressable
          onPress={handleWin}
          className={`flex-1 py-4 rounded-2xl border items-center ${
            todayEntry === 'win'
              ? 'bg-guard-success/15 border-guard-success'
              : 'bg-guard-surface border-guard-primary/30'
          }`}
        >
          <Check size={22} color={todayEntry === 'win' ? theme.success : theme.text} />
          <Text className="text-white text-[11px] font-black mt-2 uppercase tracking-wider">
            Stood
          </Text>
          {todayEntry === 'win' && (
            <Text className="text-guard-success text-[9px] font-bold mt-0.5">✓ Logged</Text>
          )}
        </Pressable>

        {/* DANGER — urge is building */}
        <Pressable
          onPress={() => setShowDanger(true)}
          style={{
            flex: 1,
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
            backgroundColor: 'rgba(232,160,32,0.12)',
            borderWidth: 1.5,
            borderColor: 'rgba(232,160,32,0.5)',
          }}
        >
          <AlertTriangle size={22} color={theme.accent} />
          <Text className="text-white text-[11px] font-black mt-2 uppercase tracking-wider">
            Danger
          </Text>
          <Text style={{ color: theme.accent, fontSize: 9, fontWeight: '700', marginTop: 2 }}>
            Urge building
          </Text>
        </Pressable>

        {/* FELL — relapse */}
        <Pressable
          onPress={() => setShowFall(true)}
          className="flex-1 py-4 rounded-2xl border bg-guard-danger/10 border-guard-danger/40 items-center"
        >
          <X size={22} color={theme.danger} />
          <Text className="text-white text-[11px] font-black mt-2 uppercase tracking-wider">
            Fell
          </Text>
          <Text style={{ color: theme.danger, fontSize: 9, fontWeight: '700', marginTop: 2 }}>
            Be honest
          </Text>
        </Pressable>
      </View>

      {/* ─── EMERGENCY ─── */}
      <Pressable
        onPress={() => setShowEmergency(true)}
        style={{
          backgroundColor: 'rgba(192,57,43,0.9)',
          borderRadius: 16,
          paddingVertical: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          borderWidth: 1,
          borderColor: 'rgba(192,57,43,0.5)',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Emergency — 60 second pause
        </Text>
      </Pressable>

      {/* Mantra with rating */}
      <View className="bg-guard-surface border border-guard-primary/30 rounded-2xl p-4 mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-white/50 text-[10px] uppercase tracking-widest">Daily mantra</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleLikeMantra}
              disabled={mantraRated !== null}
              style={{
                padding: 5,
                borderRadius: 8,
                backgroundColor: mantraRated === 'liked' ? 'rgba(30,138,74,0.2)' : 'transparent',
              }}
            >
              <ThumbsUp size={13} color={mantraRated === 'liked' ? theme.success : theme.muted} />
            </Pressable>
            <Pressable
              onPress={handleDislikeMantra}
              disabled={mantraRated !== null}
              style={{
                padding: 5,
                borderRadius: 8,
                backgroundColor: mantraRated === 'disliked' ? 'rgba(192,57,43,0.2)' : 'transparent',
              }}
            >
              <ThumbsDown size={13} color={mantraRated === 'disliked' ? theme.danger : theme.muted} />
            </Pressable>
          </View>
        </View>
        <Text className="text-white text-base leading-6">{mantra}</Text>
        {mantraRated === 'liked' && (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Text style={{ color: theme.success, fontSize: 11, marginTop: 6, fontWeight: '700' }}>
              ✓ Noted — AI will generate more like this
            </Text>
          </MotiView>
        )}
        {mantraRated === 'disliked' && (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Text style={{ color: theme.muted, fontSize: 11, marginTop: 6 }}>
              Understood — AI will shift styles for you
            </Text>
          </MotiView>
        )}
      </View>

      {/* Streak incentive bar */}
      <StreakIncentiveBar />

      {/* ─── Modals ─── */}
      <DangerMode isOpen={showDanger} onClose={() => setShowDanger(false)} />

      <PostFallProtocol isOpen={showFall} onClose={() => setShowFall(false)} />

      {showEmergency && (
        <EmergencyCountdown
          appName="Pause"
          onComplete={() => setShowEmergency(false)}
          onCancel={() => setShowEmergency(false)}
        />
      )}

      {milestoneToCelebrate && (
        <MilestoneCelebration
          day={milestoneToCelebrate}
          onClose={() => setMilestoneToCelebrate(null)}
        />
      )}

      <CheckInModal />
      <PanicButton />
    </Screen>
  );
};
