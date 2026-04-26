import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert, Linking } from 'react-native';
import {
  ChevronLeft,
  Bot,
  Key,
  Server,
  Lock,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  Zap,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import { useStore } from '../store/useStore';

// =============================================================================
// AI Coach Configuration (§2.14, Phase F)
// Bring your own key. Everything stays local until the user opts into a call.
// =============================================================================

interface Props {
  onBack: () => void;
}

type Provider = 'none' | 'anthropic' | 'openai' | 'groq' | 'gemini' | 'local-ollama' | 'custom';

const PROVIDERS: {
  id: Provider;
  name: string;
  desc: string;
  needsKey: boolean;
  needsEndpoint: boolean;
  defaultModel: string;
  modelOptions: string[];
  apiUrl?: string;
}[] = [
  {
    id: 'none',
    name: 'None (offline)',
    desc: 'No AI. Coach uses the built-in response library only.',
    needsKey: false,
    needsEndpoint: false,
    defaultModel: '',
    modelOptions: [],
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    desc: 'Best-in-class for thoughtful, safe coaching responses.',
    needsKey: true,
    needsEndpoint: false,
    defaultModel: 'claude-3-5-sonnet-latest',
    modelOptions: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-opus-4-latest'],
    apiUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    desc: 'Widely available. Solid general-purpose model.',
    needsKey: true,
    needsEndpoint: false,
    defaultModel: 'gpt-4o-mini',
    modelOptions: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    apiUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'gemini',
    name: 'Google Gemini / Gemma',
    desc: 'Free tier, generous limits. Sign in with Google — no "organization" required. Gemma is Google’s open-source model and usually has quota even when Gemini doesn’t.',
    needsKey: true,
    needsEndpoint: false,
    defaultModel: 'gemma-3-27b-it',
    modelOptions: ['gemma-3-27b-it', 'gemma-3-12b-it', 'gemma-3-4b-it', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'],
    apiUrl: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'groq',
    name: 'Groq',
    desc: 'Very fast inference. Free tier available.',
    needsKey: true,
    needsEndpoint: false,
    defaultModel: 'llama-3.3-70b-versatile',
    modelOptions: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    apiUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'local-ollama',
    name: 'Local (Ollama)',
    desc: 'Runs fully on your device. Max privacy, no API key needed.',
    needsKey: false,
    needsEndpoint: true,
    defaultModel: 'llama3.2',
    modelOptions: ['llama3.2', 'mistral', 'phi3', 'qwen2.5'],
  },
  {
    id: 'custom',
    name: 'Custom endpoint',
    desc: 'Any OpenAI-compatible API (LMStudio, vLLM, OpenRouter, etc).',
    needsKey: true,
    needsEndpoint: true,
    defaultModel: '',
    modelOptions: [],
  },
];

export const AiCoachConfigScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const aiProvider = useStore((s) => s.aiProvider);
  const aiApiKey = useStore((s) => s.aiApiKey);
  const aiModel = useStore((s) => s.aiModel);
  const aiCustomEndpoint = useStore((s) => s.aiCustomEndpoint);
  const setAiConfig = useStore((s) => s.setAiConfig);

  const [provider, setProvider] = useState<Provider>(aiProvider);
  const [apiKey, setApiKey] = useState(aiApiKey ?? '');
  const [model, setModel] = useState(aiModel ?? '');
  const [endpoint, setEndpoint] = useState(
    aiCustomEndpoint ?? (aiProvider === 'local-ollama' ? 'http://localhost:11434' : ''),
  );
  const [keyVisible, setKeyVisible] = useState(false);

  const current = PROVIDERS.find((p) => p.id === provider)!;
  const isDirty =
    provider !== aiProvider ||
    (apiKey || '') !== (aiApiKey || '') ||
    (model || '') !== (aiModel || '') ||
    (endpoint || '') !== (aiCustomEndpoint || '');

  const handleSave = () => {
    setAiConfig({
      aiProvider: provider,
      aiApiKey: current.needsKey ? apiKey.trim() || null : null,
      aiModel: model.trim() || current.defaultModel || null,
      aiCustomEndpoint: current.needsEndpoint ? endpoint.trim() || null : null,
    });
    Alert.alert('Saved', 'Your AI coach configuration has been updated.');
  };

  const handleSelectProvider = (id: Provider) => {
    setProvider(id);
    const p = PROVIDERS.find((x) => x.id === id)!;
    if (p.defaultModel && !model) setModel(p.defaultModel);
    if (id === 'local-ollama' && !endpoint) setEndpoint('http://localhost:11434');
  };

  return (
    <Screen>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 8,
        }}
      >
        <Pressable onPress={onBack} style={{ padding: 6 }}>
          <ChevronLeft size={24} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>AI Coach</Text>
          <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
            Bring your own key. Your data stays on your device.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Privacy note */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: theme.hairline,
            marginBottom: 16,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <Lock size={16} color={theme.success} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>
              How this works
            </Text>
            <Text style={{ color: theme.muted, fontSize: 12, marginTop: 4, lineHeight: 17 }}>
              Your key is stored locally on this device only. Guard never proxies requests. When
              you tap "Ask coach", your message and relevant context go directly to your chosen
              provider. Choose "None" to disable outbound calls entirely.
            </Text>
          </View>
        </View>

        {/* Quick start — Gemini (free, Google sign-in) */}
        {provider === 'none' && (
          <View
            style={{
              backgroundColor: theme.accent + '14',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: theme.accent + '66',
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Zap size={16} color={theme.accent} />
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800' }}>
                Quick start — free (recommended)
              </Text>
            </View>
            <Text style={{ color: theme.muted, fontSize: 12, lineHeight: 17, marginBottom: 10 }}>
              Google Gemini has a generous free tier and signs in with your Google account — no
              business email or organization needed. One tap picks it, then paste your key from
              aistudio.google.com/apikey.
            </Text>
            <Pressable
              onPress={() => {
                handleSelectProvider('gemini');
                Linking.openURL('https://aistudio.google.com/apikey');
              }}
              style={{
                backgroundColor: theme.accent,
                paddingVertical: 10,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Text style={{ color: theme.onAccent, fontSize: 13, fontWeight: '700' }}>
                Use Gemini & open key page
              </Text>
              <ExternalLink size={13} color={theme.onAccent} />
            </Pressable>
          </View>
        )}

        {/* Provider picker */}
        <Text style={{ color: theme.muted, fontSize: 11, marginBottom: 8, fontWeight: '600' }}>
          PROVIDER
        </Text>
        <View style={{ gap: 6, marginBottom: 20 }}>
          {PROVIDERS.map((p) => {
            const active = p.id === provider;
            return (
              <Pressable
                key={p.id}
                onPress={() => handleSelectProvider(p.id)}
                style={{
                  backgroundColor: active ? theme.accent + '1A' : theme.surface,
                  borderWidth: 1,
                  borderColor: active ? theme.accent : theme.hairline,
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: active ? theme.accent : theme.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {active && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: theme.accent,
                      }}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>
                    {p.name}
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2, lineHeight: 16 }}>
                    {p.desc}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* API key */}
        {current.needsKey && (
          <>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Text style={{ color: theme.muted, fontSize: 11, fontWeight: '600' }}>API KEY</Text>
              {current.apiUrl && (
                <Pressable
                  onPress={() => Linking.openURL(current.apiUrl!)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '600' }}>
                    Get a key
                  </Text>
                  <ExternalLink size={11} color={theme.accent} />
                </Pressable>
              )}
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.surface,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.hairline,
                marginBottom: 16,
                paddingRight: 8,
              }}
            >
              <Key size={14} color={theme.muted} style={{ marginLeft: 12 }} />
              <TextInput
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-..."
                placeholderTextColor={theme.muted}
                secureTextEntry={!keyVisible}
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  flex: 1,
                  color: theme.text,
                  paddingHorizontal: 10,
                  paddingVertical: 12,
                  fontSize: 14,
                  fontFamily: 'monospace',
                }}
              />
              <Pressable onPress={() => setKeyVisible((v) => !v)} style={{ padding: 6 }}>
                {keyVisible ? (
                  <EyeOff size={16} color={theme.muted} />
                ) : (
                  <Eye size={16} color={theme.muted} />
                )}
              </Pressable>
            </View>
          </>
        )}

        {/* Endpoint */}
        {current.needsEndpoint && (
          <>
            <Text
              style={{ color: theme.muted, fontSize: 11, marginBottom: 8, fontWeight: '600' }}
            >
              ENDPOINT
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.surface,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.hairline,
                marginBottom: 16,
              }}
            >
              <Server size={14} color={theme.muted} style={{ marginLeft: 12 }} />
              <TextInput
                value={endpoint}
                onChangeText={setEndpoint}
                placeholder={
                  provider === 'local-ollama'
                    ? 'http://localhost:11434'
                    : 'https://api.example.com/v1'
                }
                placeholderTextColor={theme.muted}
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  flex: 1,
                  color: theme.text,
                  paddingHorizontal: 10,
                  paddingVertical: 12,
                  fontSize: 13,
                  fontFamily: 'monospace',
                }}
              />
            </View>
          </>
        )}

        {/* Model picker */}
        {provider !== 'none' && (
          <>
            <Text
              style={{ color: theme.muted, fontSize: 11, marginBottom: 8, fontWeight: '600' }}
            >
              MODEL
            </Text>
            {current.modelOptions.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {current.modelOptions.map((m) => {
                  const active = model === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setModel(m)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: active ? theme.accent : theme.surface,
                        borderWidth: 1,
                        borderColor: active ? theme.accent : theme.hairline,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? theme.onAccent : theme.text,
                          fontSize: 11,
                          fontWeight: '600',
                        }}
                      >
                        {m}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <TextInput
              value={model}
              onChangeText={setModel}
              placeholder={current.defaultModel || 'model identifier'}
              placeholderTextColor={theme.muted}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                backgroundColor: theme.surface,
                color: theme.text,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.hairline,
                fontSize: 13,
                fontFamily: 'monospace',
                marginBottom: 20,
              }}
            />
          </>
        )}

        {/* Save */}
        <Pressable
          disabled={!isDirty}
          onPress={handleSave}
          style={{
            backgroundColor: isDirty ? theme.accent : theme.surface,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
            opacity: isDirty ? 1 : 0.5,
            borderWidth: 1,
            borderColor: isDirty ? theme.accent : theme.hairline,
          }}
        >
          <Check size={16} color={isDirty ? theme.onAccent : theme.muted} />
          <Text
            style={{
              color: isDirty ? theme.onAccent : theme.muted,
              fontWeight: '700',
              fontSize: 15,
            }}
          >
            {isDirty ? 'Save configuration' : 'Saved'}
          </Text>
        </Pressable>

        {/* Footer note */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
          <Bot size={12} color={theme.muted} />
          <Text style={{ color: theme.muted, fontSize: 11, flex: 1 }}>
            Coach replies are never stored on a server. Your conversation lives only on this
            device unless you export it.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
};
