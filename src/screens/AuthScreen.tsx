import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import { useCommunityStore, useCommunityConfig } from '../store/useCommunityStore';
import { signIn, signUp, getMyProfile } from '../services/community';
import { ArrowLeft } from 'lucide-react-native';

interface Props {
  onBack: () => void;
  onAuthed: () => void;
}

export const AuthScreen: React.FC<Props> = ({ onBack, onAuthed }) => {
  const theme = useTheme();
  const cfg = useCommunityConfig();
  const setSession = useCommunityStore((s) => s.setSession);

  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'sign-up') {
        await signUp(cfg, username, password);
      }
      const uid = await signIn(cfg, username, password);
      if (!uid) throw new Error('Unknown error.');
      const prof = await getMyProfile(cfg);
      setSession(uid, prof?.username ?? username);
      onAuthed();
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View className="flex-row items-center mb-8">
        <Pressable onPress={onBack} className="flex-row items-center">
          <ArrowLeft size={20} color={theme.text} />
          <Text className="text-guard-text font-bold ml-2" style={{ color: theme.text }}>Back</Text>
        </Pressable>
      </View>

      <Text className="text-3xl font-black uppercase mb-2" style={{ color: theme.text, letterSpacing: 2 }}>
        Community
      </Text>
      <Text className="text-sm mb-8" style={{ color: theme.muted }}>
        Username + password only. No email, no tracking. Your recovery data stays on your device.
      </Text>

      <View className="flex-row mb-6 rounded-lg overflow-hidden" style={{ backgroundColor: theme.surface2 }}>
        {(['sign-in', 'sign-up'] as const).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)}
            className="flex-1 py-3 items-center"
            style={{ backgroundColor: mode === m ? theme.accent : 'transparent' }}>
            <Text className="font-bold uppercase text-xs" style={{ color: mode === m ? theme.onAccent : theme.muted, letterSpacing: 1 }}>
              {m === 'sign-in' ? 'Sign in' : 'Create account'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-xs font-bold uppercase mb-2" style={{ color: theme.muted, letterSpacing: 1 }}>Username</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="lion_ari"
        placeholderTextColor={theme.textDim}
        className="rounded-lg p-3 mb-4"
        style={{ backgroundColor: theme.surface, color: theme.text, borderWidth: 1, borderColor: theme.hairline }}
      />
      <Text className="text-xs font-bold uppercase mb-2" style={{ color: theme.muted, letterSpacing: 1 }}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="At least 8 characters"
        placeholderTextColor={theme.textDim}
        className="rounded-lg p-3 mb-6"
        style={{ backgroundColor: theme.surface, color: theme.text, borderWidth: 1, borderColor: theme.hairline }}
      />

      {error && <Text className="text-sm mb-4" style={{ color: theme.danger }}>{error}</Text>}

      <Pressable
        onPress={submit}
        disabled={busy || !username || !password}
        className="rounded-lg py-4 items-center"
        style={{ backgroundColor: theme.accent, opacity: busy ? 0.5 : 1 }}
      >
        {busy ? <ActivityIndicator color={theme.onAccent} /> : (
          <Text className="font-black uppercase" style={{ color: theme.onAccent, letterSpacing: 2 }}>
            {mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </Text>
        )}
      </Pressable>

      <Text className="text-xs mt-8 text-center" style={{ color: theme.textDim }}>
        By signing up you agree to treat other members with respect. Posts are AI-moderated for ads, spam, and off-topic content.
      </Text>
    </Screen>
  );
};
