import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { ArrowLeft, Plus, Star, Trash2, Sparkles, Check, X } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';
import { generateMantras, type MantraSuggestion } from '../services/aiActions';
import { isAiConfigured } from '../services/aiService';

interface Props {
  onBack: () => void;
}

export const MantraBuilder: React.FC<Props> = ({ onBack }) => {
  const {
    mantras,
    dailyMantraIndex,
    addMantra,
    deleteMantra,
    setDailyMantra,
    personalityProfile,
    aiProvider,
    aiApiKey,
    aiModel,
    aiCustomEndpoint,
  } = useStore();
  const theme = useTheme();
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<MantraSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const aiCfg = useMemo(
    () => ({
      provider: aiProvider,
      apiKey: aiApiKey,
      model: aiModel,
      customEndpoint: aiCustomEndpoint,
    }),
    [aiProvider, aiApiKey, aiModel, aiCustomEndpoint],
  );

  const handleAdd = () => {
    const text = draft.trim();
    if (!text) return;
    addMantra(text);
    setDraft('');
  };

  const handleAskAI = async () => {
    if (!isAiConfigured(aiCfg)) {
      Alert.alert('AI not configured', 'Profile → AI coach → Groq (free).');
      return;
    }
    setError(null);
    setLoading(true);
    setSuggestions([]);
    const res = await generateMantras(aiCfg, personalityProfile, draft.trim() || undefined);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSuggestions(res.data);
  };

  const acceptSuggestion = (s: MantraSuggestion) => {
    const text = s.source ? `${s.text}\n— ${s.source}` : s.text;
    addMantra(text);
    setSuggestions((prev) => prev.filter((x) => x !== s));
  };

  const dismissSuggestion = (s: MantraSuggestion) => {
    setSuggestions((prev) => prev.filter((x) => x !== s));
  };

  const handleDelete = (index: number) => {
    Alert.alert('Delete mantra?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMantra(index) },
    ]);
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center mb-6">
        <Pressable onPress={onBack} className="w-10 h-10 rounded-xl bg-guard-surface items-center justify-center mr-3">
          <ArrowLeft size={18} color={theme.text} />
        </Pressable>
        <Text className="text-2xl font-black text-white">Mantras</Text>
      </View>

      <View className="bg-guard-surface border border-guard-primary/30 rounded-3xl p-5 mb-4">
        <Text className="text-guard-accent text-xs uppercase tracking-widest mb-3">Add New</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a mantra — or a seed theme for AI…"
          placeholderTextColor={theme.textDim}
          multiline
          className="bg-guard-bg border border-guard-primary/30 rounded-2xl px-4 py-3 text-white mb-3 min-h-[60px]"
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={handleAdd}
            disabled={!draft.trim()}
            className={`flex-1 py-3 rounded-2xl flex-row items-center justify-center ${
              draft.trim() ? 'bg-guard-accent' : 'bg-white/5'
            }`}
          >
            <Plus size={16} color={draft.trim() ? '#0F1120' : 'rgba(255,255,255,0.3)'} />
            <Text className={`ml-2 font-black uppercase ${draft.trim() ? 'text-guard-on-accent' : 'text-white/30'}`}>
              Add
            </Text>
          </Pressable>
          <Pressable
            onPress={handleAskAI}
            disabled={loading}
            className="py-3 px-4 rounded-2xl flex-row items-center justify-center"
            style={{
              backgroundColor: theme.surface2,
              borderWidth: 1,
              borderColor: theme.accent,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Sparkles size={14} color={theme.accent} />
            )}
            <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginLeft: 6 }}>
              AI: GENERATE 5
            </Text>
          </Pressable>
        </View>
      </View>

      {error && (
        <View
          style={{
            backgroundColor: theme.danger + '15',
            borderWidth: 1,
            borderColor: theme.danger + '50',
            borderRadius: 10,
            padding: 10,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: theme.danger, fontSize: 12 }}>{error}</Text>
        </View>
      )}

      {suggestions.length > 0 && (
        <View style={{ marginBottom: 18 }}>
          <Text className="text-guard-accent text-xs uppercase tracking-widest mb-2">
            AI Suggestions — review & add
          </Text>
          {suggestions.map((s, i) => (
            <View
              key={i}
              style={{
                backgroundColor: theme.accent + '12',
                borderColor: theme.accent + '60',
                borderWidth: 1,
                borderRadius: 14,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20, marginBottom: 4 }}>
                {s.text}
              </Text>
              {s.source && (
                <Text style={{ color: theme.muted, fontSize: 11, fontStyle: 'italic', marginBottom: 8 }}>
                  — {s.source}
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => acceptSuggestion(s)}
                  style={{
                    flex: 1,
                    backgroundColor: theme.accent,
                    paddingVertical: 8,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Check size={13} color={theme.onAccent} />
                  <Text style={{ color: theme.onAccent, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
                    ADD
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => dismissSuggestion(s)}
                  style={{
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: theme.hairline,
                  }}
                >
                  <X size={13} color={theme.muted} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text className="text-guard-accent text-xs uppercase tracking-widest mb-3">Your Mantras</Text>
      {mantras.map((m, i) => {
        const isDaily = dailyMantraIndex === i;
        return (
          <View
            key={`${i}-${m.slice(0, 8)}`}
            className={`bg-guard-surface border rounded-2xl p-4 mb-2 ${
              isDaily ? 'border-guard-accent' : 'border-guard-primary/30'
            }`}
          >
            <Text className="text-white leading-6 mb-3">{m}</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setDailyMantra(i)}
                disabled={isDaily}
                className={`flex-1 py-2 rounded-xl flex-row items-center justify-center ${
                  isDaily ? 'bg-guard-accent/20' : 'bg-white/5'
                }`}
              >
                <Star size={12} color={isDaily ? '#E8A020' : 'white'} />
                <Text
                  className={`text-xs ml-2 font-bold uppercase ${
                    isDaily ? 'text-guard-accent' : 'text-white'
                  }`}
                >
                  {isDaily ? 'Daily' : 'Set daily'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleDelete(i)}
                className="w-10 h-10 rounded-xl bg-guard-danger/10 items-center justify-center"
              >
                <Trash2 size={14} color="#C0392B" />
              </Pressable>
            </View>
          </View>
        );
      })}
      </ScrollView>
    </Screen>
  );
};
