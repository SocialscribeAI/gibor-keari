import React, { ReactNode, useEffect, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { ShieldAlert, X } from 'lucide-react-native';
import { parseISO } from 'date-fns';
import { useStore } from '../store/useStore';

interface Props {
  children: ReactNode;
}

export const PunishmentModeWrapper: React.FC<Props> = ({ children }) => {
  const { punishmentModeActive, punishmentModeUntil, deactivatePunishmentMode } = useStore();
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!punishmentModeActive || !punishmentModeUntil) return;

    const tick = () => {
      const now = new Date();
      const end = parseISO(punishmentModeUntil);
      if (now >= end) {
        deactivatePunishmentMode();
        return;
      }
      const diff = end.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${mins}m`);
    };
    tick();
    const interval = setInterval(tick, 10000);
    return () => clearInterval(interval);
  }, [punishmentModeActive, punishmentModeUntil, deactivatePunishmentMode]);

  const handleCancel = () => {
    Alert.alert(
      'End Focus Mode?',
      'This was your commitment to yourself and your recovery.',
      [
        { text: 'Stay Strong', style: 'cancel' },
        { text: 'End Early', style: 'destructive', onPress: deactivatePunishmentMode },
      ]
    );
  };

  return (
    <View className="flex-1 relative">
      {/* Children — RN can't natively apply grayscale filter. We dim instead. */}
      <View className="flex-1">{children}</View>
      {punishmentModeActive && (
        <View
          pointerEvents="none"
          className="absolute inset-0 bg-black/40"
        />
      )}
      <AnimatePresence>
        {punishmentModeActive && (
          <MotiView
            key="focus-banner"
            from={{ translateY: -100 }}
            animate={{ translateY: 0 }}
            exit={{ translateY: -100 }}
            className="absolute top-0 left-0 right-0 bg-red-600 px-6 pt-12 pb-3 flex-row items-center justify-between"
            style={{ elevation: 30 }}
          >
            <View className="flex-row items-center gap-3">
              <ShieldAlert size={20} color="#fff" />
              <View>
                <Text className="text-[10px] font-black uppercase text-white/70" style={{ letterSpacing: 2 }}>
                  Focus Mode Active
                </Text>
                <Text className="text-sm font-bold text-white">
                  {timeLeft || 'Remaining...'} — Stay strong.
                </Text>
              </View>
            </View>
            <Pressable onPress={handleCancel} className="p-2 bg-white/10 rounded-full">
              <X size={16} color="#fff" />
            </Pressable>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
};
