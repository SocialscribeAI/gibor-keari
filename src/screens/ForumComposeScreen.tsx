import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import { ArrowLeft } from 'lucide-react-native';
import { useCommunityConfig, useCommunityStore } from '../store/useCommunityStore';
import { createForum, createPost } from '../services/community';
import { moderate } from '../services/moderationAi';
import { useStore } from '../store/useStore';

interface Props {
  mode: 'forum' | 'post';
  forumId?: string;
  onBack: () => void;
  onCreated: (id: string) => void;
}

export const ForumComposeScreen: React.FC<Props> = ({ mode, forumId, onBack, onCreated }) => {
  const theme = useTheme();
  const cfg = useCommunityConfig();
  const moderationOn = useCommunityStore((s) => s.toggles.moderationEnabled);
  const aiProvider = useStore((s) => s.aiProvider);
  const aiApiKey = useStore((s) => s.aiApiKey);
  const aiModel = useStore((s) => s.aiModel);
  const aiCustomEndpoint = useStore((s) => s.aiCustomEndpoint);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    if (mode === 'post' && !body.trim()) return;
    if (mode === 'forum' && !slug.trim()) return;
    setSubmitting(true);
    try {
      if (moderationOn) {
        const text = [title, body].filter(Boolean).join('\n\n');
        const res = await moderate(text, { provider: aiProvider as any, apiKey: aiApiKey, model: aiModel, customEndpoint: aiCustomEndpoint });
        if (!res.allow) {
          Alert.alert('Blocked', res.reason || 'Your submission was flagged. Revise or contact support.');
          setSubmitting(false); return;
        }
      }
      if (mode === 'forum') {
        const id = await createForum(cfg, slug, title, body || undefined);
        onCreated(id);
      } else if (mode === 'post' && forumId) {
        const id = await createPost(cfg, forumId, title, body);
        onCreated(id);
      }
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSubmitting(false);
  };

  return (
    <Screen>
      <View className="flex-row items-center mb-6">
        <Pressable onPress={onBack} className="flex-row items-center">
          <ArrowLeft size={20} color={theme.text} />
          <Text className="ml-2 font-bold" style={{ color: theme.text }}>Back</Text>
        </Pressable>
        <Text className="ml-4 text-2xl font-black uppercase" style={{ color: theme.text, letterSpacing: 2 }}>
          {mode === 'forum' ? 'New forum' : 'New post'}
        </Text>
      </View>

      {mode === 'forum' && (
        <>
          <Text className="text-xs font-bold uppercase mb-2" style={{ color: theme.muted, letterSpacing: 1 }}>Slug (URL key)</Text>
          <TextInput value={slug} onChangeText={(t) => setSlug(t.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="late-night-support"
            placeholderTextColor={theme.textDim}
            autoCapitalize="none"
            className="rounded-lg p-3 mb-4"
            style={{ backgroundColor: theme.surface, color: theme.text, borderWidth: 1, borderColor: theme.hairline }}
          />
        </>
      )}

      <Text className="text-xs font-bold uppercase mb-2" style={{ color: theme.muted, letterSpacing: 1 }}>
        {mode === 'forum' ? 'Forum name' : 'Title'}
      </Text>
      <TextInput value={title} onChangeText={setTitle}
        placeholder={mode === 'forum' ? 'Late Night Support' : 'What is on your mind?'}
        placeholderTextColor={theme.textDim}
        className="rounded-lg p-3 mb-4"
        style={{ backgroundColor: theme.surface, color: theme.text, borderWidth: 1, borderColor: theme.hairline }}
      />

      <Text className="text-xs font-bold uppercase mb-2" style={{ color: theme.muted, letterSpacing: 1 }}>
        {mode === 'forum' ? 'Description (optional)' : 'Body'}
      </Text>
      <TextInput value={body} onChangeText={setBody} multiline
        placeholder={mode === 'forum' ? 'What is this forum about?' : 'Share openly...'}
        placeholderTextColor={theme.textDim}
        className="rounded-lg p-3 mb-6"
        style={{ backgroundColor: theme.surface, color: theme.text, minHeight: 160, borderWidth: 1, borderColor: theme.hairline }}
      />

      <Pressable onPress={submit} disabled={submitting}
        className="rounded-lg py-4 items-center"
        style={{ backgroundColor: theme.accent, opacity: submitting ? 0.5 : 1 }}>
        {submitting ? <ActivityIndicator color={theme.onAccent} /> : (
          <Text className="font-black uppercase" style={{ color: theme.onAccent, letterSpacing: 2 }}>
            {mode === 'forum' ? 'Create forum' : 'Post'}
          </Text>
        )}
      </Pressable>

      <Text className="text-xs mt-4 text-center" style={{ color: theme.textDim }}>
        {moderationOn ? 'AI moderation is on: ads, spam, and off-topic content will be blocked.' : 'AI moderation is off.'}
      </Text>
    </Screen>
  );
};
