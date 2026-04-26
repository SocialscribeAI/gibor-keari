import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Siren, X, ArrowRight, Zap, Wind, BookOpen, Users, Clock } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { TACTICS } from '../constants/contentLibrary';
import { selectForPanic } from '../utils/contentSelector';

// =============================================================================
// Panic Button — always-visible emergency rescue (§2.15).
// Triages by time budget, matches intervention. Distinct from Close Call:
// Panic = "I need help RIGHT NOW". Close Call = "urge passed, logging".
// =============================================================================

type TimeBudget = '30s' | '2m' | '10m' | 'partner';

interface Props {
  /** Optional absolute positioning override */
  bottom?: number;
  right?: number;
}

export const PanicButton: React.FC<Props> = ({ bottom = 90, right = 20 }) => {
  const [open, setOpen] = useState(false);
  const [budget, setBudget] = useState<TimeBudget | null>(null);
  const { personalityProfile, mantras, dailyMantraIndex } = useStore();

  const close = () => {
    setOpen(false);
    setTimeout(() => setBudget(null), 250);
  };

  const mantra =
    dailyMantraIndex !== null ? mantras[dailyMantraIndex] : mantras[0] || 'I am my choices.';

  // Intervention content based on budget
  const renderIntervention = () => {
    if (budget === '30s') {
      return (
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 items-center justify-center px-8"
        >
          <Wind size={48} color="#E8A020" />
          <Text className="text-white/60 uppercase tracking-widest text-xs mt-4 mb-4">
            One breath. One sentence.
          </Text>
          <Text
            className="text-white text-2xl font-bold text-center leading-9"
            style={{ fontFamily: 'Outfit' }}
          >
            "{mantra}"
          </Text>
          <Text className="text-white/50 text-center mt-6 max-w-xs leading-5">
            Inhale through the nose for 4. Exhale for 8. Say your mantra out loud.
          </Text>
        </MotiView>
      );
    }
    if (budget === '2m') {
      const tactic = selectForPanic(TACTICS, personalityProfile, 'panic');
      return (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="flex-1 px-6 pt-20"
        >
          <Text className="text-white/60 uppercase tracking-widest text-xs mb-2">
            2-minute rescue
          </Text>
          <Text
            className="text-3xl font-black text-white mb-6"
            style={{ fontFamily: 'Outfit' }}
          >
            {tactic?.title ?? '4-7-8 breathing'}
          </Text>
          <View
            className="rounded-3xl p-5 mb-4"
            style={{
              backgroundColor: 'rgba(232,160,32,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(232,160,32,0.3)',
            }}
          >
            <Text className="text-white leading-7 text-base">
              {tactic?.body ??
                'Inhale 4s, hold 7s, exhale 8s. Three cycles. This drops your heart rate and interrupts the spiral.'}
            </Text>
          </View>
          <View
            className="rounded-2xl p-4"
            style={{
              backgroundColor: '#1A1E35',
              borderWidth: 1,
              borderColor: 'rgba(44, 62, 122, 0.3)',
            }}
          >
            <Text className="text-white/50 text-xs uppercase tracking-widest mb-2">
              Your mantra
            </Text>
            <Text className="text-white leading-6">"{mantra}"</Text>
          </View>
        </MotiView>
      );
    }
    if (budget === '10m') {
      return (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="flex-1 px-6 pt-20"
        >
          <Text className="text-white/60 uppercase tracking-widest text-xs mb-2">
            10-minute reset
          </Text>
          <Text
            className="text-3xl font-black text-white mb-6"
            style={{ fontFamily: 'Outfit' }}
          >
            Move. Write. Return.
          </Text>

          {[
            { n: '1', text: 'Leave the room you are in. Go outside if you can.', min: '3 min' },
            { n: '2', text: 'Walk — no phone, no music. Just feet and air.', min: '5 min' },
            { n: '3', text: "Open a note. Write one paragraph about what you're actually feeling. Not what you want — what's underneath.", min: '2 min' },
          ].map((step) => (
            <View
              key={step.n}
              className="flex-row rounded-2xl p-4 mb-3"
              style={{
                backgroundColor: '#1A1E35',
                borderWidth: 1,
                borderColor: 'rgba(44, 62, 122, 0.3)',
              }}
            >
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: 'rgba(232,160,32,0.2)' }}
              >
                <Text className="text-guard-accent font-black">{step.n}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white leading-5">{step.text}</Text>
                <Text className="text-white/40 text-xs mt-1">{step.min}</Text>
              </View>
            </View>
          ))}
        </MotiView>
      );
    }
    if (budget === 'partner') {
      return (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 items-center justify-center px-8"
        >
          <Users size={48} color="#E8A020" />
          <Text
            className="text-2xl font-black text-white mt-6 text-center"
            style={{ fontFamily: 'Outfit' }}
          >
            Partner ping not set up yet
          </Text>
          <Text className="text-white/60 text-center mt-3 leading-6 max-w-xs">
            Once you pair with an accountability partner, this button will ping them immediately and offer a one-tap call.
          </Text>
          <Text className="text-white/40 text-center mt-3 leading-6 max-w-xs text-sm">
            For now — call someone you trust. Any voice. Five minutes.
          </Text>
        </MotiView>
      );
    }
    return null;
  };

  const renderTriage = () => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      className="flex-1 px-6 pt-20"
    >
      <Siren size={36} color="#E8A020" />
      <Text
        className="text-3xl font-black text-white mt-4"
        style={{ fontFamily: 'Outfit' }}
      >
        How much time do you have?
      </Text>
      <Text className="text-white/60 mt-2 leading-6">
        We'll match you with the right rescue for right now.
      </Text>

      <View className="mt-8">
        {[
          { key: '30s' as const, label: '30 seconds', icon: Zap, desc: 'Panic. Right now. One breath, one mantra.' },
          { key: '2m' as const, label: '2 minutes', icon: Wind, desc: 'Guided breath + tactic card.' },
          { key: '10m' as const, label: '10 minutes', icon: Clock, desc: 'Move, write, return grounded.' },
          { key: 'partner' as const, label: 'I need my partner', icon: Users, desc: 'Ping the person who knows.' },
        ].map((o) => (
          <Pressable
            key={o.key}
            onPress={() => setBudget(o.key)}
            className="flex-row items-center rounded-2xl p-4 mb-3"
            style={{
              backgroundColor: '#1A1E35',
              borderWidth: 1,
              borderColor: 'rgba(232,160,32,0.3)',
            }}
          >
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: 'rgba(232,160,32,0.15)' }}
            >
              <o.icon size={22} color="#E8A020" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">{o.label}</Text>
              <Text className="text-white/50 text-xs mt-0.5">{o.desc}</Text>
            </View>
            <ArrowRight size={16} color="rgba(255,255,255,0.4)" />
          </Pressable>
        ))}
      </View>
    </MotiView>
  );

  return (
    <>
      {/* Floating button */}
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          position: 'absolute',
          bottom,
          right,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#C0392B',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#C0392B',
          shadowOpacity: 0.5,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <MotiView
          from={{ scale: 1 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ loop: true, type: 'timing', duration: 2000 }}
        >
          <Siren size={26} color="#F0F2FF" />
        </MotiView>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <View className="flex-1 bg-guard-bg">
          <Pressable
            onPress={close}
            className="absolute top-12 right-6 w-10 h-10 rounded-full items-center justify-center z-10"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <X size={18} color="#F0F2FF" />
          </Pressable>
          {budget && (
            <Pressable
              onPress={() => setBudget(null)}
              className="absolute top-12 left-6 rounded-full px-4 py-2 z-10"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
            >
              <Text className="text-white/70 text-xs">← triage</Text>
            </Pressable>
          )}
          <AnimatePresence exitBeforeEnter>
            {budget ? renderIntervention() : renderTriage()}
          </AnimatePresence>
        </View>
      </Modal>
    </>
  );
};
