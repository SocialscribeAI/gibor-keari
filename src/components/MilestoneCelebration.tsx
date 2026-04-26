import React from 'react';
import { View, Text, Pressable, Modal, Share } from 'react-native';
import { MotiView } from 'moti';
import { Share2, X, Star, Gift } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { useTheme, BRAND } from '../constants/theme';
import { LionMark } from './LionMark';

interface Props {
  day: number;
  onClose: () => void;
}

export const MilestoneCelebration: React.FC<Props> = ({ day, onClose }) => {
  const { vows } = useStore();
  const theme = useTheme();
  const reward = vows[day];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${day} days standing strong as a lion. גיבור כארי. #${BRAND.nameShort}KeAri`,
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-guard-bg/95 items-center justify-center px-6">
        <View className="w-full max-w-sm bg-guard-surface border border-guard-accent/30 rounded-[48px] p-8 items-center">
          <Pressable onPress={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-white/5">
            <X size={20} color={theme.textDim} />
          </Pressable>
          <MotiView
            from={{ scale: 0.5, translateY: 50, opacity: 0 }}
            animate={{ scale: 1, translateY: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 200 }}
            className="items-center"
          >
            <View className="w-24 h-24 rounded-[40px] bg-guard-accent/10 items-center justify-center border border-guard-accent/20 mb-8">
              <LionMark size={56} color={theme.accent} accentColor={theme.text} />
            </View>
            <Text className="text-sm font-black uppercase text-guard-accent mb-2" style={{ letterSpacing: 6 }}>Milestone Reached</Text>
            <View className="flex-row items-center gap-3 mb-6">
              <Star size={24} color={theme.accent} fill={theme.accent} />
              <Text className="text-7xl font-black text-white">{day}</Text>
              <Star size={24} color={theme.accent} fill={theme.accent} />
            </View>
            <Text className="text-[10px] font-black uppercase text-guard-accent mb-10 py-3" style={{ letterSpacing: 2 }}>
              Days Standing Strong
            </Text>
          </MotiView>

          {reward && (
            <View className="mb-10 p-6 bg-guard-bg rounded-3xl border border-guard-primary/30 w-full">
              <View className="flex-row items-center gap-2 mb-3 justify-center">
                <Gift size={14} color={theme.accent} />
                <Text className="text-[10px] font-black uppercase text-white/40" style={{ letterSpacing: 2 }}>Your Earned Reward</Text>
              </View>
              <Text className="text-base font-bold text-white text-center">"{reward}"</Text>
            </View>
          )}

          <View className="flex-row gap-3 w-full">
            <Pressable
              onPress={handleShare}
              className="flex-1 py-4 rounded-2xl bg-guard-accent flex-row items-center justify-center gap-2"
            >
              <Share2 size={16} color={theme.onAccent} />
              <Text className="text-guard-on-accent font-black uppercase text-[10px]" style={{ letterSpacing: 2 }}>Tell the Pride</Text>
            </Pressable>
            <Pressable onPress={onClose} className="px-6 py-4 rounded-2xl bg-white/5 items-center justify-center">
              <Text className="text-white/40 font-black uppercase text-[10px]" style={{ letterSpacing: 2 }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
