import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useStore } from '../store/useStore';

/**
 * Bridges the user's saved `themePreference` ('light' | 'dark' | 'system')
 * to NativeWind's colorScheme so that all `guard-*` tokens and the `white`
 * override flip between light and dark palettes in real time.
 *
 * Renders nothing; mounted once near the app root.
 */
export const ThemeManager: React.FC = () => {
  const themePreference = useStore((s) => s.themePreference);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    if (themePreference === 'system') {
      const sys = Appearance.getColorScheme();
      setColorScheme(sys === 'dark' ? 'dark' : 'light');

      const sub = Appearance.addChangeListener(({ colorScheme }) => {
        setColorScheme(colorScheme === 'dark' ? 'dark' : 'light');
      });
      return () => sub.remove();
    }
    setColorScheme(themePreference);
  }, [themePreference, setColorScheme]);

  return null;
};
