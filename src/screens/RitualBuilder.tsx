import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, TextInput, Alert } from 'react-native';
import { MotiView } from 'moti';
import {
  ArrowLeft,
  Plus,
  ChevronUp,
  ChevronDown,
  Check,
  Play,
  Trash2,
  Clock,
  X as XIcon,
  Sparkles,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';

interface Props {
  onBack: () => void;
}

// Validates an HH:mm 24h time string.
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const validateTime = (t: string) => TIME_RE.test(t);

// Suggestions seeded by the setup prompt — three sensible starter rituals
// covering the three highest-leverage windows (morning anchor, evening
// wind-down, danger-window steady).
const SETUP_SUGGESTIONS = [
  { text: 'Modeh Ani — out loud, with kavanah', time: '07:00' },
  { text: 'Read your mantra', time: '13:00' },
  { text: '10 min learning before bed', time: '22:00' },
];

export const RitualBuilder: React.FC<Props> = ({ onBack }) => {
  const {
    rituals,
    addRitual,
    toggleRitual,
    reorderRituals,
    completeRitual,
    ritualStreak,
    setRitualTime,
  } = useStore();
  const theme = useTheme();
  const [draft, setDraft] = useState('');
  const [flowStep, setFlowStep] = useState<number | null>(null);
  const [editingTimeFor, setEditingTimeFor] = useState<string | null>(null);
  const [timeDraft, setTimeDraft] = useState('');
  const [timeError, setTimeError] = useState('');
  const [setupDismissed, setSetupDismissed] = useState(false);

  const enabled = rituals.filter((r) => r.enabled);
  const anyHasTime = useMemo(
    () => rituals.some((r) => r.enabled && !!r.scheduledTime),
    [rituals],
  );
  const showSetupPrompt = !anyHasTime && !setupDismissed;

  const move = (index: number, dir: -1 | 1) => {
    const next = [...rituals];
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= next.length) return;
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    reorderRituals(next);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove ritual?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => reorderRituals(rituals.filter((r) => r.id !== id)),
      },
    ]);
  };

  const handleAdd = () => {
    const text = draft.trim();
    if (!text) return;
    addRitual(text);
    setDraft('');
  };

  const openTimeEditor = (id: string, current?: string) => {
    setEditingTimeFor(id);
    setTimeDraft(current ?? '');
    setTimeError('');
  };

  const commitTime = () => {
    if (!editingTimeFor) return;
    const v = timeDraft.trim();
    if (v === '') {
      setRitualTime(editingTimeFor, null);
      setEditingTimeFor(null);
      return;
    }
    if (!validateTime(v)) {
      setTimeError('Use HH:mm (e.g. 07:30)');
      return;
    }
    setRitualTime(editingTimeFor, v);
    setEditingTimeFor(null);
  };

  const clearTime = (id: string) => setRitualTime(id, null);

  const runSetup = () => {
    // Seed the three starter rituals if they don't exist; set their time
    // either way. Match by exact text since we don't have stable seed ids.
    for (const s of SETUP_SUGGESTIONS) {
      const existing = rituals.find((r) => r.text === s.text);
      if (existing) {
        setRitualTime(existing.id, s.time);
        if (!existing.enabled) toggleRitual(existing.id);
      } else {
        // addRitual generates id internally; we set the time by reading the
        // store state right after. To avoid the race, do it via the next
        // tick — Zustand updates are synchronous, so reading right after
        // addRitual works.
        addRitual(s.text);
        const fresh = useStore.getState().rituals.find((r) => r.text === s.text && r.enabled);
        if (fresh) setRitualTime(fresh.id, s.time);
      }
    }
    setSetupDismissed(true);
  };

  const startFlow = () => {
    if (enabled.length === 0) {
      Alert.alert('No rituals', 'Enable at least one ritual first.');
      return;
    }
    setFlowStep(0);
  };

  const nextFlow = () => {
    if (flowStep === null) return;
    if (flowStep + 1 >= enabled.length) {
      completeRitual();
      setFlowStep(null);
      Alert.alert('Complete', `Morning ritual done. Streak: ${ritualStreak + 1}`);
    } else {
      setFlowStep(flowStep + 1);
    }
  };

  if (flowStep !== null) {
    const progress = ((flowStep + 1) / enabled.length) * 100;
    return (
      <Screen>
        <View className="flex-row items-center justify-between mb-8">
          <Text className="text-guard-accent text-xs uppercase tracking-widest">
            Step {flowStep + 1} of {enabled.length}
          </Text>
          <Pressable onPress={() => setFlowStep(null)}>
            <Text className="text-white/50 text-xs">Exit</Text>
          </Pressable>
        </View>

        <View className="h-1 bg-white/10 rounded-full mb-12">
          <MotiView
            animate={{ width: `${progress}%` as any }}
            transition={{ type: 'timing', duration: 300 }}
            className="h-full bg-guard-accent rounded-full"
          />
        </View>

        <View className="flex-1 items-center justify-center">
          <Text className="text-4xl font-black text-white text-center leading-tight">
            {enabled[flowStep].text}
          </Text>
          {enabled[flowStep].scheduledTime && (
            <View
              style={{
                marginTop: 16,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: 'rgba(232,160,32,0.15)',
                borderWidth: 1,
                borderColor: 'rgba(232,160,32,0.4)',
              }}
            >
              <Text style={{ color: theme.accent, fontWeight: '800', letterSpacing: 1.5, fontSize: 11 }}>
                DAILY · {enabled[flowStep].scheduledTime}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={nextFlow}
          className="py-5 rounded-2xl bg-guard-accent flex-row items-center justify-center"
        >
          <Check size={20} color={theme.onAccent} />
          <Text className="ml-2 font-black uppercase tracking-widest text-guard-on-accent">
            {flowStep + 1 >= enabled.length ? 'Finish' : 'Done — Next'}
          </Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-row items-center mb-6">
        <Pressable onPress={onBack} className="w-10 h-10 rounded-xl bg-guard-surface items-center justify-center mr-3">
          <ArrowLeft size={18} color={theme.text} />
        </Pressable>
        <Text className="text-2xl font-black text-white">Morning Ritual</Text>
      </View>

      <View className="bg-guard-primary/10 border border-guard-primary/30 rounded-3xl p-5 mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white/50 text-xs uppercase tracking-widest">Ritual streak</Text>
          <Text className="text-white text-3xl font-black">{ritualStreak}</Text>
        </View>
        <Pressable onPress={startFlow} className="bg-guard-accent px-5 py-3 rounded-2xl flex-row items-center">
          <Play size={14} color={theme.onAccent} />
          <Text className="ml-2 font-black uppercase text-guard-on-accent">Start</Text>
        </Pressable>
      </View>

      {/* Setup prompt — only shown until the user has at least one timed ritual
          or explicitly dismisses. The user's feedback was this section was
          "golden but hidden" — so we surface a one-tap setup that drops three
          sensible defaults with times. */}
      {showSetupPrompt && (
        <View
          className="mb-4 p-5 rounded-3xl"
          style={{
            backgroundColor: 'rgba(232,160,32,0.10)',
            borderWidth: 1,
            borderColor: 'rgba(232,160,32,0.35)',
          }}
        >
          <View className="flex-row items-center mb-2">
            <Sparkles size={16} color={theme.accent} />
            <Text className="text-guard-accent font-black uppercase ml-2 text-xs" style={{ letterSpacing: 2 }}>
              Quick setup
            </Text>
          </View>
          <Text className="text-white font-black text-base mb-1">Want a one-tap starter flow?</Text>
          <Text className="text-white/60 text-xs leading-5 mb-3">
            Adds three rituals with times — morning, midday, evening. You can edit anything.
          </Text>
          {SETUP_SUGGESTIONS.map((s) => (
            <View key={s.text} className="flex-row items-center mb-1.5">
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent, marginRight: 8 }} />
              <Text className="text-white/80 text-xs flex-1">{s.text}</Text>
              <Text className="text-white/40 text-[10px] font-mono">{s.time}</Text>
            </View>
          ))}
          <View className="flex-row gap-2 mt-3">
            <Pressable
              onPress={runSetup}
              className="flex-1 py-3 rounded-2xl items-center"
              style={{ backgroundColor: theme.accent }}
            >
              <Text className="font-black uppercase text-xs tracking-widest" style={{ color: theme.onAccent }}>
                Set it up
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSetupDismissed(true)}
              className="px-5 py-3 rounded-2xl items-center"
              style={{ backgroundColor: theme.surface2 }}
            >
              <Text className="font-bold uppercase text-xs tracking-widest" style={{ color: theme.muted }}>
                Skip
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <View className="bg-guard-surface border border-guard-primary/30 rounded-3xl p-5 mb-6">
        <Text className="text-guard-accent text-xs uppercase tracking-widest mb-3">Add step</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="e.g. Drink a glass of water"
          placeholderTextColor={theme.textDim}
          className="bg-guard-bg border border-guard-primary/30 rounded-2xl px-4 py-3 text-white mb-3"
        />
        <Pressable
          onPress={handleAdd}
          disabled={!draft.trim()}
          className={`py-3 rounded-2xl flex-row items-center justify-center ${
            draft.trim() ? 'bg-guard-accent' : 'bg-white/5'
          }`}
        >
          <Plus size={16} color={draft.trim() ? theme.onAccent : theme.textDim} />
          <Text className={`ml-2 font-black uppercase ${draft.trim() ? 'text-guard-on-accent' : 'text-white/30'}`}>
            Add
          </Text>
        </Pressable>
      </View>

      {rituals.map((r, i) => (
        <View
          key={r.id}
          className="bg-guard-surface border border-guard-primary/30 rounded-2xl p-3 mb-2"
        >
          <View className="flex-row items-center">
            <View className="flex-col mr-2">
              <Pressable onPress={() => move(i, -1)} className="p-1">
                <ChevronUp size={14} color={theme.textDim} />
              </Pressable>
              <Pressable onPress={() => move(i, 1)} className="p-1">
                <ChevronDown size={14} color={theme.textDim} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => toggleRitual(r.id)}
              className={`w-6 h-6 rounded-lg mr-3 items-center justify-center ${
                r.enabled ? 'bg-guard-accent' : 'bg-white/10'
              }`}
            >
              {r.enabled && <Check size={14} color={theme.onAccent} />}
            </Pressable>
            <Text className={`flex-1 ${r.enabled ? 'text-white' : 'text-white/40'}`}>{r.text}</Text>
            <Pressable onPress={() => handleDelete(r.id)} className="p-2">
              <Trash2 size={14} color={theme.danger} />
            </Pressable>
          </View>

          {/* Time chip — visible when ritual is enabled */}
          {r.enabled && (
            <View className="flex-row items-center mt-2 ml-12">
              {r.scheduledTime ? (
                <Pressable
                  onPress={() => openTimeEditor(r.id, r.scheduledTime)}
                  className="flex-row items-center px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: 'rgba(232,160,32,0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(232,160,32,0.40)',
                  }}
                >
                  <Clock size={11} color={theme.accent} />
                  <Text style={{ color: theme.accent, fontWeight: '800', marginLeft: 6, fontSize: 11, fontVariant: ['tabular-nums'] }}>
                    Daily {r.scheduledTime}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => openTimeEditor(r.id, '')}
                  className="flex-row items-center px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: theme.surface2,
                    borderWidth: 1,
                    borderColor: theme.hairline,
                  }}
                >
                  <Clock size={11} color={theme.muted} />
                  <Text style={{ color: theme.muted, fontWeight: '700', marginLeft: 6, fontSize: 11 }}>
                    Set time
                  </Text>
                </Pressable>
              )}
              {r.scheduledTime && (
                <Pressable onPress={() => clearTime(r.id)} className="ml-1 p-1.5">
                  <XIcon size={12} color={theme.muted} />
                </Pressable>
              )}
            </View>
          )}

          {/* Inline time editor — appears when this ritual's time-chip is
              tapped. Uses HH:mm validation matching ReminderSettingsScreen. */}
          {editingTimeFor === r.id && (
            <View className="mt-3 ml-12">
              <TextInput
                value={timeDraft}
                onChangeText={(t) => {
                  setTimeDraft(t);
                  if (timeError) setTimeError('');
                }}
                placeholder="07:00"
                placeholderTextColor={theme.textDim}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                autoFocus
                className="bg-guard-bg border border-guard-primary/30 rounded-xl px-3 py-2 text-white"
                style={{ width: 100, textAlign: 'center', fontVariant: ['tabular-nums'] }}
              />
              {timeError ? (
                <Text className="text-guard-danger text-[10px] mt-1">{timeError}</Text>
              ) : null}
              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={commitTime}
                  className="px-4 py-2 rounded-xl"
                  style={{ backgroundColor: theme.accent }}
                >
                  <Text className="font-black uppercase text-[10px]" style={{ color: theme.onAccent, letterSpacing: 1.5 }}>
                    Save
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setEditingTimeFor(null)}
                  className="px-4 py-2 rounded-xl"
                  style={{ backgroundColor: theme.surface2 }}
                >
                  <Text className="font-bold uppercase text-[10px]" style={{ color: theme.muted, letterSpacing: 1.5 }}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      ))}
    </Screen>
  );
};
