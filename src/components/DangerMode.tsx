import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Linking,
  Animated,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import {
  X,
  Timer,
  Phone,
  Wind,
  Zap,
  Brain,
  BookOpen,
  Shield,
  Heart,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import { useStore, type TacticPreference } from '../store/useStore';
import { useTheme } from '../constants/theme';

// =============================================================================
// DangerMode — the "I need help RIGHT NOW" screen.
//
// Shows contextual tactics ranked by what has actually worked for THIS user:
//   1. Matches user's firstMoveWhenUrgeHits
//   2. Matches user's tacticPreferences
//   3. Highest effectiveness score in tacticEffectiveness
// =============================================================================

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type TriggerTag = 'stressed' | 'lonely' | 'bored' | 'tired' | 'visual' | 'late-night' | 'victory-high' | 'anxious';

interface BuiltinTactic {
  id: string;
  title: string;
  desc: string;
  category: TacticPreference;
  duration: string;
}

const ALL_TACTICS: BuiltinTactic[] = [
  { id: 'cold-shower', title: 'Cold Shower', desc: 'Shock the nervous system. 30 seconds resets everything.', category: 'physical', duration: '2 min' },
  { id: 'ten-pushups', title: '10 Pushups — NOW', desc: 'Redirect the energy into your body. Floor, go.', category: 'physical', duration: '60s' },
  { id: 'walk-outside', title: 'Walk Outside', desc: 'Change the physical environment. The urge stays behind.', category: 'environmental', duration: '5 min' },
  { id: 'phone-drawer', title: 'Phone In the Drawer', desc: 'Close apps, put the phone face-down across the room.', category: 'environmental', duration: 'instant' },
  { id: 'breathing-478', title: '4-7-8 Breathing', desc: 'Inhale 4 counts. Hold 7. Exhale 8. Repeat 3 times.', category: 'breathwork', duration: '90s' },
  { id: 'box-breathing', title: 'Box Breathing', desc: 'In 4, hold 4, out 4, hold 4. Activates the prefrontal cortex.', category: 'breathwork', duration: '2 min' },
  { id: 'shema', title: 'Say Shema', desc: 'Out loud. With intention. Right now.', category: 'spiritual', duration: 'instant' },
  { id: 'tehillim-51', title: 'Tehillim 51', desc: "David's prayer after his fall. Say it out loud.", category: 'spiritual', duration: '3 min' },
  { id: 'call-friend', title: 'Call Someone', desc: "Say: 'I need to talk.' You don't have to explain why.", category: 'social', duration: '5 min' },
  { id: 'text-partner', title: 'Text Your Partner', desc: "One word is enough: 'Struggling.' They'll know.", category: 'social', duration: 'instant' },
  { id: 'write-it', title: 'Write the Trigger', desc: 'Open notes. Write: "Right now I feel ___."', category: 'cognitive', duration: '2 min' },
  { id: 'reframe', title: 'Reframe It', desc: '"This urge is energy. What else can I do with it right now?"', category: 'cognitive', duration: '60s' },
];

const TRIGGER_OPTIONS: { id: TriggerTag; label: string; emoji: string }[] = [
  { id: 'stressed', label: 'Stressed', emoji: '😤' },
  { id: 'lonely', label: 'Lonely', emoji: '😔' },
  { id: 'bored', label: 'Bored / idle', emoji: '😑' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
  { id: 'visual', label: 'Saw something', emoji: '👁️' },
  { id: 'late-night', label: 'Late night', emoji: '🌙' },
  { id: 'victory-high', label: 'On a high', emoji: '⚡' },
  { id: 'anxious', label: 'Anxious', emoji: '😰' },
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

// Rank tactics for this user based on preferences + effectiveness
function rankTactics(
  tacticPreferences: TacticPreference[],
  firstMove: TacticPreference | null,
  tacticEffectiveness: Record<string, { timesUsed: number; timesWorked: number }>,
  likedTacticIds: string[],
  triggers: TriggerTag[],
): BuiltinTactic[] {
  const score = (t: BuiltinTactic): number => {
    let s = 0;
    // First-move preference gets biggest boost
    if (firstMove && t.category === firstMove) s += 30;
    // Preferred category
    if (tacticPreferences.includes(t.category)) s += 15;
    // Liked explicitly
    if (likedTacticIds.includes(t.id)) s += 20;
    // Effectiveness score
    const eff = tacticEffectiveness[t.id];
    if (eff && eff.timesUsed > 0) {
      s += Math.round((eff.timesWorked / eff.timesUsed) * 20);
    }
    // Trigger-specific boosts
    if (triggers.includes('tired') && t.id === 'cold-shower') s += 10;
    if (triggers.includes('lonely') && t.category === 'social') s += 10;
    if (triggers.includes('stressed') && t.category === 'breathwork') s += 10;
    if (triggers.includes('visual') && (t.id === 'phone-drawer' || t.id === 'walk-outside')) s += 15;
    if (triggers.includes('late-night') && (t.id === 'tehillim-51' || t.id === 'shema')) s += 10;
    if (triggers.includes('bored') && t.category === 'physical') s += 8;
    return s;
  };

  return [...ALL_TACTICS].sort((a, b) => score(b) - score(a));
}

// Countdown timer hook
function useCountdown(seconds: number, active: boolean) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (!active) { setRemaining(seconds); return; }
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [active, remaining, seconds]);
  return remaining;
}

export const DangerMode: React.FC<Props> = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const {
    mantras,
    dailyMantraIndex,
    coachStylePrefs,
    tacticEffectiveness,
    logCloseCall,
    rateTactic,
  } = useStore();

  const [triggers, setTriggers] = useState<TriggerTag[]>([]);
  const [completedId, setCompletedId] = useState<string | null>(null);
  const [countdownActive, setCountdownActive] = useState(false);
  const remaining = useCountdown(1200, countdownActive); // 20 min

  const mantra = dailyMantraIndex !== null ? mantras[dailyMantraIndex] : mantras[0] || 'I am not my urges.';

  const rankedTactics = rankTactics(
    coachStylePrefs.tacticPreferences,
    coachStylePrefs.firstMoveWhenUrgeHits,
    tacticEffectiveness,
    coachStylePrefs.likedTacticIds,
    triggers,
  ).slice(0, 4);

  const toggleTrigger = (id: TriggerTag) =>
    setTriggers((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleComplete = (tacticId: string) => {
    setCompletedId(tacticId);
    rateTactic(tacticId, true, triggers.join(','));
    const tactic = ALL_TACTICS.find((t) => t.id === tacticId);
    logCloseCall({
      trigger: triggers.join(',') || 'urge',
      tacticUsed: tactic?.title ?? tacticId,
      workedRating: 4,
    });
  };

  const handleClose = () => {
    setTriggers([]);
    setCompletedId(null);
    setCountdownActive(false);
    onClose();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 52,
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.hairline,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.accent, fontSize: 22, fontWeight: '900' }}>Danger Mode</Text>
            <Text style={{ color: theme.muted, fontSize: 12 }}>
              Urges peak and pass. You can ride this out.
            </Text>
          </View>
          <Pressable
            onPress={handleClose}
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

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

          {/* Mantra */}
          <View
            style={{
              backgroundColor: 'rgba(232,160,32,0.1)',
              borderWidth: 1,
              borderColor: 'rgba(232,160,32,0.3)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Text style={{ color: theme.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 6 }}>
              YOUR MANTRA
            </Text>
            <Text style={{ color: theme.text, fontSize: 16, lineHeight: 24, fontWeight: '700' }}>{mantra}</Text>
          </View>

          {/* Countdown */}
          <View
            style={{
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.hairline,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Timer size={16} color={theme.accent} />
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14, marginLeft: 8, flex: 1 }}>
                20-minute urge timer
              </Text>
              {countdownActive && (
                <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 22 }}>
                  {formatTime(remaining)}
                </Text>
              )}
            </View>
            <Text style={{ color: theme.muted, fontSize: 12, lineHeight: 17, marginBottom: 12 }}>
              Urges biologically peak and pass in 15-20 minutes. Start the clock. Just wait it out.
            </Text>
            {remaining === 0 ? (
              <View style={{ backgroundColor: 'rgba(30,138,74,0.15)', borderRadius: 10, padding: 12, alignItems: 'center' }}>
                <Check size={20} color={theme.success} />
                <Text style={{ color: theme.success, fontWeight: '800', marginTop: 4 }}>You made it through.</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => setCountdownActive(!countdownActive)}
                style={{
                  backgroundColor: countdownActive ? theme.surface : theme.accent,
                  borderWidth: 1,
                  borderColor: countdownActive ? theme.hairline : theme.accent,
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: countdownActive ? theme.muted : theme.onAccent,
                    fontWeight: '800',
                    fontSize: 13,
                  }}
                >
                  {countdownActive ? 'Pause timer' : 'Start 20-min timer'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Trigger selection */}
          <Text style={{ color: theme.muted, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 10 }}>
            WHAT'S HAPPENING RIGHT NOW?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {TRIGGER_OPTIONS.map((t) => {
              const active = triggers.includes(t.id);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => toggleTrigger(t.id)}
                  style={{
                    backgroundColor: active ? theme.accent : theme.surface2,
                    borderWidth: 1,
                    borderColor: active ? theme.accent : theme.hairline,
                    borderRadius: 20,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{t.emoji}</Text>
                  <Text style={{ color: active ? theme.onAccent : theme.text, fontSize: 13, fontWeight: '700' }}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Contextual tactics */}
          <Text style={{ color: theme.muted, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 10 }}>
            {triggers.length > 0 ? 'TACTICS FOR THIS MOMENT' : 'YOUR BEST TACTICS'}
          </Text>
          {rankedTactics.map((tactic) => {
            const Icon = CATEGORY_ICON[tactic.category];
            const color = CATEGORY_COLOR[tactic.category];
            const eff = tacticEffectiveness[tactic.id];
            const isCompleted = completedId === tactic.id;

            return (
              <AnimatePresence key={tactic.id}>
                <MotiView
                  from={{ opacity: 0, translateY: 8 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  style={{
                    backgroundColor: isCompleted ? `${theme.success}20` : theme.surface2,
                    borderWidth: 1,
                    borderColor: isCompleted ? theme.success : theme.hairline,
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
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
                        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, flex: 1 }}>{tactic.title}</Text>
                        <Text style={{ color: theme.textDim, fontSize: 11 }}>{tactic.duration}</Text>
                      </View>
                      <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 18, marginTop: 4 }}>
                        {tactic.desc}
                      </Text>
                      {eff && eff.timesUsed > 0 && (
                        <Text style={{ color: theme.textDim, fontSize: 10, marginTop: 4 }}>
                          Worked {eff.timesWorked}/{eff.timesUsed} times for you
                        </Text>
                      )}
                      <Pressable
                        onPress={() => handleComplete(tactic.id)}
                        disabled={!!completedId}
                        style={{
                          marginTop: 10,
                          backgroundColor: isCompleted ? 'rgba(30,138,74,0.2)' : color + '20',
                          borderRadius: 10,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          opacity: completedId && !isCompleted ? 0.4 : 1,
                        }}
                      >
                        {isCompleted ? (
                          <>
                            <Check size={13} color={theme.success} />
                            <Text style={{ color: theme.success, fontWeight: '800', fontSize: 12 }}>Done — logged!</Text>
                          </>
                        ) : (
                          <>
                            <ChevronRight size={13} color={color} />
                            <Text style={{ color, fontWeight: '800', fontSize: 12 }}>I did this</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                </MotiView>
              </AnimatePresence>
            );
          })}

          {/* Call someone */}
          <Pressable
            onPress={() => Linking.openURL('tel:')}
            style={{
              backgroundColor: 'rgba(231,76,60,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(231,76,60,0.4)',
              borderRadius: 14,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginTop: 6,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: 'rgba(231,76,60,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Phone size={18} color="#E74C3C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>Call someone now</Text>
              <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                A friend, family member, or partner. Say it out loud.
              </Text>
            </View>
            <ChevronRight size={16} color={theme.muted} />
          </Pressable>

          {/* I got through it */}
          {completedId && (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                backgroundColor: `${theme.success}20`,
                borderWidth: 1,
                borderColor: theme.success,
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
                marginTop: 10,
              }}
            >
              <Heart size={28} color={theme.success} />
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 18, marginTop: 10 }}>
                You stayed standing.
              </Text>
              <Text style={{ color: theme.muted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                This close call was logged. The pattern engine noticed.{'\n'}That took discipline.
              </Text>
              <Pressable
                onPress={handleClose}
                style={{
                  marginTop: 16,
                  backgroundColor: theme.success,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 32,
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 14 }}>Back to Home</Text>
              </Pressable>
            </MotiView>
          )}

        </ScrollView>
      </View>
    </Modal>
  );
};
