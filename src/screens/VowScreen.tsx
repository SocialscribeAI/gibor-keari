import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { Crown, ArrowRight, Sparkles } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';

// =============================================================================
// King's Reward — the milestone bli-neder reward ladder.
// First-time setup. Shown when the user has no streak yet. After commit,
// `startStreak()` flips them into the main Home flow.
// =============================================================================

interface Tier {
  day: number;
  title: string;
  hint: string;
  examples: string[];
  emoji: string;
}

const TIERS: Tier[] = [
  {
    day: 7,
    title: 'A week of standing',
    emoji: '🛡️',
    hint: 'Something small but real. Not a cheat day — a celebration.',
    examples: ['that book on your list', 'a great meal out', 'a new gadget you wanted'],
  },
  {
    day: 30,
    title: 'A month of standing',
    emoji: '👑',
    hint: 'Bigger. The reward you only earn through real discipline.',
    examples: ['concert or game tickets', 'an upgrade you delayed', 'a weekend day to yourself'],
  },
  {
    day: 90,
    title: 'A king for ninety days',
    emoji: '🦁',
    hint: 'Something memorable. You will have earned it.',
    examples: ['a weekend trip', 'the watch / suit / camera', 'an experience worth telling about'],
  },
];

// Defined outside the component so TextInput keeps focus across renders
// (classic RN pitfall when an inline component remounts on every keystroke).
interface RewardCardProps {
  tier: Tier;
  value: string;
  onChange: (v: string) => void;
  filled: boolean;
}
const RewardCard: React.FC<RewardCardProps> = ({ tier, value, onChange, filled }) => (
  <View
    className={`mb-4 rounded-3xl p-5 border ${
      filled
        ? 'bg-guard-accent/10 border-guard-accent/50'
        : 'bg-guard-surface border-guard-primary/30'
    }`}
  >
    <View className="flex-row items-center mb-3">
      <Text className="text-2xl mr-2">{tier.emoji}</Text>
      <View className="flex-1">
        <Text className="text-guard-accent text-[10px] font-black uppercase tracking-widest">
          Day {tier.day}
        </Text>
        <Text className="text-white text-base font-black" style={{ fontFamily: 'Outfit' }}>
          {tier.title}
        </Text>
      </View>
    </View>
    <Text className="text-white/60 text-[12px] leading-5 mb-3">{tier.hint}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={`e.g. ${tier.examples[0]}`}
      placeholderTextColor="rgba(240,230,210,0.3)"
      className="bg-guard-bg border border-guard-primary/30 rounded-2xl px-4 py-3 text-white text-base"
      multiline
      blurOnSubmit={false}
      returnKeyType="default"
    />
    <View className="flex-row flex-wrap mt-2">
      {tier.examples.map((ex) => (
        <Pressable
          key={ex}
          onPress={() => onChange(ex)}
          className="bg-white/5 border border-guard-primary/20 rounded-full px-3 py-1 mr-2 mt-1"
        >
          <Text className="text-white/60 text-[11px]">{ex}</Text>
        </Pressable>
      ))}
    </View>
  </View>
);

export const VowScreen: React.FC = () => {
  const { vows, setVow, startStreak } = useStore();
  const theme = useTheme();
  const [day7, setDay7] = useState(vows[7] || '');
  const [day30, setDay30] = useState(vows[30] || '');
  const [day90, setDay90] = useState(vows[90] || '');

  const canCommit =
    day7.trim().length > 0 && day30.trim().length > 0 && day90.trim().length > 0;

  const commit = () => {
    if (!canCommit) return;
    setVow(7, day7.trim());
    setVow(30, day30.trim());
    setVow(90, day90.trim());
    startStreak();
  };

  const inputs = [
    { tier: TIERS[0], value: day7, onChange: setDay7 },
    { tier: TIERS[1], value: day30, onChange: setDay30 },
    { tier: TIERS[2], value: day90, onChange: setDay90 },
  ];

  return (
    <Screen scroll={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} className="mb-6 mt-2">
          <View className="w-16 h-16 rounded-2xl bg-guard-accent/15 border border-guard-accent/40 items-center justify-center mb-5">
            <Crown size={32} color={theme.accent} />
          </View>
          <Text
            className="text-3xl font-black text-white mb-2"
            style={{ fontFamily: 'Outfit' }}
          >
            A King's Reward
          </Text>
          <Text className="text-guard-accent text-[10px] font-black uppercase tracking-widest mb-3">
            בלי נדר · bli neder
          </Text>
          <Text className="text-white/70 leading-6">
            Kings reward themselves for keeping their word. Pick three rewards
            you'll give yourself when you reach Day 7, Day 30, and Day 90.
          </Text>
          <View className="flex-row items-center mt-3">
            <Sparkles size={12} color={theme.accent} />
            <Text className="text-white/50 text-[11px] ml-1.5">
              Tap a suggestion or write your own
            </Text>
          </View>
        </MotiView>

        {inputs.map(({ tier, value, onChange }) => (
          <RewardCard
            key={tier.day}
            tier={tier}
            value={value}
            onChange={onChange}
            filled={value.trim().length > 0}
          />
        ))}

        <Pressable
          onPress={commit}
          disabled={!canCommit}
          className={`mt-2 py-5 rounded-2xl flex-row items-center justify-center ${
            canCommit ? 'bg-guard-accent' : 'bg-white/5'
          }`}
        >
          <Text
            className={`font-black uppercase tracking-widest mr-2 ${
              canCommit ? 'text-guard-on-accent' : 'text-white/30'
            }`}
          >
            Crown me · Start day 1
          </Text>
          <ArrowRight size={20} color={canCommit ? theme.onAccent : 'rgba(240,230,210,0.3)'} />
        </Pressable>

        <Text className="text-white/40 text-[11px] text-center mt-4 leading-5">
          Bli neder — not a binding vow. A promise to your future self that
          your effort matters.
        </Text>
      </ScrollView>
    </Screen>
  );
};
