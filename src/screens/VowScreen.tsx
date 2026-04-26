import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { Gift, ArrowRight } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';

export const VowScreen: React.FC = () => {
  const { vows, setVow, startStreak } = useStore();
  const [day7, setDay7] = useState(vows[7] || '');
  const [day30, setDay30] = useState(vows[30] || '');
  const [day90, setDay90] = useState(vows[90] || '');

  const canCommit = day7.trim().length > 0 && day30.trim().length > 0 && day90.trim().length > 0;

  const commit = () => {
    if (!canCommit) return;
    setVow(7, day7.trim());
    setVow(30, day30.trim());
    setVow(90, day90.trim());
    startStreak();
  };

  const Row = ({ label, value, onChange, placeholder }: any) => (
    <View className="mb-5">
      <Text className="text-guard-accent text-xs font-black uppercase mb-2 tracking-widest">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
        className="bg-guard-surface border border-guard-primary/30 rounded-2xl px-5 py-4 text-white text-base"
        multiline
      />
    </View>
  );

  return (
    <Screen>
      <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <View className="w-16 h-16 rounded-2xl bg-guard-accent/10 border border-guard-accent/30 items-center justify-center mb-6">
          <Gift size={32} color="#E8A020" />
        </View>
        <Text className="text-3xl font-black text-white mb-3">Your Vow</Text>
        <Text className="text-white/60 leading-6">
          Before you begin, commit to what you'll earn. Rewards you promise yourself — in writing — at the 7,
          30, and 90-day marks.
        </Text>
      </MotiView>

      <Row label="Day 7 Reward" value={day7} onChange={setDay7} placeholder="e.g. Buy that book I wanted" />
      <Row label="Day 30 Reward" value={day30} onChange={setDay30} placeholder="e.g. A nice dinner out" />
      <Row label="Day 90 Reward" value={day90} onChange={setDay90} placeholder="e.g. Weekend trip" />

      <Pressable
        onPress={commit}
        disabled={!canCommit}
        className={`mt-4 py-5 rounded-2xl flex-row items-center justify-center ${
          canCommit ? 'bg-guard-accent' : 'bg-white/5'
        }`}
      >
        <Text className={`font-black uppercase tracking-widest mr-2 ${canCommit ? 'text-guard-on-accent' : 'text-white/30'}`}>
          Commit & Start Day 1
        </Text>
        <ArrowRight size={20} color={canCommit ? '#0F1120' : 'rgba(255,255,255,0.3)'} />
      </Pressable>
    </Screen>
  );
};
