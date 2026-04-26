# Gibor KeAri — Rebrand Notes

**From:** Guard  **To:** Gibor KeAri (גיבור כארי — "Strong as a Lion")
**Tagline:** *Stand strong as a lion.*
**Source:** Pirkei Avot 5:20 — *"הוי עז כנמר וגבור כארי… לעשות רצון אביך שבשמים"*
(*"Be bold as a leopard, strong as a lion… to do the will of your Father in heaven."*)

---

## Brand system

| Token            | Light (parchment)    | Dark (night)         |
|------------------|----------------------|----------------------|
| `guard-bg`       | Parchment `#F7F1E5`  | Deep indigo `#0F1120`|
| `guard-surface`  | Ivory `#EFE5D0`      | Night surface `#1A1E35` |
| `guard-primary`  | Ink navy `#1B2A4E`   | Blue primary `#2C3E7A`|
| `guard-accent`   | Ember gold `#C89A3C` | Candle gold `#E8A020`|
| `guard-success`  | Sage `#7A9D7E`       | Green `#1E8A4A`      |
| `guard-danger`   | Burnt sienna `#B23D2B`| Red `#C0392B`       |
| `guard-on-accent`| Ink navy (dark ink on gold — both modes) |

Light mode is default. Toggle lives in **Profile → Appearance**: Light / Dark / System.

---

## What changed

### Name & copy
- App name, slug, scheme, splash bg → everywhere updated
- Level progression is now lion-themed: New Cub → Cub on its Feet → Young Lion → Lion → **Gibor KeAri** (90d) → Pride Leader → King of the Pride
- Default mantras include "Gibor ka'ari — I stand strong as a lion." and "Eizehu gibor? Hakovesh et yitzro."
- Default display name: `Ari_XXXX`
- Modal titles: Emergency → "The Lion's Pause"; Check-in → "The Lion's Check-in"; Fall → "The Stumble"
- Share copy: "X days standing strong as a lion. גיבור כארי. #GiborKeAri"

### Theme plumbing
- `tailwind.config.js` backs all `guard-*` tokens with CSS variables. Tailwind's `white` token is overridden to point to `--color-text`, so every `text-white` class auto-flips between modes — no sweeping className edits were needed.
- `global.css` defines `:root/.light` and `.dark` variable blocks.
- `src/constants/theme.ts` exports `useTheme()` (returns the active palette for icon/SVG props) and `BRAND` (name, tagline, Hebrew, source).
- `src/components/ThemeManager.tsx` bridges the Zustand `themePreference` ↔ NativeWind's `colorScheme`, including a system-follow mode.
- `src/components/LionMark.tsx` — geometric SVG lion mark used on splash, onboarding, milestone, and check-in.

### Store
- Version bump 2 → 3 with migration (adds `themePreference: 'light'`)
- AsyncStorage key `guard-user-profile` was **intentionally left unchanged** — renaming it would wipe every existing user's data.

---

## What YOU need to do (one-time assets)

The icon and splash image files (raster PNGs) can't be auto-generated. Please regenerate these and drop into `assets/`:

| File | Size | What to draw |
|------|------|--------------|
| `assets/icon.png` | 1024×1024 | Gold lion mark on a parchment `#F7F1E5` square (or white). Use the shape from `src/components/LionMark.tsx` as reference. |
| `assets/splash.png` | 1284×2778 (or 1242×2436) | Centered gold lion on parchment, optional "גיבור כארי" subtitle. |
| `assets/adaptive-icon.png` | 1024×1024 | Same lion on parchment, leave safe zone padding (inner 66%). |
| `assets/favicon.png` | 48×48 | Simplified lion head. |

**Splash background color** in `app.json` is already set to `#F7F1E5`.

Quick path: export the inline `<LionMark>` SVG at the needed size via any vector tool (Figma, Inkscape), flatten to PNG.

---

## Verified
- `tsc` clean across 17 touched files
- No remaining `color="white"`, `color="#fff"`, or hardcoded `rgba(255,255,255,…)` in icon props
- No remaining `text-guard-bg` (that token flips to parchment in light mode; replaced with `guard-on-accent` which stays dark ink in both modes — the right pick for text on gold buttons)
- Brand name "Guard" removed from all user-facing strings (the `guard-*` Tailwind class prefix remains — it's just a CSS token name, zero user visibility)

## Known leftovers (low priority)
- Progress-bar inline `#E8A020` hex in [src/screens/Onboarding.tsx](src/screens/Onboarding.tsx) — works in both themes since gold is in both palettes, but could be migrated to `theme.accent` for consistency.
- `docs/PRODUCT_OVERVIEW.md` and `BUILD_INSTRUCTIONS.md` still reference "Guard" — update when you do the next docs pass.
