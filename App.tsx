import 'react-native-gesture-handler';
import './global.css';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import GuardApp from './src/App';

/**
 * StatusBar that follows the *app-controlled* theme (set by ThemeManager via
 * the user's themePreference), not the device system appearance. Without this,
 * `style="auto"` reads from the OS — which can leave white icons on a light
 * parchment background when the user has overridden the system theme.
 */
function ThemedStatusBar() {
  const { colorScheme } = useColorScheme();
  // dark UI bg → light icons; light UI bg → dark icons.
  const style = colorScheme === 'light' ? 'dark' : 'light';
  // backgroundColor matters on Android only; transparent lets the SafeAreaView
  // (bg-guard-bg) bleed through so the bar matches the screen.
  return <StatusBar style={style} backgroundColor="transparent" translucent />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemedStatusBar />
        <GuardApp />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
