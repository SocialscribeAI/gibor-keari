import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  Sparkles,
  Wind,
  Brain,
  Phone,
  Users,
  Heart,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import { useStore, type TacticCategory } from '../store/useStore';
import {
  suggestTactics,
  summarizeRecentTriggers,
  type TacticSuggestion,
} from '../services/aiActions';
import { isAiConfigured } from '../services/aiService';

// =============================================================================
// TacticsSettingsScreen — the "tactics for the next urge" live here now, not
// under Learn. Users can pick from built-ins, add their own, or ask AI for
// suggestions based on their pattern.
// =============================================================================

interface BuiltinTactic {
  id: string;
  title: string;
  desc: string;
  category: TacticCategory;
}

const BUILTINS: BuiltinTactic[] = [
  { id: 'cold-shower', title: 'Cold Shower', desc: 'Shock your nervous system. Breaks the loop.', category: 'body' },
  { id: 'ten-pushups', title: '10 Pushups', desc: 'Redirect urge energy into physical work.', category: 'body' },
  { id: 'call-friend', title: 'Call Someone', desc: 'Say it out loud to another human.', category: 'social' },
  { id: 'mantra', title: 'Repeat Your Mantra', desc: 'Out loud. Three times. Slowly.', category: 'mind' },
  { id: 'walk', title: 'Walk Outside', desc: 'Change your physical environment.', category: 'body' },
  { id: 'breathing', title: '4-7-8 Breathing', desc: 'Four in, hold seven, out for eight.', category: 'mind' },
  { id: 'accountability', title: 'Text Partner', desc: "Tell them you're struggling. Right now.", category: 'social' },
  { id: 'journal', title: 'Journal the Trigger', desc: 'Write what caused it. Patterns emerge.', category: 'mind' },
  { id: 'shema', title: 'Shema', desc: 'Say it with intention right now.', category: 'spirit' },
  { id: 'tehillim', title: 'Tehillim 51', desc: "David's prayer after his fall.", category: 'spirit' },
  { id: 'shmirat-einayim', title: 'Shmirat Einayim', desc: 'Close your eyes for 60 seconds.', category: 'spirit' },
  { id: 'tzedakah', title: 'Give Tzedakah', desc: 'Even a dollar. Break the ego.', category: 'spirit' },
];

const CATEGORY_ICON: Record<TacticCategory, any> = {
  body: Wind,
  mind: Brain,
  social: Phone,
  spirit: Heart,
};

const CATEGORIES: TacticCategory[] = ['body', 'mind', 'social', 'spirit'];

interface Props {
  onBack?: () => void;
}

export const TacticsSettingsScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const {
    toolkit,
    toggleTacticToToolkit,
    customTactics,
    addCustomTactic,
    removeCustomTactic,
    personalityProfile,
    fallEvents,
    closeCallEvents,
    checkInEvents,
    aiProvider,
    aiApiKey,
    aiModel,
    aiCustomEndpoint,
  } = useStore();

  const aiCfg = useMemo(
    () => ({
      provider: aiProvider,
      apiKey: aiApiKey,
      model: aiModel,
      customEndpoint: aiCustomEndpoint,
    }),
    [aiProvider, aiApiKey, aiModel, aiCustomEndpoint],
  );

  const [draftTitle, setDraftTitle] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftCat, setDraftCat] = useState<TacticCategory>('body');

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TacticSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const title = draftTitle.trim();
    const desc = draftDesc.trim();
    if (!title || !desc) return;
    addCustomTactic({ title, desc, category: draftCat, source: 'user' });
    setDraftTitle('');
    setDraftDesc('');
  };

  const handleAskAI = async () => {
    setError(null);
    if (!isAiConfigured(aiCfg)) {
      Alert.alert(
        'AI not configured',
        'Open Settings → AI coach and pick a provider (Groq is free).',
      );
      return;
    }
    setLoading(true);
    setSuggestions([]);
    const summary = summarizeRecentTriggers(fallEvents, closeCallEvents, checkInEvents);
    const res = await suggestTactics(aiCfg, personalityProfile, summary);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSuggestions(res.data);
  };

  const acceptSuggestion = (s: TacticSuggestion) => {
    addCustomTactic({
      title: s.title,
      desc: s.desc,
      category: s.category,
      timeNeeded: s.timeNeeded,
      source: 'ai',
    });
    setSuggestions((prev) => prev.filter((x) => x !== s));
  };

  const dismissSuggestion = (s: TacticSuggestion) => {
    setSuggestions((prev) => prev.filter((x) => x !== s));
  };

  const renderTacticRow = (t: {
    id: string;
    title: string;
    desc: string;
    category: TacticCategory;
    timeNeeded?: string;
    source?: string;
    onDelete?: () => void;
  }) => {
    const Icon = CATEGORY_ICON[t.category];
    const inToolkit = toolkit.includes(t.id);
    return (
      <View
        key={t.id}
        style={{
          backgroundColor: theme.surface,
          borderColor: inToolkit ? theme.accent : theme.hairline,
          borderWidth: 1,
          borderRadius: 16,
          padding: 14,
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.accent + '20',
            }}
          >
            <Icon size={15} color={theme.accent} />
          </View>
          <Text style={{ flex: 1, color: theme.text, fontWeight: '800', fontSize: 15 }}>
            {t.title}
          </Text>
          {t.source === 'ai' && (
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                backgroundColor: theme.accent + '30',
              }}
            >
              <Text style={{ color: theme.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>
                AI
              </Text>
            </View>
          )}
        </View>
        <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 18, marginBottom: 10 }}>
          {t.desc}
          {t.timeNeeded ? `  ·  ${t.timeNeeded}` : ''}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => toggleTacticToToolkit(t.id)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: inToolkit ? theme.success + '25' : 'transparent',
              borderWidth: 1,
              borderColor: inToolkit ? theme.success : theme.hairline,
            }}
          >
            {inToolkit ? (
              <Check size={12} color={theme.success} />
            ) : (
              <Plus size={12} color={theme.text} />
            )}
            <Text
              style={{
                color: inToolkit ? theme.success : theme.text,
                fontSize: 11,
                fontWeight: '800',
                letterSpacing: 1,
              }}
            >
              {inToolkit ? 'IN TOOLKIT' : 'ADD TO TOOLKIT'}
            </Text>
          </Pressable>
          {t.onDelete && (
            <Pressable
              onPress={t.onDelete}
              style={{
                paddingHorizontal: 12,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: theme.hairline,
              }}
            >
              <Trash2 size={14} color={theme.danger} />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          {onBack && (
            <Pressable
              onPress={onBack}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: theme.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <ArrowLeft size={18} color={theme.text} />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: theme.text }}>
              Tactics for the next urge
            </Text>
            <Text style={{ color: theme.muted, fontSize: 12 }}>
              Build your personal toolkit. Add your own or get AI suggestions.
            </Text>
          </View>
        </View>

        {/* AI suggestions */}
        <Pressable
          onPress={handleAskAI}
          disabled={loading}
          style={{
            backgroundColor: theme.accent,
            paddingVertical: 12,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 14,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.onAccent} />
          ) : (
            <Sparkles size={15} color={theme.onAccent} />
          )}
          <Text style={{ color: theme.onAccent, fontWeight: '800', fontSize: 14 }}>
            {loading ? 'Thinking…' : 'Get AI suggestions'}
          </Text>
        </Pressable>

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
            <Text
              style={{
                color: theme.accent,
                fontSize: 10,
                letterSpacing: 2,
                fontWeight: '800',
                marginBottom: 8,
              }}
            >
              AI SUGGESTIONS — REVIEW & ADD
            </Text>
            {suggestions.map((s, i) => {
              const Icon = CATEGORY_ICON[s.category] ?? Brain;
              return (
                <View
                  key={i}
                  style={{
                    backgroundColor: theme.accent + '10',
                    borderColor: theme.accent + '70',
                    borderWidth: 1,
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Icon size={15} color={theme.accent} />
                    <Text style={{ flex: 1, color: theme.text, fontWeight: '800', fontSize: 15 }}>
                      {s.title}
                    </Text>
                  </View>
                  <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 18, marginBottom: 10 }}>
                    {s.desc}
                    {s.timeNeeded ? `  ·  ${s.timeNeeded}` : ''}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => acceptSuggestion(s)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6,
                        backgroundColor: theme.accent,
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
                      <Text style={{ color: theme.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                        SKIP
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Add your own */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.hairline,
            borderRadius: 16,
            padding: 14,
            marginBottom: 18,
          }}
        >
          <Text
            style={{
              color: theme.accent,
              fontSize: 10,
              letterSpacing: 2,
              fontWeight: '800',
              marginBottom: 10,
            }}
          >
            ADD YOUR OWN
          </Text>
          <TextInput
            value={draftTitle}
            onChangeText={setDraftTitle}
            placeholder="Title (e.g. Splash cold water on face)"
            placeholderTextColor={theme.textDim}
            style={{
              backgroundColor: theme.bg,
              color: theme.text,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: theme.hairline,
              marginBottom: 8,
              fontSize: 14,
            }}
          />
          <TextInput
            value={draftDesc}
            onChangeText={setDraftDesc}
            placeholder="How it works (one sentence)"
            placeholderTextColor={theme.textDim}
            multiline
            style={{
              backgroundColor: theme.bg,
              color: theme.text,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: theme.hairline,
              marginBottom: 10,
              fontSize: 14,
              minHeight: 60,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
            {CATEGORIES.map((c) => {
              const active = draftCat === c;
              const Icon = CATEGORY_ICON[c];
              return (
                <Pressable
                  key={c}
                  onPress={() => setDraftCat(c)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 4,
                    backgroundColor: active ? theme.accent : 'transparent',
                    borderWidth: 1,
                    borderColor: active ? theme.accent : theme.hairline,
                  }}
                >
                  <Icon size={11} color={active ? theme.onAccent : theme.muted} />
                  <Text
                    style={{
                      color: active ? theme.onAccent : theme.muted,
                      fontSize: 10,
                      fontWeight: '800',
                      letterSpacing: 1,
                    }}
                  >
                    {c.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={handleAdd}
            disabled={!draftTitle.trim() || !draftDesc.trim()}
            style={{
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              backgroundColor: draftTitle.trim() && draftDesc.trim() ? theme.accent : theme.surface2,
              opacity: draftTitle.trim() && draftDesc.trim() ? 1 : 0.5,
            }}
          >
            <Plus size={14} color={draftTitle.trim() && draftDesc.trim() ? theme.onAccent : theme.muted} />
            <Text
              style={{
                color: draftTitle.trim() && draftDesc.trim() ? theme.onAccent : theme.muted,
                fontWeight: '800',
                fontSize: 12,
                letterSpacing: 1,
              }}
            >
              ADD TACTIC
            </Text>
          </Pressable>
        </View>

        {/* Custom tactics list */}
        {customTactics.length > 0 && (
          <>
            <Text
              style={{
                color: theme.accent,
                fontSize: 10,
                letterSpacing: 2,
                fontWeight: '800',
                marginBottom: 8,
              }}
            >
              YOUR TACTICS ({customTactics.length})
            </Text>
            {customTactics.map((t) =>
              renderTacticRow({
                ...t,
                onDelete: () =>
                  Alert.alert('Delete tactic?', t.title, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => removeCustomTactic(t.id),
                    },
                  ]),
              }),
            )}
          </>
        )}

        {/* Built-ins */}
        <Text
          style={{
            color: theme.accent,
            fontSize: 10,
            letterSpacing: 2,
            fontWeight: '800',
            marginBottom: 8,
            marginTop: 4,
          }}
        >
          BUILT-IN TACTICS
        </Text>
        {BUILTINS.map((t) => renderTacticRow(t))}
      </ScrollView>
    </Screen>
  );
};
