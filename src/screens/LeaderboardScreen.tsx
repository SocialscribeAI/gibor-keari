import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import { ArrowLeft, Trophy } from 'lucide-react-native';
import { useCommunityConfig, useCommunityStore } from '../store/useCommunityStore';
import { fetchLeaderboard, LeaderboardRow, updateMyProfile } from '../services/community';

interface Props { onBack: () => void; }

export const LeaderboardScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const cfg = useCommunityConfig();
  const userId = useCommunityStore((s) => s.userId);
  const visible = useCommunityStore((s) => s.toggles.leaderboardVisible);
  const setToggle = useCommunityStore((s) => s.setToggle);

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setRows(await fetchLeaderboard(cfg)); } catch (e: any) { Alert.alert('Error', e.message); }
      setLoading(false);
    })();
  }, [cfg, visible]);

  const toggleVisible = async () => {
    const next = !visible;
    setToggle('leaderboardVisible', next);
    try { await updateMyProfile(cfg, { leaderboard_visible: next }); } catch { /* noop */ }
  };

  return (
    <Screen>
      <View className="flex-row items-center mb-6">
        <Pressable onPress={onBack} className="flex-row items-center">
          <ArrowLeft size={20} color={theme.text} />
          <Text className="ml-2 font-bold" style={{ color: theme.text }}>Back</Text>
        </Pressable>
        <Text className="ml-4 text-2xl font-black uppercase" style={{ color: theme.text, letterSpacing: 2 }}>Leaderboard</Text>
      </View>

      <View className="p-3 rounded-lg mb-4 flex-row items-center justify-between" style={{ backgroundColor: theme.surface2 }}>
        <View className="flex-1 mr-3">
          <Text className="text-sm font-bold" style={{ color: theme.text }}>Show me on the leaderboard</Text>
          <Text className="text-xs" style={{ color: theme.muted }}>Only your username and streak are shared.</Text>
        </View>
        <Pressable onPress={toggleVisible}
          className="px-4 py-2 rounded-lg"
          style={{ backgroundColor: visible ? theme.success : theme.surface }}>
          <Text className="font-bold uppercase text-xs" style={{ color: visible ? theme.onAccent : theme.muted, letterSpacing: 1 }}>
            {visible ? 'On' : 'Off'}
          </Text>
        </Pressable>
      </View>

      {loading ? <ActivityIndicator color={theme.accent} /> : rows.length === 0 ? (
        <Text className="text-sm text-center mt-8" style={{ color: theme.muted }}>No entries yet — be the first.</Text>
      ) : rows.map((r, i) => {
        const isMe = r.id === userId;
        return (
          <View key={r.id} className="flex-row items-center p-3 rounded-lg mb-2"
            style={{ backgroundColor: isMe ? theme.accent + '33' : theme.surface }}>
            <Text className="font-black w-10 text-center" style={{ color: i < 3 ? theme.accent : theme.muted, fontSize: i < 3 ? 20 : 16 }}>
              {i + 1}
            </Text>
            <Text className="text-xl mr-2">{r.avatar_emoji ?? '🦁'}</Text>
            <View className="flex-1">
              <Text className="font-bold" style={{ color: theme.text }}>
                {r.username}{isMe ? ' (you)' : ''}
              </Text>
              <Text className="text-xs" style={{ color: theme.muted }}>Best: {r.longest_streak}d</Text>
            </View>
            <View className="flex-row items-center">
              <Trophy size={14} color={theme.accent} />
              <Text className="ml-1 font-black" style={{ color: theme.accent }}>{r.current_streak}d</Text>
            </View>
          </View>
        );
      })}
    </Screen>
  );
};
