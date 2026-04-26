import React, { useState } from 'react';
import { View, Text, Pressable, Modal, TextInput } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { X, AlertTriangle, ChevronRight, Flame } from 'lucide-react-native';
import { useStore, Tone } from '../store/useStore';
import { useTheme } from '../constants/theme';

interface LogFallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivatePunishment: () => void;
}

const ACKNOWLEDGMENTS: Record<NonNullable<Tone>, string> = {
  harsh: "You stumbled. Stand up. Lions don't stay in the dust.",
  gentle: "You slipped. It's okay. Lions fall — and lions rise. Stand back up.",
  spiritual: '“שבע יפול צדיק וקם” — A righteous one falls seven times and rises. Rise now.',
  clinical: 'A lapse is data, not identity. Note what triggered it and keep moving.',
  custom: 'You stumbled. Rise. Stand strong again.',
};

const TRIGGERS = ['Late Night', 'Boredom', 'Stress', 'Phone in bed', 'Social media', 'Loneliness', 'Idle time', 'Other'];

export const LogFallModal: React.FC<LogFallModalProps> = ({ isOpen, onClose, onActivatePunishment }) => {
  const { personalityProfile, mantras, logFallDetailed, appendCoachMessage } = useStore();
  const theme = useTheme();
  const [step, setStep] = useState(1);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const tone = (personalityProfile.tone || 'gentle') as NonNullable<Tone>;
  const acknowledgment = ACKNOWLEDGMENTS[tone];

  const noteValid = note.trim().length >= 20;

  const handleReset = () => {
    // Persist the detailed event so the coach + insights have full context.
    logFallDetailed({
      emotionalTriggers: [],
      situationalTriggers: [],
      digitalTriggers: selectedTriggers,
      notes: note.trim(),
    } as any);
    // Feed the coach memory so it remembers this stumble in future chats.
    appendCoachMessage({
      role: 'system',
      text: `[FALL LOGGED] Triggers: ${selectedTriggers.join(', ') || 'none noted'}.\nReflection: ${note.trim()}`,
    });
    onClose();
    setStep(1);
    setSelectedTriggers([]);
    setNote('');
  };

  const toggleTrigger = (t: string) =>
    setSelectedTriggers((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 justify-end">
        <MotiView
          from={{ translateY: 500 }}
          animate={{ translateY: 0 }}
          className="bg-guard-bg border-t border-guard-primary/30 rounded-t-[40px] p-8"
        >
          <View className="flex-row justify-between items-center mb-8">
            <View className="flex-row items-center gap-3">
              <View className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={20} color={theme.danger} />
              </View>
              <Text className="text-xl font-bold text-white">The Stumble</Text>
            </View>
            <Pressable onPress={onClose} className="p-2 rounded-full">
              <X size={20} color={theme.textDim} />
            </Pressable>
          </View>

          {step === 1 && (
            <View className="gap-8">
              <View className="p-6 rounded-3xl bg-guard-surface border border-guard-primary/20">
                <Text className="text-lg text-white italic leading-6">"{acknowledgment}"</Text>
              </View>
              <Pressable
                onPress={() => setStep(2)}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 flex-row items-center justify-center gap-2"
              >
                <Text className="text-white font-bold uppercase text-[10px]" style={{ letterSpacing: 2 }}>I rise. Continue</Text>
                <ChevronRight size={14} color={theme.text} />
              </Pressable>
            </View>
          )}

          {step === 2 && (
            <View className="gap-6">
              <Text className="text-sm font-bold text-white/60 uppercase text-center" style={{ letterSpacing: 2 }}>What led to this?</Text>
              <View className="flex-row flex-wrap gap-2 justify-center">
                {TRIGGERS.map((t) => {
                  const active = selectedTriggers.includes(t);
                  return (
                    <Pressable
                      key={t}
                      onPress={() => toggleTrigger(t)}
                      className={`px-4 py-2 rounded-full border ${active ? 'bg-guard-accent border-guard-accent' : 'bg-guard-surface border-guard-primary/40'}`}
                    >
                      <Text className={`text-[11px] font-bold ${active ? 'text-guard-on-accent' : 'text-white/60'}`}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text className="text-xs text-white/50 leading-5 -mt-2">
                Be honest — this is just for you. The more you write, the more your coach can help.
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="What happened? What were you feeling? What led up to it? Where were you, who were you with, what were you avoiding?"
                placeholderTextColor={theme.textDim}
                multiline
                className="bg-guard-surface border border-guard-primary/20 rounded-2xl p-4 text-sm text-white h-48"
                textAlignVertical="top"
              />
              <Text className="text-[10px] text-white/40 text-right">
                {note.trim().length} chars{noteValid ? '' : ' — minimum 20'}
              </Text>
              <Pressable
                onPress={() => noteValid && setStep(3)}
                disabled={!noteValid}
                className={`w-full py-4 rounded-2xl items-center ${noteValid ? 'bg-guard-accent' : 'bg-guard-surface border border-guard-primary/20'}`}
              >
                <Text className={`font-black uppercase text-xs ${noteValid ? 'text-guard-on-accent' : 'text-white/40'}`} style={{ letterSpacing: 2 }}>Name it & Rise</Text>
              </Pressable>
            </View>
          )}

          {step === 3 && (
            <View className="gap-8">
              <View className="items-center gap-4">
                <View className="p-4 rounded-full bg-guard-accent/10">
                  <Flame size={32} color={theme.accent} />
                </View>
                <Text className="text-xl font-bold text-white">Stand Strong Again</Text>
              </View>
              <View className="p-6 rounded-3xl bg-guard-surface border border-guard-accent/20">
                <Text className="text-sm text-white/80 italic text-center">"{mantras[0]}"</Text>
              </View>
              <View className="gap-4">
                <Pressable onPress={handleReset} className="w-full py-5 rounded-2xl bg-guard-accent items-center">
                  <Text className="text-guard-on-accent font-black uppercase text-xs" style={{ letterSpacing: 2 }}>I'm back. Reset the streak.</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    handleReset();
                    onActivatePunishment();
                  }}
                  className="w-full py-4 rounded-2xl border-2 border-red-500/30 bg-red-500/5 items-center"
                >
                  <Text className="text-red-400 font-black uppercase text-[10px]" style={{ letterSpacing: 2 }}>Activate Focus Mode</Text>
                </Pressable>
              </View>
            </View>
          )}
        </MotiView>
      </View>
    </Modal>
  );
};
