import { useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { useStore } from '../store/useStore';

/**
 * Syncs app theme with user preference from the store.
 * Responds to theme changes and keeps nativewind in sync.
 */
export const ThemeManager: React.FC = () => {
  const { setColorScheme } = useColorScheme();
  const themePreference = useStore((s) => s.themePreference);

  useEffect(() => {
    if (themePreference === 'system') {
      setColorScheme('system');
    } else {
      setColorScheme(themePreference);
    }
  }, [themePreference, setColorScheme]);

  return null;
};
