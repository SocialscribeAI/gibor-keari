import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  AppState,
  Linking,
  Vibration,
  type AppStateStatus,
} from 'react-native';
import { MotiView } from 'moti';
import {
  Phone,
  Users,
  Unlock,
  AlertTriangle,
  Sparkles,
  Wind,
  Zap,
  Brain,
  BookOpen,
  Shield,
  ChevronRight,
  Check,
  X,
} from 'lucide-react-native';
import { useStore, type TacticPreference } from '../store/useStore';
import { useTheme } from '../constants/theme';
import { AnchorCard } from './AnchorCard';

// =============================================================================
// Danger Mode — app-wide 60-second lock with CALL/CONTACTS pass-through and a
// typed-affirmation override.
//
// Design (per user spec, 2026-05-14):
//
//   - Tapping the Danger button on Home activates a 60-second lock state
//     (`store.dangerModeActiveSince`). The lock is PERSISTED so force-quitting
//     doesn't bypass it.
//   - The app remains fully navigable during the lock — no full-screen takeover.
//     A persistent banner at the top of every screen shows the countdown plus
//     CALL / CONTACTS / OVERRIDE controls.
//   - We CANNOT prevent the user from leaving the app at the OS level (no
//     mobile OS allows third-party apps to block the home button). What we
//     CAN do: detect re-entry via AppState and force the user to type the
//     override before they can keep using the app.
//   - Tapping the in-app CALL or CONTACTS button sets a pass-through flag
//     (module-level, intentionally). When AppState fires 'active' on return,
//     we consume that flag — if it was set, the user was legitimately calling
//     someone and we skip the re-entry lock. If it wasn't, the lock fires.
//   - Override phrase: typing "I promise to try my hardest to stand strong"
//     (case + whitespace tolerant) clears the lock entirely.
//   - After 60 seconds elapse naturally, the banner and re-entry lock both
//     unmount and the user can use the app normally.
// =============================================================================

export const DANGER_LOCK_MS = 60_000;
export const DANGER_OVERRIDE_PHRASE = 'I promise to try my hardest to stand strong';

// ---------------------------------------------------------------------------
// Module-level pass-through. Set when the user taps in-app CALL or CONTACTS;
// consumed when AppState fires 'active' so we know whether to penalize the
// return from background. Intentionally NOT in store — this is ephemeral and
// shouldn't survive a force-quit (that should always penalize).
// ---------------------------------------------------------------------------
let callPassThrough = false;
let callPassThroughExpiresAt = 0;

/** Mark that a user-initiated leave (CALL / CONTACTS) is happening. */
export function markCallPassThrough(): void {
  callPassThrough = true;
  // Pass-through expires after 5 minutes so a stale flag from yesterday can't
  // bypass today's lock if the timestamps somehow line up.
  callPassThroughExpiresAt = Date.now() + 5 * 60_000;
}

/** Consume the pass-through. Returns true if it was set AND still fresh. */
export function consumeCallPassThrough(): boolean {
  if (!callPassThrough) return false;
  const fresh = Date.now() < callPassThroughExpiresAt;
  callPassThrough = false;
  return fresh;
}

function normalize(s: string): string {
  // Trim, collapse whitespace, lowercase, strip non-letters (punctuation,
  // smart quotes, accidental typos with periods). The user shouldn't have to
  // perfectly match formatting under duress.
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesDangerOverride(input: string): boolean {
  return normalize(input) === normalize(DANGER_OVERRIDE_PHRASE);
}

// ---------------------------------------------------------------------------
// useDangerModeRemaining — single hook that owns the 1Hz tick. Returns the
// number of milliseconds remaining in the current lock. Calls
// `clearDangerMode()` exactly once when the lock expires naturally so the
// store stays clean.
// ---------------------------------------------------------------------------
export function useDangerModeRemaining(): number {
  const activeSince = useStore((s) => s.dangerModeActiveSince);
  const clearDangerMode = useStore((s) => s.clearDangerMode);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!activeSince) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [activeSince]);

  const remaining = activeSince ? Math.max(0, DANGER_LOCK_MS - (Date.now() - activeSince)) : 0;

  useEffect(() => {
    if (activeSince && remaining === 0) {
      clearDangerMode();
    }
  }, [activeSince, remaining, clearDangerMode]);

  return remaining;
}

// ---------------------------------------------------------------------------
// useDangerModeReentry — owns the AppState listener. When the user backgrounds
// the app and returns without the pass-through flag set, locks `reentry` to
// true. The DangerModeReentryLock component then renders the override modal.
// ---------------------------------------------------------------------------
function useDangerModeReentry(): { locked: boolean; clear: () => void } {
  const activeSince = useStore((s) => s.dangerModeActiveSince);
  const [locked, setLocked] = useState(false);
  const lastStateRef = useRef<AppStateStatus>('active');

  useEffect(() => {
    if (!activeSince) {
      setLocked(false);
      return;
    }
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = lastStateRef.current;
      lastStateRef.current = next;
      // Trigger only on a real background → active transition.
      if (next === 'active' && prev !== 'active') {
        const fresh = Date.now() - activeSince < DANGER_LOCK_MS;
        if (!fresh) return;
        const allowed = consumeCallPassThrough();
        if (!allowed) {
          setLocked(true);
        }
      }
    });
    return () => sub.remove();
  }, [activeSince]);

  return { locked, clear: () => setLocked(false) };
}

// ---------------------------------------------------------------------------
// Banner — persistent at the top of every screen while the lock is active.
// The user can navigate the app normally; this stays visible.
// ---------------------------------------------------------------------------
export const DangerModeBanner: React.FC = () => {
  const theme = useTheme();
  const remaining = useDangerModeRemaining();
  const clearDangerMode = useStore((s) => s.clearDangerMode);
  const [overrideOpen, setOverrideOpen] = useState(false);

  if (remaining === 0) return null;

  const seconds = Math.ceil(remaining / 1000);

  const handleCall = () => {
    markCallPassThrough();
    void Linking.openURL('tel:');
  };

  const handleContacts = () => {
    markCallPassThrough();
    // iOS has no official Contacts URL scheme; the dialer is the practical
    // entry point (it has a Contacts tab). Android `content://contacts/` is
    // unreliable across launchers, so use the same tel: entry. The user can
    // switch to Contacts from there in one tap.
    void Linking.openURL('tel:');
  };

  return (
    <>
      <View
        style={{
          backgroundColor: 'rgba(192,57,43,0.18)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(192,57,43,0.45)',
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <AlertTriangle size={16} color={theme.danger} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: theme.text,
              fontWeight: '900',
              fontSize: 12,
              letterSpacing: 1.5,
            }}
          >
            DANGER MODE · {String(seconds).padStart(2, '0')}s
          </Text>
          <Text style={{ color: theme.muted, fontSize: 10, marginTop: 1 }}>
            Leaving the app counts. Call someone or override.
          </Text>
        </View>
        <Pressable
          onPress={handleCall}
          hitSlop={8}
          style={{
            paddingHorizontal: 10,
            height: 32,
            borderRadius: 10,
            backgroundColor: 'rgba(231,76,60,0.22)',
            borderWidth: 1,
            borderColor: 'rgba(231,76,60,0.55)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Phone size={12} color="#E74C3C" />
          <Text style={{ color: '#E74C3C', fontWeight: '900', fontSize: 11, letterSpacing: 1 }}>
            CALL
          </Text>
        </Pressable>
        <Pressable
          onPress={handleContacts}
          hitSlop={8}
          style={{
            paddingHorizontal: 10,
            height: 32,
            borderRadius: 10,
            backgroundColor: theme.surface2,
            borderWidth: 1,
            borderColor: theme.hairline,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Users size={12} color={theme.text} />
        </Pressable>
        <Pressable
          onPress={() => setOverrideOpen(true)}
          hitSlop={8}
          style={{
            paddingHorizontal: 10,
            height: 32,
            borderRadius: 10,
            backgroundColor: theme.surface2,
            borderWidth: 1,
            borderColor: theme.hairline,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Unlock size={12} color={theme.muted} />
        </Pressable>
      </View>

      <OverrideModal
        visible={overrideOpen}
        onCancel={() => setOverrideOpen(false)}
        onUnlock={() => {
          setOverrideOpen(false);
          clearDangerMode();
        }}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// Re-entry lock — full-screen overlay shown when the user backgrounded the
// app without using CALL/CONTACTS and returned. Only escapes: type the
// override phrase or wait out the remaining timer (in which case the lock
// component naturally unmounts because `useDangerModeRemaining` hits zero
// and `clearDangerMode` fires).
// ---------------------------------------------------------------------------
export const DangerModeReentryLock: React.FC = () => {
  const theme = useTheme();
  const { locked, clear } = useDangerModeReentry();
  const remaining = useDangerModeRemaining();
  const clearDangerMode = useStore((s) => s.clearDangerMode);
  const [text, setText] = useState('');
  const [error, setError] = useState(false);

  // Once the timer naturally elapses, drop the re-entry lock too.
  useEffect(() => {
    if (remaining === 0 && locked) clear();
  }, [remaining, locked, clear]);

  if (!locked || remaining === 0) return null;

  const seconds = Math.ceil(remaining / 1000);

  const handleAttemptUnlock = () => {
    if (matchesDangerOverride(text)) {
      clearDangerMode();
      setText('');
      setError(false);
      clear();
    } else {
      setError(true);
      Vibration.vibrate(60);
    }
  };

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: theme.bg, padding: 24, paddingTop: 80 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: 'rgba(192,57,43,0.20)',
              borderWidth: 1,
              borderColor: 'rgba(192,57,43,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={28} color={theme.danger} />
          </View>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
            You stepped out.
          </Text>
          <Text style={{ color: theme.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 320 }}>
            Danger Mode is still running ({seconds}s left). Type your promise to keep going — or wait the timer out.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.hairline,
            borderRadius: 18,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: theme.muted,
              fontSize: 11,
              fontWeight: '900',
              letterSpacing: 2,
              marginBottom: 10,
            }}
          >
            TYPE EXACTLY:
          </Text>
          <Text
            style={{
              color: theme.accent,
              fontSize: 15,
              fontWeight: '700',
              fontStyle: 'italic',
              lineHeight: 22,
              marginBottom: 14,
            }}
          >
            "{DANGER_OVERRIDE_PHRASE}"
          </Text>
          <TextInput
            value={text}
            onChangeText={(t) => {
              setText(t);
              if (error) setError(false);
            }}
            placeholder="I promise to..."
            placeholderTextColor={theme.textDim}
            multiline
            autoFocus
            autoCapitalize="sentences"
            autoCorrect={false}
            style={{
              backgroundColor: theme.bg,
              borderWidth: 1,
              borderColor: error ? theme.danger : theme.hairline,
              borderRadius: 12,
              padding: 12,
              color: theme.text,
              fontSize: 14,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
          />
          {error && (
            <Text style={{ color: theme.danger, fontSize: 11, marginTop: 6 }}>
              Not quite — try again. Spelling and word order matter.
            </Text>
          )}
        </View>

        <Pressable
          onPress={handleAttemptUnlock}
          style={{
            paddingVertical: 16,
            borderRadius: 14,
            backgroundColor: theme.accent,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Text style={{ color: theme.onAccent, fontWeight: '900', letterSpacing: 1.5, fontSize: 13 }}>
            UNLOCK
          </Text>
        </Pressable>

        <Text style={{ color: theme.textDim, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
          Or wait {seconds}s for the lock to lift.
        </Text>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Override-only modal (the unlock CTA on the banner). Same UI as the re-entry
// lock but non-blocking — the user explicitly tapped it.
// ---------------------------------------------------------------------------
interface OverrideModalProps {
  visible: boolean;
  onCancel: () => void;
  onUnlock: () => void;
}

const OverrideModal: React.FC<OverrideModalProps> = ({ visible, onCancel, onUnlock }) => {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!visible) {
      setText('');
      setError(false);
    }
  }, [visible]);

  const attempt = () => {
    if (matchesDangerOverride(text)) {
      onUnlock();
    } else {
      setError(true);
      Vibration.vibrate(40);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel} presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: theme.bg, padding: 24, paddingTop: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ flex: 1, color: theme.text, fontSize: 20, fontWeight: '900' }}>
            Override the lock
          </Text>
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: theme.surface2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} color={theme.text} />
          </Pressable>
        </View>

        <Text
          style={{
            color: theme.muted,
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 20,
          }}
        >
          Type the phrase exactly. This unlocks Danger Mode immediately — use it
          if you're sure you're past the moment.
        </Text>

        <View
          style={{
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.hairline,
            borderRadius: 18,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: theme.muted,
              fontSize: 11,
              fontWeight: '900',
              letterSpacing: 2,
              marginBottom: 10,
            }}
          >
            TYPE EXACTLY:
          </Text>
          <Text
            style={{
              color: theme.accent,
              fontSize: 15,
              fontWeight: '700',
              fontStyle: 'italic',
              lineHeight: 22,
              marginBottom: 14,
            }}
          >
            "{DANGER_OVERRIDE_PHRASE}"
          </Text>
          <TextInput
            value={text}
            onChangeText={(t) => {
              setText(t);
              if (error) setError(false);
            }}
            placeholder="I promise to..."
            placeholderTextColor={theme.textDim}
            multiline
            autoFocus
            autoCapitalize="sentences"
            autoCorrect={false}
            style={{
              backgroundColor: theme.bg,
              borderWidth: 1,
              borderColor: error ? theme.danger : theme.hairline,
              borderRadius: 12,
              padding: 12,
              color: theme.text,
              fontSize: 14,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
          />
          {error && (
            <Text style={{ color: theme.danger, fontSize: 11, marginTop: 6 }}>
              Not quite — check the spelling and order.
            </Text>
          )}
        </View>

        <Pressable
          onPress={attempt}
          style={{
            paddingVertical: 16,
            borderRadius: 14,
            backgroundColor: theme.accent,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: theme.onAccent, fontWeight: '900', letterSpacing: 1.5, fontSize: 13 }}>
            UNLOCK
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Panel — the screen-level content shown when the user opens 'danger' as an
// overlay. NOT a takeover — the user can back out, navigate to other tabs,
// whatever. The banner stays visible across all those navigations.
// ---------------------------------------------------------------------------

interface BuiltinTactic {
  id: string;
  title: string;
  desc: string;
  category: TacticPreference;
  duration: string;
}

const ALL_TACTICS: BuiltinTactic[] = [
  { id: 'cold-shower', title: 'Cold Shower', desc: '30 seconds resets the nervous system.', category: 'physical', duration: '2 min' },
  { id: 'ten-pushups', title: '10 Pushups — NOW', desc: 'Floor. Redirect the energy.', category: 'physical', duration: '60s' },
  { id: 'walk-outside', title: 'Walk Outside', desc: 'Change the room. The urge stays behind.', category: 'environmental', duration: '5 min' },
  { id: 'phone-drawer', title: 'Phone in the Drawer', desc: 'Close it. Face-down across the room.', category: 'environmental', duration: 'instant' },
  { id: 'breathing-478', title: '4-7-8 Breathing', desc: 'In 4, hold 7, out 8. Three rounds.', category: 'breathwork', duration: '90s' },
  { id: 'shema', title: 'Say Shema', desc: 'Out loud. With kavanah.', category: 'spiritual', duration: 'instant' },
  { id: 'tehillim-51', title: 'Tehillim 51', desc: "David's prayer after his fall. Out loud.", category: 'spiritual', duration: '3 min' },
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

interface PanelProps {
  onBack: () => void;
}

export const DangerModePanel: React.FC<PanelProps> = ({ onBack }) => {
  const theme = useTheme();
  const {
    coachStylePrefs,
    tacticEffectiveness,
    rateTactic,
    logCloseCall,
  } = useStore();

  const [completedTactic, setCompletedTactic] = useState<string | null>(null);

  const tactics = useMemo(
    () =>
      rankTactics(
        coachStylePrefs.tacticPreferences,
        coachStylePrefs.firstMoveWhenUrgeHits,
        tacticEffectiveness,
        coachStylePrefs.likedTacticIds,
      ).slice(0, 5),
    [coachStylePrefs.tacticPreferences, coachStylePrefs.firstMoveWhenUrgeHits, coachStylePrefs.likedTacticIds, tacticEffectiveness],
  );

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
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          paddingTop: 16,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={{
            paddingHorizontal: 12,
            height: 36,
            borderRadius: 10,
            backgroundColor: theme.surface2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.muted, fontWeight: '800', fontSize: 12 }}>← Back</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: theme.accent, fontWeight: '900', letterSpacing: 3, fontSize: 11 }}>
            DANGER MODE
          </Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 60 }}>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: '900', marginBottom: 8, lineHeight: 32 }}>
          You're in the moment.{'\n'}Do one thing.
        </Text>
        <Text style={{ color: theme.muted, fontSize: 14, lineHeight: 21, marginBottom: 20 }}>
          The banner stays at the top for 60 seconds. Use the app, call someone, or open contacts. The
          override unlocks early if you're sure you're past it.
        </Text>

        <AnchorCard />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 12 }}>
          <Sparkles size={14} color={theme.accent} />
          <Text style={{ color: theme.accent, fontWeight: '900', letterSpacing: 1.5, marginLeft: 6, fontSize: 11 }}>
            PICK ONE — DO IT NOW
          </Text>
        </View>

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
                padding: 14,
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    backgroundColor: color + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15, flex: 1 }}>{tactic.title}</Text>
                    <Text style={{ color: theme.textDim, fontSize: 11 }}>{tactic.duration}</Text>
                  </View>
                  <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 18, marginTop: 4 }}>
                    {tactic.desc}
                  </Text>
                  {eff && eff.timesUsed > 0 && (
                    <Text style={{ color: theme.textDim, fontSize: 10, marginTop: 5 }}>
                      Worked {eff.timesWorked}/{eff.timesUsed} for you
                    </Text>
                  )}
                  <Pressable
                    onPress={() => handleTacticDone(tactic.id)}
                    disabled={!!completedTactic}
                    hitSlop={6}
                    style={{
                      marginTop: 10,
                      backgroundColor: isCompleted ? `${theme.success}30` : color + '20',
                      borderRadius: 10,
                      paddingVertical: 9,
                      paddingHorizontal: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    {isCompleted ? (
                      <>
                        <Check size={13} color={theme.success} />
                        <Text style={{ color: theme.success, fontWeight: '900', fontSize: 12 }}>Done — logged</Text>
                      </>
                    ) : (
                      <>
                        <ChevronRight size={13} color={color} />
                        <Text style={{ color, fontWeight: '900', fontSize: 12 }}>I'm doing this</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </MotiView>
          );
        })}
      </ScrollView>
    </View>
  );
};
