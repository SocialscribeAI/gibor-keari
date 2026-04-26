import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Share,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { MotiView } from 'moti';
import {
  Lock,
  Download,
  Trash2,
  ShieldCheck,
  ArrowLeft,
  FileText,
  Wifi,
  Server,
  Eye,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import { COLORS } from '../constants/theme';

interface Props {
  onBack: () => void;
}

const PROMISES = [
  {
    icon: Server,
    title: 'No server. No database. No account.',
    body: "Guard has nothing to store your data in. We literally do not have a place on the internet where your information could live. It lives on your phone.",
  },
  {
    icon: Wifi,
    title: 'No network calls with your data.',
    body: "The only time anything leaves your phone is (1) if you choose to use an AI coach — it goes to the provider you picked, with your key — or (2) if you pair with a partner, encrypted phone-to-phone. That's it.",
  },
  {
    icon: Eye,
    title: 'No analytics. No telemetry. No crash reports.',
    body: "We don't know you opened the app. We don't know how long you use it. We don't know you exist. That is the design.",
  },
  {
    icon: ShieldCheck,
    title: 'You can take it all, or burn it all.',
    body: "Export every byte we have on you as a JSON file. Or delete everything forever with two taps. Both buttons are below.",
  },
];

export const YourDataScreen: React.FC<Props> = ({ onBack }) => {
  const { exportAllData, deleteAllData } = useStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleExport = async () => {
    const json = exportAllData();
    if (Platform.OS === 'web') {
      // Web: trigger a file download
      try {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guard-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e) {
        Alert.alert('Export failed', String(e));
      }
    } else {
      try {
        await Share.share({
          title: 'Guard — my data export',
          message: json,
        });
      } catch (e) {
        Alert.alert('Export failed', String(e));
      }
    }
  };

  const handleDelete = () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE EVERYTHING') {
      Alert.alert(
        'Not confirmed',
        "Type exactly: DELETE EVERYTHING"
      );
      return;
    }
    deleteAllData();
    setConfirmOpen(false);
    setConfirmText('');
    Alert.alert('Gone.', 'Every trace is gone from this device.');
    onBack();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={onBack}
            className="mr-3 p-2 rounded-full"
            style={{ backgroundColor: COLORS.surface }}
          >
            <ArrowLeft size={20} color={COLORS.text} />
          </Pressable>
          <View className="flex-1">
            <Text
              className="text-2xl font-bold"
              style={{ color: COLORS.text, fontFamily: 'Outfit' }}
            >
              Your Data
            </Text>
            <Text
              className="text-sm mt-1"
              style={{ color: COLORS.textMuted }}
            >
              What's stored, where, and your two buttons.
            </Text>
          </View>
        </View>

        {/* Big lock hero */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          className="items-center justify-center rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: 'rgba(30, 138, 74, 0.12)',
            borderWidth: 1,
            borderColor: 'rgba(30, 138, 74, 0.35)',
          }}
        >
          <View
            className="items-center justify-center rounded-full mb-3"
            style={{
              width: 72,
              height: 72,
              backgroundColor: 'rgba(30, 138, 74, 0.25)',
            }}
          >
            <Lock size={36} color={COLORS.success} />
          </View>
          <Text
            className="text-lg font-bold text-center"
            style={{ color: COLORS.text, fontFamily: 'Outfit' }}
          >
            Nothing about you leaves this phone.
          </Text>
          <Text
            className="text-sm text-center mt-2"
            style={{ color: COLORS.textMuted, lineHeight: 20 }}
          >
            Not your streak. Not your falls. Not your journal. Not your triggers. Not your partner's name. None of it. Ever.
          </Text>
        </MotiView>

        {/* Promises */}
        {PROMISES.map((p, i) => (
          <MotiView
            key={p.title}
            from={{ opacity: 0, translateX: -10 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 350, delay: 80 * i }}
            className="rounded-2xl p-4 mb-3 flex-row"
            style={{ backgroundColor: COLORS.surface }}
          >
            <View
              className="items-center justify-center rounded-full mr-3"
              style={{
                width: 40,
                height: 40,
                backgroundColor: 'rgba(232, 160, 32, 0.12)',
              }}
            >
              <p.icon size={20} color={COLORS.accent} />
            </View>
            <View className="flex-1">
              <Text
                className="font-semibold"
                style={{ color: COLORS.text, fontFamily: 'Outfit' }}
              >
                {p.title}
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: COLORS.textMuted, lineHeight: 19 }}
              >
                {p.body}
              </Text>
            </View>
          </MotiView>
        ))}

        {/* What's stored */}
        <View
          className="rounded-2xl p-4 mt-4"
          style={{ backgroundColor: COLORS.surface }}
        >
          <View className="flex-row items-center mb-2">
            <FileText size={18} color={COLORS.accent} />
            <Text
              className="ml-2 font-semibold"
              style={{ color: COLORS.text, fontFamily: 'Outfit' }}
            >
              What's stored on this phone
            </Text>
          </View>
          <Text
            className="text-sm"
            style={{ color: COLORS.textMuted, lineHeight: 19 }}
          >
            • Your streak, check-ins, wins, falls, close-calls{'\n'}
            • Your mantras, rituals, vows, identity statement{'\n'}
            • Your cost/benefit inventory, trigger map, watchlist{'\n'}
            • Your preferences (tone, religious frame, all 12 axes){'\n'}
            • Your AI coach history (if enabled) — never sent anywhere except the provider you chose with your own key{'\n'}
            • Your partner's pairing info (if enabled) — end-to-end encrypted
          </Text>
        </View>

        {/* Actions */}
        <Pressable
          onPress={handleExport}
          className="flex-row items-center justify-center rounded-2xl py-4 mt-6"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Download size={18} color={COLORS.text} />
          <Text
            className="ml-2 font-semibold"
            style={{ color: COLORS.text, fontFamily: 'Outfit' }}
          >
            Export everything as JSON
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setConfirmOpen(true)}
          className="flex-row items-center justify-center rounded-2xl py-4 mt-3"
          style={{
            backgroundColor: 'rgba(192, 57, 43, 0.12)',
            borderWidth: 1,
            borderColor: 'rgba(192, 57, 43, 0.4)',
          }}
        >
          <Trash2 size={18} color={COLORS.danger} />
          <Text
            className="ml-2 font-semibold"
            style={{ color: COLORS.danger, fontFamily: 'Outfit' }}
          >
            Delete everything forever
          </Text>
        </Pressable>

        <Text
          className="text-xs text-center mt-3"
          style={{ color: COLORS.textMuted }}
        >
          If this ever changes, the app will ask before the change and require
          your re-consent. Default posture: no network transmission of your data.
        </Text>
      </ScrollView>

      {/* Delete confirmation modal */}
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: COLORS.surface, maxWidth: 420 }}
          >
            <Text
              className="text-lg font-bold"
              style={{ color: COLORS.danger, fontFamily: 'Outfit' }}
            >
              Are you sure?
            </Text>
            <Text
              className="text-sm mt-2"
              style={{ color: COLORS.textMuted, lineHeight: 19 }}
            >
              This wipes your streak, your history, every log, every preference.
              There is no cloud backup. There is no undo.{'\n\n'}
              Type <Text style={{ color: COLORS.text, fontWeight: '700' }}>DELETE EVERYTHING</Text> below to confirm.
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="DELETE EVERYTHING"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
              className="rounded-xl px-3 py-3 mt-4"
              style={{
                backgroundColor: COLORS.background,
                color: COLORS.text,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
            <View className="flex-row mt-4">
              <Pressable
                onPress={() => {
                  setConfirmOpen(false);
                  setConfirmText('');
                }}
                className="flex-1 rounded-xl py-3 mr-2 items-center"
                style={{ backgroundColor: COLORS.background }}
              >
                <Text style={{ color: COLORS.text, fontFamily: 'Outfit' }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                className="flex-1 rounded-xl py-3 items-center"
                style={{ backgroundColor: COLORS.danger }}
              >
                <Text
                  style={{ color: COLORS.text, fontFamily: 'Outfit', fontWeight: '700' }}
                >
                  Delete forever
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};
