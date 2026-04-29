import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
  withPadding?: boolean;
  scroll?: boolean;
  /** Extra bottom padding so the bottom tab bar / Continue buttons aren't covered. */
  withBottomTabSpace?: boolean;
}

/**
 * Standard screen frame.
 *
 * - Bottom padding lives in `contentContainerStyle.paddingBottom` (not on the
 *   ScrollView's outer style) so the tab bar (~80px tall, absolute) doesn't
 *   clip the last bit of scrollable content. Padding on the outer ScrollView
 *   shrinks the visible viewport instead of extending scroll length.
 * - The page-level transition animation lives in Navigator.tsx; the inner
 *   MotiView that used to live here was creating nested mount animations on
 *   every tab switch, which felt glitchy.
 */
export const Screen: React.FC<ScreenProps> = ({
  children,
  className = '',
  withPadding = true,
  scroll = true,
  withBottomTabSpace = true,
}) => {
  const padding = withPadding ? 'px-6 pt-6' : '';
  const bottomPadding = withBottomTabSpace ? 140 : 32;
  const Container: any = scroll ? ScrollView : View;

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-guard-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <Container
          className={`flex-1 ${padding} ${className}`}
          contentContainerStyle={
            scroll ? { flexGrow: 1, paddingBottom: bottomPadding } : undefined
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {scroll ? children : (
            <View style={{ flex: 1, paddingBottom: bottomPadding }}>{children}</View>
          )}
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
