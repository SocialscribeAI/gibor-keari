import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import { ArrowLeft, MessageSquare, Plus } from 'lucide-react-native';
import { useCommunityConfig } from '../store/useCommunityStore';
import { listForums, listPosts, Forum, ForumPost, Profile } from '../services/community';

interface Props {
  onBack: () => void;
  onOpenPost: (postId: string) => void;
  onOpenCompose: (mode: 'forum' | 'post', forumId?: string) => void;
}

export const ForumsListScreen: React.FC<Props> = ({ onBack, onOpenPost, onOpenCompose }) => {
  const theme = useTheme();
  const cfg = useCommunityConfig();
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [posts, setPosts] = useState<(ForumPost & { author: Profile | null })[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshForums = useCallback(async () => {
    setLoading(true);
    try {
      const f = await listForums(cfg);
      setForums(f);
      if (f.length > 0 && !selectedId) setSelectedId(f[0].id);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setLoading(false);
  }, [cfg, selectedId]);

  useEffect(() => { refreshForums(); }, []);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      try { setPosts(await listPosts(cfg, selectedId)); } catch (e: any) { Alert.alert('Error', e.message); }
    })();
  }, [selectedId, cfg]);

  const current = forums.find((f) => f.id === selectedId);

  return (
    <Screen>
      <View className="flex-row items-center mb-6">
        <Pressable onPress={onBack} className="flex-row items-center">
          <ArrowLeft size={20} color={theme.text} />
          <Text className="ml-2 font-bold" style={{ color: theme.text }}>Back</Text>
        </Pressable>
        <Text className="ml-4 text-2xl font-black uppercase" style={{ color: theme.text, letterSpacing: 2 }}>Forums</Text>
      </View>

      {loading ? <ActivityIndicator color={theme.accent} /> : (
        <>
          {/* Forum tabs */}
          <View className="flex-row flex-wrap mb-4">
            {forums.map((f) => (
              <Pressable key={f.id} onPress={() => setSelectedId(f.id)}
                className="mr-2 mb-2 px-3 py-2 rounded-full"
                style={{ backgroundColor: selectedId === f.id ? theme.accent : theme.surface }}>
                <Text className="text-xs font-bold uppercase" style={{ color: selectedId === f.id ? theme.onAccent : theme.muted, letterSpacing: 1 }}>
                  {f.title}
                </Text>
              </Pressable>
            ))}
            <Pressable onPress={() => onOpenCompose('forum')}
              className="mb-2 px-3 py-2 rounded-full flex-row items-center" style={{ backgroundColor: theme.surface2 }}>
              <Plus size={12} color={theme.muted} />
              <Text className="ml-1 text-xs font-bold uppercase" style={{ color: theme.muted, letterSpacing: 1 }}>New forum</Text>
            </Pressable>
          </View>

          {current && (
            <View className="mb-4">
              <Text className="text-xs" style={{ color: theme.muted }}>{current.description}</Text>
            </View>
          )}

          {current && (
            <Pressable onPress={() => onOpenCompose('post', current.id)}
              className="flex-row items-center justify-center py-3 rounded-lg mb-4"
              style={{ backgroundColor: theme.accent }}>
              <Plus size={16} color={theme.onAccent} />
              <Text className="ml-2 font-bold uppercase" style={{ color: theme.onAccent, letterSpacing: 1 }}>New post</Text>
            </Pressable>
          )}

          {posts.length === 0 ? (
            <Text className="text-sm text-center mt-8" style={{ color: theme.muted }}>No posts yet — be the first.</Text>
          ) : posts.map((p) => (
            <Pressable key={p.id} onPress={() => onOpenPost(p.id)}
              className="p-4 rounded-lg mb-2" style={{ backgroundColor: theme.surface }}>
              <Text className="font-bold mb-1" style={{ color: theme.text }}>{p.title}</Text>
              <Text className="text-xs mb-2" style={{ color: theme.muted }} numberOfLines={2}>{p.body}</Text>
              <View className="flex-row justify-between">
                <Text className="text-xs" style={{ color: theme.textDim }}>
                  {p.author?.username ?? 'unknown'} · {new Date(p.created_at).toLocaleDateString()}
                </Text>
                <View className="flex-row items-center">
                  <MessageSquare size={12} color={theme.muted} />
                  <Text className="ml-1 text-xs" style={{ color: theme.muted }}>{p.reply_count}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </>
      )}
    </Screen>
  );
};
