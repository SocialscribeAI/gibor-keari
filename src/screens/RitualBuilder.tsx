import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert } from 'react-native';
import { MotiView } from 'moti';
import { ArrowLeft, Plus, ChevronUp, ChevronDown, Check, Play, Trash2 } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';

interface Props {
  onBack: () => void;
}

export const RitualBuilder: React.FC<Props> = ({ onBack }) => {
  const { rituals, addRitual, toggleRitual, reorderRituals, completeRitual, ritualStreak } = useStore();
  const theme = useTheme();
  const [draft, setDraft] = useState('');
  const [flowStep, setFlowStep] = useState<number | null>(null);
  const enabled = rituals.filter((r) => r.enabled);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...rituals];
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= next.length) return;
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    reorderRituals(next);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove ritual?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => reorderRituals(rituals.filter((r) => r.id !== id)),
      },
    ]);
  };

  const handleAdd = () => {
    const text = draft.trim();
    if (!text) return;
    addRitual(text);
    setDraft('');
  };

  const startFlow = () => {
    if (enabled.length === 0) {
      Alert.alert('No rituals', 'Enable at least one ritual first.');
      return;
    }
    setFlowStep(0);
  };

  const nextFlow = () => {
    if (flowStep === null) return;
    if (flowStep + 1 >= enabled.length) {
      completeRitual();
      setFlowStep(null);
      Alert.alert('Complete', `Morning ritual done. Streak: ${ritualStreak + 1}`);
    } else {
      setFlowStep(flowStep + 1);
    }
  };

  if (flowStep !== null) {
    const progress = ((flowStep + 1) / enabled.length) * 100;
    return (
      <Screen>
        <View className="flex-row items-center justify-between mb-8">
          <Text className="text-guard-accent text-xs uppercase tracking-widest">
            Step {flowStep + 1} of {enabled.length}
          </Text>
          <Pressable onPress={() => setFlowStep(null)}>
            <Text className="text-white/50 text-xs">Exit</Text>
          </Pressable>
        </View>

        <View className="h-1 bg-white/10 rounded-full mb-12">
          <MotiView
            animate={{ width: `${progress}%` as any }}
            transition={{ type: 'timing', duration: 300 }}
            className="h-full bg-guard-accent rounded-full"
          />
        </View>

        <View className="flex-1 items-center justify-center">
          <Text className="text-4xl font-black text-white text-center leading-tight">
            {enabled[flowStep].text}
          </Text>
        </View>

        <Pressable
          onPress={nextFlow}
          className="py-5 rounded-2xl bg-guard-accent flex-row items-center justify-center"
        >
          <Check size={20} color={theme.onAccent} />
          <Text className="ml-2 font-black uppercase tracking-widest text-guard-on-accent">
            {flowStep + 1 >= enabled.length ? 'Finish' : 'Done — Next'}
          </Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-row items-center mb-6">
        <Pressable onPress={onBack} className="w-10 h-10 rounded-xl bg-guard-surface items-center justify-center mr-3">
          <ArrowLeft size={18} color={theme.text} />
        </Pressable>
        <Text className="text-2xl font-black text-white">Morning Ritual</Text>
      </View>

      <View className="bg-guard-primary/10 border border-guard-primary/30 rounded-3xl p-5 mb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-white/50 text-xs uppercase tracking-widest">Ritual streak</Text>
          <Text className="text-white text-3xl font-black">{ritualStreak}</Text>
        </View>
        <Pressable onPress={startFlow} className="bg-guard-accent px-5 py-3 rounded-2xl flex-row items-center">
          <Play size={14} color={theme.onAccent} />
          <Text className="ml-2 font-black uppercase text-guard-on-accent">Start</Text>
        </Pressable>
      </View>

      <View className="bg-guard-surface border border-guard-primary/30 rounded-3xl p-5 mb-6">
        <Text className="text-guard-accent text-xs uppercase tracking-widest mb-3">Add step</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="e.g. Drink a glass of water"
          placeholderTextColor={theme.textDim}
          className="bg-guard-bg border border-guard-primary/30 rounded-2xl px-4 py-3 text-white mb-3"
        />
        <Pressable
          onPress={handleAdd}
          disabled={!draft.trim()}
          className={`py-3 rounded-2xl flex-row items-center justify-center ${
            draft.trim() ? 'bg-guard-accent' : 'bg-white/5'
          }`}
        >
          <Plus size={16} color={draft.trim() ? theme.onAccent : theme.textDim} />
          <Text className={`ml-2 font-black uppercase ${draft.trim() ? 'text-guard-on-accent' : 'text-white/30'}`}>
            Add
          </Text>
        </Pressable>
      </View>

      {rituals.map((r, i) => (
        <View
          key={r.id}
          className="bg-guard-surface border border-guard-primary/30 rounded-2xl p-3 mb-2 flex-row items-center"
        >
          <View className="flex-col mr-2">
            <Pressable onPress={() => move(i, -1)} className="p-1">
              <ChevronUp size={14} color={theme.textDim} />
            </Pressable>
            <Pressable onPress={() => move(i, 1)} className="p-1">
              <ChevronDown size={14} color={theme.textDim} />
            </Pressable>
          </View>
          <Pressable
            onPress={() => toggleRitual(r.id)}
            className={`w-6 h-6 rounded-lg mr-3 items-center justify-center ${
              r.enabled ? 'bg-guard-accent' : 'bg-white/10'
            }`}
          >
            {r.enabled && <Check size={14} color={theme.onAccent} />}
          </Pressable>
          <Text className={`flex-1 ${r.enabled ? 'text-white' : 'text-white/40'}`}>{r.text}</Text>
          <Pressable onPress={() => handleDelete(r.id)} className="p-2">
            <Trash2 size={14} color={theme.danger} />
          </Pressable>
        </View>
      ))}
    </Screen>
  );
};
