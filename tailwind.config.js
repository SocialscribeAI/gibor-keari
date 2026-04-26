/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './App.tsx',
    './src/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand tokens — resolve to CSS variables set in global.css per theme.
        // Keeping the `guard-*` prefix so existing classNames keep working.
        'guard-bg': 'rgb(var(--color-bg) / <alpha-value>)',
        'guard-surface': 'rgb(var(--color-surface) / <alpha-value>)',
        'guard-surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
        'guard-primary': 'rgb(var(--color-primary) / <alpha-value>)',
        'guard-accent': 'rgb(var(--color-accent) / <alpha-value>)',
        'guard-success': 'rgb(var(--color-success) / <alpha-value>)',
        'guard-danger': 'rgb(var(--color-danger) / <alpha-value>)',
        'guard-text': 'rgb(var(--color-text) / <alpha-value>)',
        'guard-muted': 'rgb(var(--color-muted) / <alpha-value>)',
        // Text / icon color when placed ON the accent (gold) background.
        // Stays dark in both themes so gold buttons always have contrast.
        'guard-on-accent': 'rgb(var(--color-on-accent) / <alpha-value>)',

        // IMPORTANT: override Tailwind's built-in `white` so the widespread
        // existing use of `text-white`, `text-white/60`, `bg-white/5` etc. auto-flips
        // between themes. Dark => ivory; Light => ink navy. Contrast preserved.
        white: 'rgb(var(--color-text) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        display: ['Outfit_700Bold'],
        serif: ['Fraunces_700Bold', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
