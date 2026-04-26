import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import { ArrowLeft, Users, MessageSquare, Trophy, Settings, LogOut } from 'lucide-react-native';
import { useCommunityStore, useCommunityConfig } from '../store/useCommunityStore';
import { getMyProfile, signOut, syncStreak, clearPushToken } from '../services/community';
import { useStore } from '../store/useStore';

interface Props {
  onBack: () => void;
  onOpenAuth: () => void;
  onOpenSetup: () => void;
  onOpenSettings: () => void;
  onOpenPartner: () => void;
  onOpenForums: () => void;
  onOpenLeaderboard: () => void;
}

export const CommunityHubScreen: React.FC<Props> = ({
  onBack, onOpenAuth, onOpenSetup, onOpenSettings,
  onOpenPartner, onOpenForums, onOpenLeaderboard,
}) => {
  const theme = useTheme();
  const cfg = useCommunityConfig();
  const isConfigured = useCommunityStore((s) => s.isConfigured());
  const userId = useCommunityStore((s) => s.userId);
  const username = useCommunityStore((s) => s.username);
  const toggles = useCommunityStore((s) => s.toggles);
  const setSession = useCommunityStore((s) => s.setSession);
  const currentStreak = useStore((s) => s.currentStreak);
  const longestStreak = useStore((s) => s.longestStreak);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!isConfigured) { setLoading(false); return; }
      try {
        const prof = await getMyProfile(cfg);
        if (prof) {
          setSession(prof.id, prof.username);
          // Sync streak snapshot
          if (prof.current_streak !== currentStreak || prof.longest_streak !== longestStreak) {
            await syncStreak(cfg, currentStreak, longestStreak);
          }
        } else {
          setSession(null, null);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [isConfigured]);

  const handleSignOut = async () => {
    try { await clearPushToken(cfg); } catch { /* noop */ }
    try { await signOut(cfg); } catch { /* noop */ }
    setSession(null, null);
  };

  if (!toggles.masterEnabled) {
    return (
      <Screen>
        <Header theme={theme} onBack={onBack} />
        <View className="p-6 rounded-lg items-center" style={{ backgroundColor: theme.surface2 }}>
          <Users size={32} color={theme.muted} />
          <Text className="text-lg font-bold mt-3 text-center" style={{ color: theme.text }}>
            Community is off
          </Text>
          <Text className="text-sm text-center mt-2" style={{ color: theme.muted }}>
            Turn on Community in settings to unlock partner, forums, and the leaderboard.
          </Text>
          <Pressable onPress={onOpenSettings} className="mt-4 px-6 py-3 rounded-lg" style={{ backgroundColor: theme.accent }}>
            <Text className="font-bold uppercase" style={{ color: theme.onAccent, letterSpacing: 1 }}>Open settings</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <Header theme={theme} onBack={onBack} />
        <View className="items-center mt-12"><ActivityIndicator color={theme.accent} /></View>
      </Screen>
    );
  }

  if (!userId) {
    return (
      <Screen>
        <Header theme={theme} onBack={onBack} />
        <View className="p-6 rounded-lg" style={{ backgroundColor: theme.surface2 }}>
          <Text className="text-lg font-bold" style={{ color: theme.text }}>Sign in to continue</Text>
          <Text className="text-sm mt-2" style={{ color: theme.muted }}>
            Pick a username and password. No email required.
          </Text>
          <Pressable onPress={onOpenAuth} className="mt-4 px-6 py-3 rounded-lg self-start" style={{ backgroundColor: theme.accent }}>
            <Text className="font-bold uppercase" style={{ color: theme.onAccent, letterSpacing: 1 }}>Sign in / up</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header theme={theme} onBack={onBack} />

      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className="text-xs uppercase" style={{ color: theme.muted, letterSpacing: 2 }}>Signed in as</Text>
          <Text className="text-lg font-bold" style={{ color: theme.text }}>{username ?? '—'}</Text>
        </View>
        <Pressable onPress={handleSignOut} className="flex-row items-center px-3 py-2 rounded-lg" style={{ backgroundColor: theme.surface2 }}>
          <LogOut size={14} color={theme.muted} />
          <Text className="ml-2 text-xs" style={{ color: theme.muted }}>Sign out</Text>
        </Pressable>
      </View>

      {toggles.partnerEnabled && (
        <Tile theme={theme} icon={Users} title="Accountability Partner"
          desc="Pair up 1-on-1. Send an urge alert, check in on each other."
          onPress={onOpenPartner} />
      )}

      {toggles.forumsEnabled && (
        <Tile theme={theme} icon={MessageSquare} title="Forums"
          desc="Read, post, start new forums. AI-moderated against ads and spam."
          onPress={onOpenForums} />
      )}

      {toggles.leaderboardViewable && (
        <Tile theme={theme} icon={Trophy} title="Leaderboard"
          desc="Top streaks in the community. Your entry is private unless you opt in."
          onPress={onOpenLeaderboard} />
      )}

      <Pressable onPress={onOpenSettings} className="mt-8 flex-row items-center justify-center py-3 rounded-lg" style={{ backgroundColor: theme.surface2 }}>
        <Settings size={16} color={theme.muted} />
        <Text className="ml-2 font-bold uppercase text-xs" style={{ color: theme.muted, letterSpacing: 1 }}>Community settings</Text>
      </Pressable>
    </Screen>
  );
};

const Header: React.FC<{ theme: any; onBack: () => void }> = ({ theme, onBack }) => (
  <View className="flex-row items-center mb-8">
    <Pressable onPress={onBack} className="flex-row items-center">
      <ArrowLeft size={20} color={theme.text} />
      <Text className="ml-2 font-bold" style={{ color: theme.text }}>Back</Text>
    </Pressable>
    <Text className="ml-4 text-2xl font-black uppercase" style={{ color: theme.text, letterSpacing: 2 }}>Community</Text>
  </View>
);

const Tile: React.FC<{ theme: any; icon: any; title: string; desc: string; onPress: () => void }> = ({
  theme, icon: Icon, title, desc, onPress,
}) => (
  <Pressable onPress={onPress} className="p-4 rounded-lg mb-3 flex-row items-center" style={{ backgroundColor: theme.surface }}>
    <View className="w-10 h-10 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: theme.accent + '22' }}>
      <Icon size={20} color={theme.accent} />
    </View>
    <View className="flex-1">
      <Text className="font-bold" style={{ color: theme.text }}>{title}</Text>
      <Text className="text-xs mt-1" style={{ color: theme.muted }}>{desc}</Text>
    </View>
  </Pressable>
);
