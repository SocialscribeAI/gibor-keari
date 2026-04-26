import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { ArrowLeft, Plus, Trash2, Smartphone, Info } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';

interface Props {
  onBack?: () => void;
}

const validateTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

export const RiskyAppsSettings: React.FC<Props> = ({ onBack }) => {
  const { riskyApps, addRiskyApp, removeRiskyApp } = useStore();
  const theme = useTheme();
  const [name, setName] = useState('');
  const [start, setStart] = useState('22:00');
  const [end, setEnd] = useState('06:00');

  const handleAdd = () => {
    if (!name.trim() || !validateTime(start) || !validateTime(end)) return;
    addRiskyApp({ name: name.trim(), quietStart: start, quietEnd: end });
    setName('');
  };

  return (
    <Screen>
      <View className="flex-row items-center mb-6">
        {onBack && (
          <Pressable onPress={onBack} className="w-10 h-10 rounded-xl bg-guard-surface items-center justify-center mr-3">
            <ArrowLeft size={18} color={theme.text} />
          </Pressable>
        )}
        <Text className="text-2xl font-black text-white">Risky Apps</Text>
      </View>

      <View className="bg-guard-primary/10 border border-guard-primary/30 rounded-3xl p-5 mb-6 flex-row">
        <Info size={16} color={theme.accent} />
        <Text className="text-white/70 text-xs leading-5 ml-3 flex-1">
          Currently sends scheduled reminders during quiet hours. Real-time app blocking is coming in a future
          update (requires Android accessibility permission).
        </Text>
      </View>

      <View className="bg-guard-surface border border-guard-primary/30 rounded-3xl p-5 mb-6">
        <Text className="text-guard-accent text-xs uppercase tracking-widest mb-3">Add app</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="App name (e.g. Instagram)"
          placeholderTextColor={theme.textDim}
          className="bg-guard-bg border border-guard-primary/30 rounded-2xl px-4 py-3 text-white mb-3"
        />
        <View className="flex-row gap-2 mb-3">
          <View className="flex-1">
            <Text className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Quiet start</Text>
            <TextInput
              value={start}
              onChangeText={setStart}
              maxLength={5}
              className="bg-guard-bg border border-guard-primary/30 rounded-2xl px-4 py-3 text-white font-black"
            />
          </View>
          <View className="flex-1">
            <Text className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Quiet end</Text>
            <TextInput
              value={end}
              onChangeText={setEnd}
              maxLength={5}
              className="bg-guard-bg border border-guard-primary/30 rounded-2xl px-4 py-3 text-white font-black"
            />
          </View>
        </View>
        <Pressable
          onPress={handleAdd}
          disabled={!name.trim() || !validateTime(start) || !validateTime(end)}
          className={`py-3 rounded-2xl flex-row items-center justify-center ${
            name.trim() && validateTime(start) && validateTime(end) ? 'bg-guard-accent' : 'bg-white/5'
          }`}
        >
          <Plus size={16} color={name.trim() && validateTime(start) && validateTime(end) ? '#0F1120' : 'rgba(255,255,255,0.3)'} />
          <Text
            className={`ml-2 font-black uppercase ${
              name.trim() && validateTime(start) && validateTime(end) ? 'text-guard-on-accent' : 'text-white/30'
            }`}
          >
            Add
          </Text>
        </Pressable>
      </View>

      {riskyApps.length === 0 ? (
        <Text className="text-white/40 text-center text-sm mt-4">No risky apps added yet.</Text>
      ) : (
        riskyApps.map((a) => (
          <View
            key={a.id}
            className="bg-guard-surface border border-guard-primary/30 rounded-2xl p-4 mb-2 flex-row items-center"
          >
            <View className="w-10 h-10 rounded-xl bg-guard-primary/10 items-center justify-center mr-3">
              <Smartphone size={16} color="#E8A020" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold">{a.name}</Text>
              <Text className="text-white/50 text-xs">
                Quiet: {a.quietStart} – {a.quietEnd}
              </Text>
            </View>
            <Pressable
              onPress={() => removeRiskyApp(a.id)}
              className="w-9 h-9 rounded-xl bg-guard-danger/10 items-center justify-center"
            >
              <Trash2 size={14} color="#C0392B" />
            </Pressable>
          </View>
        ))
      )}
    </Screen>
  );
};
