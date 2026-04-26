import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { sendFeedback } from '../services/feedback';

/**
 * Slim banner that announces the alpha state and lets the user send
 * feedback / feature ideas via WhatsApp in one tap.
 */
export function AlphaBanner() {
  return (
    <Pressable
      onPress={() => { void sendFeedback(); }}
      className="bg-guard-accent/15 border-b border-guard-accent/40 px-3 py-2"
      accessibilityRole="button"
      accessibilityLabel="Alpha build — tap to send feedback or ideas via WhatsApp"
    >
      <View className="flex-row items-center">
        <Sparkles size={14} color="#C89A3C" />
        <Text className="text-white/80 text-[11px] ml-2 flex-1" numberOfLines={2}>
          <Text className="text-guard-accent font-black">Alpha build · </Text>
          Got an idea or feature request? Tap to message us on WhatsApp.
        </Text>
      </View>
    </Pressable>
  );
}
