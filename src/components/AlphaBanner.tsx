import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MessageCircle, Sparkles } from 'lucide-react-native';
import { sendFeedback } from '../services/feedback';

/**
 * Always-visible alpha banner. Tap anywhere on it to open WhatsApp with a
 * pre-filled feedback message. Sits directly under the status bar so the user
 * is reminded every session that this is alpha and ideas are welcome.
 */
export function AlphaBanner() {
  return (
    <Pressable
      onPress={() => { void sendFeedback(); }}
      className="bg-guard-accent/20 border-b border-guard-accent/50 px-3 py-2.5"
      accessibilityRole="button"
      accessibilityLabel="Alpha build — tap to message us on WhatsApp with ideas or feedback"
    >
      <View className="flex-row items-center">
        <View className="w-7 h-7 rounded-full bg-guard-accent/30 items-center justify-center mr-2.5">
          <Sparkles size={14} color="#E8A020" />
        </View>
        <View className="flex-1">
          <Text className="text-guard-accent font-black text-[11px] tracking-widest uppercase">
            Alpha · help us make it perfect
          </Text>
          <Text className="text-white/80 text-[12px] mt-0.5" numberOfLines={2}>
            Tap anytime to send ideas or report a bug on WhatsApp.
          </Text>
        </View>
        <MessageCircle size={18} color="#E8A020" />
      </View>
    </Pressable>
  );
}
