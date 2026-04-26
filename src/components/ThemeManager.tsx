import { useEffect } from 'react';
import { useColorScheme } from 'nativewind';

/**
 * Forces the app into dark mode at all times.
 *
 * Light mode is intentionally disabled — too many components use hardcoded
 * `rgba(255,255,255,...)` placeholder/border colors that become white-on-
 * parchment in light mode and unreadable. Until every call site is audited
 * and migrated to theme tokens, dark is the only supported scheme.
 */
export const ThemeManager: React.FC = () => {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme('dark');
  }, [setColorScheme]);

  return null;
};
