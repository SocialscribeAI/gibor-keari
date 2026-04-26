import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import { ArrowLeft, Copy, AlertTriangle, Check } from 'lucide-react-native';
import { useCommunityConfig } from '../store/useCommunityStore';
import {
  createInvite, acceptInvite, listMyPartnerships, sendUrgeAlert,
  listIncomingAlerts, acknowledgeAlert, endPartnership, Partnership, Profile, UrgeAlert,
} from '../services/community';

interface Props { onBack: () => void; }

export const PartnerScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const cfg = useCommunityConfig();

  const [partnerships, setPartnerships] = useState<(Partnership & { partner: Profile | null })[]>([]);
  const [alerts, setAlerts] = useState<(UrgeAlert & { from_profile: Profile | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [myCode, setMyCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ps, al] = await Promise.all([
        listMyPartnerships(cfg),
        listIncomingAlerts(cfg),
      ]);
      setPartnerships(ps);
      setAlerts(al);
      const pending = ps.find((p) => p.status === 'pending' && p.invite_code);
      setMyCode(pending?.invite_code ?? null);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load.');
    }
    setLoading(false);
  }, [cfg]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreateInvite = async () => {
    setBusy(true);
    try {
      const c = await createInvite(cfg);
      setMyCode(c);
      await refresh();
    } catch (e: any) { Alert.alert('Error', e.message); }
    setBusy(false);
  };

  const handleAccept = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      await acceptInvite(cfg, code.trim().toUpperCase());
      setCode('');
      await refresh();
      Alert.alert('Partnered', 'You are now connected.');
    } catch (e: any) { Alert.alert('Invalid code', e.message); }
    setBusy(false);
  };

  const handleSendAlert = async (p: Partnership, intensity: number) => {
    try {
      await sendUrgeAlert(cfg, p.id, intensity);
      Alert.alert('Sent', 'Your partner has been notified.');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleEnd = (p: Partnership) => {
    Alert.alert('End partnership?', 'This cannot be undone.', [
      { text: 'Cancel' },
      { text: 'End', style: 'destructive', onPress: async () => {
        try { await endPartnership(cfg, p.id); await refresh(); } catch (e: any) { Alert.alert('Error', e.message); }
      } },
    ]);
  };

  const active = partnerships.filter((p) => p.status === 'active');

  return (
    <Screen>
      <View className="flex-row items-center mb-6">
        <Pressable onPress={onBack} className="flex-row items-center">
          <ArrowLeft size={20} color={theme.text} />
          <Text className="ml-2 font-bold" style={{ color: theme.text }}>Back</Text>
        </Pressable>
        <Text className="ml-4 text-2xl font-black uppercase" style={{ color: theme.text, letterSpacing: 2 }}>Partner</Text>
      </View>

      {loading ? <ActivityIndicator color={theme.accent} /> : (
        <>
          {/* ---- Active partnerships ---- */}
          {active.length === 0 && (
            <View className="p-4 rounded-lg mb-6" style={{ backgroundColor: theme.surface2 }}>
              <Text className="text-sm" style={{ color: theme.muted }}>No active partner yet. Share a code or paste one below.</Text>
            </View>
          )}
          {active.map((p) => (
            <View key={p.id} className="p-4 rounded-lg mb-4" style={{ backgroundColor: theme.surface }}>
              <Text className="text-xs uppercase" style={{ color: theme.muted, letterSpacing: 1 }}>Partnered with</Text>
              <Text className="text-lg font-bold mb-3" style={{ color: theme.text }}>
                {p.partner?.avatar_emoji ?? '🦁'} {p.partner?.username ?? 'unknown'}
              </Text>
              <Text className="text-xs font-bold uppercase mb-2" style={{ color: theme.muted, letterSpacing: 1 }}>Send urge alert</Text>
              <View className="flex-row">
                {[3, 6, 9].map((i) => (
                  <Pressable key={i} onPress={() => handleSendAlert(p, i)}
                    className="flex-1 mr-2 last:mr-0 py-3 rounded-lg items-center"
                    style={{ backgroundColor: i <= 3 ? theme.success : i <= 6 ? theme.accent : theme.danger }}>
                    <Text className="font-bold" style={{ color: theme.onAccent }}>
                      {i <= 3 ? 'Mild' : i <= 6 ? 'Strong' : 'Severe'}
                    </Text>
                    <Text className="text-xs" style={{ color: theme.onAccent }}>{i}/10</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={() => handleEnd(p)} className="mt-4">
                <Text className="text-xs" style={{ color: theme.danger }}>End partnership</Text>
              </Pressable>
            </View>
          ))}

          {/* ---- Incoming alerts ---- */}
          {alerts.length > 0 && (
            <>
              <Text className="text-xs font-bold uppercase mb-2 mt-4" style={{ color: theme.muted, letterSpacing: 2 }}>Incoming alerts</Text>
              {alerts.map((a) => (
                <View key={a.id} className="p-3 rounded-lg mb-2 flex-row items-center" style={{ backgroundColor: theme.surface }}>
                  <AlertTriangle size={18} color={a.intensity >= 7 ? theme.danger : theme.accent} />
                  <View className="ml-3 flex-1">
                    <Text className="font-bold" style={{ color: theme.text }}>
                      {a.from_profile?.username ?? 'partner'} — {a.intensity}/10
                    </Text>
                    <Text className="text-xs" style={{ color: theme.muted }}>
                      {new Date(a.created_at).toLocaleString()}
                    </Text>
                    {a.note && <Text className="text-sm mt-1" style={{ color: theme.text }}>{a.note}</Text>}
                  </View>
                  {!a.acknowledged_at && (
                    <Pressable onPress={async () => { await acknowledgeAlert(cfg, a.id); await refresh(); }}
                      className="p-2 rounded-lg" style={{ backgroundColor: theme.accent }}>
                      <Check size={16} color={theme.onAccent} />
                    </Pressable>
                  )}
                </View>
              ))}
            </>
          )}

          {/* ---- Invite / accept ---- */}
          <Text className="text-xs font-bold uppercase mb-2 mt-8" style={{ color: theme.muted, letterSpacing: 2 }}>Invite someone</Text>
          {myCode ? (
            <View className="p-4 rounded-lg mb-4" style={{ backgroundColor: theme.accent + '22' }}>
              <Text className="text-xs" style={{ color: theme.muted }}>Share this code with your partner:</Text>
              <Text className="text-3xl font-black mt-1" style={{ color: theme.accent, letterSpacing: 4 }}>{myCode}</Text>
              <Text className="text-xs mt-2" style={{ color: theme.muted }}>Expires once used.</Text>
            </View>
          ) : (
            <Pressable onPress={handleCreateInvite} disabled={busy}
              className="p-4 rounded-lg mb-4 items-center" style={{ backgroundColor: theme.surface2 }}>
              <Text className="font-bold uppercase text-xs" style={{ color: theme.text, letterSpacing: 1 }}>Generate invite code</Text>
            </Pressable>
          )}

          <Text className="text-xs font-bold uppercase mb-2" style={{ color: theme.muted, letterSpacing: 2 }}>Or accept a code</Text>
          <View className="flex-row">
            <TextInput value={code} onChangeText={(t) => setCode(t.toUpperCase())}
              placeholder="XXXXXXXX"
              placeholderTextColor={theme.textDim}
              autoCapitalize="characters"
              className="flex-1 rounded-lg p-3 mr-2"
              style={{ backgroundColor: theme.surface, color: theme.text, borderWidth: 1, borderColor: theme.hairline, letterSpacing: 3 }}
            />
            <Pressable onPress={handleAccept} disabled={busy || !code.trim()}
              className="px-4 py-3 rounded-lg items-center justify-center" style={{ backgroundColor: theme.accent }}>
              <Text className="font-bold uppercase" style={{ color: theme.onAccent, letterSpacing: 1 }}>Accept</Text>
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
};
