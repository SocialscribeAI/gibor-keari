import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MessageCircle, X } from 'lucide-react-native';
import { sendFeedback } from '../services/feedback';

/**
 * Slim, dismissible alpha tag. Tapping the message-circle opens WhatsApp
 * feedback; tapping X hides it for the session. Stays out of the way unless
 * the user wants it.
 */
export function AlphaBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <View className="bg-guard-surface/80 border-b border-guard-primary/20 px-3 py-1.5 flex-row items-center">
      <View className="flex-1 flex-row items-center">
        <Text className="text-guard-accent text-[10px] font-black uppercase tracking-widest">
          Alpha
        </Text>
        <Text className="text-guard-text/50 text-[11px] ml-2" numberOfLines={1}>
          tap the chat icon to send feedback
        </Text>
      </View>
      <Pressable
        onPress={() => { void sendFeedback(); }}
        accessibilityRole="button"
        accessibilityLabel="Send feedback"
        hitSlop={8}
        className="px-2"
      >
        <MessageCircle size={14} color="#E8A020" />
      </Pressable>
      <Pressable
        onPress={() => setDismissed(true)}
        accessibilityRole="button"
        accessibilityLabel="Dismiss alpha banner"
        hitSlop={8}
        className="px-1"
      >
        <X size={14} color="rgba(240,230,210,0.5)" />
      </Pressable>
    </View>
  );
}
