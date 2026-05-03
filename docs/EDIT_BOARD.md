# Guard / Gibor KeAri — Edit Board

> **What this is.** A live map of every screen, overlay, component, service, and setting in the mobile app. Each functionality has its own section with a blank **Edits** block where you write changes you want made. When pasted into Google Docs, every `##` becomes a heading that shows up in the **Document outline** sidebar — that gives you a clickable index that behaves like tabs.
>
> **How to use it.**
> 1. Paste this whole file into a new Google Doc (`File → Open → Upload`, or copy-paste). All headings, lists, and tables convert.
> 2. Open the outline pane: `View → Show outline` (or `Ctrl+Alt+A` then `Ctrl+Alt+H`).
> 3. Jump to any section. Write your edit notes under the **Edits** block. Leave **Currently** alone — it's the source-of-truth snapshot.
> 4. When you want me to apply edits, point me at the section name (e.g. "apply the edits in *Coach tab* and *Personalization overlay*").
>
> **Last synced from code.** 2026-05-03. If the codebase has moved on since then, the **Currently** blocks may be stale — re-sync before relying on them for big edits.

---

## 0. Document conventions

Every functional unit below uses the same five-block template:

```
### <Name>
- Route / surface: <how the user gets here>
- Files: <real paths>

Currently:
  <factual snapshot of what it does today>

Edits:
  <BLANK — you write here>

Open questions:
  <BLANK — you write here>
```

If a block is empty, leave it empty. Don't delete the headers — keeping them stable means I can grep for `### <Name>` and find your edits exactly.

---

# Part A — App architecture at a glance

## A1. Tech stack

| Layer | Tech |
|---|---|
| Runtime | Expo (React Native), TypeScript |
| Styling | NativeWind (Tailwind for RN) + a `theme.ts` token layer |
| Animation | Moti / Reanimated, Lucide icons |
| State | Zustand with `persist` → AsyncStorage |
| Backend | Supabase (auth, community, partner, forums, leaderboard) |
| AI | Provider-agnostic client in `src/services/aiClient.ts`; tool-call layer in `coachTools.ts` + `aiActions.ts` |
| OTA | EAS Update (see `UpdateBanner.tsx`) |
| Native push | `notificationService.ts` |

## A2. Navigation model (the schema)

The app does **not** use React Navigation. Instead, [src/navigation/Navigator.tsx](src/navigation/Navigator.tsx) holds two pieces of local state:

- `activeTab` — one of 6 bottom-tab values
- `overlay` — one of ~21 string keys, or `null`

Rendering rule: if `overlay !== null`, that overlay is shown full-screen and the bottom tab bar is hidden. Otherwise the active tab renders. Transitions are a Moti opacity + 10px translateX slide.

```
            ┌────────────────────────────────────────────┐
            │              GuardApp (root)               │
            │  ThemeManager · UpdateBanner · AlphaBanner │
            └─────────────────────┬──────────────────────┘
                                  │
                  hasCompletedOnboarding ?
                          │           │
                       no │           │ yes
                          ▼           ▼
                   ┌──────────┐   ┌──────────────────┐
                   │Onboarding│   │     Navigator    │
                   └──────────┘   └────────┬─────────┘
                                           │
                              overlay !== null ?
                              │              │
                            no│              │ yes
                              ▼              ▼
                  ┌─────────────────┐   ┌────────────────┐
                  │  Active Tab     │   │ Overlay screen │
                  │ (1 of 6 below)  │   │ (full screen,  │
                  └────────┬────────┘   │  no tab bar)   │
                           │            └────────────────┘
                           ▼
                ┌──────── BottomTab ─────────┐
                │ Home  Calendar  Coach      │
                │ Learn  Circle   You        │
                └────────────────────────────┘
```

### Tab → screen map

| Tab id | Label | Component |
|---|---|---|
| `home` | Home | [Home.tsx](src/screens/Home.tsx) |
| `calendar` | Calendar | [Calendar.tsx](src/screens/Calendar.tsx) |
| `coach` | Coach | [Coach.tsx](src/screens/Coach.tsx) |
| `learn` | Learn | [Learn.tsx](src/screens/Learn.tsx) |
| `community` | Circle | [CommunityHubScreen.tsx](src/screens/CommunityHubScreen.tsx) |
| `profile` | You | [Profile.tsx](src/screens/Profile.tsx) |

> Note: `tactics` exists in the `TabType` union but isn't in the bottom bar — Tactics is reached via Profile and the Home action grid. Worth deciding: keep this dual-route or collapse to one path. (See *Edits* in Tactics section.)

### Overlay registry

These are the strings that `setOverlay()` accepts in [Navigator.tsx](src/navigation/Navigator.tsx). Each is its own section in Part C.

`reminders · mantras · rituals · data · personalization · why · watchlist · insights · aiconfig · tactics · learn · coach-style · community · community-setup · community-settings · auth · partner · leaderboard · forums · forum-thread · forum-compose`

## A3. Persistent state schema (Zustand store)

Defined in [src/store/useStore.ts](src/store/useStore.ts). Persisted to AsyncStorage. Two stores total:

1. **`useStore`** — the user's local state (the 12 axes + everything below)
2. **`useCommunityStore`** — Supabase-backed community state ([useCommunityStore.ts](src/store/useCommunityStore.ts))

### The 12 personalization axes

| Axis | Type | Values |
|---|---|---|
| Tone | `Tone` | gentle · harsh · spiritual · clinical · custom · null |
| ReligiousLevel | `ReligiousLevel` | secular · traditional · modern-orthodox · chareidi · chassidish · baal-teshuva · other · custom · null |
| MotivationStyle | `MotivationStyle` | incentive · punishment · mixed · pure-discipline · custom · null |
| AccountabilityMode | `AccountabilityMode` | solo · partner · group · anonymous-community · sponsor · custom · null |
| LifeStage | `LifeStage` | single · dating · engaged · married · married-kids · divorced · widowed · custom · null |
| TriggerTag | `TriggerTag[]` | stress · loneliness · boredom · fatigue · visual · late-night · rejection · success · travel · conflict |
| RiskTime | `RiskTime` | morning · midday · evening · late-night · custom · null |
| RecoveryStage | `RecoveryStage` | day-one · restarting · maintenance · helping-friend · severe-relapse-rebuild · custom · null |
| Intensity | `Intensity` | gentle · standard · hardcore · monk-mode · custom · null |
| LearningStyle | `LearningStyle` | read · listen · watch · do · talk · custom · null |
| PrivacyLevel | `PrivacyLevel` | fully-private · partner-aggregate · partner-detailed · anonymous-group · opt-in-leaderboard · custom · null |
| Language | `Language` | en · he · yi · es · fr · custom · null |

### Coach-style sub-axes

`MantraStyle` · `TacticPreference` · `CoachingApproach` · `TacticDuration` — used by Coach and Tactics screens to pick which content to surface.

Edits to schema:
  <BLANK>

Open questions:
  <BLANK>

---

# Part B — Tab screens

## B1. Home tab
- Route: bottom-tab `home` (default)
- Files: [src/screens/Home.tsx](src/screens/Home.tsx) · uses [PanicButton.tsx](src/components/PanicButton.tsx) · [StreakIncentiveBar.tsx](src/components/StreakIncentiveBar.tsx) · [CheckInModal.tsx](src/components/CheckInModal.tsx) · [DangerMode.tsx](src/components/DangerMode.tsx)

Currently:
  Landing surface after onboarding. Displays current streak, panic button, an action grid (Tactics, Mantras, Rituals, Coach), and conditional banners (UpdateBanner, AlphaBanner, A King's Reward incentive bar). Triggers CheckInModal at configured cadences. Reorganized in commit 49f84a3.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## B2. Calendar tab
- Route: bottom-tab `calendar`
- Files: [src/screens/Calendar.tsx](src/screens/Calendar.tsx) · [LogFallModal.tsx](src/components/LogFallModal.tsx)

Currently:
  Day-grid view of clean days, falls, and check-ins. Tap a day to log a fall or note. Streak is computed from this data via [useStreak.ts](src/hooks/useStreak.ts).

Edits:
  <BLANK>

Open questions:
  <BLANK>

## B3. Coach tab
- Route: bottom-tab `coach`
- Files: [src/screens/Coach.tsx](src/screens/Coach.tsx) · [services/aiClient.ts](src/services/aiClient.ts) · [services/coachTools.ts](src/services/coachTools.ts) · [services/aiActions.ts](src/services/aiActions.ts) · [services/moderationAi.ts](src/services/moderationAi.ts)

Currently:
  AI coach chat. Reads CoachStyle + the 12 axes to shape system prompt. Uses tool-calling (`coachTools.ts`) so the model can read the user's streak/falls/triggers and write back actions (`aiActions.ts`). `hasNewCoachMessage` flag drives the red dot on the bottom-tab Coach icon. Persistent coach memory landed in commit a3fcd03.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## B4. Learn tab
- Route: bottom-tab `learn` (also reachable as overlay `learn` from Profile)
- Files: [src/screens/Learn.tsx](src/screens/Learn.tsx) · [constants/contentLibrary.ts](src/constants/contentLibrary.ts) · [utils/contentSelector.ts](src/utils/contentSelector.ts)

Currently:
  Curated library — Torah sources, neuroscience, recovery articles. `contentSelector.ts` filters by LearningStyle + ReligiousLevel + Intensity. Content is currently static in `contentLibrary.ts`.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## B5. Circle (Community) tab
- Route: bottom-tab `community` → `CommunityHubScreen`
- Files: [src/screens/CommunityHubScreen.tsx](src/screens/CommunityHubScreen.tsx) · [services/community.ts](src/services/community.ts) · [store/useCommunityStore.ts](src/store/useCommunityStore.ts) · [services/supabaseClient.ts](src/services/supabaseClient.ts)

Currently:
  Hub that fans out to Auth, Setup, Settings, Partner, Forums, Leaderboard. Backed by Supabase. `bootstrapSupabase()` runs once on Navigator mount.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## B6. You (Profile) tab
- Route: bottom-tab `profile`
- Files: [src/screens/Profile.tsx](src/screens/Profile.tsx)

Currently:
  Settings hub. Renders user header (Avatar, displayName, memberSince, totalFallCount, streak), badge progression (7/14/30/60/90/180/365), then a long list of `onNavigateTo*` rows that each open one of the overlays in Part C. Also hosts feedback/bug-report (`services/feedback.ts`), data export, and reset.

Edits:
  <BLANK>

Open questions:
  <BLANK>

---

# Part C — Overlay screens (settings + deep features)

These render full-screen above the active tab; the bottom-tab bar disappears while one is open.

## C1. Reminders
- Overlay key: `reminders` · opened from Profile
- Files: [src/screens/ReminderSettingsScreen.tsx](src/screens/ReminderSettingsScreen.tsx) · [services/notificationService.ts](src/services/notificationService.ts)

Currently:
  Configure local push reminders (frequency, quiet hours, content tone). Times are stored on the user object; native scheduling is via `notificationService.ts`.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C2. Mantras
- Overlay key: `mantras` · opened from Profile + Home action grid
- Files: [src/screens/MantraBuilder.tsx](src/screens/MantraBuilder.tsx)

Currently:
  Create/edit personal mantras. Each mantra has a `MantraStyle` (warrior · torah · clinical · compassionate · short-punch · reflective). Surfaced by Coach and on Home.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C3. Rituals
- Overlay key: `rituals` · opened from Profile + Home action grid
- Files: [src/screens/RitualBuilder.tsx](src/screens/RitualBuilder.tsx)

Currently:
  User-defined recovery rituals (e.g. morning Shema + cold shower + journal). Each ritual is a step list with a trigger context (RiskTime, TriggerTag).

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C4. Your Data
- Overlay key: `data` · opened from Profile
- Files: [src/screens/YourDataScreen.tsx](src/screens/YourDataScreen.tsx)

Currently:
  Privacy-focused export/inspect view. Shows what's persisted locally vs synced to Supabase. Honors `PrivacyLevel`. Includes data delete.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C5. Personalization
- Overlay key: `personalization` · opened from Profile
- Files: [src/screens/PersonalizationScreen.tsx](src/screens/PersonalizationScreen.tsx)

Currently:
  Master editor for the 12 axes. Each axis has its own section with the values listed in Part A3. Custom values flow to `*-custom` text fields.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C6. Your Why
- Overlay key: `why` · opened from Profile
- Files: [src/screens/YourWhyScreen.tsx](src/screens/YourWhyScreen.tsx) · [src/screens/VowScreen.tsx](src/screens/VowScreen.tsx)

Currently:
  The user's reason-for-recovery and Vow text. The vow is referenced by Coach prompts and shown during PostFallProtocol.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C7. Watchlist
- Overlay key: `watchlist` · opened from Profile
- Files: [src/screens/WatchlistScreen.tsx](src/screens/WatchlistScreen.tsx) · [src/screens/RiskyAppsSettings.tsx](src/screens/RiskyAppsSettings.tsx)

Currently:
  User-flagged risky apps/sites. Used by pattern engine and reminders. (Native blocking is out of scope; this is awareness-only.)

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C8. Pattern Insights
- Overlay key: `insights` · opened from Profile
- Files: [src/screens/PatternInsightsScreen.tsx](src/screens/PatternInsightsScreen.tsx) · [utils/patternEngine.ts](src/utils/patternEngine.ts)

Currently:
  Reads fall log + check-ins to surface patterns (most-common RiskTime, top TriggerTags, day-of-week distributions). Pure-client analytics — no backend call.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C9. AI Coach Config
- Overlay key: `aiconfig` · opened from Profile
- Files: [src/screens/AiCoachConfigScreen.tsx](src/screens/AiCoachConfigScreen.tsx) · [services/aiClient.ts](src/services/aiClient.ts) · [services/_builtinKey.ts](src/services/_builtinKey.ts)

Currently:
  Choose model/provider, BYOK or use bundled key, set safety toggles. Key rotation landed in commit a3fcd03.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C10. Tactics
- Overlay key: `tactics` · also reached as a (hidden) tab and from Home action grid
- Files: [src/screens/TacticsSettingsScreen.tsx](src/screens/TacticsSettingsScreen.tsx)

Currently:
  Library of urge-management tactics filterable by `TacticPreference` (physical · cognitive · social · spiritual · environmental · breathwork) and `TacticDuration` (instant · 2min · 5min · 10min+). Effectiveness rating per tactic landed in commit 74db04e.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C11. Coach Style
- Overlay key: `coach-style` · opened from Profile
- Files: [src/screens/CoachStyleScreen.tsx](src/screens/CoachStyleScreen.tsx)

Currently:
  Picks `CoachingApproach` (drill-sergeant · warm-mentor · accountability · clinical · spiritual · socratic) plus voice tone modifiers. Coach reads this on every send.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C12. Community Setup
- Overlay key: `community-setup`
- Files: [src/screens/CommunitySetupScreen.tsx](src/screens/CommunitySetupScreen.tsx)

Currently:
  First-time community onboarding — handle, anonymity preference, partner code generation.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C13. Community Settings
- Overlay key: `community-settings`
- Files: [src/screens/CommunitySettingsScreen.tsx](src/screens/CommunitySettingsScreen.tsx)

Currently:
  Edit community profile, leave/rejoin, blocklist.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C14. Auth
- Overlay key: `auth`
- Files: [src/screens/AuthScreen.tsx](src/screens/AuthScreen.tsx) · [services/supabaseClient.ts](src/services/supabaseClient.ts)

Currently:
  Email magic-link / OAuth. Required for any feature in `useCommunityStore`. App is fully usable without auth (solo mode).

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C15. Partner
- Overlay key: `partner`
- Files: [src/screens/PartnerScreen.tsx](src/screens/PartnerScreen.tsx)

Currently:
  Pair with one accountability partner via code. Partner sees aggregate or detailed data depending on `PrivacyLevel`. Partner reload loop fix landed in commit 49f84a3.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C16. Leaderboard
- Overlay key: `leaderboard`
- Files: [src/screens/LeaderboardScreen.tsx](src/screens/LeaderboardScreen.tsx)

Currently:
  Opt-in only (`PrivacyLevel === 'opt-in-leaderboard'`). Anonymous handle + streak.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C17. Forums (list)
- Overlay key: `forums`
- Files: [src/screens/ForumsListScreen.tsx](src/screens/ForumsListScreen.tsx)

Currently:
  List of forum boards and recent posts. Tap a post → `forum-thread`. Compose → `forum-compose`.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C18. Forum thread
- Overlay key: `forum-thread`
- Files: [src/screens/ForumThreadScreen.tsx](src/screens/ForumThreadScreen.tsx)

Currently:
  Single thread view + replies. Moderation runs through `moderationAi.ts`.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## C19. Forum compose
- Overlay key: `forum-compose`
- Files: [src/screens/ForumComposeScreen.tsx](src/screens/ForumComposeScreen.tsx)

Currently:
  Compose new post or reply. Mode is set by caller (`'forum'` for top-level, `'post'` for reply).

Edits:
  <BLANK>

Open questions:
  <BLANK>

---

# Part D — Cross-cutting components

## D1. Onboarding flow
- Files: [src/screens/Onboarding.tsx](src/screens/Onboarding.tsx)

Currently:
  Runs once when `hasCompletedOnboarding` is false. Trimmed in commit 49f84a3 — collects identity, ReligiousLevel, RecoveryStage, top triggers, vow. Skips the rest (those go to defaults; user can edit later in Personalization).

Edits:
  <BLANK>

Open questions:
  <BLANK>

## D2. Panic Button + Emergency Countdown
- Files: [PanicButton.tsx](src/components/PanicButton.tsx) · [EmergencyCountdown.tsx](src/components/EmergencyCountdown.tsx) · [CloseCallProtocol.tsx](src/components/CloseCallProtocol.tsx) · [PostFallProtocol.tsx](src/components/PostFallProtocol.tsx)

Currently:
  Panic button on Home triggers a countdown overlay with the user's top tactic + mantra. After countdown: choose "Won" (CloseCallProtocol — celebrates, logs check-in) or "Fell" (PostFallProtocol — vow re-read, journal, restart streak).

Edits:
  <BLANK>

Open questions:
  <BLANK>

## D3. Check-In Modal
- Files: [CheckInModal.tsx](src/components/CheckInModal.tsx)

Currently:
  Auto-prompts at user-configured cadence. Quick mood/risk capture used by patternEngine.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## D4. Danger Mode
- Files: [DangerMode.tsx](src/components/DangerMode.tsx) · [PunishmentModeWrapper.tsx](src/components/PunishmentModeWrapper.tsx) · [PunishmentSettingsScreen.tsx](src/screens/PunishmentSettingsScreen.tsx)

Currently:
  When `MotivationStyle` includes `'punishment'` or `'mixed'`, this wraps the app in a stricter visual + interaction mode (cooldowns, locked features). Configured in PunishmentSettingsScreen.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## D5. Streak / Milestone
- Files: [StreakIncentiveBar.tsx](src/components/StreakIncentiveBar.tsx) · [MilestoneCelebration.tsx](src/components/MilestoneCelebration.tsx) · [hooks/useStreak.ts](src/hooks/useStreak.ts)

Currently:
  Streak bar shows current streak + next badge target ("A King's Reward" framing landed in commit 49f84a3). MilestoneCelebration fires at 7/14/30/60/90/180/365.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## D6. Theme system
- Files: [ThemeManager.tsx](src/components/ThemeManager.tsx) · [constants/theme.ts](src/constants/theme.ts) · [App.tsx](App.tsx) (ThemedStatusBar)

Currently:
  Light/dark theme with `themePreference` stored in store ('light' · 'dark' · 'system'). WCAG AA contrast pass landed in commit 4d90e42. StatusBar follows app theme, not OS theme.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## D7. Update / Alpha banners
- Files: [UpdateBanner.tsx](src/components/UpdateBanner.tsx) · [AlphaBanner.tsx](src/components/AlphaBanner.tsx) · [SplashScreen.tsx](src/components/SplashScreen.tsx) · [LionMark.tsx](src/components/LionMark.tsx) · [buildInfo.ts](src/buildInfo.ts)

Currently:
  UpdateBanner triggers EAS Update fetch; AlphaBanner shows pre-release messaging; SplashScreen + LionMark are first-run visuals.

Edits:
  <BLANK>

Open questions:
  <BLANK>

---

# Part E — Services / integrations

## E1. AI client + tool layer
- Files: [services/aiClient.ts](src/services/aiClient.ts) · [services/aiService.ts](src/services/aiService.ts) · [services/coachTools.ts](src/services/coachTools.ts) · [services/aiActions.ts](src/services/aiActions.ts) · [services/moderationAi.ts](src/services/moderationAi.ts) · [services/_builtinKey.ts](src/services/_builtinKey.ts)

Currently:
  Provider-agnostic chat completion with tool-call support. `coachTools.ts` exposes read/write tools to the model (read streak, read triggers, append journal, set reminder, etc.). `moderationAi.ts` runs on community/forum content. `_builtinKey.ts` holds the rotated bundled key.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## E2. Supabase / community
- Files: [services/supabaseClient.ts](src/services/supabaseClient.ts) · [services/supabaseConfig.ts](src/services/supabaseConfig.ts) · [services/community.ts](src/services/community.ts) · [store/useCommunityStore.ts](src/store/useCommunityStore.ts)

Currently:
  Single Supabase project. Tables back: profiles, partners, forums, posts, replies, leaderboard. Schema: see `community.ts` for the canonical reads/writes.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## E3. Notifications
- Files: [services/notificationService.ts](src/services/notificationService.ts)

Currently:
  Local notifications only (no remote push). Schedules reminders based on `ReminderSettingsScreen` config.

Edits:
  <BLANK>

Open questions:
  <BLANK>

## E4. Feedback / bug report
- Files: [services/feedback.ts](src/services/feedback.ts) · `sendFeedback` and `reportBug` called from Profile

Currently:
  Sends user-submitted feedback or bug reports to the backend.

Edits:
  <BLANK>

Open questions:
  <BLANK>

---

# Part F — Settings deep dive

This is the section to use when you want to edit *settings*, not whole features. It cross-references which screens read/write each setting.

| Setting | Stored as | Edited in | Read by |
|---|---|---|---|
| Display name | `displayName` | Profile (inline) · Onboarding | Profile header · Coach prompt · Community |
| Tone | `tone` | Personalization | Coach prompt · Reminder copy · Mantras |
| ReligiousLevel | `religiousLevel` | Onboarding · Personalization | Coach prompt · Learn filter · Mantras (torah style) |
| MotivationStyle | `motivationStyle` | Personalization | DangerMode wrapper · Streak bar copy · Coach |
| AccountabilityMode | `accountabilityMode` | Personalization · Community Setup | Circle hub · Partner |
| LifeStage | `lifeStage` | Personalization | Coach prompt · Learn filter |
| TriggerTag[] | `triggers` | Onboarding · Personalization · CheckInModal | Pattern Insights · Coach · Tactics filter |
| RiskTime | `riskTime` | Personalization · Pattern Insights (auto-suggest) | Reminders default · Tactics ordering |
| RecoveryStage | `recoveryStage` | Onboarding · Personalization | Coach prompt · onboarding skip logic |
| Intensity | `intensity` | Personalization | DangerMode · Tactics filter · Reminder cadence |
| LearningStyle | `learningStyle` | Personalization | Learn content selector |
| PrivacyLevel | `privacyLevel` | Your Data · Community Settings | Partner detail-level · Leaderboard opt-in · sync gate |
| Language | `language` | Personalization | All copy |
| Theme | `themePreference` | Profile / settings | ThemeManager · StatusBar |
| AI provider/key | aiconfig fields | AI Coach Config | aiClient.ts |
| Reminder schedule | reminder fields | Reminder Settings | notificationService |
| Risky apps | watchlist array | Watchlist | Pattern engine · Reminders |
| Mantras | mantras array | Mantra Builder | Home · Coach · Panic |
| Rituals | rituals array | Ritual Builder | Home · Coach |
| Tactics prefs | TacticPreference[] · TacticDuration | Tactics Settings | Tactics screen ordering · Panic |
| Coach style | CoachingApproach · MantraStyle | Coach Style | Coach prompt |

Edits to settings UX (cross-cutting):
  <BLANK>

Open questions:
  <BLANK>

---

# Part G — Cross-cutting / open edits

Use this section for changes that span multiple screens (e.g. "tighten the entire onboarding by 30%", "rename 'Circle' back to 'Community' everywhere", "introduce a new axis").

## G1. Naming / copy
Edits:
  <BLANK>

## G2. New features / axes to add
Edits:
  <BLANK>

## G3. Things to remove or hide
Edits:
  <BLANK>

## G4. Bugs / regressions to investigate
Edits:
  <BLANK>

## G5. Anything else
Edits:
  <BLANK>

---

# Appendix — file index

Generated 2026-05-03 from `src/**/*.{ts,tsx}`. Use this to grep for what to edit.

**Screens** ([src/screens/](src/screens/))
- Home · Calendar · Coach · Learn · Profile · Onboarding · VowScreen
- ReminderSettingsScreen · MantraBuilder · RitualBuilder · YourDataScreen · PersonalizationScreen · YourWhyScreen · WatchlistScreen · RiskyAppsSettings · PatternInsightsScreen · AiCoachConfigScreen · TacticsSettingsScreen · PunishmentSettingsScreen · CoachStyleScreen
- CommunityHubScreen · CommunitySetupScreen · CommunitySettingsScreen · AuthScreen · PartnerScreen · LeaderboardScreen · ForumsListScreen · ForumThreadScreen · ForumComposeScreen

**Components** ([src/components/](src/components/))
- BottomTab · Screen · Avatar · LionMark · SplashScreen · ThemeManager
- PanicButton · EmergencyCountdown · CheckInModal · DangerMode · PunishmentModeWrapper · LogFallModal · MilestoneCelebration · StreakIncentiveBar · CloseCallProtocol · PostFallProtocol
- UpdateBanner · AlphaBanner · PrivacyNote

**Stores** ([src/store/](src/store/))
- useStore · useCommunityStore

**Services** ([src/services/](src/services/))
- aiClient · aiService · aiActions · coachTools · moderationAi · _builtinKey · supabaseClient · supabaseConfig · community · notificationService · feedback

**Hooks / utils**
- [hooks/useStreak.ts](src/hooks/useStreak.ts) · [utils/patternEngine.ts](src/utils/patternEngine.ts) · [utils/contentSelector.ts](src/utils/contentSelector.ts) · [utils/formatters.ts](src/utils/formatters.ts)

**Constants**
- [constants/theme.ts](src/constants/theme.ts) · [constants/contentLibrary.ts](src/constants/contentLibrary.ts)

**Navigation / root**
- [src/App.tsx](src/App.tsx) · [src/navigation/Navigator.tsx](src/navigation/Navigator.tsx) · [App.tsx](App.tsx) · [src/buildInfo.ts](src/buildInfo.ts)
