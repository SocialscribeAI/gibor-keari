import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, Animated, Easing } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { X, ArrowRight, Wind, Sparkles, Check, Heart, Moon, Eye, Clock } from 'lucide-react-native';
import { useStore, type TriggerTag } from '../store/useStore';
import { TACTICS } from '../constants/contentLibrary';
import { selectForTrigger, selectForPanic } from '../utils/contentSelector';

// =============================================================================
// Close Call Protocol — 90-second urge intervention (§2.14).
// A Close Call is a WIN, not a near-miss. Streak is NOT reset. We celebrate it.
// =============================================================================

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TRIGGER_TAPS: { key: TriggerTag; label: string; icon: any }[] = [
  { key: 'loneliness', label: "I'm alone", icon: Heart },
  { key: 'fatigue', label: "I'm tired", icon: Moon },
  { key: 'boredom', label: "I'm bored", icon: Clock },
  { key: 'visual', label: 'Visual trigger', icon: Eye },
  { key: 'stress', label: 'Stressed', icon: Wind },
  { key: 'late-night', label: 'Late night', icon: Moon },
];

type Phase = 'breath' | 'mantra' | 'trigger' | 'tactic' | 'done';

export const CloseCallProtocol: React.FC<Props> = ({ isOpen, onClose }) => {
  const { personalityProfile, mantras, dailyMantraIndex, logCloseCall } = useStore();
  const [phase, setPhase] = useState<Phase>('breath');
  const [trigger, setTrigger] = useState<TriggerTag | null>(null);
  const [rating, setRating] = useState(0);
  const [breathCycle, setBreathCycle] = useState(0);

  const mantra =
    dailyMantraIndex !== null ? mantras[dailyMantraIndex] : mantras[0] || 'I am my choices.';

  const reset = () => {
    setPhase('breath');
    setTrigger(null);
    setRating(0);
    setBreathCycle(0);
  };

  const close = () => {
    reset();
    onClose();
  };

  // ---- Breathing animation: 4s inhale → 7s hold → 8s exhale, 3 cycles ----
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isOpen || phase !== 'breath') return;
    let cancelled = false;

    const runCycle = (cycle: number) => {
      if (cancelled) return;
      if (cycle >= 3) {
        // Move to mantra phase
        setTimeout(() => !cancelled && setPhase('mantra'), 500);
        return;
      }
      setBreathCycle(cycle);
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.6,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.6,
          duration: 7000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => runCycle(cycle + 1));
    };

    runCycle(0);
    return () => {
      cancelled = true;
    };
  }, [isOpen, phase, scale]);

  const suggestedTactic = (() => {
    if (!trigger) return null;
    const matches = selectForTrigger(TACTICS, personalityProfile, trigger);
    return matches[0] ?? selectForPanic(TACTICS, personalityProfile, 'panic');
  })();

  const saveAndFinish = () => {
    logCloseCall({
      trigger: trigger ?? 'unspecified',
      tacticUsed: suggestedTactic?.id,
      workedRating: rating,
    });
    setPhase('done');
  };

  // ---- Renderers ----

  const BreathPhase = () => (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 items-center justify-center px-6"
    >
      <Text className="text-white/60 uppercase tracking-widest text-xs mb-4">
        Breath {breathCycle + 1} of 3
      </Text>
      <Animated.View
        style={{
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: 'rgba(232,160,32,0.2)',
          borderWidth: 2,
          borderColor: '#E8A020',
          transform: [{ scale }],
        }}
      />
      <Text className="text-white text-2xl font-bold mt-10 text-center" style={{ fontFamily: 'Outfit' }}>
        4 in · hold 7 · 8 out
      </Text>
      <Text className="text-white/60 mt-3 text-center leading-6 max-w-xs">
        Follow the circle. Breathe with it. This interrupts the cascade.
      </Text>
      <Pressable
        onPress={() => setPhase('mantra')}
        className="mt-10 rounded-full px-5 py-2"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
      >
        <Text className="text-white/70 text-xs">Skip to mantra</Text>
      </Pressable>
    </MotiView>
  );

  const MantraPhase = () => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      className="flex-1 items-center justify-center px-8"
    >
      <Sparkles size={32} color="#E8A020" />
      <Text className="text-white/60 uppercase tracking-widest text-xs mt-3 mb-6">
        Say it out loud · 3 times
      </Text>
      <Text
        className="text-white text-2xl font-bold text-center leading-8"
        style={{ fontFamily: 'Outfit' }}
      >
        "{mantra}"
      </Text>
      <Text className="text-white/50 text-xs mt-6 text-center max-w-xs leading-5">
        Verbal self-talk engages a different neural pathway than silent thought. Use your voice.
      </Text>
      <Pressable
        onPress={() => setPhase('trigger')}
        className="rounded-2xl px-6 py-4 mt-10 flex-row items-center"
        style={{ backgroundColor: '#E8A020' }}
      >
        <Text className="text-guard-on-accent font-black mr-2">Said it</Text>
        <ArrowRight size={16} color="#0F1120" />
      </Pressable>
    </MotiView>
  );

  const TriggerPhase = () => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      className="flex-1 px-6"
    >
      <View className="items-center mt-12 mb-8">
        <Text className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Outfit' }}>
          What's driving this?
        </Text>
        <Text className="text-white/60 text-center">
          Pick one. We'll match a tactic to it.
        </Text>
      </View>
      <View>
        {TRIGGER_TAPS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => {
              setTrigger(t.key);
              setPhase('tactic');
            }}
            className="flex-row items-center rounded-2xl p-4 mb-2"
            style={{ backgroundColor: '#1A1E35', borderWidth: 1, borderColor: 'rgba(44, 62, 122, 0.4)' }}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: 'rgba(232,160,32,0.12)' }}
            >
              <t.icon size={18} color="#E8A020" />
            </View>
            <Text className="text-white flex-1 font-semibold">{t.label}</Text>
            <ArrowRight size={16} color="rgba(255,255,255,0.4)" />
          </Pressable>
        ))}
      </View>
    </MotiView>
  );

  const TacticPhase = () => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      className="flex-1 px-6"
    >
      <View className="mt-12 mb-6">
        <Text className="text-white/60 uppercase tracking-widest text-xs">Do this now</Text>
        <Text className="text-3xl font-black text-white mt-2" style={{ fontFamily: 'Outfit' }}>
          {suggestedTactic?.title ?? 'Take one step.'}
        </Text>
      </View>
      <View
        className="rounded-3xl p-5"
        style={{
          backgroundColor: 'rgba(232,160,32,0.08)',
          borderWidth: 1,
          borderColor: 'rgba(232,160,32,0.3)',
        }}
      >
        <Text className="text-white leading-7">
          {suggestedTactic?.body ?? "Stand up. Walk to a different room. Turn on the main light. Change the environment."}
        </Text>
        {suggestedTactic?.source && (
          <Text className="text-white/40 text-xs mt-3 italic">— {suggestedTactic.source}</Text>
        )}
      </View>

      <Text className="text-white/70 mt-8 mb-3 uppercase tracking-widest text-xs">
        How much did this help?
      </Text>
      <View className="flex-row justify-between">
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setRating(n)}
            className="flex-1 py-3 mx-1 rounded-xl items-center"
            style={{
              backgroundColor: rating >= n ? '#E8A020' : 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{ color: rating >= n ? '#0F1120' : '#F0F2FF', fontWeight: '700' }}>
              {n}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={saveAndFinish}
        className="rounded-2xl py-4 mt-8 items-center"
        style={{ backgroundColor: rating > 0 ? '#1E8A4A' : '#2C3E7A' }}
        disabled={rating === 0}
      >
        <Text className="text-white font-black">
          {rating > 0 ? 'Log the save' : 'Rate it to save'}
        </Text>
      </Pressable>
    </MotiView>
  );

  const DonePhase = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring' }}
      className="flex-1 items-center justify-center px-8"
    >
      <View
        className="items-center justify-center rounded-full mb-6"
        style={{
          width: 100,
          height: 100,
          backgroundColor: 'rgba(30,138,74,0.2)',
          borderWidth: 2,
          borderColor: '#1E8A4A',
        }}
      >
        <Check size={52} color="#1E8A4A" />
      </View>
      <Text className="text-4xl font-black text-white text-center" style={{ fontFamily: 'Outfit' }}>
        That was a win.
      </Text>
      <Text className="text-white/70 text-center mt-4 text-base leading-6 max-w-xs">
        Your streak is intact. You just intercepted an urge — that's literally what getting stronger looks like.
      </Text>
      <Text className="text-white/50 text-center mt-4 text-sm leading-5 max-w-xs">
        The lion remembers. Next time you see this trigger, we'll offer the tactic that worked for you.
      </Text>
      <Pressable
        onPress={close}
        className="rounded-2xl py-4 px-10 mt-10"
        style={{ backgroundColor: '#E8A020' }}
      >
        <Text className="text-guard-on-accent font-black">Back home</Text>
      </Pressable>
    </MotiView>
  );

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 bg-guard-bg">
        {/* Close button — only visible before "done" */}
        {phase !== 'done' && (
          <Pressable
            onPress={close}
            className="absolute top-12 right-6 w-10 h-10 rounded-full items-center justify-center z-10"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <X size={18} color="#F0F2FF" />
          </Pressable>
        )}
        <AnimatePresence exitBeforeEnter>
          {phase === 'breath' && <BreathPhase key="breath" />}
          {phase === 'mantra' && <MantraPhase key="mantra" />}
          {phase === 'trigger' && <TriggerPhase key="trigger" />}
          {phase === 'tactic' && <TacticPhase key="tactic" />}
          {phase === 'done' && <DonePhase key="done" />}
        </AnimatePresence>
      </View>
    </Modal>
  );
};
