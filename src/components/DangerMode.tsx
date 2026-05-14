import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Animated,
  Easing,
  Linking,
  StatusBar,
  AppState,
  BackHandler,
  Vibration,
  type AppStateStatus,
} from 'react-native';
import { MotiView } from 'moti';
import {
  X,
  Wind,
  Heart,
  Shield,
  Check,
  ChevronLeft,
  ChevronRight,
  Phone,
  Sparkles,
  Zap,
  Brain,
  BookOpen,
  Share2,
} from 'lucide-react-native';
import { useStore, type TacticPreference } from '../store/useStore';
import { useTheme } from '../constants/theme';

// =============================================================================
// Danger Mode — full-screen takeover, 4 steps, 30-second commitment lock.
//
// Replaces the modal-style v1 which (per user report) could lock the UI and
// force a quit-and-relaunch escape. New invariants:
//
//   1. 30-SECOND LOCK at open. The in-app X cannot dismiss the screen for the
//      first 30 seconds; instead it displays a live countdown. The hardware
//      back button is intercepted for the same window. This is the user's own
//      requirement — turn Danger Mode into a commitment device, not just a
//      suggestion.
//   2. Backgrounding the app RESETS the lock to 30s. We can't intercept the
//      OS home button or app switcher, but on return the timer restarts. Every
//      bail-out costs another 30s.
//   3. CALLS pass through. An always-tappable "Call someone" button is in the
//      header so the user can reach a partner / friend / hotline without
//      needing to leave the app. Once they tap it, the lock pauses so the call
//      can complete without timer punishment.
//   4. No UI-blocking work. Breath animation uses native driver; the lock
//      countdown updates a ref (not state) every tick — state only updates
//      once per second for the visible label.
//   5. Each step is self-contained — its own state, no shared resources that
//      could leak between steps.
//
// Steps:
//   1. BREATH   — 4-7-8 animated breathing
//   2. ANCHOR   — identity statement + a why reason
//   3. ACT      — top 4 ranked tactics; "I did this"
//   4. RECOVER  — "you stayed standing", share + tehillim
// =============================================================================

const LOCK_SECONDS = 30;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type StepId = 'breath' | 'anchor' | 'act' | 'recover';
const STEPS: StepId[] = ['breath', 'anchor', 'act', 'recover'];

interface BuiltinTactic {
  id: string;
  title: string;
  desc: string;
  category: TacticPreference;
  duration: string;
}

const ALL_TACTICS: BuiltinTactic[] = [
  { id: 'cold-shower', title: 'Cold Shower', desc: '30 seconds resets the nervous system. Go.', category: 'physical', duration: '2 min' },
  { id: 'ten-pushups', title: '10 Pushups — NOW', desc: 'Floor. Redirect the energy. Go.', category: 'physical', duration: '60s' },
  { id: 'walk-outside', title: 'Walk Outside', desc: 'Change the room. The urge stays behind.', category: 'environmental', duration: '5 min' },
  { id: 'phone-drawer', title: 'Phone In the Drawer', desc: 'Close it. Put it face-down across the room.', category: 'environmental', duration: 'instant' },
  { id: 'breathing-478', title: '4-7-8 Breathing', desc: 'In 4, hold 7, out 8. Repeat 3 times.', category: 'breathwork', duration: '90s' },
  { id: 'shema', title: 'Say Shema', desc: 'Out loud. With kavanah. Right now.', category: 'spiritual', duration: 'instant' },
  { id: 'tehillim-51', title: 'Tehillim 51', desc: "David's prayer after his fall. Out loud.", category: 'spiritual', duration: '3 min' },
  { id: 'call-friend', title: 'Call Someone', desc: '"I need to talk." That\'s the whole sentence.', category: 'social', duration: '5 min' },
  { id: 'text-partner', title: 'Text Your Partner', desc: 'One word: "Struggling." They\'ll know.', category: 'social', duration: 'instant' },
  { id: 'reframe', title: 'Reframe It', desc: '"This urge is energy. What else can I do with it?"', category: 'cognitive', duration: '60s' },
];

const CATEGORY_ICON: Record<TacticPreference, any> = {
  physical: Zap,
  breathwork: Wind,
  spiritual: BookOpen,
  cognitive: Brain,
  social: Phone,
  environmental: Shield,
};

const CATEGORY_COLOR: Record<TacticPreference, string> = {
  physical: '#E8A020',
  breathwork: '#4A90D9',
  spiritual: '#9B59B6',
  cognitive: '#27AE60',
  social: '#E74C3C',
  environmental: '#2C3E50',
};

// Reused verbatim from v1 — well-designed scoring against user preferences
// and effectiveness history. Keeping it intact preserves all the personalization
// work already invested in tactic selection.
function rankTactics(
  tacticPreferences: TacticPreference[],
  firstMove: TacticPreference | null,
  tacticEffectiveness: Record<string, { timesUsed: number; timesWorked: number }>,
  likedTacticIds: string[],
): BuiltinTactic[] {
  const score = (t: BuiltinTactic): number => {
    let s = 0;
    if (firstMove && t.category === firstMove) s += 30;
    if (tacticPreferences.includes(t.category)) s += 15;
    if (likedTacticIds.includes(t.id)) s += 20;
    const eff = tacticEffectiveness[t.id];
    if (eff && eff.timesUsed > 0) {
      s += Math.round((eff.timesWorked / eff.timesUsed) * 20);
    }
    return s;
  };
  return [...ALL_TACTICS].sort((a, b) => score(b) - score(a));
}

export const DangerMode: React.FC<Props> = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const {
    coachStylePrefs,
    tacticEffectiveness,
    identityStatement,
    whyReasons,
    logCloseCall,
    rateTactic,
  } = useStore();

  const [stepIndex, setStepIndex] = useState(0);
  const [exitConfirming, setExitConfirming] = useState(false);
  const [completedTactic, setCompletedTactic] = useState<string | null>(null);

  // 30-second commitment lock. The X / hardware-back can't dismiss while
  // `lockRemaining > 0`. The countdown updates state once per second for the
  // label; we don't drive it off `Date.now()` per render because backgrounding
  // freezes the JS timer (which is exactly what we want — the timer "pauses"
  // while backgrounded and the AppState listener separately resets to full
  // on return).
  const [lockRemaining, setLockRemaining] = useState(LOCK_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callPausedRef = useRef(false);

  const startLockTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setLockRemaining(LOCK_SECONDS);
    intervalRef.current = setInterval(() => {
      setLockRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }, []);

  const stepId = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const locked = lockRemaining > 0;

  // Reset state when the modal opens fresh. Don't reset while it's already
  // open — that would wipe progress mid-session.
  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
      setExitConfirming(false);
      setCompletedTactic(null);
      startLockTimer();
    } else {
      // Modal closed — stop the timer so it doesn't keep ticking in the
      // background.
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen, startLockTimer]);

  // Backgrounding penalty: when the user leaves the app (home button, app
  // switcher) and comes back, reset the lock to a full 30s. We can't *prevent*
  // them leaving (OS doesn't allow it), but we can make every escape costly.
  //
  // Exception: if the user just tapped "Call someone", we set callPausedRef
  // so the next background→foreground cycle doesn't reset (the call is the
  // explicit allowed reason to leave). Cleared on the first return.
  useEffect(() => {
    if (!isOpen) return;
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        if (callPausedRef.current) {
          callPausedRef.current = false;
          return; // pass through — they were calling someone
        }
        // They left for some other reason. Reset to full lock.
        startLockTimer();
      }
    });
    return () => sub.remove();
  }, [isOpen, startLockTimer]);

  // Hardware back button on Android: intercept while locked. Returning true
  // tells RN we've handled it. After 30s the back button does its normal
  // thing (which on this Modal is also handled by onRequestClose → exit).
  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (locked) {
        // Subtle haptic so the user knows we heard them — and that the
        // back button isn't broken, just intentionally disabled.
        Vibration.vibrate(40);
        return true; // intercept
      }
      handleAttemptExit();
      return true;
    });
    return () => sub.remove();
  }, [isOpen, locked]); // eslint-disable-line react-hooks/exhaustive-deps

  const tactics = useMemo(
    () =>
      rankTactics(
        coachStylePrefs.tacticPreferences,
        coachStylePrefs.firstMoveWhenUrgeHits,
        tacticEffectiveness,
        coachStylePrefs.likedTacticIds,
      ).slice(0, 4),
    [coachStylePrefs.tacticPreferences, coachStylePrefs.firstMoveWhenUrgeHits, coachStylePrefs.likedTacticIds, tacticEffectiveness],
  );

  const handleAttemptExit = () => {
    if (locked) {
      // Hard block — the user committed to 30s. A short vibration so the
      // tap is acknowledged but no exit.
      Vibration.vibrate(40);
      return;
    }
    // After the lock: still confirm if they haven't completed the flow.
    if (stepIndex === STEPS.length - 1 || completedTactic) {
      doExit();
      return;
    }
    setExitConfirming(true);
  };

  const doExit = () => {
    setExitConfirming(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    onClose();
  };

  // Always-allowed escape: calling someone. Sets the pass-through flag so the
  // AppState listener doesn't reset the lock when the user returns from the
  // call.
  const handleCall = () => {
    callPausedRef.current = true;
    void Linking.openURL('tel:');
  };

  const handleTacticDone = (tacticId: string) => {
    if (completedTactic) return;
    setCompletedTactic(tacticId);
    const tactic = ALL_TACTICS.find((t) => t.id === tacticId);
    rateTactic(tacticId, true, 'danger-mode');
    logCloseCall({
      trigger: 'danger-mode',
      tacticUsed: tactic?.title ?? tacticId,
      workedRating: 4,
    });
    // Auto-advance to recover step after a beat so the user sees the success
    // state. Single setTimeout, no animation deps — safe to leave even if the
    // user exits in the gap.
    setTimeout(() => {
      setStepIndex(STEPS.length - 1);
    }, 800);
  };

  const next = () => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  const back = () => setStepIndex((i) => Math.max(0, i - 1));

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      onRequestClose={handleAttemptExit}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* Header
            - DANGER MODE label + step counter
            - Always-visible "Call" button (the explicit allowed escape)
            - X button that becomes a live countdown for the first 30s
        */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 56,
            paddingHorizontal: 20,
            paddingBottom: 12,
            gap: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900', letterSpacing: 3 }}>
              DANGER MODE
            </Text>
            <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
              Step {stepIndex + 1} of {STEPS.length}
              {locked ? ' · Locked' : ''}
            </Text>
          </View>

          {/* Call someone — the explicit allowed escape. Always tappable,
              even during lock. Tapping flips callPausedRef so the
              background→foreground cycle doesn't penalize the call. */}
          <Pressable
            onPress={handleCall}
            hitSlop={12}
            style={{
              paddingHorizontal: 12,
              height: 40,
              borderRadius: 12,
              backgroundColor: 'rgba(231,76,60,0.15)',
              borderWidth: 1,
              borderColor: 'rgba(231,76,60,0.45)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Phone size={14} color="#E74C3C" />
            <Text style={{ color: '#E74C3C', fontWeight: '900', fontSize: 11, letterSpacing: 1 }}>
              CALL
            </Text>
          </Pressable>

          {/* Exit X — shows countdown while locked. Tap during lock just
              vibrates; tap after lock triggers handleAttemptExit (which
              still confirms if not on the final step). */}
          <Pressable
            onPress={handleAttemptExit}
            hitSlop={16}
            style={{
              minWidth: 40,
              paddingHorizontal: locked ? 10 : 0,
              height: 40,
              borderRadius: 12,
              backgroundColor: locked ? 'rgba(232,160,32,0.15)' : theme.surface2,
              borderWidth: locked ? 1 : 0,
              borderColor: locked ? 'rgba(232,160,32,0.45)' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {locked ? (
              <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 13, fontVariant: ['tabular-nums'] }}>
                {`0:${String(lockRemaining).padStart(2, '0')}`}
              </Text>
            ) : (
              <X size={18} color={theme.text} />
            )}
          </Pressable>
        </View>

        {/* Lock explanation — only shown while locked, fades out after */}
        {locked && (
          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            <Text style={{ color: theme.muted, fontSize: 11, lineHeight: 16, fontStyle: 'italic' }}>
              You're locked in for {lockRemaining}s — long enough for the urge to crest. Tap CALL if you need someone now.
            </Text>
          </View>
        )}

        {/* Progress bar — solid filled to current step */}
        <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 20, marginBottom: 8 }}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: i <= stepIndex ? theme.accent : theme.hairline,
              }}
            />
          ))}
        </View>

        {/* Step content */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {stepId === 'breath' && <BreathStep theme={theme} />}
          {stepId === 'anchor' && (
            <AnchorStep
              theme={theme}
              identityStatement={identityStatement}
              whyReasons={whyReasons}
            />
          )}
          {stepId === 'act' && (
            <ActStep
              theme={theme}
              tactics={tactics}
              tacticEffectiveness={tacticEffectiveness}
              completedTactic={completedTactic}
              onTacticDone={handleTacticDone}
            />
          )}
          {stepId === 'recover' && (
            <RecoverStep
              theme={theme}
              completedTactic={completedTactic}
              tactics={tactics}
            />
          )}
        </ScrollView>

        {/* Bottom controls — back / continue. Bottom-anchored so they're
            always reachable; never overlap with content because the
            ScrollView's paddingBottom reserves space. */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            paddingBottom: 32,
            backgroundColor: theme.bg,
            borderTopWidth: 1,
            borderTopColor: theme.hairline,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          {stepIndex > 0 && !isLast && (
            <Pressable
              onPress={back}
              hitSlop={8}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 18,
                borderRadius: 16,
                backgroundColor: theme.surface2,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <ChevronLeft size={18} color={theme.muted} />
              <Text style={{ color: theme.muted, fontWeight: '800', marginLeft: 4, fontSize: 13 }}>
                Back
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={isLast ? doExit : next}
            style={{
              flex: 1,
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: theme.accent,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: theme.onAccent, fontWeight: '900', letterSpacing: 1.5, fontSize: 14, textTransform: 'uppercase' }}>
              {isLast ? 'Back to Home' : stepId === 'act' && completedTactic ? 'Continue' : 'Continue'}
            </Text>
            <ChevronRight size={18} color={theme.onAccent} style={{ marginLeft: 4 }} />
          </Pressable>
        </View>

        {/* Exit confirmation — soft warning, not a hard block. */}
        {exitConfirming && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15,17,32,0.92)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: 24,
                padding: 24,
                width: '100%',
                maxWidth: 360,
                borderWidth: 1,
                borderColor: theme.hairline,
              }}
            >
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', marginBottom: 8 }}>
                Leave now?
              </Text>
              <Text style={{ color: theme.muted, fontSize: 14, lineHeight: 21, marginBottom: 20 }}>
                You haven't finished. Even one more breath could be what carries you through.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={doExit}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: theme.surface2,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: theme.muted, fontWeight: '800', fontSize: 13 }}>
                    Yes, exit
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setExitConfirming(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: theme.accent,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: theme.onAccent, fontWeight: '900', fontSize: 13 }}>
                    Keep going
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

// =============================================================================
// Step 1 — BREATH
// =============================================================================
//
// 4-7-8 breathing cycle. Animation driven by Animated.Value with native driver
// so it runs off the JS thread — no UI freeze risk. Phase labels update from a
// chained sequence of timings; the user can ignore the timing and just watch.
// =============================================================================

const BREATH_PHASES = [
  { label: 'Breathe in', duration: 4000, toScale: 1.4 },
  { label: 'Hold', duration: 7000, toScale: 1.4 },
  { label: 'Breathe out', duration: 8000, toScale: 0.6 },
] as const;

const BreathStep: React.FC<{ theme: ReturnType<typeof useTheme> }> = ({ theme }) => {
  const scale = useRef(new Animated.Value(0.8)).current;
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const animatePhase = (i: number, c: number) => {
      if (cancelledRef.current) return;
      const phase = BREATH_PHASES[i];
      setPhaseIndex(i);
      Animated.timing(scale, {
        toValue: phase.toScale,
        duration: phase.duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start((res) => {
        if (cancelledRef.current || !res.finished) return;
        const nextI = (i + 1) % BREATH_PHASES.length;
        const nextC = nextI === 0 ? c + 1 : c;
        if (nextI === 0) setCycle(nextC);
        animatePhase(nextI, nextC);
      });
    };

    animatePhase(0, 0);

    return () => {
      cancelledRef.current = true;
      scale.stopAnimation();
    };
  }, [scale]);

  const phase = BREATH_PHASES[phaseIndex];

  return (
    <View style={{ alignItems: 'center', paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Wind size={16} color={theme.accent} />
        <Text style={{ color: theme.accent, fontWeight: '800', marginLeft: 8, letterSpacing: 1, fontSize: 12 }}>
          4 · 7 · 8 BREATHING
        </Text>
      </View>

      <Text style={{ color: theme.text, fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 32, lineHeight: 38 }}>
        Slow your body before{'\n'}you do anything else.
      </Text>

      <View style={{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Animated.View
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: 'rgba(232,160,32,0.12)',
            borderWidth: 2,
            borderColor: theme.accent,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale }],
          }}
        >
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900' }}>{phase.label}</Text>
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 6 }}>
            Cycle {cycle + 1}
          </Text>
        </Animated.View>
      </View>

      <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 300 }}>
        Just match the circle. Inhale 4, hold 7, exhale 8. The urge starts dropping in under a minute.
      </Text>
    </View>
  );
};

// =============================================================================
// Step 2 — ANCHOR
// =============================================================================
//
// User's own identityStatement + a why reason. Pulled verbatim from onboarding
// or About Me. If neither was captured, fall back to a generic but strong line
// that points the user toward setting their own.
// =============================================================================

interface AnchorStepProps {
  theme: ReturnType<typeof useTheme>;
  identityStatement: string | null;
  whyReasons: string[];
}

const AnchorStep: React.FC<AnchorStepProps> = ({ theme, identityStatement, whyReasons }) => {
  const hasIdentity = !!identityStatement && identityStatement.trim().length > 0;
  const hasWhy = whyReasons.length > 0;

  // Pick a why reason — rotate through them by minute so the same reason
  // doesn't appear every time within one session.
  const reason = useMemo(() => {
    if (!hasWhy) return null;
    const idx = Math.floor(Date.now() / 60_000) % whyReasons.length;
    return whyReasons[idx];
  }, [whyReasons, hasWhy]);

  return (
    <View style={{ paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Heart size={16} color={theme.accent} />
        <Text style={{ color: theme.accent, fontWeight: '800', marginLeft: 8, letterSpacing: 1, fontSize: 12 }}>
          REMEMBER WHO YOU ARE
        </Text>
      </View>

      {hasIdentity ? (
        <View
          style={{
            backgroundColor: 'rgba(232,160,32,0.10)',
            borderWidth: 1,
            borderColor: 'rgba(232,160,32,0.40)',
            borderRadius: 24,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: theme.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 12 }}>
            YOU SAID:
          </Text>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: '900', lineHeight: 32 }}>
            "I am the kind of man who {identityStatement!.replace(/^i am the kind of man who\s+/i, '')}."
          </Text>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.hairline,
            borderRadius: 24,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: theme.muted, fontSize: 14, lineHeight: 21 }}>
            You haven't set your identity statement yet. When the dust settles, go to About Me and finish: <Text style={{ color: theme.text, fontWeight: '700' }}>"I am the kind of man who..."</Text> — then this card will quote your own words back to you in the moment.
          </Text>
        </View>
      )}

      {hasWhy && reason && (
        <View
          style={{
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.hairline,
            borderRadius: 24,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: theme.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 }}>
            ONE OF YOUR REASONS:
          </Text>
          <Text style={{ color: theme.text, fontSize: 17, lineHeight: 25, fontWeight: '600' }}>
            {reason}
          </Text>
        </View>
      )}

      <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', paddingHorizontal: 8 }}>
        This is who you are. The urge is a wave — you are the shore. Stand here for a beat.
      </Text>
    </View>
  );
};

// =============================================================================
// Step 3 — ACT
// =============================================================================
//
// Top 4 user-ranked tactics. Tap "I did this" to log + advance to recover.
// =============================================================================

interface ActStepProps {
  theme: ReturnType<typeof useTheme>;
  tactics: BuiltinTactic[];
  tacticEffectiveness: Record<string, { timesUsed: number; timesWorked: number }>;
  completedTactic: string | null;
  onTacticDone: (id: string) => void;
}

const ActStep: React.FC<ActStepProps> = ({ theme, tactics, tacticEffectiveness, completedTactic, onTacticDone }) => (
  <View style={{ paddingTop: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <Sparkles size={16} color={theme.accent} />
      <Text style={{ color: theme.accent, fontWeight: '800', marginLeft: 8, letterSpacing: 1, fontSize: 12 }}>
        DO ONE THING
      </Text>
    </View>

    <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900', marginBottom: 8, lineHeight: 28 }}>
      Pick one. Do it now.
    </Text>
    <Text style={{ color: theme.muted, fontSize: 14, lineHeight: 21, marginBottom: 20 }}>
      Ranked by what's worked for you. Tap when you've done it.
    </Text>

    {tactics.map((tactic, i) => {
      const Icon = CATEGORY_ICON[tactic.category];
      const color = CATEGORY_COLOR[tactic.category];
      const eff = tacticEffectiveness[tactic.id];
      const isCompleted = completedTactic === tactic.id;
      const isDisabled = !!completedTactic && !isCompleted;

      return (
        <MotiView
          key={tactic.id}
          from={{ opacity: 0, translateY: 6 }}
          animate={{ opacity: isDisabled ? 0.35 : 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 240, delay: i * 60 }}
          style={{
            backgroundColor: isCompleted ? `${theme.success}1A` : theme.surface,
            borderWidth: 1,
            borderColor: isCompleted ? theme.success : theme.hairline,
            borderRadius: 18,
            padding: 16,
            marginBottom: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: color + '20',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={18} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, flex: 1 }}>{tactic.title}</Text>
                <Text style={{ color: theme.textDim, fontSize: 11 }}>{tactic.duration}</Text>
              </View>
              <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
                {tactic.desc}
              </Text>
              {eff && eff.timesUsed > 0 && (
                <Text style={{ color: theme.textDim, fontSize: 10, marginTop: 6 }}>
                  Worked {eff.timesWorked}/{eff.timesUsed} times for you
                </Text>
              )}
              <Pressable
                onPress={() => onTacticDone(tactic.id)}
                disabled={!!completedTactic}
                hitSlop={6}
                style={{
                  marginTop: 12,
                  backgroundColor: isCompleted ? `${theme.success}30` : color + '20',
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {isCompleted ? (
                  <>
                    <Check size={14} color={theme.success} />
                    <Text style={{ color: theme.success, fontWeight: '900', fontSize: 12 }}>
                      Done — logged
                    </Text>
                  </>
                ) : (
                  <>
                    <ChevronRight size={14} color={color} />
                    <Text style={{ color, fontWeight: '900', fontSize: 12 }}>
                      I'm doing this
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </MotiView>
      );
    })}
  </View>
);

// =============================================================================
// Step 4 — RECOVER
// =============================================================================
//
// Closing affirmation. Acknowledges what they did. Offers next-step links
// (share, talk to coach) but doesn't require any action.
// =============================================================================

interface RecoverStepProps {
  theme: ReturnType<typeof useTheme>;
  completedTactic: string | null;
  tactics: BuiltinTactic[];
}

const RecoverStep: React.FC<RecoverStepProps> = ({ theme, completedTactic, tactics }) => {
  const tactic = completedTactic ? tactics.find((t) => t.id === completedTactic) ?? ALL_TACTICS.find((t) => t.id === completedTactic) : null;

  const handleShare = () => {
    void Linking.openURL('sms:?body=Just rode out a hard moment. Standing strong.');
  };

  return (
    <View style={{ paddingTop: 8, alignItems: 'center' }}>
      <MotiView
        from={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14 }}
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: `${theme.success}25`,
          borderWidth: 2,
          borderColor: theme.success,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Heart size={40} color={theme.success} />
      </MotiView>

      <Text style={{ color: theme.text, fontSize: 30, fontWeight: '900', textAlign: 'center', marginBottom: 12, lineHeight: 36 }}>
        You stayed standing.
      </Text>

      <Text style={{ color: theme.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 24, maxWidth: 340 }}>
        {tactic
          ? `You chose ${tactic.title} and worked through it. That choice is logged — the pattern engine just noticed who you are when it counts.`
          : 'You showed up here when it would have been easier not to. That counts.'}
      </Text>

      <View
        style={{
          width: '100%',
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.hairline,
          borderRadius: 20,
          padding: 18,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: theme.muted, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8 }}>
          חיזוק · STRENGTH
        </Text>
        <Text style={{ color: theme.text, fontSize: 15, lineHeight: 22, fontWeight: '600', fontStyle: 'italic' }}>
          "אֵיזֶהוּ גִּבּוֹר, הַכּוֹבֵשׁ אֶת יִצְרוֹ — Who is mighty? The one who masters his desire."
        </Text>
        <Text style={{ color: theme.textDim, fontSize: 11, marginTop: 6 }}>
          Pirkei Avot 4:1
        </Text>
      </View>

      <Pressable
        onPress={handleShare}
        style={{
          width: '100%',
          paddingVertical: 14,
          borderRadius: 14,
          backgroundColor: theme.surface2,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Share2 size={14} color={theme.muted} />
        <Text style={{ color: theme.muted, fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>
          TELL SOMEONE YOU MADE IT
        </Text>
      </Pressable>
    </View>
  );
};
