import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { MotiView } from 'moti';
import {
  BookOpen,
  Sparkles,
  Youtube,
  Headphones,
  FileText,
  ExternalLink,
  Lock,
  RefreshCw,
  Scroll,
  Clock,
  Zap,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';
import { isAiConfigured } from '../services/aiService';
import {
  recommendLearnContent,
  generateRecTldr,
  summarizeRecentTriggers,
  type LearnRec,
  type RecKind,
} from '../services/aiActions';

interface TimeOption {
  id: string;
  label: string;
  minutes: number;
}

const TIME_OPTIONS: TimeOption[] = [
  { id: '5', label: '5 min', minutes: 5 },
  { id: '15', label: '15 min', minutes: 15 },
  { id: '30', label: '30 min', minutes: 30 },
  { id: '60', label: '1 hr+', minutes: 90 },
];

interface TldrState {
  loading: boolean;
  text?: string;
  error?: string;
  open: boolean;
}

// =============================================================================
// Learn — AI content suggester. Pick topics, get curated videos / shiurim /
// podcasts / articles / books tailored to the user's profile and struggle.
// Tactics moved to their own tab/settings screen.
// =============================================================================

interface Topic {
  id: string;
  label: string;
  prompt: string;
  jewishOnly?: boolean;
}

const ALL_TOPICS: Topic[] = [
  { id: 'motivation', label: 'Motivation', prompt: 'motivational talks about discipline, willpower, and becoming your best self' },
  { id: 'addiction-science', label: 'Addiction Science', prompt: 'the neuroscience of porn/masturbation addiction, dopamine, and recovery' },
  { id: 'psychology', label: 'Psychology', prompt: 'psychology of compulsive behavior, triggers, shame, and behavior change' },
  { id: 'neuroscience', label: 'Neuroscience', prompt: 'how the brain rewires during abstinence, dopamine detox, prefrontal cortex recovery' },
  { id: 'testimony', label: 'Testimonies', prompt: 'personal stories of men who overcame porn/masturbation addiction' },
  { id: 'discipline', label: 'Discipline', prompt: 'building daily discipline, stoicism, habit formation' },
  // Jewish-only (filtered out for secular users)
  { id: 'mussar', label: 'Mussar', prompt: 'mussar on shmirat habrit, kedusha, yetzer hara, and self-mastery', jewishOnly: true },
  { id: 'jewish-thought', label: 'Jewish Thought', prompt: 'Jewish hashkafa on kedusha, tikkun habrit, and spiritual growth', jewishOnly: true },
  { id: 'chassidus', label: 'Chassidus', prompt: 'chassidus on overcoming the yetzer hara, tikkun, and dveikus', jewishOnly: true },
  { id: 'teshuvah', label: 'Teshuvah', prompt: 'Rav Kook, Rav Tzadok, Rambam on teshuvah after falling, getting back up', jewishOnly: true },
];

const KIND_META: Record<RecKind, { label: string; icon: any }> = {
  youtube: { label: 'YouTube', icon: Youtube },
  'torah-shiur': { label: 'Torah Shiur', icon: Scroll },
  podcast: { label: 'Podcast', icon: Headphones },
  article: { label: 'Article', icon: FileText },
  book: { label: 'Book', icon: BookOpen },
};

const ALL_KINDS: RecKind[] = ['youtube', 'torah-shiur', 'podcast', 'article', 'book'];

export const Learn: React.FC = () => {
  const theme = useTheme();
  const {
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
  const aiOn = isAiConfigured(aiCfg);

  const isJewish =
    personalityProfile.religiousLevel === 'traditional' ||
    personalityProfile.religiousLevel === 'modern-orthodox' ||
    personalityProfile.religiousLevel === 'chareidi';

  const availableTopics = useMemo(
    () => ALL_TOPICS.filter((t) => !t.jewishOnly || isJewish),
    [isJewish],
  );

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedKinds, setSelectedKinds] = useState<RecKind[]>([]);
  const [timeBudget, setTimeBudget] = useState<string | null>(null);
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<LearnRec[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tldrs, setTldrs] = useState<Record<number, TldrState>>({});

  const kindsForUser = useMemo(
    () => (isJewish ? ALL_KINDS : ALL_KINDS.filter((k) => k !== 'torah-shiur')),
    [isJewish],
  );

  const toggleTopic = (id: string) =>
    setSelectedTopics((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleKind = (k: RecKind) =>
    setSelectedKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const fetchRecs = async () => {
    if (!aiOn) return;
    setLoading(true);
    setError(null);
    try {
      const topicPrompts = selectedTopics
        .map((id) => availableTopics.find((t) => t.id === id)?.prompt)
        .filter((x): x is string => !!x);

      const struggleSummary =
        seed.trim() ||
        summarizeRecentTriggers(fallEvents ?? [], closeCallEvents ?? [], checkInEvents ?? []) ||
        '';

      const timeMin = TIME_OPTIONS.find((t) => t.id === timeBudget)?.minutes;

      const res = await recommendLearnContent(aiCfg, personalityProfile, struggleSummary, {
        topics: topicPrompts,
        kinds: selectedKinds,
        count: 6,
        timeBudgetMin: timeMin,
      });

      if (!res.ok) {
        setError(res.error || 'Something went wrong.');
        setRecs([]);
      } else {
        setRecs(res.data);
        setTldrs({}); // reset TL;DRs when new recs arrive
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTldr = async (i: number, rec: LearnRec) => {
    const existing = tldrs[i];
    // If already loaded, just toggle open/closed.
    if (existing?.text) {
      setTldrs((prev) => ({ ...prev, [i]: { ...existing, open: !existing.open } }));
      return;
    }
    // If loading, ignore.
    if (existing?.loading) return;

    setTldrs((prev) => ({ ...prev, [i]: { loading: true, open: true } }));
    try {
      const res = await generateRecTldr(aiCfg, personalityProfile, rec);
      if (!res.ok) {
        setTldrs((prev) => ({
          ...prev,
          [i]: { loading: false, open: true, error: res.error || 'Could not generate TL;DR.' },
        }));
      } else {
        setTldrs((prev) => ({
          ...prev,
          [i]: { loading: false, open: true, text: res.data },
        }));
      }
    } catch (e: any) {
      setTldrs((prev) => ({
        ...prev,
        [i]: { loading: false, open: true, error: e?.message || 'Could not generate TL;DR.' },
      }));
    }
  };

  const openRec = async (rec: LearnRec) => {
    const url = rec.url;
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Cannot open link', url);
    } catch {
      Alert.alert('Cannot open link', url);
    }
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 20, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text
            className="text-3xl font-black mb-2"
            style={{ color: theme.text, fontFamily: 'Outfit' }}
          >
            Learn
          </Text>
          <Text style={{ color: theme.mutedStrong, lineHeight: 20 }}>
            AI-curated videos, shiurim, podcasts, and books that meet you where you are.
          </Text>
        </View>

        {!aiOn && (
          <View
            className="rounded-2xl p-4 mb-6 flex-row items-start"
            style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline }}
          >
            <Lock size={18} color={theme.accent} style={{ marginTop: 2 }} />
            <View className="flex-1 ml-3">
              <Text className="font-black mb-1" style={{ color: theme.text }}>
                AI coach isn't set up yet
              </Text>
              <Text style={{ color: theme.mutedStrong, lineHeight: 18 }}>
                Open Profile → AI coach and pick Groq (free). Then come back here and I'll curate content for you.
              </Text>
            </View>
          </View>
        )}

        {/* Topic picker */}
        <View className="mb-5">
          <Text
            className="text-xs font-black uppercase mb-3"
            style={{ color: theme.accent, letterSpacing: 2 }}
          >
            What helps you?
          </Text>
          <View className="flex-row flex-wrap">
            {availableTopics.map((t) => {
              const active = selectedTopics.includes(t.id);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => toggleTopic(t.id)}
                  className="mr-2 mb-2 rounded-full px-4 py-2"
                  style={{
                    backgroundColor: active ? theme.accent : theme.surface,
                    borderWidth: 1,
                    borderColor: active ? theme.accent : theme.hairline,
                  }}
                >
                  <Text
                    className="text-sm font-black"
                    style={{ color: active ? theme.onAccent : theme.text }}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Format picker */}
        <View className="mb-5">
          <Text
            className="text-xs font-black uppercase mb-3"
            style={{ color: theme.accent, letterSpacing: 2 }}
          >
            Formats (optional)
          </Text>
          <View className="flex-row flex-wrap">
            {kindsForUser.map((k) => {
              const active = selectedKinds.includes(k);
              const meta = KIND_META[k];
              const Icon = meta.icon;
              return (
                <Pressable
                  key={k}
                  onPress={() => toggleKind(k)}
                  className="mr-2 mb-2 rounded-full px-3 py-2 flex-row items-center"
                  style={{
                    backgroundColor: active ? theme.accent : theme.surface,
                    borderWidth: 1,
                    borderColor: active ? theme.accent : theme.hairline,
                  }}
                >
                  <Icon size={14} color={active ? theme.onAccent : theme.text} />
                  <Text
                    className="text-xs font-black ml-1.5"
                    style={{ color: active ? theme.onAccent : theme.text }}
                  >
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Time filter */}
        <View className="mb-5">
          <Text
            className="text-xs font-black uppercase mb-3"
            style={{ color: theme.accent, letterSpacing: 2 }}
          >
            How much time do you have?
          </Text>
          <View className="flex-row flex-wrap">
            {TIME_OPTIONS.map((t) => {
              const active = timeBudget === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTimeBudget(active ? null : t.id)}
                  className="mr-2 mb-2 rounded-full px-3 py-2 flex-row items-center"
                  style={{
                    backgroundColor: active ? theme.accent : theme.surface,
                    borderWidth: 1,
                    borderColor: active ? theme.accent : theme.hairline,
                  }}
                >
                  <Clock size={14} color={active ? theme.onAccent : theme.text} />
                  <Text
                    className="text-xs font-black ml-1.5"
                    style={{ color: active ? theme.onAccent : theme.text }}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Seed input */}
        <View className="mb-5">
          <Text
            className="text-xs font-black uppercase mb-2"
            style={{ color: theme.accent, letterSpacing: 2 }}
          >
            What's on your mind? (optional)
          </Text>
          <TextInput
            value={seed}
            onChangeText={setSeed}
            placeholder="e.g. struggling at night, lost momentum after a fall…"
            placeholderTextColor={theme.textDim}
            multiline
            className="rounded-2xl p-4"
            style={{
              backgroundColor: theme.surface,
              color: theme.text,
              borderWidth: 1,
              borderColor: theme.hairline,
              minHeight: 72,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Action button */}
        <Pressable
          onPress={fetchRecs}
          disabled={!aiOn || loading}
          className="rounded-2xl py-4 flex-row items-center justify-center mb-6"
          style={{
            backgroundColor: !aiOn || loading ? theme.surface : theme.accent,
            borderWidth: 1,
            borderColor: !aiOn || loading ? theme.hairline : theme.accent,
            opacity: !aiOn ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color={theme.accent} />
          ) : (
            <>
              {recs.length > 0 ? (
                <RefreshCw size={18} color={theme.onAccent} />
              ) : (
                <Sparkles size={18} color={theme.onAccent} />
              )}
              <Text
                className="font-black ml-2"
                style={{ color: !aiOn ? theme.mutedStrong : theme.onAccent, letterSpacing: 1 }}
              >
                {recs.length > 0 ? 'REGENERATE' : 'GET RECOMMENDATIONS'}
              </Text>
            </>
          )}
        </Pressable>

        {error && (
          <View
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.danger }}
          >
            <Text style={{ color: theme.danger, fontWeight: '700' }}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {recs.map((rec, i) => {
          const meta = KIND_META[rec.kind];
          const Icon = meta.icon;
          const tldr = tldrs[i];
          return (
            <MotiView
              key={`${rec.title}-${i}`}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: i * 60 }}
              style={{ marginBottom: 12 }}
            >
              <View
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.hairline,
                }}
              >
                <Pressable onPress={() => openRec(rec)}>
                  <View className="flex-row items-center mb-2">
                    <View
                      className="rounded-full px-2 py-1 flex-row items-center mr-2"
                      style={{ backgroundColor: theme.surface2 }}
                    >
                      <Icon size={12} color={theme.accent} />
                      <Text
                        className="text-[10px] font-black uppercase ml-1"
                        style={{ color: theme.accent, letterSpacing: 1 }}
                      >
                        {meta.label}
                      </Text>
                    </View>
                    <ExternalLink size={14} color={theme.textDim} style={{ marginLeft: 'auto' }} />
                  </View>
                  <Text
                    className="text-base font-black mb-1"
                    style={{ color: theme.text, lineHeight: 20 }}
                  >
                    {rec.title}
                  </Text>
                  <Text style={{ color: theme.mutedStrong, lineHeight: 18 }}>{rec.why}</Text>
                  <Text
                    className="text-xs mt-2"
                    style={{ color: theme.textDim, fontStyle: 'italic' }}
                    numberOfLines={1}
                  >
                    Search: {rec.searchQuery}
                  </Text>
                </Pressable>

                {/* TL;DR button + panel */}
                <Pressable
                  onPress={() => toggleTldr(i, rec)}
                  disabled={tldr?.loading}
                  className="mt-3 rounded-xl px-3 py-2 flex-row items-center self-start"
                  style={{
                    backgroundColor: theme.surface2,
                    borderWidth: 1,
                    borderColor: theme.hairline,
                    opacity: tldr?.loading ? 0.7 : 1,
                  }}
                >
                  {tldr?.loading ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : (
                    <Zap size={13} color={theme.accent} />
                  )}
                  <Text
                    className="text-xs font-black ml-1.5"
                    style={{ color: theme.accent, letterSpacing: 1 }}
                  >
                    {tldr?.loading
                      ? 'GENERATING…'
                      : tldr?.text && tldr.open
                        ? 'HIDE TL;DR'
                        : tldr?.text
                          ? 'SHOW TL;DR'
                          : "TL;DR (AI)"}
                  </Text>
                </Pressable>

                {tldr?.open && (tldr.text || tldr.error) && (
                  <View
                    className="mt-3 rounded-xl p-3"
                    style={{
                      backgroundColor: theme.surface2,
                      borderWidth: 1,
                      borderColor: tldr.error ? theme.danger : theme.hairline,
                    }}
                  >
                    {tldr.error ? (
                      <Text style={{ color: theme.danger, fontWeight: '700' }}>
                        {tldr.error}
                      </Text>
                    ) : (
                      <Text style={{ color: theme.text, lineHeight: 20 }}>{tldr.text}</Text>
                    )}
                  </View>
                )}
              </View>
            </MotiView>
          );
        })}

        {!loading && recs.length === 0 && aiOn && !error && (
          <View className="items-center py-8">
            <Sparkles size={28} color={theme.textDim} />
            <Text className="mt-3 text-center" style={{ color: theme.mutedStrong, lineHeight: 20 }}>
              Pick a topic or two and tap{'\n'}
              <Text style={{ color: theme.accent, fontWeight: '900' }}>GET RECOMMENDATIONS</Text>.
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};
