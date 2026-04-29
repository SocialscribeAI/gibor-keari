import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { ArrowRight, Check, Lock, ChevronLeft } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import {
  useStore,
  type Tone,
  type ReligiousLevel,
  type TriggerTag,
  type Intensity,
  type LearningStyle,
} from '../store/useStore';
import { useTheme, BRAND } from '../constants/theme';
import { LionMark } from '../components/LionMark';

// =============================================================================
// Onboarding — personality builder.
// Asks only for the axes the rest of the app actually consumes:
//   religious level, tone, triggers, intensity, learning style.
// Religious + tone are required; the rest are skippable and editable later
// from Profile → Personalization.
// =============================================================================

type Option<T> = { id: T; label: string; desc?: string };

const RELIGIOUS: Option<NonNullable<ReligiousLevel>>[] = [
  { id: 'secular', label: 'Secular', desc: 'Not observant. Cultural / agnostic.' },
  { id: 'traditional', label: 'Traditional', desc: 'Some mitzvos, not fully shomer.' },
  { id: 'baal-teshuva', label: 'Baal teshuva', desc: 'On the journey back \u2014 newer to observance.' },
  { id: 'modern-orthodox', label: 'Modern Orthodox' },
  { id: 'chassidish', label: 'Chassidish' },
  { id: 'chareidi', label: 'Chareidi / Yeshivish' },
  { id: 'other', label: 'Other / spiritual', desc: 'Jewish but doesn\u2019t fit above.' },
];

const TONES: Option<NonNullable<Tone>>[] = [
  { id: 'gentle', label: 'Gentle', desc: 'Encouragement. Patience.' },
  { id: 'harsh', label: 'Harsh', desc: 'Brutal honesty. No excuses.' },
  { id: 'spiritual', label: 'Spiritual', desc: 'Faith-rooted. Soulful.' },
  { id: 'clinical', label: 'Clinical', desc: 'Evidence-based. Neutral.' },
];

const TRIGGERS: Option<TriggerTag>[] = [
  { id: 'stress', label: 'Stress' },
  { id: 'loneliness', label: 'Loneliness' },
  { id: 'boredom', label: 'Boredom' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'visual', label: 'Visual cues' },
  { id: 'late-night', label: 'Late night' },
  { id: 'rejection', label: 'Rejection' },
  { id: 'success', label: 'After success' },
  { id: 'travel', label: 'Travel / alone' },
  { id: 'conflict', label: 'Conflict' },
];

const INTENSITIES: Option<NonNullable<Intensity>>[] = [
  { id: 'gentle', label: 'Gentle', desc: 'Low pressure. Long road.' },
  { id: 'standard', label: 'Standard', desc: 'Balanced pace.' },
  { id: 'hardcore', label: 'Hardcore', desc: 'Strict. High stakes.' },
  { id: 'monk-mode', label: 'Monk mode', desc: 'Total reset. Radical focus.' },
];

const LEARNING: Option<NonNullable<LearningStyle>>[] = [
  { id: 'read', label: 'Reading' },
  { id: 'listen', label: 'Listening' },
  { id: 'watch', label: 'Watching' },
  { id: 'do', label: 'Doing' },
  { id: 'talk', label: 'Talking it through' },
];

type StepId =
  | 'welcome'
  | 'religious'
  | 'tone'
  | 'triggers'
  | 'intensity'
  | 'learning'
  | 'privacyPromise';

const ORDER: StepId[] = [
  'welcome',
  'religious',
  'tone',
  'triggers',
  'intensity',
  'learning',
  'privacyPromise',
];

// Required steps need a real answer before continuing.
const REQUIRED: Set<StepId> = new Set(['religious', 'tone', 'privacyPromise']);

export const Onboarding: React.FC = () => {
  const { updateProfile, completeOnboarding, acknowledgePrivacyPromise } = useStore();
  const theme = useTheme();

  const [stepIndex, setStepIndex] = useState(0);

  // State for each axis
  const [religious, setReligious] = useState<ReligiousLevel>(null);
  const [customReligious, setCustomReligious] = useState('');
  const [tone, setTone] = useState<Tone>(null);
  const [customTone, setCustomTone] = useState('');
  const [triggers, setTriggers] = useState<TriggerTag[]>([]);
  const [customTriggers, setCustomTriggers] = useState('');
  const [intensity, setIntensity] = useState<Intensity>(null);
  const [learning, setLearning] = useState<LearningStyle>(null);

  const step = ORDER[stepIndex];

  const totalSkippable = useMemo(() => ORDER.filter((s) => !REQUIRED.has(s) && s !== 'welcome').length, []);

  const canAdvance = (): boolean => {
    switch (step) {
      case 'welcome':
        return true;
      case 'religious':
        return religious !== null && (religious !== 'custom' || customReligious.trim().length > 0);
      case 'tone':
        return tone !== null && (tone !== 'custom' || customTone.trim().length > 0);
      case 'privacyPromise':
        return true;
      default:
        return true; // skippable
    }
  };

  const next = () => {
    if (stepIndex >= ORDER.length - 1) {
      // Finalize
      const customTriggersArr = customTriggers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      updateProfile({
        religiousLevel: religious,
        customReligious,
        tone,
        customTone,
        primaryTriggers: triggers,
        customTriggers: customTriggersArr,
        intensity,
        learningStyle: learning,
      });
      acknowledgePrivacyPromise();
      completeOnboarding();
      return;
    }
    setStepIndex(stepIndex + 1);
  };

  const back = () => stepIndex > 0 && setStepIndex(stepIndex - 1);
  const skip = () => !REQUIRED.has(step) && setStepIndex(stepIndex + 1);

  const toggleTrigger = (t: TriggerTag) => {
    setTriggers(triggers.includes(t) ? triggers.filter((x) => x !== t) : [...triggers, t]);
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <StepWelcome theme={theme} />
        );
      case 'religious':
        return (
          <SingleSelectStep
            title="Where do you stand?"
            subtitle="This app is built for Klal Yisrael \u2014 from secular to chareidi. We tailor the language, sources, and tactics to fit you."
            options={RELIGIOUS}
            value={religious}
            onSelect={setReligious}
            theme={theme}
            allowCustom
            customValue={customReligious}
            onCustomChange={setCustomReligious}
            customPlaceholder="Describe your frame..."
          />
        );
      case 'tone':
        return (
          <SingleSelectStep
            title="How should we speak to you?"
            subtitle="The voice of Coach. You can change it later."
            options={TONES}
            value={tone}
            onSelect={setTone}
            theme={theme}
            allowCustom
            customValue={customTone}
            onCustomChange={setCustomTone}
            customPlaceholder="Describe your preferred tone..."
          />
        );
      case 'triggers':
        return (
          <MultiSelectStep
            title="Pick your triggers"
            subtitle="Select all that apply. We'll match tactics to these."
            options={TRIGGERS}
            selected={triggers}
            onToggle={toggleTrigger}
            customValue={customTriggers}
            onCustomChange={setCustomTriggers}
            customPlaceholder="Other triggers (comma-separated)..."
            theme={theme}
          />
        );
      case 'intensity':
        return (
          <SingleSelectStep
            title="How intense?"
            subtitle="Pick your pace. Changeable later."
            options={INTENSITIES}
            value={intensity}
            onSelect={setIntensity}
            theme={theme}
          />
        );
      case 'learning':
        return (
          <SingleSelectStep
            title="How do you learn best?"
            subtitle="We'll lead with this in the library."
            options={LEARNING}
            value={learning}
            onSelect={setLearning}
            theme={theme}
          />
        );
      case 'privacyPromise':
        return <PrivacyPromiseStep />;
    }
  };

  const isWelcome = step === 'welcome';
  const isPromise = step === 'privacyPromise';

  return (
    <Screen>
      {/* Progress bar */}
      {!isWelcome && (
        <View className="mb-4 mt-2">
          <View className="flex-row items-center justify-between mb-2">
            <Pressable onPress={back} className="flex-row items-center">
              <ChevronLeft size={16} color={theme.muted} />
              <Text className="text-xs ml-1" style={{ color: theme.muted }}>Back</Text>
            </Pressable>
            <Text className="text-[10px] uppercase tracking-widest" style={{ color: theme.textDim }}>
              {stepIndex} of {ORDER.length - 1}
            </Text>
          </View>
          <View className="flex-row gap-1">
            {ORDER.slice(1).map((_, i) => (
              <View
                key={i}
                className="flex-1 h-1 rounded-full"
                style={{
                  backgroundColor:
                    i < stepIndex ? theme.accent : i === stepIndex - 1 + 1 ? `${theme.accent}80` : theme.hairline,
                }}
              />
            ))}
          </View>
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={step}
            from={{ opacity: 0, translateX: 20 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -20 }}
            transition={{ type: 'timing', duration: 220 }}
          >
            {renderStep()}
          </MotiView>
        </AnimatePresence>
      </ScrollView>

      {/* Footer controls */}
      <View className="pt-4">
        {!REQUIRED.has(step) && !isWelcome && (
          <Pressable onPress={skip} className="py-2 items-center mb-2">
            <Text className="text-white/40 text-xs uppercase tracking-widest">Skip — decide later</Text>
          </Pressable>
        )}
        <Pressable
          onPress={next}
          disabled={!canAdvance()}
          className="py-5 rounded-2xl flex-row items-center justify-center"
          style={{ backgroundColor: canAdvance() ? theme.accent : theme.surface2 }}
        >
          <Text
            className="font-black uppercase tracking-widest mr-2"
            style={{ color: canAdvance() ? theme.onAccent : theme.muted }}
          >
            {isPromise ? 'Stand strong' : isWelcome ? 'Begin' : 'Continue'}
          </Text>
          <ArrowRight size={18} color={canAdvance() ? theme.onAccent : theme.muted} />
        </Pressable>
      </View>
    </Screen>
  );
};

// =============================================================================
// Step components
// =============================================================================

const StepWelcome: React.FC<{ theme: any }> = ({ theme }) => (
  <View className="pt-6">
    <View className="w-24 h-24 rounded-3xl bg-guard-accent/10 border border-guard-accent/30 items-center justify-center mb-8">
      <LionMark size={64} color={theme.accent} accentColor={theme.text} />
    </View>
    <Text className="text-guard-accent text-xs font-black uppercase tracking-[3px] mb-3">
      {BRAND.hebrew}
    </Text>
    <Text className="text-5xl font-black text-white mb-3" style={{ fontFamily: 'Outfit' }}>
      Welcome to {BRAND.name}
    </Text>
    <Text className="text-white/80 text-lg leading-7 mb-6 italic">{BRAND.tagline}</Text>
    <Text className="text-white/60 text-base leading-6 mb-4">
      A private space to rise again. No accounts. No tracking. No shame — ever.
    </Text>
    <View className="bg-guard-primary/10 border border-guard-primary/30 rounded-2xl p-5 mb-4">
      <Text className="text-white/70 leading-6 italic">
        "איזהו גבור? הכובש את יצרו — Who is strong? The one who masters his own desire."
      </Text>
      <Text className="text-white/40 text-xs mt-2">— {BRAND.source}</Text>
    </View>
    <Text className="text-white/50 text-sm leading-6">
      A few questions to shape the app around you. Most are skippable. You can change anything later.
    </Text>
  </View>
);

const PrivacyPromiseStep: React.FC = () => (
  <View className="pt-6">
    <View
      className="w-20 h-20 rounded-3xl items-center justify-center mb-6"
      style={{ backgroundColor: 'rgba(30,138,74,0.15)', borderWidth: 1, borderColor: 'rgba(30,138,74,0.3)' }}
    >
      <Lock size={40} color="#1E8A4A" />
    </View>
    <Text className="text-4xl font-black text-white mb-3" style={{ fontFamily: 'Outfit' }}>
      Our promise to you
    </Text>
    <Text className="text-white/70 text-base leading-7 mb-6">
      We don't save any of your info. Everything stays on your phone. There's no
      account, no email, no password — nothing to hack, nothing to leak.
    </Text>
    <View
      className="rounded-2xl p-4 mb-2"
      style={{ backgroundColor: 'rgba(232,160,32,0.08)', borderWidth: 1, borderColor: 'rgba(232,160,32,0.25)' }}
    >
      <Text className="text-white/70 text-sm leading-6 italic">
        Tap below and you're in. Your data, your phone, your control.
      </Text>
    </View>
  </View>
);

interface SingleSelectProps<T> {
  title: string;
  subtitle?: string;
  options: Option<T>[];
  value: T | null;
  onSelect: (v: T) => void;
  theme: any;
  allowCustom?: boolean;
  customValue?: string;
  onCustomChange?: (v: string) => void;
  customPlaceholder?: string;
}

function SingleSelectStep<T extends string>({
  title,
  subtitle,
  options,
  value,
  onSelect,
  theme,
  allowCustom,
  customValue,
  onCustomChange,
  customPlaceholder,
}: SingleSelectProps<T>) {
  const isCustom = value === ('custom' as unknown as T);
  return (
    <View className="pt-2">
      <Text className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Outfit' }}>
        {title}
      </Text>
      {subtitle && (
        <Text className="mb-6 leading-6" style={{ color: theme.muted }}>
          {subtitle}
        </Text>
      )}
      {options.map((o) => (
        <Pressable
          key={o.id}
          onPress={() => onSelect(o.id)}
          className="mb-2.5 p-4 rounded-2xl flex-row items-center"
          style={{
            backgroundColor: value === o.id ? `${theme.accent}20` : theme.surface2,
            borderWidth: 1,
            borderColor: value === o.id ? theme.accent : theme.hairline,
          }}
        >
          <View className="flex-1">
            <Text className="font-black text-base" style={{ color: theme.text }}>
              {o.label}
            </Text>
            {o.desc && (
              <Text className="text-xs mt-1" style={{ color: theme.muted }}>
                {o.desc}
              </Text>
            )}
          </View>
          {value === o.id && <Check size={18} color={theme.accent} />}
        </Pressable>
      ))}
      {allowCustom && (
        <Pressable
          onPress={() => onSelect('custom' as unknown as T)}
          className="mb-2.5 p-4 rounded-2xl flex-row items-center"
          style={{
            backgroundColor: isCustom ? `${theme.accent}20` : theme.surface2,
            borderWidth: 1,
            borderColor: isCustom ? theme.accent : theme.hairline,
            borderStyle: 'dashed',
          }}
        >
          <View className="flex-1">
            <Text className="font-black text-base" style={{ color: theme.text }}>
              Custom
            </Text>
            <Text className="text-xs mt-1" style={{ color: theme.muted }}>
              Define your own.
            </Text>
          </View>
          {isCustom && <Check size={18} color={theme.accent} />}
        </Pressable>
      )}
      {allowCustom && isCustom && (
        <TextInput
          value={customValue}
          onChangeText={onCustomChange}
          placeholder={customPlaceholder}
          placeholderTextColor={theme.textDim}
          className="rounded-2xl px-4 py-3 mt-2"
          style={{
            backgroundColor: theme.surface2,
            borderWidth: 1,
            borderColor: theme.accent,
            color: theme.text,
          }}
        />
      )}
    </View>
  );
}

interface MultiSelectProps<T> {
  title: string;
  subtitle?: string;
  options: Option<T>[];
  selected: T[];
  onToggle: (v: T) => void;
  customValue?: string;
  onCustomChange?: (v: string) => void;
  customPlaceholder?: string;
  theme: any;
}

function MultiSelectStep<T extends string>({
  title,
  subtitle,
  options,
  selected,
  onToggle,
  customValue,
  onCustomChange,
  customPlaceholder,
  theme,
}: MultiSelectProps<T>) {
  return (
    <View className="pt-2">
      <Text className="text-3xl font-black mb-2" style={{ fontFamily: 'Outfit', color: theme.text }}>
        {title}
      </Text>
      {subtitle && (
        <Text className="mb-6 leading-6" style={{ color: theme.muted }}>
          {subtitle}
        </Text>
      )}
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => {
          const active = selected.includes(o.id);
          return (
            <Pressable
              key={o.id}
              onPress={() => onToggle(o.id)}
              className="rounded-full px-4 py-2.5"
              style={{
                backgroundColor: active ? `${theme.accent}25` : theme.surface2,
                borderWidth: 1,
                borderColor: active ? theme.accent : theme.hairline,
              }}
            >
              <Text
                className="font-bold text-sm"
                style={{ color: active ? theme.accent : theme.text }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {customPlaceholder && (
        <TextInput
          value={customValue}
          onChangeText={onCustomChange}
          placeholder={customPlaceholder}
          placeholderTextColor={theme.textDim}
          className="rounded-2xl px-4 py-3 mt-5"
          style={{
            backgroundColor: theme.surface2,
            borderWidth: 1,
            borderColor: theme.hairline,
            color: theme.text,
          }}
        />
      )}
    </View>
  );
}
