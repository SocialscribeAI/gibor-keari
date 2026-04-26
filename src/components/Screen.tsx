import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { MotiView } from 'moti';
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
 * - Top safe-area is handled by the App-level banners (AlphaBanner / UpdateBanner)
 *   which are wrapped in their own SafeAreaView, so we only pad the bottom here.
 *   This prevents the status bar from covering the alpha banner.
 * - Wraps content in KeyboardAvoidingView so Continue/Submit buttons stay visible
 *   when the keyboard is open. (Without this the keyboard hid CTAs on the
 *   onboarding / vow / mantra screens.)
 */
export const Screen: React.FC<ScreenProps> = ({
  children,
  className = '',
  withPadding = true,
  scroll = true,
  withBottomTabSpace = true,
}) => {
  const padding = withPadding ? 'px-6 pt-6' : '';
  const bottomPad = withBottomTabSpace ? 'pb-32' : 'pb-6';
  const Container: any = scroll ? ScrollView : View;

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-guard-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
          className="flex-1"
        >
          <Container
            className={`flex-1 ${padding} ${bottomPad} ${className}`}
            contentContainerStyle={
              scroll ? { flexGrow: 1, paddingBottom: 32 } : undefined
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </Container>
        </MotiView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
