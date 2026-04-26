import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import { ArrowLeft, Flag, Send } from 'lucide-react-native';
import { useCommunityConfig, useCommunityStore } from '../store/useCommunityStore';
import { getPost, listReplies, createReply, reportContent, ForumPost, ForumReply, Profile } from '../services/community';
import { moderate } from '../services/moderationAi';
import { useStore } from '../store/useStore';

interface Props {
  postId: string;
  onBack: () => void;
}

export const ForumThreadScreen: React.FC<Props> = ({ postId, onBack }) => {
  const theme = useTheme();
  const cfg = useCommunityConfig();
  const moderationOn = useCommunityStore((s) => s.toggles.moderationEnabled);
  const aiProvider = useStore((s) => s.aiProvider);
  const aiApiKey = useStore((s) => s.aiApiKey);
  const aiModel = useStore((s) => s.aiModel);
  const aiCustomEndpoint = useStore((s) => s.aiCustomEndpoint);

  const [post, setPost] = useState<(ForumPost & { author: Profile | null }) | null>(null);
  const [replies, setReplies] = useState<(ForumReply & { author: Profile | null })[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([getPost(cfg, postId), listReplies(cfg, postId)]);
      setPost(p);
      setReplies(r);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setLoading(false);
  }, [cfg, postId]);

  useEffect(() => { refresh(); }, [refresh]);

  const submit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      if (moderationOn) {
        const res = await moderate(body, { provider: aiProvider as any, apiKey: aiApiKey, model: aiModel, customEndpoint: aiCustomEndpoint });
        if (!res.allow) { Alert.alert('Blocked', res.reason || 'Your reply was flagged.'); setSubmitting(false); return; }
      }
      await createReply(cfg, postId, body.trim());
      setBody('');
      await refresh();
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSubmitting(false);
  };

  const report = (targetType: 'post' | 'reply', targetId: string) => {
    Alert.alert('Report content?', 'Send this to moderators for review.', [
      { text: 'Cancel' },
      { text: 'Report', style: 'destructive', onPress: async () => {
        try { await reportContent(cfg, targetType, targetId, 'user-reported'); Alert.alert('Reported', 'Thanks.'); }
        catch (e: any) { Alert.alert('Error', e.message); }
      } },
    ]);
  };

  return (
    <Screen>
      <View className="flex-row items-center mb-6">
        <Pressable onPress={onBack} className="flex-row items-center">
          <ArrowLeft size={20} color={theme.text} />
          <Text className="ml-2 font-bold" style={{ color: theme.text }}>Back</Text>
        </Pressable>
      </View>

      {loading || !post ? <ActivityIndicator color={theme.accent} /> : (
        <>
          <View className="p-4 rounded-lg mb-4" style={{ backgroundColor: theme.surface }}>
            <View className="flex-row items-start">
              <View className="flex-1">
                <Text className="text-xl font-black mb-2" style={{ color: theme.text }}>{post.title}</Text>
                <Text className="text-xs mb-3" style={{ color: theme.muted }}>
                  {post.author?.username ?? 'unknown'} · {new Date(post.created_at).toLocaleString()}
                </Text>
                <Text className="text-sm" style={{ color: theme.text }}>{post.body}</Text>
              </View>
              <Pressable onPress={() => report('post', post.id)} className="ml-2 p-2">
                <Flag size={14} color={theme.muted} />
              </Pressable>
            </View>
          </View>

          <Text className="text-xs font-bold uppercase mb-2" style={{ color: theme.muted, letterSpacing: 2 }}>
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </Text>
          {replies.map((r) => (
            <View key={r.id} className="p-3 rounded-lg mb-2" style={{ backgroundColor: theme.surface2 }}>
              <View className="flex-row items-start">
                <View className="flex-1">
                  <Text className="text-xs font-bold mb-1" style={{ color: theme.muted }}>
                    {r.author?.username ?? 'unknown'} · {new Date(r.created_at).toLocaleDateString()}
                  </Text>
                  <Text className="text-sm" style={{ color: theme.text }}>{r.body}</Text>
                </View>
                <Pressable onPress={() => report('reply', r.id)} className="ml-2 p-1">
                  <Flag size={12} color={theme.muted} />
                </Pressable>
              </View>
            </View>
          ))}

          <View className="mt-6">
            <TextInput
              value={body} onChangeText={setBody} multiline
              placeholder="Share something encouraging..."
              placeholderTextColor={theme.textDim}
              className="rounded-lg p-3"
              style={{ backgroundColor: theme.surface, color: theme.text, minHeight: 80, borderWidth: 1, borderColor: theme.hairline }}
            />
            <Pressable onPress={submit} disabled={submitting || !body.trim()}
              className="mt-2 flex-row items-center justify-center py-3 rounded-lg"
              style={{ backgroundColor: theme.accent, opacity: submitting || !body.trim() ? 0.5 : 1 }}>
              {submitting ? <ActivityIndicator color={theme.onAccent} /> : (
                <>
                  <Send size={14} color={theme.onAccent} />
                  <Text className="ml-2 font-bold uppercase" style={{ color: theme.onAccent, letterSpacing: 1 }}>Reply</Text>
                </>
              )}
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
};
