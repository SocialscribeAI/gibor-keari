import React from 'react';
import { ScrollView, View } from 'react-native';
import { MotiView } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
  withPadding?: boolean;
  scroll?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  className = '',
  withPadding = true,
  scroll = true,
}) => {
  const padding = withPadding ? 'px-6 pt-12 pb-24' : '';
  const Container: any = scroll ? ScrollView : View;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-guard-bg">
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
        className="flex-1"
      >
        <Container
          className={`flex-1 ${padding} ${className}`}
          contentContainerStyle={scroll ? { flexGrow: 1 } : undefined}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </Container>
      </MotiView>
    </SafeAreaView>
  );
};
