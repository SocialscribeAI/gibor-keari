import React from 'react';
import { View, Text, Pressable, Switch, ScrollView, Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import { ArrowLeft, Server } from 'lucide-react-native';
import { useCommunityStore, useCommunityConfig } from '../store/useCommunityStore';
import { updateMyProfile } from '../services/community';

interface Props { onBack: () => void; onOpenSetup: () => void; }

export const CommunitySettingsScreen: React.FC<Props> = ({ onBack, onOpenSetup }) => {
  const theme = useTheme();
  const toggles = useCommunityStore((s) => s.toggles);
  const setToggle = useCommunityStore((s) => s.setToggle);
  const userId = useCommunityStore((s) => s.userId);
  const cfg = useCommunityConfig();

  const updateServer = async (patch: Record<string, any>) => {
    if (!userId) return;
    try { await updateMyProfile(cfg, patch); } catch { /* silent — next sync will retry */ }
  };

  const Row: React.FC<{ label: string; desc: string; value: boolean; onChange: (v: boolean) => void; danger?: boolean }>
    = ({ label, desc, value, onChange, danger }) => (
    <View className="flex-row items-center py-4" style={{ borderBottomWidth: 1, borderBottomColor: theme.hairline }}>
      <View className="flex-1 mr-3">
        <Text className="font-bold" style={{ color: danger ? theme.danger : theme.text }}>{label}</Text>
        <Text className="text-xs mt-1" style={{ color: theme.muted }}>{desc}</Text>
      </View>
      <Switch value={value} onValueChange={onChange}
        trackColor={{ false: theme.surface2, true: theme.accent }}
        thumbColor={theme.bg} />
    </View>
  );

  return (
    <Screen>
      <View className="flex-row items-center mb-6">
        <Pressable onPress={onBack} className="flex-row items-center">
          <ArrowLeft size={20} color={theme.text} />
          <Text className="ml-2 font-bold" style={{ color: theme.text }}>Back</Text>
        </Pressable>
        <Text className="ml-4 text-2xl font-black uppercase" style={{ color: theme.text, letterSpacing: 2 }}>Settings</Text>
      </View>

      <Row label="Community master switch"
        desc="Off = hide everything. On = allow the features below."
        value={toggles.masterEnabled}
        onChange={(v) => { setToggle('masterEnabled', v); updateServer({ community_enabled: v }); }}
        danger />

      <Text className="text-xs font-bold uppercase mt-6 mb-2" style={{ color: theme.muted, letterSpacing: 2 }}>Partner</Text>
      <Row label="Enable partner"
        desc="Pair with one person and exchange urge alerts."
        value={toggles.partnerEnabled}
        onChange={(v) => { setToggle('partnerEnabled', v); updateServer({ partner_enabled: v }); }} />
      <Row label="Accept partner requests"
        desc="Others can redeem your invite code."
        value={toggles.allowPartnerRequests}
        onChange={(v) => { setToggle('allowPartnerRequests', v); updateServer({ partner_allow_requests: v }); }} />

      <Text className="text-xs font-bold uppercase mt-6 mb-2" style={{ color: theme.muted, letterSpacing: 2 }}>Forums</Text>
      <Row label="Enable forums"
        desc="Read and post in community forums."
        value={toggles.forumsEnabled}
        onChange={(v) => { setToggle('forumsEnabled', v); updateServer({ forums_enabled: v }); }} />
      <Row label="AI content moderation"
        desc="Uses your configured AI to block ads, spam, and off-topic content before it posts."
        value={toggles.moderationEnabled}
        onChange={(v) => setToggle('moderationEnabled', v)} />

      <Text className="text-xs font-bold uppercase mt-6 mb-2" style={{ color: theme.muted, letterSpacing: 2 }}>Leaderboard</Text>
      <Row label="View the leaderboard"
        desc="Turn off to hide the leaderboard screen entirely."
        value={toggles.leaderboardViewable}
        onChange={(v) => setToggle('leaderboardViewable', v)} />
      <Row label="Appear on the leaderboard"
        desc="Share your current streak and username. Can be turned off anytime."
        value={toggles.leaderboardVisible}
        onChange={(v) => { setToggle('leaderboardVisible', v); updateServer({ leaderboard_visible: v }); }} />

      <Pressable onPress={onOpenSetup} className="mt-8 flex-row items-center justify-center py-3 rounded-lg" style={{ backgroundColor: theme.surface2 }}>
        <Server size={16} color={theme.muted} />
        <Text className="ml-2 font-bold uppercase text-xs" style={{ color: theme.muted, letterSpacing: 1 }}>Server config</Text>
      </Pressable>
    </Screen>
  );
};
