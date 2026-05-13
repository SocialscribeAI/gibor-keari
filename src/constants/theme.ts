/**
 * Gibor KeAri — design tokens & theme hook.
 *
 * Single dark palette. `useTheme()` is preserved as a hook for call-site API
 * stability — every consumer in the app calls it. It now returns the static
 * dark palette without subscribing to any color-scheme source.
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

export function useTheme(): ThemePalette & { scheme: 'dark' } {
  return { ...DARK, scheme: 'dark' };
}

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

export const BRAND = {
  name: 'Gibor KeAri',
  nameShort: 'Gibor',
  tagline: 'Stand strong as a lion.',
  hebrew: 'גיבור כארי',
  source: 'Pirkei Avot 5:20',
  sourceQuote:
    'Be bold as a leopard, light as an eagle, swift as a deer, and strong as a lion to do the will of your Father in Heaven.',
};
