import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { ArrowLeft, Dumbbell, NotebookPen, Lock, BookOpen, Trash2, Check } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore, type DisciplineType } from '../store/useStore';
import { useTheme } from '../constants/theme';

// =============================================================================
// DisciplineSetupScreen — user defines a self-imposed consequence rule.
//
// Framed as agency, never shame. The premise: a fall is followed by a clear
// act of self-restoration rather than a void. The user pre-commits when they
// are strong; the post-fall protocol step 7 surfaces the rule when it counts.
//
// Four archetypes:
//   - PHYSICAL    — pushups, cold shower, run
//   - REFLECTIVE  — write a letter, longer coach session
//   - RESTRICTIVE — no social media for 24h, app lockdown
//   - SPIRITUAL   — extra learning, Tehillim, charity commitment
//
// Copy reviewed for tone: never punitive, always "I choose this for myself."
// =============================================================================

interface Props {
  onBack: () => void;
}

interface ArchetypeMeta {
  id: DisciplineType;
  label: string;
  icon: any;
  blurb: string;
  examples: string[];
  defaultDuration: number;
}

const ARCHETYPES: ArchetypeMeta[] = [
  {
    id: 'physical',
    label: 'Physical',
    icon: Dumbbell,
    blurb: 'Channel the energy into your body. Discomfort restores agency.',
    examples: [
      '50 pushups within 1 hour',
      '5-minute cold shower today',
      'A 30-minute walk before sundown',
    ],
    defaultDuration: 6,
  },
  {
    id: 'reflective',
    label: 'Reflective',
    icon: NotebookPen,
    blurb: 'Process what happened on paper. The fall becomes information.',
    examples: [
      'Write a letter to yourself about what triggered this',
      '20-minute coach session on this fall',
      'Three pages of journal — what I felt and what I learned',
    ],
    defaultDuration: 24,
  },
  {
    id: 'restrictive',
    label: 'Restrictive',
    icon: Lock,
    blurb: 'Remove a trigger you control. The discipline is in the constraint.',
    examples: [
      'No social media for 24 hours',
      'Phone in another room from 9pm tonight',
      'No screens before noon tomorrow',
    ],
    defaultDuration: 24,
  },
  {
    id: 'spiritual',
    label: 'Spiritual',
    icon: BookOpen,
    blurb: 'Channel inward and upward. Avodah where the void was.',
    examples: [
      '20 minutes of learning before bed tonight',
      'Say full Tehillim 51 with kavanah',
      'Give tzedakah ($5+) within the hour',
    ],
    defaultDuration: 12,
  },
];

const DURATION_OPTIONS = [1, 3, 6, 12, 24, 48];

export const DisciplineSetupScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const { disciplineRule, setDisciplineRule } = useStore();

  const [type, setType] = useState<DisciplineType | null>(disciplineRule?.type ?? null);
  const [body, setBody] = useState(disciplineRule?.body ?? '');
  const [duration, setDuration] = useState<number>(disciplineRule?.durationHours ?? 6);

  const selected = ARCHETYPES.find((a) => a.id === type) ?? null;

  const handleSave = () => {
    if (!type || !body.trim()) {
      Alert.alert('Almost', 'Pick a type and write your commitment.');
      return;
    }
    setDisciplineRule({
      type,
      body: body.trim(),
      durationHours: duration,
      createdAt: disciplineRule?.createdAt ?? new Date().toISOString(),
    });
    onBack();
  };

  const handleClear = () => {
    Alert.alert(
      'Clear your discipline rule?',
      'No judgment. You can set a new one anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setDisciplineRule(null);
            onBack();
          },
        },
      ],
    );
  };

  const useExample = (text: string) => setBody(text);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={onBack}
            className="w-10 h-10 rounded-xl bg-guard-surface items-center justify-center mr-3"
          >
            <ArrowLeft size={18} color={theme.text} />
          </Pressable>
          <Text className="text-2xl font-black text-white">Discipline</Text>
        </View>

        <View
          className="rounded-3xl p-5 mb-5"
          style={{
            backgroundColor: 'rgba(232,160,32,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(232,160,32,0.30)',
          }}
        >
          <Text className="font-black text-sm mb-2" style={{ color: theme.accent, letterSpacing: 2 }}>
            THIS IS NOT PUNISHMENT.
          </Text>
          <Text className="text-sm leading-5" style={{ color: theme.muted }}>
            It's a promise you make to yourself <Text style={{ color: theme.text, fontWeight: '700' }}>now</Text>, while you're strong — so a fall is followed by a clear act of restoration rather than a void. You set the rule. You choose the cost. That's the whole point.
          </Text>
        </View>

        <Text
          className="text-xs font-black uppercase mb-3"
          style={{ color: theme.accent, letterSpacing: 2 }}
        >
          1. Pick a type
        </Text>
        {ARCHETYPES.map((arch) => {
          const Icon = arch.icon;
          const active = type === arch.id;
          return (
            <Pressable
              key={arch.id}
              onPress={() => {
                setType(arch.id);
                if (!disciplineRule || disciplineRule.type !== arch.id) {
                  setDuration(arch.defaultDuration);
                }
              }}
              className="rounded-2xl p-4 mb-2 flex-row items-start"
              style={{
                backgroundColor: active ? theme.surface : theme.surface2,
                borderWidth: 1,
                borderColor: active ? theme.accent : theme.hairline,
              }}
            >
              <View
                className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                style={{
                  backgroundColor: active ? 'rgba(232,160,32,0.20)' : theme.surface2,
                }}
              >
                <Icon size={20} color={active ? theme.accent : theme.muted} />
              </View>
              <View className="flex-1">
                <Text className="font-black text-base mb-1" style={{ color: theme.text }}>
                  {arch.label}
                </Text>
                <Text className="text-xs leading-5" style={{ color: theme.muted }}>
                  {arch.blurb}
                </Text>
              </View>
              {active && <Check size={16} color={theme.accent} style={{ marginTop: 4 }} />}
            </Pressable>
          );
        })}

        {selected && (
          <>
            <Text
              className="text-xs font-black uppercase mt-6 mb-3"
              style={{ color: theme.accent, letterSpacing: 2 }}
            >
              2. Write your commitment
            </Text>
            <Text className="text-xs leading-5 mb-3" style={{ color: theme.muted }}>
              Your exact words. Specific. Concrete. The kind of thing you can mark "done."
            </Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="If I fall, I will..."
              placeholderTextColor={theme.textDim}
              multiline
              className="rounded-2xl px-4 py-3 mb-3"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.hairline,
                color: theme.text,
                minHeight: 90,
                textAlignVertical: 'top',
                fontSize: 14,
                lineHeight: 22,
              }}
            />
            <Text
              className="text-[10px] font-black uppercase mb-2"
              style={{ color: theme.muted, letterSpacing: 2 }}
            >
              Examples — tap to use
            </Text>
            {selected.examples.map((ex, i) => (
              <Pressable
                key={i}
                onPress={() => useExample(ex)}
                className="rounded-xl px-3 py-2 mb-1.5"
                style={{
                  backgroundColor: theme.surface2,
                  borderWidth: 1,
                  borderColor: theme.hairline,
                }}
              >
                <Text className="text-xs" style={{ color: theme.text }}>
                  {ex}
                </Text>
              </Pressable>
            ))}

            <Text
              className="text-xs font-black uppercase mt-6 mb-3"
              style={{ color: theme.accent, letterSpacing: 2 }}
            >
              3. Within how long?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DURATION_OPTIONS.map((h) => {
                const active = duration === h;
                return (
                  <Pressable
                    key={h}
                    onPress={() => setDuration(h)}
                    className="px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: active ? theme.accent : theme.surface,
                      borderWidth: 1,
                      borderColor: active ? theme.accent : theme.hairline,
                    }}
                  >
                    <Text
                      className="font-black text-xs"
                      style={{ color: active ? theme.onAccent : theme.text }}
                    >
                      {h < 24 ? `${h}h` : `${h / 24}d`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Pressable
          onPress={handleSave}
          disabled={!type || !body.trim()}
          className="rounded-2xl py-4 items-center mt-8"
          style={{
            backgroundColor: type && body.trim() ? theme.accent : theme.surface2,
          }}
        >
          <Text
            className="font-black uppercase tracking-widest"
            style={{
              color: type && body.trim() ? theme.onAccent : theme.muted,
              letterSpacing: 2,
            }}
          >
            {disciplineRule ? 'Update commitment' : 'Set my commitment'}
          </Text>
        </Pressable>

        {disciplineRule && (
          <Pressable
            onPress={handleClear}
            className="rounded-2xl py-3 items-center mt-2 flex-row justify-center"
          >
            <Trash2 size={13} color={theme.danger} />
            <Text
              className="font-bold uppercase text-xs ml-2"
              style={{ color: theme.danger, letterSpacing: 2 }}
            >
              Clear my rule
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
};
