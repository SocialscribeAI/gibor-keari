import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { ArrowRight, Check, Lock, ChevronLeft } from 'lucide-react-native';
import { Screen } from '../components/Screen';
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
} from '../store/useStore';
import { useTheme, BRAND } from '../constants/theme';
import { LionMark } from '../components/LionMark';

// =============================================================================
// Onboarding — 12-axis personality builder (§3).
// All steps (except core recovery/religious/tone) are skippable and can be
// finished later from Profile.
// =============================================================================

type Option<T> = { id: T; label: string; desc?: string };

const RECOVERY: Option<NonNullable<RecoveryStage>>[] = [
  { id: 'day-one', label: 'Day one', desc: 'Just starting fresh.' },
  { id: 'restarting', label: 'Restarting', desc: 'I had streaks before. Back at it.' },
  { id: 'maintenance', label: 'Maintenance', desc: 'Stable for a while — keeping it.' },
  { id: 'severe-relapse-rebuild', label: 'Rebuilding', desc: 'After a deep slip. Rebuilding trust.' },
  { id: 'helping-friend', label: 'Helping someone', desc: 'I use it to support another.' },
];

const RELIGIOUS: Option<NonNullable<ReligiousLevel>>[] = [
  { id: 'secular', label: 'Secular' },
  { id: 'traditional', label: 'Traditional' },
  { id: 'modern-orthodox', label: 'Modern Orthodox' },
  { id: 'chareidi', label: 'Chareidi' },
  { id: 'christian', label: 'Christian' },
  { id: 'muslim', label: 'Muslim' },
  { id: 'other', label: 'Other / spiritual' },
];

const TONES: Option<NonNullable<Tone>>[] = [
  { id: 'gentle', label: 'Gentle', desc: 'Encouragement. Patience.' },
  { id: 'harsh', label: 'Harsh', desc: 'Brutal honesty. No excuses.' },
  { id: 'spiritual', label: 'Spiritual', desc: 'Faith-rooted. Soulful.' },
  { id: 'clinical', label: 'Clinical', desc: 'Evidence-based. Neutral.' },
];

const MOTIVATION: Option<NonNullable<MotivationStyle>>[] = [
  { id: 'incentive', label: 'Incentive', desc: 'Rewards, progress, celebration.' },
  { id: 'punishment', label: 'Punishment', desc: 'Consequences. Stakes.' },
  { id: 'mixed', label: 'Mixed', desc: 'Both, balanced.' },
  { id: 'pure-discipline', label: 'Pure discipline', desc: 'No bells. Just the work.' },
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

const RISK_TIMES: Option<NonNullable<RiskTime>>[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'midday', label: 'Midday' },
  { id: 'evening', label: 'Evening' },
  { id: 'late-night', label: 'Late night' },
];

const LIFE_STAGES: Option<NonNullable<LifeStage>>[] = [
  { id: 'single', label: 'Single' },
  { id: 'dating', label: 'Dating' },
  { id: 'engaged', label: 'Engaged' },
  { id: 'married', label: 'Married' },
  { id: 'married-kids', label: 'Married with kids' },
  { id: 'divorced', label: 'Divorced' },
  { id: 'widowed', label: 'Widowed' },
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

const ACCOUNTABILITY: Option<NonNullable<AccountabilityMode>>[] = [
  { id: 'solo', label: 'Solo', desc: 'Private. Just me.' },
  { id: 'partner', label: 'Partner', desc: 'One trusted person.' },
  { id: 'group', label: 'Group', desc: 'Accountability circle.' },
  { id: 'anonymous-community', label: 'Anonymous community', desc: 'Opt-in, no identity.' },
  { id: 'sponsor', label: 'Sponsor', desc: '12-step style guide.' },
];

const PRIVACY: Option<NonNullable<PrivacyLevel>>[] = [
  { id: 'fully-private', label: 'Fully private', desc: 'Nobody sees anything.' },
  { id: 'partner-aggregate', label: 'Partner sees streak only', desc: 'High-level. No details.' },
  { id: 'partner-detailed', label: 'Partner sees details', desc: 'Falls, triggers, notes.' },
  { id: 'anonymous-group', label: 'Anonymous in group', desc: 'Stats only, no name.' },
];

const LANGUAGES: Option<NonNullable<Language>>[] = [
  { id: 'en', label: 'English' },
  { id: 'he', label: 'עברית (Hebrew)' },
  { id: 'yi', label: 'ייִדיש (Yiddish)' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
];

type StepId =
  | 'welcome'
  | 'recovery'
  | 'religious'
  | 'tone'
  | 'motivation'
  | 'triggers'
  | 'riskTime'
  | 'lifeStage'
  | 'intensity'
  | 'learning'
  | 'accountability'
  | 'privacyLevel'
  | 'language'
  | 'privacyPromise';

const ORDER: StepId[] = [
  'welcome',
  'recovery',
  'religious',
  'tone',
  'motivation',
  'triggers',
  'riskTime',
  'lifeStage',
  'intensity',
  'learning',
  'accountability',
  'privacyLevel',
  'language',
  'privacyPromise',
];

// Axes that are *essential* — require an answer. Others skippable.
const REQUIRED: Set<StepId> = new Set(['recovery', 'religious', 'tone', 'privacyPromise']);

export const Onboarding: React.FC = () => {
  const { updateProfile, completeOnboarding, acknowledgePrivacyPromise } = useStore();
  const theme = useTheme();

  const [stepIndex, setStepIndex] = useState(0);

  // State for each axis
  const [recovery, setRecovery] = useState<RecoveryStage>(null);
  const [religious, setReligious] = useState<ReligiousLevel>(null);
  const [customReligious, setCustomReligious] = useState('');
  const [tone, setTone] = useState<Tone>(null);
  const [customTone, setCustomTone] = useState('');
  const [motivation, setMotivation] = useState<MotivationStyle>(null);
  const [triggers, setTriggers] = useState<TriggerTag[]>([]);
  const [customTriggers, setCustomTriggers] = useState('');
  const [riskTime, setRiskTime] = useState<RiskTime>(null);
  const [lifeStage, setLifeStage] = useState<LifeStage>(null);
  const [intensity, setIntensity] = useState<Intensity>(null);
  const [learning, setLearning] = useState<LearningStyle>(null);
  const [accountability, setAccountability] = useState<AccountabilityMode>(null);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(null);
  const [language, setLanguage] = useState<Language>('en');

  const step = ORDER[stepIndex];

  const totalSkippable = useMemo(() => ORDER.filter((s) => !REQUIRED.has(s) && s !== 'welcome').length, []);

  const canAdvance = (): boolean => {
    switch (step) {
      case 'welcome':
        return true;
      case 'recovery':
        return recovery !== null;
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
        recoveryStage: recovery,
        religiousLevel: religious,
        customReligious,
        tone,
        customTone,
        motivationStyle: motivation,
        primaryTriggers: triggers,
        customTriggers: customTriggersArr,
        riskTimeOfDay: riskTime,
        lifeStage,
        intensity,
        learningStyle: learning,
        accountabilityMode: accountability,
        privacyLevel,
        language,
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
      case 'recovery':
        return (
          <SingleSelectStep
            title="Where are you right now?"
            subtitle="Honest answer. We meet you here."
            options={RECOVERY}
            value={recovery}
            onSelect={setRecovery}
            theme={theme}
          />
        );
      case 'religious':
        return (
          <SingleSelectStep
            title="Your frame"
            subtitle="Helps us show content that fits — and hide what doesn't."
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
            subtitle="The voice of the app. You can change it later."
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
      case 'motivation':
        return (
          <SingleSelectStep
            title="What drives you?"
            subtitle="Carrots, sticks, or neither."
            options={MOTIVATION}
            value={motivation}
            onSelect={setMotivation}
            theme={theme}
          />
        );
      case 'triggers':
        return (
          <MultiSelectStep
            title="Pick your triggers"
            subtitle="Select all that apply. We'll use these to match tactics."
            options={TRIGGERS}
            selected={triggers}
            onToggle={toggleTrigger}
            customValue={customTriggers}
            onCustomChange={setCustomTriggers}
            customPlaceholder="Other triggers (comma-separated)..."
          />
        );
      case 'riskTime':
        return (
          <SingleSelectStep
            title="Your riskiest time of day"
            subtitle="When urges hit hardest."
            options={RISK_TIMES}
            value={riskTime}
            onSelect={setRiskTime}
            theme={theme}
          />
        );
      case 'lifeStage':
        return (
          <SingleSelectStep
            title="Life stage"
            subtitle="Shapes your context — nothing more."
            options={LIFE_STAGES}
            value={lifeStage}
            onSelect={setLifeStage}
            theme={theme}
          />
        );
      case 'intensity':
        return (
          <SingleSelectStep
            title="How intense?"
            subtitle="Choose your pace. Always changeable."
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
      case 'accountability':
        return (
          <SingleSelectStep
            title="Accountability"
            subtitle="You can change this or go solo forever."
            options={ACCOUNTABILITY}
            value={accountability}
            onSelect={setAccountability}
            theme={theme}
          />
        );
      case 'privacyLevel':
        return (
          <SingleSelectStep
            title="Sharing level"
            subtitle="Only relevant if you picked partner or group."
            options={PRIVACY}
            value={privacyLevel}
            onSelect={setPrivacyLevel}
            theme={theme}
          />
        );
      case 'language':
        return (
          <SingleSelectStep
            title="Language"
            options={LANGUAGES}
            value={language}
            onSelect={setLanguage}
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
              <ChevronLeft size={16} color="rgba(255,255,255,0.5)" />
              <Text className="text-white/50 text-xs ml-1">Back</Text>
            </Pressable>
            <Text className="text-white/40 text-[10px] uppercase tracking-widest">
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
                    i < stepIndex ? '#E8A020' : i === stepIndex - 1 + 1 ? 'rgba(232,160,32,0.5)' : 'rgba(255,255,255,0.08)',
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
          style={{ backgroundColor: canAdvance() ? '#E8A020' : 'rgba(255,255,255,0.05)' }}
        >
          <Text
            className="font-black uppercase tracking-widest mr-2"
            style={{ color: canAdvance() ? '#0F1326' : 'rgba(255,255,255,0.3)' }}
          >
            {isPromise ? 'Stand strong' : isWelcome ? 'Begin' : 'Continue'}
          </Text>
          <ArrowRight size={18} color={canAdvance() ? '#0F1326' : 'rgba(255,255,255,0.3)'} />
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
    <Text className="text-white/70 text-base leading-6 mb-6">
      Before you begin, read this. This is the deal:
    </Text>
    {[
      'Everything is stored on your phone only.',
      'No account. No email. No login.',
      'No telemetry. No analytics. No ad networks.',
      "If you use the AI coach, it uses YOUR key and talks only to the provider you pick.",
      'You can export everything as JSON or delete it all in one tap.',
    ].map((line, i) => (
      <View key={i} className="flex-row items-start mb-3">
        <View
          className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5"
          style={{ backgroundColor: 'rgba(30,138,74,0.2)' }}
        >
          <Check size={12} color="#1E8A4A" />
        </View>
        <Text className="flex-1 text-white/80 leading-6">{line}</Text>
      </View>
    ))}
    <View
      className="rounded-2xl p-4 mt-4"
      style={{ backgroundColor: 'rgba(232,160,32,0.08)', borderWidth: 1, borderColor: 'rgba(232,160,32,0.25)' }}
    >
      <Text className="text-white/70 text-sm leading-6 italic">
        Tap below and you're in. The door is always unlocked from the inside — your data, your control.
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
      {subtitle && <Text className="text-white/50 mb-6 leading-6">{subtitle}</Text>}
      {options.map((o) => (
        <Pressable
          key={o.id}
          onPress={() => onSelect(o.id)}
          className="mb-2.5 p-4 rounded-2xl flex-row items-center"
          style={{
            backgroundColor: value === o.id ? 'rgba(232,160,32,0.12)' : '#1A1E35',
            borderWidth: 1,
            borderColor: value === o.id ? '#E8A020' : 'rgba(44,62,122,0.3)',
          }}
        >
          <View className="flex-1">
            <Text className="text-white font-black text-base">{o.label}</Text>
            {o.desc && <Text className="text-white/50 text-xs mt-1">{o.desc}</Text>}
          </View>
          {value === o.id && <Check size={18} color={theme.accent} />}
        </Pressable>
      ))}
      {allowCustom && (
        <Pressable
          onPress={() => onSelect('custom' as unknown as T)}
          className="mb-2.5 p-4 rounded-2xl flex-row items-center"
          style={{
            backgroundColor: isCustom ? 'rgba(232,160,32,0.12)' : '#1A1E35',
            borderWidth: 1,
            borderColor: isCustom ? '#E8A020' : 'rgba(44,62,122,0.3)',
            borderStyle: 'dashed',
          }}
        >
          <View className="flex-1">
            <Text className="text-white font-black text-base">Custom</Text>
            <Text className="text-white/50 text-xs mt-1">Define your own.</Text>
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
          className="text-white rounded-2xl px-4 py-3 mt-2"
          style={{
            backgroundColor: '#1A1E35',
            borderWidth: 1,
            borderColor: '#E8A020',
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
}: MultiSelectProps<T>) {
  return (
    <View className="pt-2">
      <Text className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Outfit' }}>
        {title}
      </Text>
      {subtitle && <Text className="text-white/50 mb-6 leading-6">{subtitle}</Text>}
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => {
          const active = selected.includes(o.id);
          return (
            <Pressable
              key={o.id}
              onPress={() => onToggle(o.id)}
              className="rounded-full px-4 py-2.5"
              style={{
                backgroundColor: active ? 'rgba(232,160,32,0.15)' : '#1A1E35',
                borderWidth: 1,
                borderColor: active ? '#E8A020' : 'rgba(44,62,122,0.3)',
              }}
            >
              <Text
                className="font-bold text-sm"
                style={{ color: active ? '#E8A020' : 'rgba(255,255,255,0.7)' }}
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
          placeholderTextColor="rgba(255,255,255,0.3)"
          className="text-white rounded-2xl px-4 py-3 mt-5"
          style={{
            backgroundColor: '#1A1E35',
            borderWidth: 1,
            borderColor: 'rgba(44,62,122,0.4)',
          }}
        />
      )}
    </View>
  );
}
