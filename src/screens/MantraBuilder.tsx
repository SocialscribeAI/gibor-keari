import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { ArrowLeft, Plus, Star, Trash2, Sparkles, Check, X, ThumbsUp, ThumbsDown, Library } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';
import { generateMantras, type MantraSuggestion } from '../services/aiActions';
import { isAiConfigured } from '../services/aiService';
import {
  filterMantraLibrary,
  CATEGORY_LABELS,
  type MantraCategory,
  type MantraEntry,
} from '../constants/mantraLibrary';

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
    likeMantra,
    dislikeMantra,
    coachStylePrefs,
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
  const [libraryOpen, setLibraryOpen] = useState(false);

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
    const res = await generateMantras(aiCfg, personalityProfile, draft.trim() || undefined, coachStylePrefs);
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

      <Pressable
        onPress={() => setLibraryOpen(true)}
        className="flex-row items-center justify-center mb-4 py-4 rounded-3xl"
        style={{
          backgroundColor: 'rgba(232,160,32,0.10)',
          borderWidth: 1,
          borderColor: 'rgba(232,160,32,0.40)',
        }}
      >
        <Library size={16} color={theme.accent} />
        <Text className="font-black uppercase ml-2 text-xs" style={{ color: theme.accent, letterSpacing: 2 }}>
          Browse the library
        </Text>
      </Pressable>

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
            <Plus size={16} color={draft.trim() ? theme.onAccent : theme.muted} />
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
        const isLiked = coachStylePrefs.likedMantraTexts.includes(m);
        const isDisliked = coachStylePrefs.dislikedMantraTexts.includes(m);
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
              {/* Resonance rating — feeds AI mantra generation */}
              <Pressable
                onPress={() => likeMantra(m)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: isLiked ? 'rgba(30,138,74,0.2)' : theme.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isLiked ? 'rgba(30,138,74,0.5)' : theme.hairline,
                }}
              >
                <ThumbsUp size={13} color={isLiked ? '#1E8A4A' : theme.muted} />
              </Pressable>
              <Pressable
                onPress={() => dislikeMantra(m)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: isDisliked ? 'rgba(192,57,43,0.15)' : theme.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDisliked ? 'rgba(192,57,43,0.4)' : theme.hairline,
                }}
              >
                <ThumbsDown size={13} color={isDisliked ? '#C0392B' : theme.muted} />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(i)}
                className="w-9 h-9 rounded-xl bg-guard-danger/10 items-center justify-center"
              >
                <Trash2 size={13} color="#C0392B" />
              </Pressable>
            </View>
          </View>
        );
      })}
      </ScrollView>

      <MantraLibraryModal
        visible={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        existingMantras={mantras}
        onPick={(entry) => {
          const formatted = entry.source ? `${entry.text}\n— ${entry.source}` : entry.text;
          addMantra(formatted);
        }}
        religiousLevel={personalityProfile.religiousLevel}
        intensity={personalityProfile.intensity}
      />
    </Screen>
  );
};

// =============================================================================
// MantraLibraryModal — browses the curated library, filtered by profile.
// =============================================================================

interface LibraryModalProps {
  visible: boolean;
  onClose: () => void;
  existingMantras: string[];
  onPick: (entry: MantraEntry) => void;
  religiousLevel: any;
  intensity: any;
}

const MantraLibraryModal: React.FC<LibraryModalProps> = ({
  visible,
  onClose,
  existingMantras,
  onPick,
  religiousLevel,
  intensity,
}) => {
  const theme = useTheme();
  const [category, setCategory] = useState<MantraCategory | null>(null);

  const filtered = useMemo(() => {
    const set = category ? new Set<MantraCategory>([category]) : undefined;
    return filterMantraLibrary(religiousLevel, intensity, set);
  }, [religiousLevel, intensity, category]);

  // Determine which categories actually have results so we don't show empty
  // filter chips.
  const availableCategories = useMemo(() => {
    const baseline = filterMantraLibrary(religiousLevel, intensity);
    const set = new Set<MantraCategory>();
    for (const m of baseline) set.add(m.category);
    return Array.from(set);
  }, [religiousLevel, intensity]);

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <Text style={{ flex: 1, color: theme.text, fontSize: 20, fontWeight: '900' }}>
            Mantra library
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: theme.surface2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} color={theme.text} />
          </Pressable>
        </View>

        <Text style={{ paddingHorizontal: 20, color: theme.muted, fontSize: 12, lineHeight: 18, marginBottom: 10 }}>
          {filtered.length} entries matching your profile. Tap one to add it to your collection.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}
        >
          <Pressable
            onPress={() => setCategory(null)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: category === null ? theme.accent : theme.surface,
              borderWidth: 1,
              borderColor: category === null ? theme.accent : theme.hairline,
              marginRight: 6,
            }}
          >
            <Text
              style={{
                color: category === null ? theme.onAccent : theme.text,
                fontWeight: '900',
                fontSize: 12,
              }}
            >
              All
            </Text>
          </Pressable>
          {availableCategories.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: category === c ? theme.accent : theme.surface,
                borderWidth: 1,
                borderColor: category === c ? theme.accent : theme.hairline,
                marginRight: 6,
              }}
            >
              <Text
                style={{
                  color: category === c ? theme.onAccent : theme.text,
                  fontWeight: '900',
                  fontSize: 12,
                }}
              >
                {CATEGORY_LABELS[c]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 40 }}>
          {filtered.map((entry, i) => {
            const formatted = entry.source ? `${entry.text}\n— ${entry.source}` : entry.text;
            const already = existingMantras.includes(formatted);
            return (
              <View
                key={i}
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.hairline,
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: theme.text, fontSize: 14, lineHeight: 21, marginBottom: 6 }}>
                  {entry.text}
                </Text>
                <Text style={{ color: theme.muted, fontSize: 11, fontStyle: 'italic', marginBottom: 10 }}>
                  — {entry.source}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 999,
                      backgroundColor: theme.surface2,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.muted,
                        fontWeight: '700',
                        fontSize: 9,
                        letterSpacing: 1,
                      }}
                    >
                      {CATEGORY_LABELS[entry.category].toUpperCase()}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => onPick(entry)}
                    disabled={already}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: already ? theme.surface2 : theme.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 5,
                    }}
                  >
                    {already ? (
                      <>
                        <Check size={12} color={theme.muted} />
                        <Text
                          style={{
                            color: theme.muted,
                            fontWeight: '900',
                            fontSize: 11,
                            letterSpacing: 1,
                          }}
                        >
                          ALREADY ADDED
                        </Text>
                      </>
                    ) : (
                      <>
                        <Plus size={12} color={theme.onAccent} />
                        <Text
                          style={{
                            color: theme.onAccent,
                            fontWeight: '900',
                            fontSize: 11,
                            letterSpacing: 1,
                          }}
                        >
                          ADD
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })}
          {filtered.length === 0 && (
            <Text style={{ color: theme.muted, textAlign: 'center', padding: 24 }}>
              No entries match those filters. Try removing the category filter.
            </Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};
