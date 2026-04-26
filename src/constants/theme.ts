import { useColorScheme } from 'nativewind';

/**
 * Gibor KeAri — design tokens & theme hook.
 *
 * className-based colors (bg, text, border) resolve to CSS variables
 * and flip with the theme automatically. Use `useTheme()` for anything
 * that can't be expressed as a Tailwind class — lucide `color` props,
 * SVG strokes, Slider / Switch tints, etc.
 */

export interface ThemePalette {
  bg: string;
  surface: string;
  surface2: string;
  primary: string;
  accent: string;
  success: string;
  danger: string;
  text: string;
  muted: string;
  /** Text / icon color when placed on the accent (gold) background. Always dark. */
  onAccent: string;
  textDim: string;
  mutedStrong: string;
  hairline: string;
}

export const LIGHT: ThemePalette = {
  bg: '#F7F1E5',
  surface: '#FFFBF0',
  surface2: '#F0E7D1',
  primary: '#1B2A4E',
  accent: '#C89A3C',
  success: '#7A9D7E',
  danger: '#B23D2B',
  text: '#1B2A4E',
  muted: '#717891',
  onAccent: '#1B2A4E',
  textDim: 'rgba(27, 42, 78, 0.5)',
  mutedStrong: 'rgba(27, 42, 78, 0.7)',
  hairline: 'rgba(27, 42, 78, 0.15)',
};

export const DARK: ThemePalette = {
  bg: '#0F1120',
  surface: '#1A1E35',
  surface2: '#14172A',
  primary: '#2C3E7A',
  accent: '#E8A020',
  success: '#1E8A4A',
  danger: '#C0392B',
  text: '#F0E6D2',
  muted: '#B4BAD2',
  onAccent: '#0F1120',
  textDim: 'rgba(240, 230, 210, 0.5)',
  mutedStrong: 'rgba(240, 230, 210, 0.7)',
  hairline: 'rgba(240, 230, 210, 0.15)',
};

/** Returns the active palette. Re-renders when theme flips. */
export function useTheme(): ThemePalette & { scheme: 'light' | 'dark' } {
  const { colorScheme } = useColorScheme();
  const resolved = colorScheme === 'light' ? LIGHT : DARK;
  return { ...resolved, scheme: colorScheme === 'light' ? 'light' : 'dark' };
}

// ---------------------------------------------------------------------------
// Legacy `COLORS` export — still imported by a couple of older components.
// Points at DARK so they keep rendering correctly; migrate to useTheme() over
// time.
// ---------------------------------------------------------------------------
export const COLORS = {
  primary: DARK.primary,
  accent: DARK.accent,
  background: DARK.bg,
  surface: DARK.surface,
  success: DARK.success,
  danger: DARK.danger,
  text: DARK.text,
  textMuted: DARK.mutedStrong,
  border: 'rgba(44, 62, 122, 0.3)',
  glow: 'rgba(232, 160, 32, 0.3)',
};

export const FONTS = {
  sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
  display: '"Outfit", "Inter", sans-serif',
  serif: '"Fraunces", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
};

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

/** Brand constants — single source of truth for name / tagline. */
export const BRAND = {
  name: 'Gibor KeAri',
  nameShort: 'Gibor',
  tagline: 'Stand strong as a lion.',
  hebrew: 'גיבור כארי',
  source: 'Pirkei Avot 5:20',
  sourceQuote:
    'Be bold as a leopard, light as an eagle, swift as a deer, and strong as a lion to do the will of your Father in Heaven.',
};
