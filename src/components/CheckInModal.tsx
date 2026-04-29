import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, TextInput, ScrollView } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import Slider from '@react-native-community/slider';
import {
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  X,
  ArrowRight,
  Check,
  Utensils,
  Flame,
  Users,
  Moon,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';

// =============================================================================
// Expanded evening check-in (§2.9). Multi-step, skippable flow.
// Status → HALT → mood/sleep/exercise → gratitude/reflection → done
// =============================================================================

type Step = 'status' | 'halt' | 'body' | 'reflect' | 'done';
type Status = 'clean' | 'struggled' | 'fall';

export const CheckInModal: React.FC = () => {
  const { lastCheckInDate, submitCheckInDetailed, checkInStreak } = useStore();
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('status');

  // Form state
  const [status, setStatus] = useState<Status | null>(null);
  const [halt, setHalt] = useState({ hungry: false, angry: false, lonely: false, tired: false });
  const [mood, setMood] = useState(6);
  const [sleepHours, setSleepHours] = useState(7);
  const [exercised, setExercised] = useState<boolean | null>(null);
  const [gratitude, setGratitude] = useState('');
  const [reflection, setReflection] = useState('');

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const today = format(now, 'yyyy-MM-dd');
      const isCheckInWindow = hour >= 20 && hour <= 22;
      if (isCheckInWindow && lastCheckInDate !== today) setIsOpen(true);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [lastCheckInDate]);

  const reset = () => {
    setStep('status');
    setStatus(null);
    setHalt({ hungry: false, angry: false, lonely: false, tired: false });
    setMood(6);
    setSleepHours(7);
    setExercised(null);
    setGratitude('');
    setReflection('');
  };

  const close = () => {
    setIsOpen(false);
    setTimeout(reset, 300);
  };

  const commit = () => {
    if (!status) return;
    submitCheckInDetailed({
      status,
      halt,
      mood,
      sleepHours,
      exercised: exercised ?? undefined,
      gratitude: gratitude.trim() || undefined,
      reflection: reflection.trim() || undefined,
    });
    setStep('done');
    setTimeout(close, 1800);
  };

  const skipToDone = () => commit();

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 bg-guard-bg/95 justify-center px-5">
        <MotiView
          from={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-guard-surface border-2 border-guard-accent/20 rounded-3xl overflow-hidden"
          style={{ maxHeight: '90%' }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-6 pb-3">
            <View>
              <Text className="text-[10px] font-black uppercase text-guard-accent tracking-widest">
                Evening check-in
              </Text>
              <Text className="text-xs mt-1" style={{ color: theme.muted }}>
                Streak: {checkInStreak} day{checkInStreak === 1 ? '' : 's'}
              </Text>
            </View>
            <Pressable
              onPress={close}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.surface2 }}
            >
              <X size={16} color={theme.text} />
            </Pressable>
          </View>

          {/* Progress dots */}
          {step !== 'done' && (
            <View className="flex-row gap-1.5 px-6 mb-2">
              {(['status', 'halt', 'body', 'reflect'] as Step[]).map((s) => (
                <View
                  key={s}
                  className="flex-1 h-1 rounded-full"
                  style={{
                    backgroundColor: s === step ? theme.accent : theme.hairline,
                  }}
                />
              ))}
            </View>
          )}

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12 }}
            showsVerticalScrollIndicator={false}
          >
            <AnimatePresence exitBeforeEnter>
              {step === 'status' && (
                <MotiView
                  key="status"
                  from={{ opacity: 0, translateX: 20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  exit={{ opacity: 0, translateX: -20 }}
                >
                  <Text
                    className="text-2xl font-black mb-1"
                    style={{ fontFamily: 'Outfit', color: theme.text }}
                  >
                    How did you stand today?
                  </Text>
                  <Text className="text-sm mb-5" style={{ color: theme.muted }}>
                    No shame either way. Just honest.
                  </Text>

                  <View className="gap-3">
                    <CheckInChoice
                      label="Stood strong"
                      sub="Clean day. Choices aligned with who I am."
                      icon={ShieldCheck}
                      color="#1E8A4A"
                      active={status === 'clean'}
                      onPress={() => setStatus('clean')}
                      theme={theme}
                    />
                    <CheckInChoice
                      label="Tested, but I held"
                      sub="Close calls or struggles — but I didn't fall."
                      icon={TrendingUp}
                      color="#E8A020"
                      active={status === 'struggled'}
                      onPress={() => setStatus('struggled')}
                      theme={theme}
                    />
                    <CheckInChoice
                      label="I stumbled"
                      sub="I fell. Tomorrow I stand again."
                      icon={AlertCircle}
                      color="#C0392B"
                      active={status === 'fall'}
                      onPress={() => setStatus('fall')}
                      theme={theme}
                    />
                  </View>

                  <Pressable
                    onPress={() => status && setStep('halt')}
                    disabled={!status}
                    className="rounded-2xl py-4 items-center flex-row justify-center mt-6"
                    style={{ backgroundColor: status ? theme.accent : theme.surface2 }}
                  >
                    <Text
                      className="font-black uppercase tracking-widest mr-2"
                      style={{ color: status ? theme.onAccent : theme.muted }}
                    >
                      Continue
                    </Text>
                    <ArrowRight size={16} color={status ? theme.onAccent : theme.muted} />
                  </Pressable>

                  <Pressable onPress={skipToDone} disabled={!status} className="py-3 items-center mt-1">
                    <Text className="text-xs uppercase tracking-widest" style={{ color: theme.muted }}>
                      Skip the rest — just log it
                    </Text>
                  </Pressable>
                </MotiView>
              )}

              {step === 'halt' && (
                <MotiView
                  key="halt"
                  from={{ opacity: 0, translateX: 20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  exit={{ opacity: 0, translateX: -20 }}
                >
                  <Text className="text-2xl font-black mb-1" style={{ fontFamily: 'Outfit', color: theme.text }}>
                    HALT check
                  </Text>
                  <Text className="text-sm mb-5" style={{ color: theme.muted }}>
                    Tap any that applied today. These precede most falls.
                  </Text>

                  <View className="gap-2">
                    <HaltRow
                      label="Hungry"
                      icon={Utensils}
                      active={halt.hungry}
                      onPress={() => setHalt({ ...halt, hungry: !halt.hungry })}
                      theme={theme}
                    />
                    <HaltRow
                      label="Angry / resentful"
                      icon={Flame}
                      active={halt.angry}
                      onPress={() => setHalt({ ...halt, angry: !halt.angry })}
                      theme={theme}
                    />
                    <HaltRow
                      label="Lonely"
                      icon={Users}
                      active={halt.lonely}
                      onPress={() => setHalt({ ...halt, lonely: !halt.lonely })}
                      theme={theme}
                    />
                    <HaltRow
                      label="Tired"
                      icon={Moon}
                      active={halt.tired}
                      onPress={() => setHalt({ ...halt, tired: !halt.tired })}
                      theme={theme}
                    />
                  </View>

                  <NavButtons onBack={() => setStep('status')} onNext={() => setStep('body')} theme={theme} />
                </MotiView>
              )}

              {step === 'body' && (
                <MotiView
                  key="body"
                  from={{ opacity: 0, translateX: 20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  exit={{ opacity: 0, translateX: -20 }}
                >
                  <Text className="text-2xl font-black mb-1" style={{ fontFamily: 'Outfit', color: theme.text }}>
                    Body & mood
                  </Text>
                  <Text className="text-sm mb-5" style={{ color: theme.muted }}>
                    Quick snapshot.
                  </Text>

                  {/* Mood */}
                  <View className="mb-5">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-xs uppercase tracking-widest" style={{ color: theme.muted }}>
                        Mood
                      </Text>
                      <Text className="text-guard-accent font-black">{mood}/10</Text>
                    </View>
                    <Slider
                      minimumValue={1}
                      maximumValue={10}
                      step={1}
                      value={mood}
                      onValueChange={setMood}
                      minimumTrackTintColor={theme.accent}
                      maximumTrackTintColor={theme.hairline}
                      thumbTintColor={theme.accent}
                    />
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-[10px]" style={{ color: theme.textDim }}>
                        low
                      </Text>
                      <Text className="text-[10px]" style={{ color: theme.textDim }}>
                        great
                      </Text>
                    </View>
                  </View>

                  {/* Sleep */}
                  <View className="mb-5">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-xs uppercase tracking-widest" style={{ color: theme.muted }}>
                        Sleep last night
                      </Text>
                      <Text className="text-guard-accent font-black">{sleepHours}h</Text>
                    </View>
                    <Slider
                      minimumValue={0}
                      maximumValue={12}
                      step={0.5}
                      value={sleepHours}
                      onValueChange={setSleepHours}
                      minimumTrackTintColor={theme.accent}
                      maximumTrackTintColor={theme.hairline}
                      thumbTintColor={theme.accent}
                    />
                  </View>

                  {/* Exercise */}
                  <Text className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.muted }}>
                    Moved your body?
                  </Text>
                  <View className="flex-row gap-2 mb-3">
                    <Pressable
                      onPress={() => setExercised(true)}
                      className="flex-1 rounded-2xl py-3 items-center"
                      style={{
                        backgroundColor: exercised === true ? `${theme.success}25` : theme.surface2,
                        borderWidth: 1,
                        borderColor: exercised === true ? theme.success : theme.hairline,
                      }}
                    >
                      <Text
                        className="font-bold"
                        style={{ color: exercised === true ? theme.success : theme.text }}
                      >
                        Yes
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setExercised(false)}
                      className="flex-1 rounded-2xl py-3 items-center"
                      style={{
                        backgroundColor: exercised === false ? `${theme.accent}25` : theme.surface2,
                        borderWidth: 1,
                        borderColor: exercised === false ? theme.accent : theme.hairline,
                      }}
                    >
                      <Text
                        className="font-bold"
                        style={{ color: exercised === false ? theme.accent : theme.text }}
                      >
                        No
                      </Text>
                    </Pressable>
                  </View>

                  <NavButtons onBack={() => setStep('halt')} onNext={() => setStep('reflect')} theme={theme} />
                </MotiView>
              )}

              {step === 'reflect' && (
                <MotiView
                  key="reflect"
                  from={{ opacity: 0, translateX: 20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  exit={{ opacity: 0, translateX: -20 }}
                >
                  <Text className="text-2xl font-black mb-1" style={{ fontFamily: 'Outfit', color: theme.text }}>
                    Close the loop
                  </Text>
                  <Text className="text-sm mb-5" style={{ color: theme.muted }}>
                    Optional. 30 seconds.
                  </Text>

                  <Text className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.muted }}>
                    One thing you're grateful for
                  </Text>
                  <TextInput
                    value={gratitude}
                    onChangeText={setGratitude}
                    placeholder="Anything. Even tiny."
                    placeholderTextColor={theme.textDim}
                    className="rounded-2xl px-4 py-3 mb-4"
                    style={{
                      backgroundColor: theme.surface2,
                      borderWidth: 1,
                      borderColor: theme.hairline,
                      fontSize: 14,
                      color: theme.text,
                    }}
                  />

                  <Text className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.muted }}>
                    What did today teach you?
                  </Text>
                  <TextInput
                    value={reflection}
                    onChangeText={setReflection}
                    multiline
                    placeholder="A pattern you noticed. A trigger. A win."
                    placeholderTextColor={theme.textDim}
                    className="rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: theme.surface2,
                      borderWidth: 1,
                      borderColor: theme.hairline,
                      minHeight: 80,
                      textAlignVertical: 'top',
                      fontSize: 14,
                      lineHeight: 22,
                      color: theme.text,
                    }}
                  />

                  <Pressable
                    onPress={commit}
                    className="rounded-2xl py-4 items-center flex-row justify-center mt-5"
                    style={{ backgroundColor: theme.accent }}
                  >
                    <Check size={16} color={theme.onAccent} />
                    <Text className="font-black uppercase tracking-widest ml-2" style={{ color: theme.onAccent }}>
                      Lock it in
                    </Text>
                  </Pressable>

                  <Pressable onPress={() => setStep('body')} className="py-3 items-center mt-1">
                    <Text className="text-xs uppercase tracking-widest" style={{ color: theme.muted }}>
                      ← Back
                    </Text>
                  </Pressable>
                </MotiView>
              )}

              {step === 'done' && (
                <MotiView
                  key="done"
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="items-center py-8"
                >
                  <View
                    className="w-20 h-20 rounded-full items-center justify-center mb-5"
                    style={{ backgroundColor: `${theme.success}25` }}
                  >
                    <Check size={40} color={theme.success} />
                  </View>
                  <Text className="text-2xl font-black" style={{ fontFamily: 'Outfit', color: theme.text }}>
                    Logged.
                  </Text>
                  <Text className="text-center mt-2 leading-6 max-w-xs" style={{ color: theme.muted }}>
                    Showing up every night is the win.
                  </Text>
                </MotiView>
              )}
            </AnimatePresence>
          </ScrollView>
        </MotiView>
      </View>
    </Modal>
  );
};

const CheckInChoice: React.FC<{
  label: string;
  sub: string;
  icon: any;
  color: string;
  active: boolean;
  onPress: () => void;
  theme: any;
}> = ({ label, sub, icon: Icon, color, active, onPress, theme }) => (
  <Pressable
    onPress={onPress}
    className="rounded-2xl px-5 py-4 flex-row items-center"
    style={{
      backgroundColor: active ? `${color}22` : theme.surface2,
      borderWidth: 1,
      borderColor: active ? color : theme.hairline,
    }}
  >
    <View
      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
      style={{ backgroundColor: active ? `${color}33` : theme.surface }}
    >
      <Icon size={18} color={active ? color : theme.text} />
    </View>
    <View className="flex-1">
      <Text className="font-black text-base" style={{ color: theme.text }}>
        {label}
      </Text>
      <Text className="text-xs mt-0.5" style={{ color: theme.muted }}>
        {sub}
      </Text>
    </View>
  </Pressable>
);

const HaltRow: React.FC<{ label: string; icon: any; active: boolean; onPress: () => void; theme: any }> = ({
  label,
  icon: Icon,
  active,
  onPress,
  theme,
}) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center rounded-2xl px-4 py-3"
    style={{
      backgroundColor: active ? `${theme.accent}25` : theme.surface2,
      borderWidth: 1,
      borderColor: active ? theme.accent : theme.hairline,
    }}
  >
    <Icon size={18} color={active ? theme.accent : theme.muted} />
    <Text
      className="flex-1 ml-3 font-bold"
      style={{ color: active ? theme.text : theme.text }}
    >
      {label}
    </Text>
    <View
      className="w-5 h-5 rounded-md items-center justify-center"
      style={{
        backgroundColor: active ? theme.accent : 'transparent',
        borderWidth: 1,
        borderColor: active ? theme.accent : theme.hairline,
      }}
    >
      {active && <Check size={12} color={theme.onAccent} />}
    </View>
  </Pressable>
);

const NavButtons: React.FC<{ onBack: () => void; onNext: () => void; theme: any }> = ({ onBack, onNext, theme }) => (
  <View className="flex-row gap-2 mt-6">
    <Pressable
      onPress={onBack}
      className="flex-1 rounded-2xl py-4 items-center"
      style={{ backgroundColor: theme.surface2 }}
    >
      <Text className="font-bold uppercase text-xs tracking-widest" style={{ color: theme.muted }}>
        Back
      </Text>
    </Pressable>
    <Pressable
      onPress={onNext}
      className="flex-[2] rounded-2xl py-4 items-center flex-row justify-center"
      style={{ backgroundColor: theme.accent }}
    >
      <Text className="font-black uppercase tracking-widest mr-2" style={{ color: theme.onAccent }}>
        Next
      </Text>
      <ArrowRight size={16} color={theme.onAccent} />
    </Pressable>
  </View>
);
