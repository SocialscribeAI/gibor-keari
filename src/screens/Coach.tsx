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
import { Sparkles, Send, Moon, Lock, AlertCircle } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { PrivacyNote } from '../components/PrivacyNote';
import { useStore } from '../store/useStore';
import { isAiConfigured, providerLabel } from '../services/aiService';
import { generateCoachReply, countRecent } from '../services/aiActions';

interface Message {
  id: string;
  role: 'user' | 'coach';
  text: string;
}

interface Props {
  onNavigateToAiConfig?: () => void;
}

export const Coach: React.FC<Props> = ({ onNavigateToAiConfig }) => {
  const {
    personalityProfile,
    lightsOutTime,
    currentStreak,
    longestStreak,
    fallEvents,
    closeCallEvents,
    identityStatement,
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

  const seedText = aiOn
    ? `Coach ready · ${providerLabel(aiProvider)}.\n\nI know your tone, your triggers, and your streak. What's on your mind?`
    : "Coach AI isn't set up yet. Open Profile → AI coach and pick Groq (free, open-source). Until then, your messages are saved locally.";

  const [messages, setMessages] = useState<Message[]>([
    { id: 'seed', role: 'coach', text: seedText },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const now = new Date();
  const [lH, lM] = (lightsOutTime || '22:30').split(':').map(Number);
  const afterLightsOut =
    now.getHours() > lH || (now.getHours() === lH && now.getMinutes() >= lM);
  const locked = !!lightsOutTime && afterLightsOut;

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');

    if (!aiOn) {
      setMessages((m) => [
        ...m,
        {
          id: `c-${Date.now()}`,
          role: 'coach',
          text: 'Saved locally. Turn on AI in Profile → AI coach to get a real reply.',
        },
      ]);
      return;
    }

    setLoading(true);
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
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
      setMessages((m) => [
        ...m,
        {
          id: `c-err-${Date.now()}`,
          role: 'coach',
          text: `[Coach is offline right now]\n${res.error}`,
        },
      ]);
      return;
    }
    const text = toolsUsed.length
      ? `${res.data}\n\n_${toolsUsed.join(' · ')}_`
      : res.data;
    setMessages((m) => [
      ...m,
      { id: `c-${Date.now()}`, role: 'coach', text },
    ]);
  };

  if (locked) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <View className="w-20 h-20 rounded-3xl bg-guard-primary/10 border border-guard-primary/30 items-center justify-center mb-6">
            <Moon size={40} color="#E8A020" />
          </View>
          <Text className="text-2xl font-black text-white mb-2">Lights Out</Text>
          <Text className="text-white/60 text-center leading-6 max-w-xs">
            Coach is locked until morning. Rest well. You've done enough for today.
          </Text>
          <View className="mt-6 flex-row items-center bg-guard-surface px-4 py-2 rounded-full">
            <Lock size={12} color="#E8A020" />
            <Text className="text-white/60 text-xs ml-2">Unlocks at 6:00 AM</Text>
          </View>
        </View>
      </Screen>
    );
  }

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
              {aiOn
                ? `${providerLabel(aiProvider)} · ${personalityProfile.tone ?? 'tone not set'}`
                : 'AI off — using local library'}
            </Text>
          </View>
        </View>

        <View className="mb-3">
          <PrivacyNote message="This chat never leaves your phone except to the AI provider you choose — with your own key." />
        </View>

        {!aiOn && (
          <View
            className="flex-row items-center rounded-xl px-3 py-2 mb-3"
            style={{
              backgroundColor: 'rgba(232,160,32,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(232,160,32,0.3)',
            }}
          >
            <AlertCircle size={12} color="#E8A020" />
            <Text className="text-white/70 text-xs ml-2 flex-1">
              Profile → AI coach → pick Groq (free, open-source) to activate the coach.
            </Text>
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((m) => (
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
              style={{ backgroundColor: 'rgba(44,62,122,0.2)', gap: 8 }}
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
            placeholderTextColor="rgba(255,255,255,0.3)"
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
