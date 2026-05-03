import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MotiView } from 'moti';
import { Sparkles, Send } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { PrivacyNote } from '../components/PrivacyNote';
import { useStore } from '../store/useStore';
import { isAiConfigured } from '../services/aiService';
import { generateCoachReply, countRecent } from '../services/aiActions';
import { useTheme } from '../constants/theme';

interface Message {
  id: string;
  role: 'user' | 'coach';
  text: string;
}

interface Props {
  onNavigateToAiConfig?: () => void;
}

export const Coach: React.FC<Props> = ({ onNavigateToAiConfig }) => {
  const theme = useTheme();
  const {
    personalityProfile,
    currentStreak,
    longestStreak,
    fallEvents,
    closeCallEvents,
    identityStatement,
    aiProvider,
    aiApiKey,
    aiModel,
    aiCustomEndpoint,
    coachMessages,
    coachSummary,
    coachStylePrefs,
    tacticEffectiveness,
    appendCoachMessage,
    clearCoachMessages,
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

  const seedText = aiOn
    ? "I know your tone, your triggers, and your streak. What's on your mind?"
    : "Coach is warming up. Type anything — your messages save locally either way.";

  // Map persisted store messages -> UI messages. Hide system entries from the
  // visible chat (they're context for the model only).
  const visibleMessages: Message[] = useMemo(() => {
    const mapped = coachMessages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        id: m.id,
        role: (m.role === 'assistant' ? 'coach' : 'user') as 'user' | 'coach',
        text: m.text,
      }));
    if (mapped.length === 0) {
      return [{ id: 'seed', role: 'coach', text: seedText }];
    }
    return mapped;
  }, [coachMessages, seedText]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [visibleMessages]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    appendCoachMessage({ role: 'user', text: trimmed });
    setInput('');

    if (!aiOn) {
      appendCoachMessage({
        role: 'assistant',
        text: 'Saved locally. Turn on AI in Profile → AI coach to get a real reply.',
      });
      return;
    }

    setLoading(true);
    // Build history from persisted store. Include the rolling summary as a
    // pseudo-system turn so the model has long-term memory without sending
    // the whole transcript every time.
    const history: { role: 'user' | 'coach'; text: string }[] = [];
    if (coachSummary) {
      history.push({ role: 'coach', text: `[Memory of past sessions]: ${coachSummary}` });
    }
    // Last 30 turns (excluding the message we just appended).
    const recent = coachMessages
      .filter((m) => m.role !== 'system')
      .slice(-30)
      .map((m) => ({
        role: (m.role === 'assistant' ? 'coach' : 'user') as 'user' | 'coach',
        text: m.text,
      }));
    history.push(...recent);
    // Include any [FALL LOGGED] system notes as context summary.
    const sysNotes = coachMessages.filter((m) => m.role === 'system').slice(-5);
    if (sysNotes.length) {
      history.unshift({
        role: 'coach',
        text: `[Recent events the user logged]:\n${sysNotes.map((s) => s.text).join('\n')}`,
      });
    }

    const toolsUsed: string[] = [];
    const res = await generateCoachReply(
      aiCfg,
      personalityProfile,
      {
        currentStreak,
        longestStreak,
        recentFalls7d: countRecent(fallEvents, 7),
        recentCloseCalls7d: countRecent(closeCallEvents, 7),
        identityStatement,
        stylePrefs: coachStylePrefs,
        tacticEffectiveness,
      },
      history,
      trimmed,
      {
        onToolEvent: (e) => {
          toolsUsed.push(`${e.ok ? '✓' : '⚠'} ${e.name}`);
        },
      },
    );
    setLoading(false);

    if (!res.ok) {
      appendCoachMessage({
        role: 'assistant',
        text: `[Coach is offline right now]\n${res.error}`,
      });
      return;
    }
    const text = toolsUsed.length
      ? `${res.data}\n\n_${toolsUsed.join(' · ')}_`
      : res.data;
    appendCoachMessage({ role: 'assistant', text });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-guard-bg"
    >
      <Screen scroll={false}>
        <View className="flex-row items-center mb-4">
          <View className="w-12 h-12 rounded-2xl bg-guard-accent/10 border border-guard-accent/30 items-center justify-center mr-3">
            <Sparkles size={20} color="#E8A020" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-black text-white">Coach</Text>
            <Text className="text-white/50 text-xs">
              {personalityProfile.tone ?? 'Here when you need it'}
            </Text>
          </View>
        </View>

        <View className="mb-3">
          <PrivacyNote message="This chat stays on your phone." />
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {visibleMessages.map((m) => (
            <MotiView
              key={m.id}
              from={{ opacity: 0, translateY: 6 }}
              animate={{ opacity: 1, translateY: 0 }}
              className={`mb-3 max-w-[85%] p-4 rounded-2xl ${
                m.role === 'user'
                  ? 'bg-guard-accent self-end'
                  : 'bg-guard-surface border border-guard-primary/30 self-start'
              }`}
            >
              <Text className={m.role === 'user' ? 'text-guard-on-accent' : 'text-white/90'}>
                {m.text}
              </Text>
            </MotiView>
          ))}
          {loading && (
            <View
              className="self-start mb-3 p-4 rounded-2xl flex-row items-center"
              style={{ backgroundColor: theme.surface, gap: 8 }}
            >
              <ActivityIndicator size="small" color="#E8A020" />
              <Text className="text-white/60 text-xs">Coach is thinking…</Text>
            </View>
          )}
        </ScrollView>

        <View className="flex-row items-end gap-2 pt-2 pb-4">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type to Coach…"
            placeholderTextColor={theme.textDim}
            multiline
            editable={!loading}
            className="flex-1 bg-guard-surface border border-guard-primary/30 rounded-2xl px-4 py-3 text-white max-h-32"
          />
          <Pressable
            onPress={send}
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-2xl bg-guard-accent items-center justify-center"
            style={{ opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            <Send size={18} color="#0F1120" />
          </Pressable>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
};
