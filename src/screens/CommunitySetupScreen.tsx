import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import { ArrowLeft } from 'lucide-react-native';
import { useCommunityStore } from '../store/useCommunityStore';

interface Props { onBack: () => void; }

export const CommunitySetupScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const existingUrl = useCommunityStore((s) => s.supabaseUrl);
  const existingKey = useCommunityStore((s) => s.supabaseAnonKey);
  const setCfg = useCommunityStore((s) => s.setSupabaseConfig);
  const clear = useCommunityStore((s) => s.clearSupabaseConfig);

  const [url, setUrl] = useState(existingUrl ?? '');
  const [key, setKey] = useState(existingKey ?? '');

  const save = () => {
    if (!/^https:\/\/.+\.supabase\.co\/?$/i.test(url.trim())) {
      Alert.alert('Invalid URL', 'URL should look like https://abc123.supabase.co');
      return;
    }
    if (key.trim().length < 20) {
      Alert.alert('Invalid key', 'That does not look like a Supabase anon key.');
      return;
    }
    setCfg(url.trim().replace(/\/$/, ''), key.trim());
    Alert.alert('Saved', 'Server config saved. You can now sign in.');
    onBack();
  };

  const reset = () => {
    Alert.alert('Clear server config?', 'You will need to paste the URL and key again to rejoin the community.', [
      { text: 'Cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { clear(); setUrl(''); setKey(''); } },
    ]);
  };

  return (
    <Screen>
      <View className="flex-row items-center mb-8">
        <Pressable onPress={onBack} className="flex-row items-center">
          <ArrowLeft size={20} color={theme.text} />
          <Text className="ml-2 font-bold" style={{ color: theme.text }}>Back</Text>
        </Pressable>
      </View>

      <Text className="text-2xl font-black uppercase mb-3" style={{ color: theme.text, letterSpacing: 2 }}>Server setup</Text>
      <Text className="text-sm mb-6" style={{ color: theme.muted }}>
        Community features need a Supabase backend. You set up a free project once, run the SQL migration in supabase/migrations/0001_community.sql, then paste your project URL and anon key here.
      </Text>

      <Text className="text-xs font-bold uppercase mb-2" style={{ color: theme.muted, letterSpacing: 1 }}>Project URL</Text>
      <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false}
        placeholder="https://xyz.supabase.co"
        placeholderTextColor={theme.textDim}
        className="rounded-lg p-3 mb-4"
        style={{ backgroundColor: theme.surface, color: theme.text, borderWidth: 1, borderColor: theme.hairline }}
      />

      <Text className="text-xs font-bold uppercase mb-2" style={{ color: theme.muted, letterSpacing: 1 }}>Anon public key</Text>
      <TextInput value={key} onChangeText={setKey} autoCapitalize="none" autoCorrect={false} multiline
        placeholder="eyJhbGciOi..."
        placeholderTextColor={theme.textDim}
        className="rounded-lg p-3 mb-6"
        style={{ backgroundColor: theme.surface, color: theme.text, borderWidth: 1, borderColor: theme.hairline, minHeight: 100 }}
      />

      <Pressable onPress={save} className="rounded-lg py-4 items-center mb-3" style={{ backgroundColor: theme.accent }}>
        <Text className="font-black uppercase" style={{ color: theme.onAccent, letterSpacing: 2 }}>Save config</Text>
      </Pressable>
      {(existingUrl || existingKey) && (
        <Pressable onPress={reset} className="rounded-lg py-3 items-center" style={{ backgroundColor: theme.surface2 }}>
          <Text className="font-bold uppercase text-xs" style={{ color: theme.danger, letterSpacing: 1 }}>Clear saved config</Text>
        </Pressable>
      )}

      <Text className="text-xs mt-8" style={{ color: theme.textDim }}>
        Only the anon public key goes here — never your service-role key. The anon key is safe for client apps; Row-Level Security in the database prevents abuse.
      </Text>
    </Screen>
  );
};
