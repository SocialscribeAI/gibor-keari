import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { ArrowRight, Check, Lock, ChevronLeft, SkipForward } from 'lucide-react-native';
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
// Onboarding — Phase 1, v2.
//
// Deep intake. Every question must materially change at least one of: coach
// voice, coach content selection, danger-detection thresholds, pattern-engine
// inputs, default reminders, fallback tactics, or surfacing of the user's own
// vow/why. See plans/onboarding-question-justification.md for the rationale
// behind each axis.
//
// Soft-skippable: every step except `welcome`, `name`, and `privacyPromise`
// has a Skip control that writes null. After 3 skips a soft warning fires.
// =============================================================================

type Option<T> = { id: T; label: string; desc?: string };

const RELIGIOUS: Option<NonNullable<ReligiousLevel>>[] = [
  { id: 'secular', label: 'Secular', desc: 'Not observant. Cultural / agnostic.' },
  { id: 'traditional', label: 'Traditional', desc: 'Some mitzvos, not fully shomer.' },
  { id: 'baal-teshuva', label: 'Baal teshuva', desc: 'On the journey back.' },
  { id: 'modern-orthodox', label: 'Modern Orthodox' },
  { id: 'chassidish', label: 'Chassidish' },
  { id: 'chareidi', label: 'Chareidi / Yeshivish' },
  { id: 'other', label: 'Other / spiritual', desc: 'Jewish but doesn’t fit above.' },
];

const TONES: Option<NonNullable<Tone>>[] = [
  { id: 'gentle', label: 'Gentle', desc: 'Encouragement. Patience.' },
  { id: 'harsh', label: 'Harsh', desc: 'Brutal honesty. No excuses.' },
  { id: 'spiritual', label: 'Spiritual', desc: 'Faith-rooted. Soulful.' },
  { id: 'clinical', label: 'Clinical', desc: 'Evidence-based. Neutral.' },
];

const MOTIVATION: Option<NonNullable<MotivationStyle>>[] = [
  { id: 'incentive', label: 'What I’ll gain', desc: 'Pulled forward by the version of me that wins this.' },
  { id: 'punishment', label: 'What I’ll lose', desc: 'Held back by what falling costs me.' },
  { id: 'mixed', label: 'Both, depending on the day', desc: 'Switch up the framing as needed.' },
  { id: 'pure-discipline', label: 'Discipline for its own sake', desc: 'Not about reward or fear — about the man I’m building.' },
];

const ACCOUNTABILITY: Option<NonNullable<AccountabilityMode>>[] = [
  { id: 'solo', label: 'Solo', desc: 'I process this alone. No one else.' },
  { id: 'partner', label: 'A partner', desc: 'One person who knows and checks in.' },
  { id: 'group', label: 'A small group', desc: 'A few brothers fighting the same fight.' },
  { id: 'anonymous-community', label: 'Anonymous community', desc: 'Strangers I never have to face.' },
  { id: 'sponsor', label: 'A sponsor / rav', desc: 'Someone older or wiser I report to.' },
];

const LIFE_STAGE: Option<NonNullable<LifeStage>>[] = [
  { id: 'single', label: 'Single' },
  { id: 'dating', label: 'Dating / shidduchim' },
  { id: 'engaged', label: 'Engaged' },
  { id: 'married', label: 'Married' },
  { id: 'married-kids', label: 'Married with kids' },
  { id: 'divorced', label: 'Divorced' },
  { id: 'widowed', label: 'Widowed' },
];

const TRIGGERS: Option<TriggerTag>[] = [
  { id: 'stress', label: 'Stress' },
  { id: 'loneliness', label: 'Loneliness' },
  { id: 'boredom', label: 'Boredom' },
  { id: 'fatigue', label: 'Exhaustion' },
  { id: 'visual', label: 'Visual exposure', desc: 'Something I saw set it off.' },
  { id: 'late-night', label: 'Late-night spiral' },
  { id: 'rejection', label: 'Rejection / shame' },
  { id: 'success', label: 'A win / celebration', desc: 'After good news, I drop my guard.' },
  { id: 'travel', label: 'Travel / hotels' },
  { id: 'conflict', label: 'Conflict / fight' },
];

const RISK_TIME: Option<NonNullable<RiskTime>>[] = [
  { id: 'morning', label: 'Morning', desc: 'First hour I’m awake.' },
  { id: 'midday', label: 'Midday', desc: 'Mid-afternoon slump.' },
  { id: 'evening', label: 'Evening', desc: 'After dinner, winding down.' },
  { id: 'late-night', label: 'Late night', desc: 'Past midnight, everyone’s asleep.' },
];

const RECOVERY_STAGE: Option<NonNullable<RecoveryStage>>[] = [
  { id: 'day-one', label: 'Day one', desc: 'I’m just starting.' },
  { id: 'restarting', label: 'Restarting', desc: 'Tried before. Back at it.' },
  { id: 'maintenance', label: 'Maintenance', desc: 'Months clean. Holding the line.' },
  { id: 'severe-relapse-rebuild', label: 'Bad fall, rebuilding', desc: 'Just came off a hard relapse.' },
  { id: 'helping-friend', label: 'Helping someone else', desc: 'I’m here to learn how to support them.' },
];

const INTENSITY: Option<NonNullable<Intensity>>[] = [
  { id: 'gentle', label: 'Gentle', desc: 'Encouraging. No sharp edges.' },
  { id: 'standard', label: 'Standard', desc: 'Honest. Direct but not harsh.' },
  { id: 'hardcore', label: 'Hardcore', desc: 'No excuses. Push me.' },
  { id: 'monk-mode', label: 'Monk mode', desc: 'Take the gloves off. I want unflinching.' },
];

const LEARNING_STYLE: Option<NonNullable<LearningStyle>>[] = [
  { id: 'read', label: 'Read text', desc: 'Articles, sources, sefarim.' },
  { id: 'listen', label: 'Listen', desc: 'Shiurim, podcasts, audio.' },
  { id: 'watch', label: 'Watch', desc: 'Video shiurim, talks.' },
  { id: 'do', label: 'Practice', desc: 'Exercises I can try right now.' },
  { id: 'talk', label: 'Conversation', desc: 'Back-and-forth with the coach.' },
];

const PRIVACY: Option<NonNullable<PrivacyLevel>>[] = [
  { id: 'fully-private', label: 'Fully private', desc: 'Nothing shared, ever.' },
  { id: 'partner-aggregate', label: 'Partner sees aggregate', desc: 'They see streak + status, not details.' },
  { id: 'partner-detailed', label: 'Partner sees everything', desc: 'Full transparency with my partner.' },
  { id: 'anonymous-group', label: 'Anonymous group', desc: 'Shared with strangers, no name.' },
  { id: 'opt-in-leaderboard', label: 'Leaderboard opt-in', desc: 'Show up on the community leaderboard.' },
];

const LANGUAGE: Option<NonNullable<Language>>[] = [
  { id: 'en', label: 'English' },
  { id: 'he', label: 'Hebrew' },
  { id: 'yi', label: 'Yiddish' },
  { id: 'es', label: 'Spanish' },
  { id: 'fr', label: 'French' },
];

const MILESTONE_REWARD_DAYS = [7, 30, 90] as const;

type StepId =
  | 'welcome'
  | 'religious'
  | 'tone'
  | 'intensity'
  | 'recovery-stage'
  | 'motivation'
  | 'triggers'
  | 'risk-time'
  | 'life-stage'
  | 'accountability'
  | 'learning-style'
  | 'privacy'
  | 'language'
  | 'identity'
  | 'why'
  | 'vow'
  | 'name'
  | 'privacyPromise';

const ORDER: StepId[] = [
  'welcome',
  'religious',
  'tone',
  'intensity',
  'recovery-stage',
  'motivation',
  'triggers',
  'risk-time',
  'life-stage',
  'accountability',
  'learning-style',
  'privacy',
  'language',
  'identity',
  'why',
  'vow',
  'name',
  'privacyPromise',
];

const SKIPPABLE: Set<StepId> = new Set([
  'intensity',
  'recovery-stage',
  'motivation',
  'triggers',
  'risk-time',
  'life-stage',
  'accountability',
  'learning-style',
  'privacy',
  'language',
  'identity',
  'why',
  'vow',
]);

export const Onboarding: React.FC = () => {
  const {
    updateProfile,
    completeOnboarding,
    acknowledgePrivacyPromise,
    setIdentityStatement,
    setWhyReasons,
    setVow,
    setOnboardingVersion,
    personalityProfile,
    identityStatement,
    whyReasons,
    vows,
    displayName,
  } = useStore();
  const theme = useTheme();

  const [stepIndex, setStepIndex] = useState(0);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [skipWarningShown, setSkipWarningShown] = useState(false);

  // Pre-fill from existing store state so re-running onboarding (the v2 upgrade
  // CTA on existing users) doesn't wipe their data. Initial-state useState
  // form so subsequent edits in the wizard are local until finalize().
  const [religious, setReligious] = useState<ReligiousLevel>(personalityProfile.religiousLevel);
  const [tone, setTone] = useState<Tone>(personalityProfile.tone);
  const [intensity, setIntensity] = useState<Intensity>(personalityProfile.intensity);
  const [recoveryStage, setRecoveryStage] = useState<RecoveryStage>(personalityProfile.recoveryStage);
  const [motivation, setMotivation] = useState<MotivationStyle>(personalityProfile.motivationStyle);
  const [triggers, setTriggers] = useState<TriggerTag[]>(personalityProfile.primaryTriggers ?? []);
  const [riskTime, setRiskTime] = useState<RiskTime>(personalityProfile.riskTimeOfDay);
  const [lifeStage, setLifeStage] = useState<LifeStage>(personalityProfile.lifeStage);
  const [accountability, setAccountability] = useState<AccountabilityMode>(personalityProfile.accountabilityMode);
  const [learningStyle, setLearningStyle] = useState<LearningStyle>(personalityProfile.learningStyle);
  const [privacy, setPrivacy] = useState<PrivacyLevel>(personalityProfile.privacyLevel ?? null);
  const [language, setLanguage] = useState<Language>(personalityProfile.language ?? null);
  const [identityText, setIdentityText] = useState(identityStatement ?? '');
  const [whyOne, setWhyOne] = useState(whyReasons[0] ?? '');
  const [whyTwo, setWhyTwo] = useState(whyReasons[1] ?? '');
  const [whyThree, setWhyThree] = useState(whyReasons[2] ?? '');
  const [reward7, setReward7] = useState(vows[7] ?? '');
  const [reward30, setReward30] = useState(vows[30] ?? '');
  const [reward90, setReward90] = useState(vows[90] ?? '');
  const [name, setName] = useState(displayName ?? '');

  const step = ORDER[stepIndex];

  const canAdvance = (): boolean => {
    if (SKIPPABLE.has(step)) return true; // skippable steps always allow advance
    switch (step) {
      case 'welcome':
      case 'privacyPromise':
        return true;
      case 'religious':
        return religious !== null;
      case 'tone':
        return tone !== null;
      case 'name':
        return name.trim().length >= 1;
      default:
        return true;
    }
  };

  const finalize = () => {
    updateProfile({
      religiousLevel: religious,
      tone,
      intensity,
      recoveryStage,
      motivationStyle: motivation,
      primaryTriggers: triggers,
      riskTimeOfDay: riskTime,
      lifeStage,
      accountabilityMode: accountability,
      learningStyle,
      privacyLevel: privacy ?? 'fully-private',
      language: language ?? 'en',
      displayName: name.trim(),
    });
    if (identityText.trim()) setIdentityStatement(identityText);
    const reasons = [whyOne, whyTwo, whyThree].map((r) => r.trim()).filter(Boolean);
    if (reasons.length) setWhyReasons(reasons);
    if (reward7.trim()) setVow(7, reward7.trim());
    if (reward30.trim()) setVow(30, reward30.trim());
    if (reward90.trim()) setVow(90, reward90.trim());
    acknowledgePrivacyPromise();
    setOnboardingVersion(2);
    completeOnboarding();
  };

  const next = () => {
    if (stepIndex >= ORDER.length - 1) {
      finalize();
      return;
    }
    setStepIndex(stepIndex + 1);
  };

  const skip = () => {
    const newSkips = skipsUsed + 1;
    setSkipsUsed(newSkips);
    if (newSkips === 3 && !skipWarningShown) {
      setSkipWarningShown(true);
    }
    next();
  };

  const back = () => stepIndex > 0 && setStepIndex(stepIndex - 1);

  const toggleTrigger = (id: TriggerTag) => {
    setTriggers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return <StepWelcome theme={theme} />;
      case 'religious':
        return (
          <SingleSelectStep
            title="Where do you stand?"
            subtitle="This app is built for Klal Yisrael — from secular to chareidi. We tailor the language, sources, and tactics to fit you."
            options={RELIGIOUS}
            value={religious}
            onSelect={setReligious}
            theme={theme}
          />
        );
      case 'tone':
        return (
          <SingleSelectStep
            title="When you're struggling, what voice helps you get back up?"
            subtitle="The voice of Coach. You can change it later."
            options={TONES}
            value={tone}
            onSelect={setTone}
            theme={theme}
          />
        );
      case 'intensity':
        return (
          <SingleSelectStep
            title="How hard do you want this app to push you?"
            subtitle="Same coach, very different bite. Pick what'll actually help — not what sounds tough."
            options={INTENSITY}
            value={intensity}
            onSelect={setIntensity}
            theme={theme}
          />
        );
      case 'recovery-stage':
        return (
          <SingleSelectStep
            title="Where are you in this fight?"
            subtitle="No wrong answer. Different stages need different help."
            options={RECOVERY_STAGE}
            value={recoveryStage}
            onSelect={setRecoveryStage}
            theme={theme}
          />
        );
      case 'motivation':
        return (
          <SingleSelectStep
            title="What pulls you forward more?"
            subtitle="Some men move toward what they'll gain. Others, away from what they'll lose. Both are valid."
            options={MOTIVATION}
            value={motivation}
            onSelect={setMotivation}
            theme={theme}
          />
        );
      case 'triggers':
        return (
          <MultiSelectStep
            title="Which of these tend to set you off?"
            subtitle="Pick all that apply. The coach uses this to anticipate. You can change this any time."
            options={TRIGGERS}
            selected={triggers}
            onToggle={toggleTrigger}
            theme={theme}
          />
        );
      case 'risk-time':
        return (
          <SingleSelectStep
            title="When are you most vulnerable?"
            subtitle="When the danger usually hits. We'll guard that window with you."
            options={RISK_TIME}
            value={riskTime}
            onSelect={setRiskTime}
            theme={theme}
          />
        );
      case 'life-stage':
        return (
          <SingleSelectStep
            title="Where are you in life?"
            subtitle="Different stages bring different battles. The coach adjusts."
            options={LIFE_STAGE}
            value={lifeStage}
            onSelect={setLifeStage}
            theme={theme}
          />
        );
      case 'accountability':
        return (
          <SingleSelectStep
            title="When you fall, what do you want?"
            subtitle="Solitude to process? Someone to text? Both work — pick what's true for you."
            options={ACCOUNTABILITY}
            value={accountability}
            onSelect={setAccountability}
            theme={theme}
          />
        );
      case 'learning-style':
        return (
          <SingleSelectStep
            title="When you want to learn something deep, what works?"
            subtitle="Drives the Learn section. We'll surface content in your format."
            options={LEARNING_STYLE}
            value={learningStyle}
            onSelect={setLearningStyle}
            theme={theme}
          />
        );
      case 'privacy':
        return (
          <SingleSelectStep
            title="How private is this fight for you?"
            subtitle="You can change this any time. Defaults are conservative — nothing shared until you choose."
            options={PRIVACY}
            value={privacy}
            onSelect={setPrivacy}
            theme={theme}
          />
        );
      case 'language':
        return (
          <SingleSelectStep
            title="Which feels more natural?"
            subtitle="Drives mantras and source citations."
            options={LANGUAGE}
            value={language}
            onSelect={setLanguage}
            theme={theme}
          />
        );
      case 'identity':
        return (
          <FreeTextStep
            title="Finish this: I am the kind of man who..."
            subtitle="One sentence. The coach will quote this back to you in the moment you forget."
            value={identityText}
            onChange={setIdentityText}
            placeholder="...keeps his word, even when no one's watching."
            theme={theme}
            multiline
            maxLength={140}
          />
        );
      case 'why':
        return (
          <WhyStep
            one={whyOne}
            two={whyTwo}
            three={whyThree}
            onOne={setWhyOne}
            onTwo={setWhyTwo}
            onThree={setWhyThree}
            theme={theme}
          />
        );
      case 'vow':
        return (
          <VowStep
            reward7={reward7}
            reward30={reward30}
            reward90={reward90}
            onReward7={setReward7}
            onReward30={setReward30}
            onReward90={setReward90}
            theme={theme}
          />
        );
      case 'name':
        return <NameStep name={name} onChange={setName} theme={theme} />;
      case 'privacyPromise':
        return <PrivacyPromiseStep />;
    }
  };

  const isWelcome = step === 'welcome';
  const isPromise = step === 'privacyPromise';
  const showSkip = SKIPPABLE.has(step);

  return (
    <Screen>
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
                  backgroundColor: i < stepIndex ? theme.accent : theme.hairline,
                }}
              />
            ))}
          </View>
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={step}
            from={{ opacity: 0, translateX: 20 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -20 }}
            transition={{ type: 'timing', duration: 220 }}
          >
            {renderStep()}
            {skipWarningShown && SKIPPABLE.has(step) && (
              <View
                className="mt-4 p-3 rounded-2xl"
                style={{
                  backgroundColor: 'rgba(232,160,32,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(232,160,32,0.25)',
                }}
              >
                <Text className="text-xs leading-5" style={{ color: theme.accent }}>
                  Heads up — the coach can only help with what it knows about you. Skipping is fine, but the more you share, the better it shows up for you.
                </Text>
              </View>
            )}
          </MotiView>
        </AnimatePresence>
      </ScrollView>

      <View className="pt-4 flex-row gap-2">
        {showSkip && (
          <Pressable
            onPress={skip}
            className="px-5 py-5 rounded-2xl flex-row items-center justify-center"
            style={{ backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.hairline }}
          >
            <SkipForward size={16} color={theme.muted} />
            <Text className="font-bold ml-2 text-xs uppercase tracking-widest" style={{ color: theme.muted }}>
              Skip
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={next}
          disabled={!canAdvance()}
          className="flex-1 py-5 rounded-2xl flex-row items-center justify-center"
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
      About 7 minutes of questions to shape the app around you. The coach gets sharper with every answer. Skip any that don't fit — you can fill them in any time from Settings.
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
}

function SingleSelectStep<T extends string>({
  title,
  subtitle,
  options,
  value,
  onSelect,
  theme,
}: SingleSelectProps<T>) {
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
      {options.map((o) => {
        const active = value === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => onSelect(o.id)}
            className="mb-2.5 p-4 rounded-2xl flex-row items-center"
            style={{
              backgroundColor: active ? theme.accent : theme.surface2,
              borderWidth: 1,
              borderColor: active ? theme.accent : theme.hairline,
            }}
          >
            <View className="flex-1">
              <Text
                className="font-black text-base"
                style={{ color: active ? theme.onAccent : theme.text }}
              >
                {o.label}
              </Text>
              {o.desc && (
                <Text
                  className="text-xs mt-1"
                  style={{ color: active ? theme.onAccent : theme.muted, opacity: active ? 0.8 : 1 }}
                >
                  {o.desc}
                </Text>
              )}
            </View>
            {active && <Check size={18} color={theme.onAccent} />}
          </Pressable>
        );
      })}
    </View>
  );
}

interface MultiSelectProps<T> {
  title: string;
  subtitle?: string;
  options: Option<T>[];
  selected: T[];
  onToggle: (v: T) => void;
  theme: any;
}

function MultiSelectStep<T extends string>({
  title,
  subtitle,
  options,
  selected,
  onToggle,
  theme,
}: MultiSelectProps<T>) {
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
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => {
          const active = selected.includes(o.id);
          return (
            <Pressable
              key={o.id}
              onPress={() => onToggle(o.id)}
              className="px-4 py-3 rounded-2xl"
              style={{
                backgroundColor: active ? theme.accent : theme.surface2,
                borderWidth: 1,
                borderColor: active ? theme.accent : theme.hairline,
              }}
            >
              <Text
                className="font-black text-sm"
                style={{ color: active ? theme.onAccent : theme.text }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="text-xs mt-4" style={{ color: theme.textDim }}>
        {selected.length} selected
      </Text>
    </View>
  );
}

interface FreeTextStepProps {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  theme: any;
  multiline?: boolean;
  maxLength?: number;
}

const FreeTextStep: React.FC<FreeTextStepProps> = ({
  title,
  subtitle,
  value,
  onChange,
  placeholder,
  theme,
  multiline,
  maxLength,
}) => (
  <View className="pt-2">
    <Text className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Outfit' }}>
      {title}
    </Text>
    {subtitle && (
      <Text className="mb-6 leading-6" style={{ color: theme.muted }}>
        {subtitle}
      </Text>
    )}
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={theme.textDim}
      multiline={multiline}
      maxLength={maxLength}
      className="rounded-2xl px-4 py-4 text-base"
      style={{
        backgroundColor: theme.surface2,
        borderWidth: 1,
        borderColor: theme.hairline,
        color: theme.text,
        minHeight: multiline ? 100 : 56,
        textAlignVertical: multiline ? 'top' : 'center',
      }}
    />
    {maxLength && (
      <Text className="text-xs mt-2 text-right" style={{ color: theme.textDim }}>
        {value.length} / {maxLength}
      </Text>
    )}
  </View>
);

interface WhyStepProps {
  one: string;
  two: string;
  three: string;
  onOne: (v: string) => void;
  onTwo: (v: string) => void;
  onThree: (v: string) => void;
  theme: any;
}

const WhyStep: React.FC<WhyStepProps> = ({ one, two, three, onOne, onTwo, onThree, theme }) => (
  <View className="pt-2">
    <Text className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Outfit' }}>
      Why does this matter to you?
    </Text>
    <Text className="mb-6 leading-6" style={{ color: theme.muted }}>
      Up to three reasons. The coach will read them on every turn and quote them back to you when you forget.
    </Text>
    {[
      { value: one, set: onOne, placeholder: 'Reason 1 — the heaviest one.' },
      { value: two, set: onTwo, placeholder: 'Reason 2 (optional).' },
      { value: three, set: onThree, placeholder: 'Reason 3 (optional).' },
    ].map((row, i) => (
      <TextInput
        key={i}
        value={row.value}
        onChangeText={row.set}
        placeholder={row.placeholder}
        placeholderTextColor={theme.textDim}
        maxLength={140}
        multiline
        className="rounded-2xl px-4 py-3 mb-3 text-base"
        style={{
          backgroundColor: theme.surface2,
          borderWidth: 1,
          borderColor: theme.hairline,
          color: theme.text,
          minHeight: 72,
          textAlignVertical: 'top',
        }}
      />
    ))}
  </View>
);

interface VowStepProps {
  reward7: string;
  reward30: string;
  reward90: string;
  onReward7: (v: string) => void;
  onReward30: (v: string) => void;
  onReward90: (v: string) => void;
  theme: any;
}

const VowStep: React.FC<VowStepProps> = ({ reward7, reward30, reward90, onReward7, onReward30, onReward90, theme }) => (
  <View className="pt-2">
    <Text className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Outfit' }}>
      Pick rewards you'll claim at 7, 30, and 90 days.
    </Text>
    <Text className="mb-6 leading-6" style={{ color: theme.muted }}>
      Concrete prizes. Not abstract. The kind of thing that pulls you forward when the streak feels long.
    </Text>
    {MILESTONE_REWARD_DAYS.map((day, i) => {
      const value = [reward7, reward30, reward90][i];
      const setter = [onReward7, onReward30, onReward90][i];
      return (
        <View key={day} className="mb-4">
          <Text className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
            Day {day}
          </Text>
          <TextInput
            value={value}
            onChangeText={setter}
            placeholder={
              day === 7
                ? 'Something small but real (new sefer, dinner out).'
                : day === 30
                  ? 'Something meaningful (weekend trip, a tool you wanted).'
                  : 'Something significant (a celebration that matters).'
            }
            placeholderTextColor={theme.textDim}
            maxLength={120}
            multiline
            className="rounded-2xl px-4 py-3 text-base"
            style={{
              backgroundColor: theme.surface2,
              borderWidth: 1,
              borderColor: theme.hairline,
              color: theme.text,
              minHeight: 60,
              textAlignVertical: 'top',
            }}
          />
        </View>
      );
    })}
  </View>
);

interface NameStepProps {
  name: string;
  onChange: (v: string) => void;
  theme: any;
}

const NameStep: React.FC<NameStepProps> = ({ name, onChange, theme }) => (
  <View className="pt-2">
    <Text className="text-3xl font-black mb-2" style={{ fontFamily: 'Outfit', color: theme.text }}>
      What should Coach call you?
    </Text>
    <Text className="mb-6 leading-6" style={{ color: theme.muted }}>
      First name, nickname, Hebrew name — whatever feels right. You can change it any time.
    </Text>
    <TextInput
      value={name}
      onChangeText={onChange}
      placeholder="e.g. Yossi"
      placeholderTextColor={theme.textDim}
      autoCapitalize="words"
      autoCorrect={false}
      maxLength={40}
      className="rounded-2xl px-4 py-4 text-lg"
      style={{
        backgroundColor: theme.surface2,
        borderWidth: 1,
        borderColor: theme.hairline,
        color: theme.text,
      }}
    />
    <Text className="text-xs mt-3" style={{ color: theme.textDim }}>
      Stays on your phone. Never sent anywhere.
    </Text>
  </View>
);
