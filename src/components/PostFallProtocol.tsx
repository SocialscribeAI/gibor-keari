import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Heart,
  Wind,
  Shield,
  Sunrise,
  Moon,
  Sun,
  Check,
  Plus,
} from 'lucide-react-native';
import {
  useStore,
  type EmotionalTrigger,
  type SituationalTrigger,
  type PrecursorFlag,
} from '../store/useStore';
import { PrivacyNote } from './PrivacyNote';
import { useTheme } from '../constants/theme';

// =============================================================================
// Post-Fall Protocol — the single most important flow in Guard (§2.3).
// Never shames. Frames every step as DATA the app will use to make tomorrow
// safer. Ends on identity, not failure.
// =============================================================================

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onActivatePunishment?: () => void;
}

const STEP_COUNT = 9;

// -------------------- Step data --------------------

const EMOTIONAL_OPTIONS: { value: EmotionalTrigger; label: string }[] = [
  { value: 'stressed', label: 'Stressed' },
  { value: 'lonely', label: 'Lonely' },
  { value: 'bored', label: 'Bored' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'tired', label: 'Tired' },
  { value: 'numb', label: 'Numb' },
  { value: 'angry', label: 'Angry' },
  { value: 'excited', label: 'Excited / high' },
  { value: 'ashamed', label: 'Ashamed' },
  { value: 'anxious', label: 'Anxious' },
];

const SITUATIONAL_OPTIONS: { value: SituationalTrigger; label: string }[] = [
  { value: 'in-bed', label: 'In bed' },
  { value: 'in-bathroom', label: 'In bathroom' },
  { value: 'alone-at-home', label: 'Alone at home' },
  { value: 'at-work', label: 'At work' },
  { value: 'traveling', label: 'Traveling' },
  { value: 'at-party', label: 'At a party / event' },
  { value: 'in-public', label: 'In public' },
];

const DIGITAL_OPTIONS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Reddit',
  'X / Twitter',
  'Snapchat',
  'Telegram',
  'Discord',
  'Browser',
  'Dating app',
  'Messaging',
  'Gaming',
];

const PRECURSOR_OPTIONS: { value: PrecursorFlag; label: string; halt?: boolean }[] = [
  { value: 'halt-hungry', label: 'Hungry', halt: true },
  { value: 'halt-angry', label: 'Angry', halt: true },
  { value: 'halt-lonely', label: 'Lonely', halt: true },
  { value: 'halt-tired', label: 'Tired', halt: true },
  { value: 'ritual-skipped', label: 'Skipped morning ritual' },
  { value: 'check-in-missed', label: 'Missed check-in' },
  { value: 'poor-sleep', label: 'Slept badly last night' },
  { value: 'no-exercise', label: "Didn't move my body today" },
];

// =============================================================================
// COMPONENT
// =============================================================================

export const PostFallProtocol: React.FC<Props> = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const {
    logFallDetailed,
    setRecoveryVow,
    addWatchItem,
    personalityProfile,
    dangerWatchlist,
  } = useStore();

  const [step, setStep] = useState(0);
  const [emotional, setEmotional] = useState<EmotionalTrigger[]>([]);
  const [situational, setSituational] = useState<SituationalTrigger[]>([]);
  const [digital, setDigital] = useState<string[]>([]);
  const [customDigital, setCustomDigital] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [precursors, setPrecursors] = useState<PrecursorFlag[]>([]);
  const [shame, setShame] = useState(5);
  const [anger, setAnger] = useState(5);
  const [numbness, setNumbness] = useState(5);
  const [acceptedWatchlistAdds, setAcceptedWatchlistAdds] = useState<string[]>([]);
  const [plan, setPlan] = useState({ tonight: '', morning: '', dangerWindow: '', evening: '' });
  const [vow, setVow] = useState('');

  const reset = () => {
    setStep(0);
    setEmotional([]);
    setSituational([]);
    setDigital([]);
    setCustomDigital('');
    setCustomNotes('');
    setPrecursors([]);
    setShame(5);
    setAnger(5);
    setNumbness(5);
    setAcceptedWatchlistAdds([]);
    setPlan({ tonight: '', morning: '', dangerWindow: '', evening: '' });
    setVow('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const toggle = <T extends string>(arr: T[], val: T, setter: (v: T[]) => void) => {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const next = () => setStep((s) => Math.min(s + 1, STEP_COUNT));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const commit = () => {
    // 1. Record detailed fall
    const allDigital = [
      ...digital.map((d) => d.toLowerCase()),
      ...(customDigital
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)),
    ];
    logFallDetailed({
      emotionalTriggers: emotional,
      situationalTriggers: situational,
      digitalTriggers: allDigital,
      temporalTriggers: [],
      customTriggerNotes: customNotes,
      precursors,
      shameLevel: shame,
      angerLevel: anger,
      numbnessLevel: numbness,
      recoveryVow: vow.trim() || undefined,
      planCreated: !!(plan.tonight || plan.morning || plan.dangerWindow || plan.evening),
      notes: [plan.tonight, plan.morning, plan.dangerWindow, plan.evening]
        .filter(Boolean)
        .join(' | '),
    });

    // 2. Add accepted watchlist items
    acceptedWatchlistAdds.forEach((label) => {
      if (dangerWatchlist.some((w) => w.label.toLowerCase() === label.toLowerCase())) return;
      addWatchItem({
        type: 'app',
        label,
        detector: { kind: 'app-name', value: label },
        level: 'warn',
        suggestedBy: 'post-fall-protocol',
      });
    });

    // 3. Set 24h identity vow
    if (vow.trim()) setRecoveryVow(vow.trim());

    close();
  };

  // Auto-suggested watchlist additions = digital triggers that aren't already watched
  const watchlistSuggestions = digital.filter(
    (d) => !dangerWatchlist.some((w) => w.label.toLowerCase() === d.toLowerCase())
  );

  const hasLateNight = precursors.includes('halt-tired') || situational.includes('in-bed');
  const hasLonely = precursors.includes('halt-lonely') || situational.includes('alone-at-home');

  // -------------------- Renderers --------------------

  const renderProgress = () => (
    <View className="flex-row gap-1 mb-5">
      {Array.from({ length: STEP_COUNT }).map((_, i) => (
        <View
          key={i}
          className="flex-1 h-1 rounded-full"
          style={{
            backgroundColor: i <= step ? theme.accent : theme.hairline,
          }}
        />
      ))}
    </View>
  );

  const Chip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      className="rounded-full px-3 py-2 mr-2 mb-2"
      style={{
        backgroundColor: active ? theme.accent : theme.surface,
        borderWidth: 1,
        borderColor: active ? theme.accent : theme.hairline,
      }}
    >
      <Text
        style={{ color: active ? theme.onAccent : theme.text, fontWeight: active ? '700' : '500' }}
      >
        {label}
      </Text>
    </Pressable>
  );

  const Slider = ({
    label,
    value,
    onChange,
    low,
    high,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    low: string;
    high: string;
  }) => (
    <View className="mb-5">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white font-semibold">{label}</Text>
        <Text className="text-guard-accent font-black">{value}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
        >
          <Text className="text-white">−</Text>
        </Pressable>
        <View className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{ width: `${(value / 10) * 100}%`, backgroundColor: theme.accent }}
          />
        </View>
        <Pressable
          onPress={() => onChange(Math.min(10, value + 1))}
          className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
        >
          <Text className="text-white">+</Text>
        </Pressable>
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className="text-white/40 text-xs">{low}</Text>
        <Text className="text-white/40 text-xs">{high}</Text>
      </View>
    </View>
  );

  const StepShell: React.FC<{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }> = ({ title, subtitle, children }) => (
    <MotiView
      from={{ opacity: 0, translateX: 20 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -20 }}
      transition={{ type: 'timing', duration: 250 }}
    >
      <Text className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Outfit' }}>
        {title}
      </Text>
      {subtitle && (
        <Text className="text-white/60 mb-5 leading-5">{subtitle}</Text>
      )}
      {children}
    </MotiView>
  );

  // -------------------- Step content --------------------

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepShell title="Pause.">
            <View
              className="rounded-3xl p-6 mb-6"
              style={{
                backgroundColor: 'rgba(232, 160, 32, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(232, 160, 32, 0.3)',
              }}
            >
              <View className="flex-row items-center mb-3">
                <Wind size={22} color="#E8A020" />
                <Text className="ml-2 text-white font-bold text-lg">One breath.</Text>
              </View>
              <Text className="text-white/80 leading-6 text-base">
                This moment matters more than the fall. The bravest thing in the
                world right now is to stay here and look at what happened — instead
                of closing the app and pretending it didn't.
              </Text>
              <Text className="text-white/80 leading-6 text-base mt-3">
                You are not your fall. You are the person who chose to open this
                screen. That person is who you're becoming.
              </Text>
            </View>
            <PrivacyNote tone="prominent" message="Everything you enter here stays on your phone. It's for you and the app's learning — nothing else, nowhere else." />
          </StepShell>
        );

      case 1:
        return (
          <StepShell
            title="How were you feeling?"
            subtitle="Tap anything that fits. Multiple is fine. No judgement — we're just looking at the pattern."
          >
            <View className="flex-row flex-wrap">
              {EMOTIONAL_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={emotional.includes(o.value)}
                  onPress={() => toggle(emotional, o.value, setEmotional)}
                />
              ))}
            </View>
          </StepShell>
        );

      case 2:
        return (
          <StepShell
            title="Where were you?"
            subtitle="Physical context matters more than most people realize."
          >
            <View className="flex-row flex-wrap">
              {SITUATIONAL_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={situational.includes(o.value)}
                  onPress={() => toggle(situational, o.value, setSituational)}
                />
              ))}
            </View>
          </StepShell>
        );

      case 3:
        return (
          <StepShell
            title="What app or site?"
            subtitle="If something digital led into this, tag it. Guard will watch it for you going forward."
          >
            <View className="flex-row flex-wrap">
              {DIGITAL_OPTIONS.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  active={digital.includes(d)}
                  onPress={() => toggle(digital, d, setDigital)}
                />
              ))}
            </View>
            <Text className="text-white/60 text-xs mt-3 mb-1">Other (comma-separated)</Text>
            <TextInput
              value={customDigital}
              onChangeText={setCustomDigital}
              placeholder="e.g. a specific website, a group chat"
              placeholderTextColor={theme.textDim}
              className="bg-guard-surface border border-guard-primary/30 rounded-xl px-3 py-3 text-white"
            />
          </StepShell>
        );

      case 4:
        return (
          <StepShell
            title="What was missing today?"
            subtitle="The stuff that was off before the fall. HALT + basics. Pattern engine uses this."
          >
            <View className="flex-row flex-wrap">
              {PRECURSOR_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={precursors.includes(o.value)}
                  onPress={() => toggle(precursors, o.value, setPrecursors)}
                />
              ))}
            </View>
          </StepShell>
        );

      case 5:
        return (
          <StepShell
            title="How are you feeling right now?"
            subtitle="Noticing the feeling reduces its grip. Amygdala-PFC shift (Lieberman)."
          >
            <Slider
              label="Shame"
              value={shame}
              onChange={setShame}
              low="None"
              high="Crushing"
            />
            <Slider
              label="Anger at myself"
              value={anger}
              onChange={setAnger}
              low="None"
              high="Furious"
            />
            <Slider
              label="Numbness"
              value={numbness}
              onChange={setNumbness}
              low="Fully present"
              high="Disconnected"
            />
            <Text className="text-white/60 text-xs mt-1 mb-2">Anything else to note?</Text>
            <TextInput
              value={customNotes}
              onChangeText={setCustomNotes}
              placeholder="(optional)"
              placeholderTextColor={theme.textDim}
              multiline
              className="bg-guard-surface border border-guard-primary/30 rounded-xl px-3 py-3 text-white min-h-[80px]"
            />
          </StepShell>
        );

      case 6: {
        const suggestions: { key: string; icon: any; text: string; accept: () => void; isAccepted: boolean }[] = [];
        watchlistSuggestions.forEach((w) => {
          suggestions.push({
            key: `watch-${w}`,
            icon: Shield,
            text: `Add ${w} to your Danger Watchlist so Guard warns you before you open it next time.`,
            accept: () =>
              setAcceptedWatchlistAdds((arr) =>
                arr.includes(w) ? arr : [...arr, w]
              ),
            isAccepted: acceptedWatchlistAdds.includes(w),
          });
        });
        if (hasLateNight) {
          suggestions.push({
            key: 'lights-out',
            icon: Moon,
            text: "It was late + you were tired. Consider moving lights-out to 10:30pm in Reminder Settings.",
            accept: () => {},
            isAccepted: false,
          });
        }
        if (hasLonely) {
          suggestions.push({
            key: 'call-friend',
            icon: Heart,
            text: "You were alone. Add an evening check-in call to your ritual stack.",
            accept: () => {},
            isAccepted: false,
          });
        }

        return (
          <StepShell
            title="What Guard can do for you"
            subtitle="Based on what you just logged. Tap any you want. Guard adjusts automatically."
          >
            {suggestions.length === 0 ? (
              <Text className="text-white/60 leading-5">
                Nothing obvious to suggest from this log. That's okay — every log still feeds the pattern engine quietly.
              </Text>
            ) : (
              suggestions.map((s) => (
                <Pressable
                  key={s.key}
                  onPress={s.accept}
                  className="rounded-2xl p-4 mb-3 flex-row"
                  style={{
                    backgroundColor: s.isAccepted ? 'rgba(30,138,74,0.15)' : theme.surface,
                    borderWidth: 1,
                    borderColor: s.isAccepted ? '#1E8A4A' : theme.hairline,
                  }}
                >
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                    style={{
                      backgroundColor: s.isAccepted
                        ? 'rgba(30,138,74,0.25)'
                        : 'rgba(232, 160, 32, 0.12)',
                    }}
                  >
                    {s.isAccepted ? (
                      <Check size={18} color="#1E8A4A" />
                    ) : (
                      <s.icon size={18} color="#E8A020" />
                    )}
                  </View>
                  <Text className="flex-1 text-white/90 leading-5">{s.text}</Text>
                </Pressable>
              ))
            )}
          </StepShell>
        );
      }

      case 7:
        return (
          <StepShell
            title="Next 24 hours"
            subtitle="Concrete actions. One line each. The plan is the win."
          >
            {[
              { key: 'tonight', icon: Moon, label: 'Tonight' },
              { key: 'morning', icon: Sunrise, label: 'Tomorrow morning' },
              { key: 'dangerWindow', icon: Shield, label: 'Tomorrow danger window' },
              { key: 'evening', icon: Sun, label: 'Tomorrow evening' },
            ].map(({ key, icon: Icon, label }) => (
              <View key={key} className="mb-4">
                <View className="flex-row items-center mb-2">
                  <Icon size={14} color="#E8A020" />
                  <Text className="ml-2 text-white/70 text-xs uppercase tracking-widest">
                    {label}
                  </Text>
                </View>
                <TextInput
                  value={plan[key as keyof typeof plan]}
                  onChangeText={(v) => setPlan((p) => ({ ...p, [key]: v }))}
                  placeholder={
                    key === 'tonight'
                      ? 'e.g. lights out at 10pm, no phone in bed'
                      : key === 'morning'
                      ? 'e.g. 10 min walk after waking'
                      : key === 'dangerWindow'
                      ? 'e.g. call partner at 10pm'
                      : 'e.g. read 15 min, no social media after 9'
                  }
                  placeholderTextColor={theme.textDim}
                  className="bg-guard-surface border border-guard-primary/30 rounded-xl px-3 py-3 text-white"
                />
              </View>
            ))}
          </StepShell>
        );

      case 8:
        return (
          <StepShell
            title="Who are you becoming?"
            subtitle="One sentence. Your words. Shown at the top of Home for the next 24 hours."
          >
            <TextInput
              value={vow}
              onChangeText={setVow}
              placeholder="I am the kind of person who gets up."
              placeholderTextColor={theme.textDim}
              multiline
              autoFocus
              className="bg-guard-surface border border-guard-accent/40 rounded-2xl px-4 py-4 text-white text-base min-h-[100px]"
            />
            <Text className="text-white/50 text-xs mt-3 leading-5">
              This isn't a punishment. It's a reminder of your direction. You can edit it or clear it any time.
            </Text>
          </StepShell>
        );

      case 9:
        return (
          <StepShell
            title="That was the hard thing."
            subtitle=""
          >
            <View
              className="rounded-3xl p-6 mb-6"
              style={{
                backgroundColor: 'rgba(30, 138, 74, 0.12)',
                borderWidth: 1,
                borderColor: 'rgba(30, 138, 74, 0.4)',
              }}
            >
              <View className="flex-row items-center mb-3">
                <Check size={22} color="#1E8A4A" />
                <Text className="ml-2 text-white font-bold text-lg">You faced it.</Text>
              </View>
              <Text className="text-white/80 leading-6">
                Most people close the app and pretend it didn't happen. You didn't.
                You looked at it. You turned it into data. That is how recovery
                actually happens.
              </Text>
              <Text className="text-white/80 leading-6 mt-3">
                The streak is just a number. This protocol is growth. Guard is a
                little smarter about you now — and tomorrow will be easier
                because of it.
              </Text>
            </View>
            <Pressable
              onPress={commit}
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: theme.accent }}
            >
              <Text className="text-guard-on-accent font-black text-base tracking-wide">
                Save & keep going
              </Text>
            </Pressable>
          </StepShell>
        );

      default:
        return null;
    }
  };

  // Step validation — disable Next if required info missing
  const canAdvance = (() => {
    switch (step) {
      case 0:
        return true;
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        return true; // all optional
      case 8:
        return true; // vow optional
      default:
        return true;
    }
  })();

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-guard-bg">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-12 pb-3">
            <Pressable
              onPress={step === 0 ? close : prev}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.hairline }}
            >
              {step === 0 ? (
                <X size={18} color={theme.text} />
              ) : (
                <ArrowLeft size={18} color={theme.text} />
              )}
            </Pressable>
            <Text className="text-white/50 text-xs uppercase tracking-widest">
              Reset · Step {step + 1} of {STEP_COUNT + 1}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            className="flex-1 px-6"
            contentContainerStyle={{ paddingBottom: 140 }}
            keyboardShouldPersistTaps="handled"
          >
            {renderProgress()}
            <AnimatePresence exitBeforeEnter>{renderStep()}</AnimatePresence>
          </ScrollView>

          {/* Footer */}
          {step < STEP_COUNT && (
            <View
              className="absolute bottom-0 left-0 right-0 px-6 pt-3 pb-8"
              style={{
                backgroundColor: theme.bg,
                borderTopWidth: 1,
                borderTopColor: theme.hairline,
              }}
            >
              <Pressable
                onPress={next}
                disabled={!canAdvance}
                className="rounded-2xl py-4 flex-row items-center justify-center"
                style={{ backgroundColor: theme.accent, opacity: canAdvance ? 1 : 0.4 }}
              >
                <Text className="text-guard-on-accent font-black mr-2">
                  {step === 0 ? "I'm ready" : 'Continue'}
                </Text>
                <ArrowRight size={16} color={theme.onAccent} />
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
