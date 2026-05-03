import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { ChevronLeft, ChevronDown, Check, Sliders } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import {
  useStore,
  type Tone,
  type ReligiousLevel,
  type MotivationStyle,
  type AccountabilityMode,
  type LifeStage,
  type TriggerTag,
  type RiskTime,
  type RecoveryStage,
  type Intensity,
  type LearningStyle,
  type PrivacyLevel,
  type Language,
  type PersonalityProfile,
} from '../store/useStore';

// =============================================================================
// Personalization — all 12 axes editable in one place (§3).
// Collapsible cards; inline chip-select; "Custom" fallback on each.
// =============================================================================

interface Props {
  onBack: () => void;
}

type AxisKey =
  | 'recoveryStage'
  | 'religiousLevel'
  | 'tone'
  | 'motivationStyle'
  | 'primaryTriggers'
  | 'riskTimeOfDay'
  | 'lifeStage'
  | 'intensity'
  | 'learningStyle'
  | 'accountabilityMode'
  | 'privacyLevel'
  | 'language';

interface AxisConfig {
  key: AxisKey;
  label: string;
  desc: string;
  options: { id: string; label: string }[];
  multi?: boolean;
  allowCustom?: boolean;
  customField?: keyof PersonalityProfile;
}

const AXES: AxisConfig[] = [
  {
    key: 'recoveryStage',
    label: 'Recovery stage',
    desc: 'Where you are right now.',
    options: [
      { id: 'day-one', label: 'Day one' },
      { id: 'restarting', label: 'Restarting' },
      { id: 'maintenance', label: 'Maintenance' },
      { id: 'severe-relapse-rebuild', label: 'Rebuilding' },
      { id: 'helping-friend', label: 'Helping someone' },
    ],
    allowCustom: true,
    customField: 'customRecoveryStage',
  },
  {
    key: 'religiousLevel',
    label: 'Frame',
    desc: 'Filters content tone.',
    options: [
      { id: 'secular', label: 'Secular' },
      { id: 'traditional', label: 'Traditional' },
      { id: 'baal-teshuva', label: 'Baal teshuva' },
      { id: 'modern-orthodox', label: 'Modern Orthodox' },
      { id: 'chassidish', label: 'Chassidish' },
      { id: 'chareidi', label: 'Chareidi / Yeshivish' },
      { id: 'other', label: 'Other / spiritual' },
    ],
    allowCustom: true,
    customField: 'customReligious',
  },
  {
    key: 'tone',
    label: 'Tone',
    desc: 'How the app speaks.',
    options: [
      { id: 'gentle', label: 'Gentle' },
      { id: 'harsh', label: 'Harsh' },
      { id: 'spiritual', label: 'Spiritual' },
      { id: 'clinical', label: 'Clinical' },
    ],
    allowCustom: true,
    customField: 'customTone',
  },
  {
    key: 'motivationStyle',
    label: 'Motivation',
    desc: 'Carrots, sticks, or neither.',
    options: [
      { id: 'incentive', label: 'Incentive' },
      { id: 'punishment', label: 'Punishment' },
      { id: 'mixed', label: 'Mixed' },
      { id: 'pure-discipline', label: 'Pure discipline' },
    ],
    allowCustom: true,
    customField: 'customMotivation',
  },
  {
    key: 'primaryTriggers',
    label: 'Primary triggers',
    desc: 'Select all that apply.',
    multi: true,
    options: [
      { id: 'stress', label: 'Stress' },
      { id: 'loneliness', label: 'Loneliness' },
      { id: 'boredom', label: 'Boredom' },
      { id: 'fatigue', label: 'Fatigue' },
      { id: 'visual', label: 'Visual' },
      { id: 'late-night', label: 'Late night' },
      { id: 'rejection', label: 'Rejection' },
      { id: 'success', label: 'After success' },
      { id: 'travel', label: 'Travel' },
      { id: 'conflict', label: 'Conflict' },
    ],
  },
  {
    key: 'riskTimeOfDay',
    label: 'Risk time of day',
    desc: 'When urges hit hardest.',
    options: [
      { id: 'morning', label: 'Morning' },
      { id: 'midday', label: 'Midday' },
      { id: 'evening', label: 'Evening' },
      { id: 'late-night', label: 'Late night' },
    ],
  },
  {
    key: 'lifeStage',
    label: 'Life stage',
    desc: 'Shapes context only.',
    options: [
      { id: 'single', label: 'Single' },
      { id: 'dating', label: 'Dating' },
      { id: 'engaged', label: 'Engaged' },
      { id: 'married', label: 'Married' },
      { id: 'married-kids', label: 'Married w/ kids' },
      { id: 'divorced', label: 'Divorced' },
      { id: 'widowed', label: 'Widowed' },
    ],
    allowCustom: true,
    customField: 'customLifeStage',
  },
  {
    key: 'intensity',
    label: 'Intensity',
    desc: 'Pace you want.',
    options: [
      { id: 'gentle', label: 'Gentle' },
      { id: 'standard', label: 'Standard' },
      { id: 'hardcore', label: 'Hardcore' },
      { id: 'monk-mode', label: 'Monk mode' },
    ],
    allowCustom: true,
    customField: 'customIntensity',
  },
  {
    key: 'learningStyle',
    label: 'Learning style',
    desc: 'How content is presented.',
    options: [
      { id: 'read', label: 'Read' },
      { id: 'listen', label: 'Listen' },
      { id: 'watch', label: 'Watch' },
      { id: 'do', label: 'Do' },
      { id: 'talk', label: 'Talk' },
    ],
    allowCustom: true,
    customField: 'customLearningStyle',
  },
  {
    key: 'accountabilityMode',
    label: 'Accountability',
    desc: 'Who is in this with you.',
    options: [
      { id: 'solo', label: 'Solo' },
      { id: 'partner', label: 'Partner' },
      { id: 'group', label: 'Group' },
      { id: 'anonymous-community', label: 'Anonymous community' },
      { id: 'sponsor', label: 'Sponsor' },
    ],
    allowCustom: true,
    customField: 'customAccountability',
  },
  {
    key: 'privacyLevel',
    label: 'Sharing level',
    desc: 'What partners/groups see.',
    options: [
      { id: 'fully-private', label: 'Fully private' },
      { id: 'partner-aggregate', label: 'Partner: streak only' },
      { id: 'partner-detailed', label: 'Partner: detailed' },
      { id: 'anonymous-group', label: 'Anonymous in group' },
    ],
    allowCustom: true,
    customField: 'customPrivacy',
  },
  {
    key: 'language',
    label: 'Language',
    desc: 'UI language.',
    options: [
      { id: 'en', label: 'English' },
      { id: 'he', label: 'עברית' },
      { id: 'yi', label: 'ייִדיש' },
      { id: 'es', label: 'Español' },
      { id: 'fr', label: 'Français' },
    ],
  },
];

export const PersonalizationScreen: React.FC<Props> = ({ onBack }) => {
  const { personalityProfile, updateProfile } = useStore();
  const theme = useTheme();
  const [expanded, setExpanded] = useState<AxisKey | null>(null);

  const getValue = (axis: AxisConfig): string | string[] | null => {
    const v = personalityProfile[axis.key];
    if (Array.isArray(v)) return v as string[];
    return (v ?? null) as string | null;
  };

  const displayValue = (axis: AxisConfig): string => {
    const v = getValue(axis);
    if (axis.multi) {
      const arr = (v as string[]) ?? [];
      if (arr.length === 0) return 'Not set';
      if (arr.length <= 2) return arr.map((id) => axis.options.find((o) => o.id === id)?.label ?? id).join(', ');
      return `${arr.length} selected`;
    }
    if (v === null || v === undefined) return 'Not set';
    if (v === 'custom' && axis.customField) {
      const custom = personalityProfile[axis.customField];
      if (typeof custom === 'string' && custom.trim()) return `Custom: ${custom}`;
      return 'Custom';
    }
    return axis.options.find((o) => o.id === v)?.label ?? String(v);
  };

  const setSingle = (axis: AxisConfig, id: string) => {
    // Strong-typed dispatch — the store merges partial updates
    updateProfile({ [axis.key]: id } as Partial<PersonalityProfile>);
  };

  const toggleMulti = (axis: AxisConfig, id: string) => {
    const current = (getValue(axis) as string[]) ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    updateProfile({ [axis.key]: next } as Partial<PersonalityProfile>);
  };

  const setCustom = (axis: AxisConfig, value: string) => {
    if (!axis.customField) return;
    updateProfile({ [axis.customField]: value } as Partial<PersonalityProfile>);
  };

  return (
    <Screen>
      <View className="flex-row items-center mb-4 mt-2">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: theme.hairline }}
        >
          <ChevronLeft size={18} color={theme.text} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-guard-accent text-xs font-black uppercase tracking-widest">
            Shape the app
          </Text>
          <Text className="text-2xl font-black text-white mt-0.5" style={{ fontFamily: 'Outfit' }}>
            Personalization
          </Text>
        </View>
        <Sliders size={20} color={theme.accent} />
      </View>

      <Text className="text-white/50 text-sm mb-5 leading-6">
        All 12 dimensions. Change anything, anytime. Affects content, coach tone, and prompts.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {AXES.map((axis) => {
          const isOpen = expanded === axis.key;
          const currentValue = getValue(axis);
          const isCustomSelected =
            !axis.multi && currentValue === 'custom' && axis.customField !== undefined;

          return (
            <View
              key={axis.key}
              className="rounded-2xl mb-3 overflow-hidden"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: isOpen ? 'rgba(232,160,32,0.4)' : theme.hairline,
              }}
            >
              <Pressable
                onPress={() => setExpanded(isOpen ? null : axis.key)}
                className="flex-row items-center p-4"
              >
                <View className="flex-1">
                  <Text className="text-white font-black text-base">{axis.label}</Text>
                  <Text className="text-white/50 text-xs mt-0.5">{displayValue(axis)}</Text>
                </View>
                <MotiView
                  animate={{ rotate: isOpen ? '180deg' : '0deg' }}
                  transition={{ type: 'timing', duration: 200 }}
                >
                  <ChevronDown size={18} color={theme.textDim} />
                </MotiView>
              </Pressable>

              <AnimatePresence>
                {isOpen && (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' as any }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'timing', duration: 200 }}
                    className="px-4 pb-4"
                  >
                    <Text className="text-white/40 text-xs mb-3">{axis.desc}</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {axis.options.map((o) => {
                        const active = axis.multi
                          ? ((currentValue as string[]) ?? []).includes(o.id)
                          : currentValue === o.id;
                        return (
                          <Pressable
                            key={o.id}
                            onPress={() =>
                              axis.multi ? toggleMulti(axis, o.id) : setSingle(axis, o.id)
                            }
                            className="rounded-full px-3.5 py-2"
                            style={{
                              backgroundColor: active ? theme.accent : theme.hairline,
                              borderWidth: 1,
                              borderColor: active ? theme.accent : theme.hairline,
                            }}
                          >
                            <View className="flex-row items-center">
                              {active && <Check size={12} color={theme.onAccent} style={{ marginRight: 4 }} />}
                              <Text
                                className="text-xs font-bold"
                                style={{ color: active ? theme.onAccent : theme.mutedStrong }}
                              >
                                {o.label}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                      {axis.allowCustom && !axis.multi && (
                        <Pressable
                          onPress={() => setSingle(axis, 'custom')}
                          className="rounded-full px-3.5 py-2"
                          style={{
                            backgroundColor: isCustomSelected
                              ? theme.accent
                              : theme.hairline,
                            borderWidth: 1,
                            borderStyle: 'dashed',
                            borderColor: isCustomSelected ? theme.accent : theme.hairline,
                          }}
                        >
                          <Text
                            className="text-xs font-bold"
                            style={{
                              color: isCustomSelected ? theme.onAccent : theme.text,
                            }}
                          >
                            Custom
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    {axis.allowCustom && isCustomSelected && axis.customField && (
                      <TextInput
                        value={
                          (personalityProfile[axis.customField] as string | undefined) ?? ''
                        }
                        onChangeText={(v) => setCustom(axis, v)}
                        placeholder="Describe your custom value..."
                        placeholderTextColor={theme.textDim}
                        className="text-white rounded-xl px-3 py-2 mt-3"
                        style={{
                          backgroundColor: theme.hairline,
                          borderWidth: 1,
                          borderColor: 'rgba(232,160,32,0.3)',
                          fontSize: 13,
                        }}
                      />
                    )}
                  </MotiView>
                )}
              </AnimatePresence>
            </View>
          );
        })}

        <View
          className="rounded-2xl p-4 my-4"
          style={{
            backgroundColor: 'rgba(232,160,32,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(232,160,32,0.25)',
          }}
        >
          <Text className="text-white/70 text-xs leading-5 italic">
            Changes apply instantly. The coach, content library, and prompts all adapt.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
};

// Silence unused-type warnings in strict mode — these are imported for the
// PersonalityProfile shape used above.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _Unused =
  | Tone
  | ReligiousLevel
  | MotivationStyle
  | AccountabilityMode
  | LifeStage
  | TriggerTag
  | RiskTime
  | RecoveryStage
  | Intensity
  | LearningStyle
  | PrivacyLevel
  | Language;
