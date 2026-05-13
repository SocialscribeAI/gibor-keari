# Guard / Gibor KeAri — Implementation Plan

**Author:** Claude (Opus 4.7 1M)
**Date:** 2026-05-13
**Status:** Plan — awaiting per-phase user go-ahead before any code is written
**Final destination:** Will be migrated to `c:/Users/morah/OneDrive/Desktop/websites/Gaurd/plans/edit-list-implementation.md` once plan mode exits.

---
y

## 1. Context

The user reviewed every screen of Guard (Jewish men's recovery app, React Native + Expo SDK 52, Zustand, optional Supabase community) and wrote a punch-list of edits. I interpreted each item, ran diagnostic exploration to confirm what's bug vs. UX vs. missing feature, and surfaced 4 directional questions. The user answered them. Those answers, combined with the diagnostic findings, constrain how this plan is built.

This document is the *how*. Every item the user wrote has a corresponding work block here — concrete files, concrete code direction, concrete acceptance criteria, concrete test plan, and a callout on whether it ships OTA or needs an APK build.

**Discipline applied throughout:**
- No work starts without an explicit per-phase user go-ahead.
- Every onboarding question must justify itself (the user's "necessary to fight the addiction" rule). The same rule extends to every new feature: if I can't articulate how it changes user behavior or coach quality, it doesn't ship.
- Each phase is independently shippable. We don't bundle "small fix" with "structural rewrite" into one PR.
- Zustand schema bumps happen exactly once per phase that needs them, with a migration function — never silent shape changes.

---

## 2. Locked decisions (from user answers, 2026-05-13)

| Question | Decision | Implication |
|---|---|---|
| Theme | Dark-only — drop light theme entirely | Revert/strip the `7c14902` light-theme work; all tokens collapse back to a single dark palette. Kills "invisible text" bugs at the root. |
| Panic button | Hide from sight everywhere, keep code in tree | Remove from Home + any deep links, leave files for later rewrite. No code deletion. |
| Onboarding | Single deep flow; every question must be *necessary* to fight this addiction; editable in Settings later | Justify-or-cut rule on every question. Profile becomes edit-only. |
| Coach training | Feedback-based steering + clinical-style notes the coach writes and the user can edit | Build a deep, transparent memory layer. No fine-tuning. Info quality > model quality. |

---

## 3. Phase plan (sequenced)

The order below is deliberate. Earlier phases reduce surface area for later phases (e.g. theme cleanup before deep UI rebuilds, AI loop fix before coach memory). Phases are sized so each is shippable on its own.

**Legend per work block:**
- **Scope** — what's in / what's out
- **Files** — concrete paths that change or are added
- **Approach** — code-level direction
- **Data model** — Zustand / persist migration if any
- **Acceptance** — how we know it's done
- **Test plan** — manual + automated
- **Ship vehicle** — OTA-shippable or needs APK build
- **Risk** — what could go wrong

---

### Phase 0 — Cleanup & quick wins
Tiny, isolated fixes. Each could ship independently. Together they remove the most user-painful issues and clear the deck for structural work.

#### 0.1 Strip the light theme — return to dark-only

**Scope:** Remove all light-theme tokens, `useColorScheme()` flips, and `themePreference` toggles. Re-unify hardcoded `rgba(255,255,255,...)` and `#F0F2FF` colors to the dark palette tokens. Out of scope: any brand pivot (forged-steel feel). That's a later phase if the user wants it.

**Files:**
- `src/constants/theme.ts` — collapse LIGHT/DARK to a single `THEME` export with the dark palette only.
- `global.css` — remove light-mode CSS custom property block.
- `tailwind.config.js` — remove any light-mode color references.
- `app.config.js` — remove or hardcode `userInterfaceStyle: 'dark'`.
- Every screen that calls `useColorScheme()` — replace with the static dark tokens.
- Every screen with hardcoded `rgba(255,255,255,...)`, `#F0F2FF`, or similar — replace with the token (e.g. `theme.text`, `theme.surface`).
- `src/store/useStore.ts` — remove `themePreference` from state and its setter. Add a v8 migration that drops the field.

**Approach:**
1. Search for `useColorScheme`, `LIGHT`, `vellum`, `parchment`, `#FFFBF0`, `#F7F1E5`, `#C89A3C`, `themePreference` — these are the migration's surface area.
2. Delete the LIGHT object from `theme.ts`. Inline the dark values or keep them as the single `THEME` export. All consumers stop reading from a tuple.
3. For each component that previously branched on theme, remove the branch.
4. Grep for `rgba(255,255,255` and `rgba(255, 255, 255` — every hit gets replaced with the appropriate token (`theme.text` for body, `theme.muted` for secondary, etc.).
5. Add the `themePreference` removal to the persist migration (see §5 Cross-cutting → Zustand migrations).

**Data model:** Zustand bump v7 → v8. Migration: `delete state.themePreference; return state;`.

**Acceptance:**
- `git grep -i "vellum\|parchment\|#FFFBF0\|#F7F1E5\|useColorScheme"` returns no app-code hits (node_modules excluded).
- App boots and every screen renders against the dark palette regardless of device OS theme.
- No "white text on white" or "dark text on dark" anywhere — visual spot-check of all 5 tabs and all 17 overlays.

**Test plan:**
- Build APK, install on a phone with OS light mode → app is still dark.
- Build APK, install on a phone with OS dark mode → identical.
- Walk every overlay screen, eyeball contrast. Make a checklist.
- TypeScript clean: `npx tsc --noEmit`.

**Ship vehicle:** OTA-shippable.

**Risk:** Some components may have been written assuming the LIGHT theme was the default. Visual regressions possible — must walk every screen manually. The `7c14902` commit is large; reverting it cleanly without reintroducing the original `rgba(255,255,255,...)` bugs takes care.

---

#### 0.2 Hide the Panic Button

**Scope:** Remove all entry points to the panic flow from the UI. Keep the implementation files (`PanicButton.tsx`, `EmergencyCountdown.tsx`) in the tree, untouched, for a future rewrite.

**Files:**
- `src/screens/Home.tsx` — remove the `<PanicButton />` (or `<EmergencyButton />`) usage.
- Any other screen that renders the panic affordance (search for `PanicButton`, `Help me now`, `Emergency`, `panic`) — remove the render but keep the imports commented with a `// PHASE 0.2: hidden — see plan` marker so the rewrite picks them up easily.
- `src/navigation/Navigator.tsx` — if there's a deep-link/overlay for `panic`, remove it from the active routes but leave the case branch commented.

**Approach:**
1. Search for `PanicButton`, `EmergencyCountdown`, `panic`, `Help me now` across `src/`.
2. For each render site, comment the JSX with a `// PHASE 0.2: temporarily hidden — see plans/edit-list-implementation.md` tag.
3. Verify no other code path can trigger the panic modal (e.g. urge slider at level 10 currently auto-opening it).

**Data model:** None.

**Acceptance:**
- No button or affordance opens the EmergencyCountdown modal from any screen.
- The files `PanicButton.tsx` and `EmergencyCountdown.tsx` remain untouched.
- No console warnings about unused imports (use the comment-out pattern, not full delete).

**Test plan:**
- Walk every screen. Confirm no panic button visible.
- Set urge slider to 10. Confirm no auto-open.
- TypeScript clean.

**Ship vehicle:** OTA-shippable.

**Risk:** Low. The only risk is missing a trigger path. Mitigation: grep-driven removal, manual walkthrough.

---

#### 0.3 Fix the streak counter timezone bug

**Scope:** Make `syncStreak()` and `recomputeStreak()` produce correct day counts regardless of user timezone. Specifically: a day boundary is "local midnight", not "UTC midnight".

**Files:**
- `src/hooks/useStreak.ts` — verify it just reads `currentStreak` from store; if it computes anything, fix here too.
- `src/store/useStore.ts` — `syncStreak()` (around line 1232), `recomputeStreak()` (around line 1256), and any caller that constructs Date objects for streak math.
- `src/utils/formatters.ts` — add a `localDaysBetween(a: Date, b: Date): number` helper that uses local-year/month/day, not UTC.

**Approach:**
1. Add helper to `formatters.ts`:
   ```ts
   export function localDaysBetween(a: Date, b: Date): number {
     const aDay = new Date(a.getFullYear(), a.getMonth(), a.getDate());
     const bDay = new Date(b.getFullYear(), b.getMonth(), b.getDate());
     const MS_PER_DAY = 86400000;
     return Math.round((bDay.getTime() - aDay.getTime()) / MS_PER_DAY);
   }
   ```
   This avoids `date-fns` `differenceInDays` (UTC-aware) and the `new Date(y, m-1, d+1)` half-correct pattern currently in the code.
2. Replace every `differenceInDays(...)` call in `useStore.ts` related to streak with `localDaysBetween(...)`.
3. In `recomputeStreak()`, when constructing "day after the last fall", use `new Date(y, m-1, d+1)` *and* call `.setHours(0,0,0,0)` to force local midnight.
4. Audit the auto-backfill loop in `syncStreak()`. The current logic fills every missing day from `streakStart` to `today` as `win` unless already logged. After the fix, ensure: (a) the start day itself is not double-counted, (b) the loop's day iterator uses local-midnight increments.
5. Add a unit test (Jest) that constructs Dates in `America/New_York` at 23:30 local and verifies the count matches expected.

**Data model:** No persist change. But: existing users may have an incorrect `currentStreak` saved. The first time the new code runs, `syncStreak()` will recompute and self-correct.

**Acceptance:**
- For a user with `streakStart = today at 10:00 local`, `currentStreak === 0`.
- For a user with `streakStart = yesterday at 23:50 local`, `currentStreak === 1`.
- For a user in UTC-5, opening the app at 22:00 local does not roll the streak forward by one day until local midnight.
- A user who has had the bug shows a corrected streak on first launch after the fix.

**Test plan:**
- Unit tests for `localDaysBetween` covering timezone boundaries, DST transitions, year rollover.
- Manual: set device clock to various times near midnight in different timezones, observe streak.
- Verify no regression with the existing milestone ladder (rank label still derives correctly from the corrected count).

**Ship vehicle:** OTA-shippable. (Pure JS.)

**Risk:** Some users may see their streak *change* on the first launch after the fix. This could read as "the fix broke my streak." Mitigation: include a one-line toast / first-launch banner saying "Your streak count has been corrected to use local time." If the user objects, we can suppress.

---

#### 0.4 Wire the daily check-in reminder into the app lifecycle

**Scope:** Make `scheduleDailyReminder()` actually get called at app startup (and whenever the user changes their reminder time), so notifications fire at the user's chosen morning time instead of the danger hour or never.

**Files:**
- `src/services/notificationService.ts` — confirm `scheduleDailyReminder()` signature; add `cancelScheduledReminder()` if missing.
- `src/App.tsx` — on mount (after store hydration), call `scheduleDailyReminder(store.dailyReminderTime)`.
- `src/screens/ReminderSettingsScreen.tsx` — on `setDailyReminderTime`, also call `cancelScheduledReminder()` then `scheduleDailyReminder(newTime)`.
- `src/store/useStore.ts` — ensure `setDailyReminderTime` triggers the reschedule (via a side-effect in the setter or via a useEffect subscriber).

**Approach:**
1. Audit the current notification service. Document:
   - What identifier each scheduled notification uses (so we can cancel cleanly).
   - Whether the danger-hour urge alert and the daily reminder use the same identifier (collision risk).
2. Add a `bootstrapNotifications()` function that, given the current store state, schedules everything that should be scheduled and cancels stale schedules. Idempotent.
3. Call `bootstrapNotifications()` from `App.tsx` after `useStore` is hydrated.
4. Hook into every setting change that affects scheduling (`setDailyReminderTime`, `setLightsOutTime`, `setDangerHourOverride` if it exists, `setRemindersEnabled` if it exists) so the reschedule is automatic.

**Data model:** No persist change. May add `remindersScheduledAt` for diagnostics — but only if it earns its place.

**Acceptance:**
- Setting `dailyReminderTime` to `07:00` causes a notification to fire the next morning at 07:00 local.
- Changing the time to `08:30` and force-closing the app — the next notification fires at 08:30, not 07:00 (no stale schedule).
- The danger-hour urge alert continues to fire at its own time independently.
- Cold-launching the app schedules notifications for the next 7 days (or however expo-notifications wants us to chunk it).

**Test plan:**
- Set reminder to 1 minute in the future; force-close app; wait; confirm notification fires.
- Change time; force-close; verify new schedule.
- Toggle reminders off entirely; verify no notification fires.

**Ship vehicle:** OTA-shippable. (No new native modules — `expo-notifications` is already in the app per project memory.)

**Risk:** iOS notification permission handshake — if the user denied permission, the schedule call silently fails. Need a check at call site and a soft UI prompt to re-enable. (Out of scope for 0.4 — add to the Phase 3 UX polish list.)

---

#### 0.5 Daily mantra rotation

**Scope:** Make the home-screen mantra change once per local day. Selection is deterministic so the user sees the same mantra all day, but a different one tomorrow.

**Files:**
- `src/store/useStore.ts` — add `mantraRotationSeed: number` (set once at install, persisted), and a `getTodaysMantra()` derived selector or a `rotateMantraIfNeeded()` action.
- `src/screens/Home.tsx` — call `rotateMantraIfNeeded()` on mount; read `mantras[dailyMantraIndex]`.

**Approach:**
1. On install, set `mantraRotationSeed = Math.floor(Math.random() * 100000)`. Persist.
2. The day index = `Math.floor((todayLocalEpochMs / MS_PER_DAY))`. The mantra index = `(daySeed + rotationSeed) % mantras.length`.
3. Store `lastMantraRotationDayIndex`. On Home mount, if the current day index differs, update `dailyMantraIndex` and `lastMantraRotationDayIndex`.
4. User-liked mantras (via the existing `likeMantra` action) get weighted ~2× — i.e. the modulus operates on an expanded array where liked mantras appear twice. Dislikes appear half as often or not at all.
5. The pool the rotation reads from is **whatever is in `mantras`** today — Phase 4.1 expands that pool with a curated library.

**Data model:** Zustand v8 (same bump as 0.1 if shipped together) adds `mantraRotationSeed: number` and `lastMantraRotationDayIndex: number`. Migration initializes them.

**Acceptance:**
- Tomorrow's mantra differs from today's (in a pool ≥ 2).
- Re-opening the app multiple times today shows the same mantra.
- Liked mantras appear more often over time; disliked ones less often.
- Adding a new user mantra makes it eligible from the next day.

**Test plan:**
- Mock `Date.now()` in a Jest test, walk through 30 days, confirm rotation.
- Manual: like a mantra, observe weighting over a week (or use a temporary debug screen showing the calculated index for the next 14 days).

**Ship vehicle:** OTA-shippable.

**Risk:** Low. The rotation is deterministic and cheap.

---

#### 0.6 Fix the AI tool-use loop in `aiActions.ts`

**Scope:** Stop the duplicate-prose bug and prevent uncaught tool failures from leaving the Coach/Learn UI half-rendered. Out of scope: redesigning the tool registry, adding new tools.

**Files:**
- `src/services/aiActions.ts` — `generateCoachReply()` (around line 526), `executeToolCalls()` (around line 614), and any sibling that participates in the loop.
- `src/services/coachTools.ts` — confirm each tool's exception contract (do they throw, or return error objects?). Standardize.
- `src/screens/Coach.tsx` — error-boundary the assistant-reply render.
- `src/screens/LearnScreen.tsx` (or wherever Learn calls AI) — same pattern.

**Approach:**
1. Wrap `executeToolCalls()` with a try/catch around every tool invocation. On failure, the tool call returns `{ ok: false, error: string }` instead of throwing.
2. Replace the "preserve prior prose by re-feeding into next turn" logic. The current pattern is what causes duplicates. Two cleaner options:
   - **A (preferred):** Capture prose during the loop into a separate `accumulatedProse: string[]` array. After the loop terminates (or hits the 3-iteration cap), the *final* user-visible reply is `accumulatedProse.join("\n\n")`. Tool-call segments never get fed back as prose.
   - **B (fallback):** If the model insists on emitting prose+tool together, parse them out, *render the prose immediately* in a streaming-style append, then continue with tool calls.
3. Cap the loop at 3 iterations (already there) but on cap-hit, emit a graceful "[I tried to look that up but couldn't finish — try again]" instead of returning a half-state.
4. In `Coach.tsx`, wrap the message render in an ErrorBoundary that, on render error, shows a "Reply failed to load — tap to retry" affordance.

**Data model:** None.

**Acceptance:**
- A coach reply that includes a tool call (e.g. `readUserProfile`) renders exactly once, with no duplicate prose blocks.
- If a tool call deliberately throws (e.g. a test tool that always errors), the user sees a graceful inline error, not a frozen screen.
- The same fix carries through to Learn recommendations.

**Test plan:**
- Manually trigger a coach turn that uses tools (ask the coach "what do you know about me?" — should call `readUserProfile`).
- Inject a deliberately-failing tool and confirm the UI doesn't freeze.
- Verify prior conversations still render correctly after the change (no regressions in saved `coachMessages`).

**Ship vehicle:** OTA-shippable.

**Risk:** Medium. This is the most behavior-sensitive change in Phase 0. Real risk of breaking working coach flows. Mitigation: do not delete the prose-re-feed branch in the same commit as adding the new accumulator — feature-flag the new path for one OTA cycle so we can roll back.

---

**Phase 0 deliverables in summary:**

| Item | Sub-section | Estimated effort | Ship via |
|---|---|---|---|
| Strip light theme | 0.1 | 1 day | OTA |
| Hide Panic Button | 0.2 | 1 hour | OTA |
| Streak timezone fix | 0.3 | 4 hours | OTA |
| Wire check-in reminder | 0.4 | 4 hours | OTA |
| Mantra rotation | 0.5 | 3 hours | OTA |
| AI tool-use loop fix | 0.6 | 1 day | OTA |

Phase 0 total: ~3 working days. Entire phase is OTA-shippable — no APK build required.

---

### Phase 1 — Deep onboarding redesign

**Goal:** Replace the current 5-step minimalist wizard with a deep, justified intake that captures all data needed to drive coaching quality. Every question must earn its place. Profile becomes edit-only afterward.

#### 1.1 The justify-each-question pass

Before writing any onboarding code, write a one-page table mapping every proposed question to:
- The personality profile axis it sets
- The concrete way the coach's behavior changes based on the answer
- An example of a coach reply that would differ if this question weren't answered

If the third column is empty or weak, the question is cut.

**Files:**
- A new doc: `c:/Users/morah/OneDrive/Desktop/websites/Gaurd/plans/onboarding-question-justification.md`. This is reviewed with the user before any UI is built.

**Approach (questions to justify, derived from the 12-axis profile):**

| Axis | Question | Why it matters for coaching |
|---|---|---|
| Religious level | "How would you describe your relationship to Yiddishkeit right now?" (chips: secular / traditional / modern-orthodox / chareidi / chassidish / baal teshuva) | Coach picks Sefaria sources or secular framing accordingly. Already in use. |
| Tone | "When you mess up, what kind of voice helps you get back up?" (gentle mentor / firm coach / drill sergeant / spiritual guide) | Drives basePreamble tone directive. |
| Motivation style | "What pulls you forward — what you'll *gain*, or what you'll *avoid losing*?" (approach / avoidance) | Coach frames the same advice differently. |
| Accountability mode | "When you fall, what do you want — solitude to process, or someone to text?" (solo / partner-pushed) | Drives whether to surface partner invite flow. |
| Life stage | "Where are you in life?" (single / dating / engaged / married-no-kids / married-with-kids) | Coach's analogies and triggers adjust (marriage-specific framing, parenting-specific guilt, etc.). |
| Primary triggers | "Which of these tend to set you off?" (multi-select from a curated list) | Pattern engine and danger detection get a seed. |
| Risk time of day | "When are you most vulnerable?" (morning / afternoon / late evening / night / overnight) | Drives danger-hour scheduling and reminder timing. |
| Recovery stage | "Where are you in this fight?" (just starting / been trying for months / been clean for a while / cycling) | Coach calibrates intensity and expectation. |
| Intensity | "How hard do you want this app to push you?" (gentle / medium / hard / unflinching) | Affects mantra harshness, post-fall protocol tone, milestone naming. |
| Learning style | "When you want to learn something deep, what works for you?" (reading / audio / video / conversation) | Drives Learn recommendations format. |
| Privacy level | "How private is this fight for you?" (locked down / partner only / open with circle) | Default community visibility, leaderboard opt-in. |
| Language | "Which feels more natural?" (English / Hebrew transliterated / mixed) | Mantra defaults, Sefaria citations. |

Plus the **Vow / Why** capture (see 3.4 below — gets pulled into onboarding):

| Axis | Question | Why |
|---|---|---|
| Identity statement | "Finish: 'I am the kind of man who...'" (free text) | Surfaced during weakness; coach quotes back. |
| Vow rewards | Three milestone rewards (day 7, 30, 90) | Surfaced on Home approaching the milestone; coach references in danger. |
| Reasons (the "Why") | "Why does this matter to you? Three reasons." (free text, three slots) | Coach reads on every turn. Surfaced in panic / urge ≥7. |

That's ~15 question screens (some are multi-select on a single screen). Total time ~6–10 minutes for the user. Justifiable because every answer changes coach behavior or app behavior.

**Files added:**
- `src/screens/Onboarding/` directory (refactor from single file to multi-step folder)
  - `index.tsx` — orchestrator
  - `Step.tsx` — shared chrome
  - `steps/` — one file per question screen
- `src/screens/Onboarding/data.ts` — the question list, in order, with axis mappings.

#### 1.2 Onboarding UI rebuild

**Approach:**
1. Refactor `src/screens/Onboarding.tsx` into a folder with one file per step. Each step component is dumb: receives `value` and `onChange`, renders chips/text input/multi-select.
2. The orchestrator owns a single `responses` object mirroring `PersonalityProfile`. On each step's `Next`, write the response into the orchestrator state.
3. On the final step ("Commit"), atomically write all responses to the Zustand store via a new `setPersonalityProfileBulk(profile)` action — single state write, single migration, no half-filled profile.
4. Each step has a "Skip" affordance but the orchestrator counts skips. After ≥3 skips, show a soft warning: "The coach can only help with what it knows about you. Are you sure?"
5. Progress indicator at top (1 of 15, etc.).
6. Pure Moti transitions between steps (left/right slide), no flicker.

**Data model:** Zustand v9 — add `onboardingVersion: 2`. Migration: existing users with `onboardingVersion: 1` (or missing) get prompted on next launch with a "We've expanded onboarding to help the coach know you better — want to do the new questions? (5 min)" CTA. If they accept, run the new flow with their existing answers pre-filled. If they decline, mark `onboardingVersion: 2` anyway so we don't nag.

**Acceptance:**
- A brand-new user goes through 15 question screens, can skip any, and lands on Home with a fully-populated `PersonalityProfile`.
- An existing user with the old 5-step profile sees a one-time CTA to "complete onboarding" — accepting runs the new flow; declining doesn't nag again.
- The Personalization settings screen still shows all axes and is still editable; it now reads as "edit your profile" not "set it for the first time."
- The Vow screen flow is folded into onboarding — first-time users no longer hit the standalone vow screen.

**Test plan:**
- Run the full new-user onboarding on a fresh install.
- Run the "existing user" upgrade flow with a v7 store dump.
- Verify all axes feed into the basePreamble (read the constructed system prompt for a coach reply).
- Lint + typecheck.

**Ship vehicle:** OTA-shippable.

**Risk:** Form fatigue. Mitigation: every screen ≤ 2 taps to complete, all skippable, progress always visible, language is conversational (not survey-y). If user testing shows abandonment > 20%, fall back to 8-step "core" plus optional "depth" — but only after data.

---

### Phase 2 — Coach memory & notes layer

**Goal:** Implement the user's vision — the coach has a deep, transparent, editable picture of the user that grows over time. User and coach both write into it. Coach reads on every turn. No fine-tuning.

#### 2.1 Data model — `coachKnowledge`

**Approach:** Replace the current free-form `coachSummary: string` with a structured, categorized notes layer.

```ts
type CoachNoteCategory =
  | 'emotional-pattern'   // "User opens up about shame more on Sundays"
  | 'trigger'             // "Instagram reels at night = strongest risk"
  | 'what-works'          // "Cold showers reset urge within 5 minutes"
  | 'what-doesnt'         // "Shame-based framing makes the user shut down"
  | 'identity'            // "Sees himself as a father first, not a fighter"
  | 'relationship'        // "Married, wife knows in general terms, not specifics"
  | 'spiritual'           // "Resonates with Chazal more than Mussar"
  | 'physical'            // "Reports better weeks when sleeping 7+ hours"
  | 'goal'                // "Wants to be 30 days clean before second baby is born"
  | 'preference'          // "Wants shorter coach replies after 10pm"
  ;

type CoachNote = {
  id: string;             // uuid
  category: CoachNoteCategory;
  body: string;           // the note itself, ≤ 300 chars
  authoredBy: 'coach' | 'user';
  authoredAt: number;     // epoch ms
  confidence: number;     // 0–1, coach's self-rated confidence
  pinned: boolean;        // user can pin notes the coach must always weight
  archived: boolean;      // soft-delete; the coach won't read archived notes
};

type CoachKnowledge = {
  notes: CoachNote[];
  styleSignals: {
    // derived from 👍/👎 over time
    preferredTone: number;      // -1 (gentler) ... +1 (harsher) running average
    preferredLength: number;    // -1 (shorter) ... +1 (longer)
    preferredSpiritualWeight: number;  // -1 (less Torah) ... +1 (more Torah)
  };
};
```

**Files:**
- `src/store/useStore.ts` — add `coachKnowledge: CoachKnowledge`, migrations, and CRUD actions: `addCoachNote`, `updateCoachNote`, `archiveCoachNote`, `pinCoachNote`, `nudgeStyleSignal(axis, direction)`.
- `src/services/coachTools.ts` — add tool definitions the coach can call: `addNote(category, body, confidence)`, `updateNote(id, body)`, `archiveNote(id)`. These are *write* tools — they only execute after the AI emits a tool call, and they're logged for user review.
- `src/services/aiActions.ts` — `basePreamble()` now reads `coachKnowledge.notes` (filtered to non-archived, sorted by pinned-first then recency, capped at ~25 to fit context budget) and renders them into the prompt as a structured "What you know about this user" block.

**Data model:** Zustand v10. Migration: if `coachSummary` is non-empty, convert it to a single un-categorized note with `authoredBy: 'coach'` and pin it (the user can recategorize later). Then delete `coachSummary`.

#### 2.2 Feedback steering

**Approach:** Add 👍/👎 buttons to every coach reply (already partially scaffolded for mantras).
1. Each 👍/👎 nudges `styleSignals` by ±0.05 on inferred axes — e.g. a 👍 on a long, Torah-heavy reply increases preferredLength and preferredSpiritualWeight. The inference logic lives in a new helper `inferStyleAxes(message: CoachMessage): Partial<StyleSignals>`.
2. After 5 👎 in a row on the same axis (e.g. user keeps disliking long replies), the coach gets a system-level reminder injected: "User has shown a strong preference for shorter replies. Match it."
3. The system prompt translates `styleSignals` into directives: `preferredLength > 0.3` → "Tend toward longer, thorough replies"; `< -0.3` → "Keep replies brief — under 3 paragraphs."

**Files:**
- `src/components/CoachMessage.tsx` (new or existing) — add 👍/👎 affordance.
- `src/services/aiActions.ts` — translate styleSignals to prompt directives.

#### 2.3 The "Coach's Notes" screen

**Approach:** A new overlay accessible from Profile that shows all coach notes, grouped by category, with pin/edit/archive controls.
1. Top section: "What the coach has learned about you" — non-archived, sorted by pinned-first then recency.
2. Each note has: category badge, body, who wrote it (coach or you), how confident, pin/edit/archive buttons.
3. A "Add your own note" CTA at the top — user can pre-load the coach with facts.
4. An "Archived notes" expander at the bottom — reviewable but won't be read by the coach.

**Files:**
- `src/screens/CoachNotesScreen.tsx` — new file.
- `src/navigation/Navigator.tsx` — add `'coach-notes'` overlay.
- `src/screens/Profile.tsx` — add link to Coach's Notes.

#### 2.4 Coach instruction update

**Approach:** Teach the coach (via the system prompt) when to write a note:
- Pattern observation: "User mentioned for the 3rd time that Sundays are the worst — worth a note."
- Strong preference revealed: "User firmly rejected the 'fighter' framing — worth a note."
- New goal stated: "User said he wants 30 days before the baby — worth a note."

And **when not to** write a note:
- Single off-hand comment without pattern.
- Information that contradicts an existing pinned note (instead, propose an update tool call and explain to the user).

**Files:**
- `src/services/aiActions.ts` — extend `basePreamble()` with a "How and when to take notes" section.

**Acceptance:**
- After 5 coach conversations on different topics, the Coach's Notes screen shows a small, accurate set of categorized notes the coach wrote.
- The user can pin a note and see that, on the next coach turn, the response reflects the pinned info more strongly.
- The user can archive a note and see that subsequent replies stop referencing it.
- 👍/👎 feedback over 10 replies measurably shifts coach tone (verified by reading the constructed system prompt and seeing the style directives change).

**Test plan:**
- Scripted Coach session that should produce 3 specific notes; verify they appear.
- Pin / archive / edit notes; verify the next coach turn behaves accordingly.
- Inject 10 👎 on length; verify the next prompt includes a "keep replies brief" directive.
- Migration: load a v9 store with non-empty `coachSummary`; verify it's converted to a pinned note.

**Ship vehicle:** OTA-shippable. (No new native modules.)

**Risk:** This is the deepest behavioral change in the plan. The coach may write *too many* notes or noisy ones — a quality issue. Mitigation: an internal rate limit (max 3 notes per session), confidence threshold (notes < 0.5 confidence are auto-archived after 7 days unless the user pins them), and a user-facing "rate this note" review prompt after the first 10 are written.

---

### Phase 3 — Heavy UX rebuilds

These are the items the user flagged as "good idea, bad execution" or "feels hidden." Each is a larger redesign of an existing surface.

#### 3.1 Danger Mode as full-screen takeover

**Scope:** Replace the modal-pop-up Danger Mode with an immersive, full-screen flow that *does the work for the user* in the moment — breath → mantra → ritual → coach prompt → distraction.

**Files:**
- `src/screens/DangerMode/` directory:
  - `index.tsx` — root, manages the 5-step flow
  - `BreathStep.tsx` — animated breathing circle, 4-7-8 pattern, 60 seconds
  - `MantraStep.tsx` — full-screen mantra display + "I'm anchoring on this" tap
  - `RitualStep.tsx` — picks a quick ritual from the user's enabled list; "Done" advances
  - `CoachStep.tsx` — one preloaded coach prompt: "You're in the moment. Talk to me. What's pulling at you?" — coach reply optimized for ≤ 2 short paragraphs.
  - `DistractionStep.tsx` — one of: a Tehillim verse, a 60s walking-meditation script, a "name 5 things you can see / 4 you can hear" grounding exercise.
- `src/navigation/Navigator.tsx` — register `'danger-mode'` as a full-screen overlay that overlays everything including the tab bar.

**Approach:**
- The flow can be entered (a) by the user tapping a "I'm in it" button on Home, (b) automatically when urge slider hits 9+ for the first time today, (c) from the post-fall protocol's step 7 plan if a danger window approaches.
- The user can exit any time but the flow gently re-prompts: "You're not done yet. One more breath?"
- The flow is NOT a modal — it's a true overlay that hides the tab bar. Visual signal: this is its own world.
- Reuses existing components where possible (breathing already exists in PanicButton — extract the animation logic into a shared `<BreathingCircle />`).

**Data model:** Add `dangerModeSessions: { startedAt, endedAt, completedSteps, urgeAtStart, urgeAtEnd }[]` to track outcomes. Migration trivial.

**Acceptance:**
- Tapping "I'm in it" or hitting urge 9+ opens the full-screen flow.
- Each step is gracefully animated, ≤ 3 taps to advance.
- Coach reply within Danger Mode arrives in < 5 seconds (preloaded prompt, faster model selection if BYOK supports it).
- Tab bar is hidden during the flow; user has to complete or exit explicitly.
- Telemetry: % of urge-9+ events that result in a "stood" within 30 min — measurable improvement vs. baseline.

**Test plan:**
- Trigger from Home; walk through all 5 steps.
- Trigger from urge slider; verify auto-launch.
- Force-close mid-flow; verify the session is logged with the steps that completed.
- Coach step with no AI configured — verify graceful fallback (built-in Gemini key).

**Ship vehicle:** OTA-shippable.

**Risk:** Auto-triggering at urge 9+ may feel intrusive. Mitigation: a one-time onboarding prompt asking "Should Guard take over when you mark urge 9+? You can change this anytime." Default off; user opts in. Phase 1 onboarding can include this question.

---

#### 3.2 Streak / milestone hype + rank rename

**Scope:** Make milestones feel earned. Bigger celebration animations, prominent rank badge, next rank teased.

**Files:**
- `src/components/StreakRing.tsx` (existing) — add a small rank-badge crown above the number.
- `src/components/MilestoneCelebration.tsx` (new) — full-screen celebratory overlay triggered when a milestone day is hit. Big animation, sound (optional), shareable card.
- `src/constants/milestones.ts` (new or extracted from store) — the milestone ladder data and rank names.
- `src/store/useStore.ts` — `currentRank` and `nextRank` selectors; trigger celebration on first-launch-after-milestone.

**Approach:**
1. Rename ranks. The current lion-themed ladder is fine but presentation is small. Proposed (subject to user review):
   - Day 0: *Awakened* (was: implicit start)
   - Day 7: *Cub Opens His Eyes* → keep, it's good
   - Day 14: *Cub Stands* (was: ?)
   - Day 30: *Young Lion* (was: ?)
   - Day 60: *Lion of the Pride*
   - Day 90: *Lion Stands Alone*
   - Day 180: *Lion of Yehuda*
   - Day 365: *Gibor KeAri* (the app's namesake — earned the title)
2. Each rank gets a small icon (Lucide or custom SVG). Rendered as a crown above the streak ring.
3. On the morning of a milestone day, on first app open, show the celebration overlay. It's a one-time event per milestone — `milestonesShown: number[]` in the store tracks which have fired.
4. Home shows "Next rank: *Young Lion* in 5 days" below the streak ring.

**Data model:** Add `milestonesShown: number[]`. Trivial migration.

**Acceptance:**
- Streak ring shows a rank badge.
- Crossing day 7 (first time) triggers the celebration overlay.
- Below the ring: "Next rank in X days."
- The 8 rank names feel weighty and earned, not whimsical.

**Test plan:**
- Mock `currentStreak = 6`, set device clock forward to simulate day 7 — celebration fires.
- Set to day 8 — celebration does NOT re-fire (one-shot).
- Spot-check rank names with the user before shipping.

**Ship vehicle:** OTA-shippable. (Icons can be Lucide; if custom SVG, also OTA.)

**Risk:** Rank renames are subjective. Mitigation: present the proposed list to the user for sign-off before implementing.

---

#### 3.3 Rituals — auto-prompt builder, per-ritual times, daily reminders

**Scope:** Promote the rituals feature from hidden settings page to a first-class tool. Each ritual can have a time. Daily reminder notifications. First-time users get walked through creating one.

**Files:**
- `src/store/useStore.ts` — extend `Ritual` shape with `scheduledTime?: string` (HH:mm) and `notificationId?: string`. Migration is additive — existing rituals get `undefined` for both.
- `src/screens/RitualBuilder.tsx` — add a time picker per ritual; on save, schedule a notification.
- `src/screens/RitualOnboarding.tsx` (new) — a 3-step wizard ("What's one thing you do every morning that grounds you? What's one thing in the evening? What's one thing during your danger hour?") that appears the first time the user opens the rituals screen with an empty list.
- `src/services/notificationService.ts` — `scheduleRitualReminder(ritualId, time)` and `cancelRitualReminder(notificationId)`.
- `src/screens/Home.tsx` — surface "Today's rituals: 2/3 done" badge.

**Approach:**
1. Add a "Set time" affordance on each ritual row in RitualBuilder.
2. When a time is set/changed, schedule the notification and store its identifier; when cleared, cancel it.
3. On Home, show ritual progress for today (already-completed rituals based on a `ritualCompletions[]` array keyed by date).
4. RitualOnboarding launches the first time `rituals.length === 0` and the user lands on the rituals screen.

**Data model:** Adds `scheduledTime`, `notificationId` to each ritual; adds `ritualCompletions: { date: string, ritualId: string }[]`. Migration: initialize to empty.

**Acceptance:**
- A new ritual can be created with a 7:00 AM time; at 7:00 the next day, a notification fires.
- Marking a ritual done on Home increments the day's count.
- A new user with no rituals lands in the onboarding wizard and ends with 2–3 rituals scheduled.

**Test plan:**
- Create rituals with various times; verify notifications fire (1-min-future test).
- Delete a ritual; verify the notification is cancelled.
- Wipe data; relaunch; verify the ritual onboarding triggers.

**Ship vehicle:** OTA-shippable.

**Risk:** Notification scheduling on iOS can be permission-blocked. Same mitigation as 0.4.

---

#### 3.4 Vow surfacing during weakness

**Scope:** Make the vow / "Why" actually do its job — show it to the user when they need it most.

**Files:**
- `src/screens/Home.tsx` — when `urgeLevel >= 7`, the daily-mantra slot is replaced with the user's identity statement and one of their three reasons (rotated daily).
- `src/screens/DangerMode/MantraStep.tsx` (from 3.1) — uses the vow text instead of the daily mantra when in Danger Mode.
- `src/components/PostFallProtocol/Step8.tsx` — already references the vow; verify it's loud and prominent, not buried.
- `src/services/aiActions.ts` — coach reads `vows`, `whyReasons`, `identityStatement` on every turn (already does; verify after Phase 2's basePreamble changes don't drop them).

**Approach:**
- When urge level hits 7 on the slider, fade in (Moti) the vow above the slider. Keep visible for 60 seconds or until urge drops below 7.
- In Danger Mode (3.1), the MantraStep displays the identity statement + a reason, not a generic mantra.
- Post-fall protocol step 8 already exists; verify it pulls from the user's stored vow.

**Data model:** Likely no change if the existing `vows` and `identityStatement` already exist. Verify during implementation.

**Acceptance:**
- Sliding urge to 7+ surfaces the vow on Home within 1 second.
- Danger Mode shows the vow's identity statement.
- After a fall, step 8 of the protocol shows the user's three "why" reasons prominently.

**Test plan:**
- Set urge to 6 — no vow. Move to 7 — vow appears.
- Walk Danger Mode — verify vow on MantraStep.
- Trigger a fall flow — verify step 8.

**Ship vehicle:** OTA-shippable.

**Risk:** Low.

---

#### 3.5 Calendar polish — solid colors + labeled top filters

**Scope:** Make the day squares pop and label the top row.

**Files:**
- `src/screens/Calendar.tsx` — change opacity values to 100% (or near, e.g. 90%), add labels to top chip row.

**Approach:**
1. Day cells: win = `rgba(30,138,74,1.0)`, fall = `rgba(192,57,43,1.0)`, medium = `rgba(232,160,32,1.0)`, close-call = `rgba(232,160,32,0.6)` (the close-call stays slightly faded to distinguish from medium).
2. Empty cells: use a darker shade (`theme.surface`) so the calendar grid is structured.
3. Top filters: add a single-line label above each chip ("All / Wins / Falls / Close calls" or whatever they currently are).

**Acceptance:**
- Calendar reads as bold solid blocks at a glance.
- Top filter chips are labeled.

**Test plan:** Eyeball.

**Ship vehicle:** OTA-shippable.

**Risk:** None.

---

#### 3.6 About Me / Settings split

**Scope:** Restructure the Profile screen — separate technical settings from identity/personalization.

**Files:**
- `src/screens/Profile.tsx` — restructure into two clearly distinct sections: "About You" (identity, vow, why, personalization, coach's notes) and "Settings" (theme — gone after 0.1, AI config, reminders, data export, privacy).

**Approach:** Pure UI restructure. No data model change. Group the existing 17 overlays under one of the two headings; add visual separation (section headers, slightly different background tint).

**Acceptance:**
- Profile reads as two distinct zones: identity vs. technical.
- All existing links remain accessible.

**Test plan:** Eyeball + click every link.

**Ship vehicle:** OTA-shippable.

**Risk:** None.

---

### Phase 4 — Content & strategy

#### 4.1 Mantra library expansion

**Scope:** Ship a pre-vetted library of mantras (Chazal, Mussar, Rambam, secular philosophy/recovery) with categorization by religious level. Not AI-generated — hand-curated from real sources.

**Files:**
- `src/constants/mantraLibrary.ts` (new) — typed array of `{ text, source, religiousLevels, intensity, language }`.
- `src/store/useStore.ts` — on first launch (or migration), seed the user's mantras with 8–12 picks from the library matching their religious level and intensity.
- `src/screens/MantraBuilder.tsx` — "Add from library" button opens a browser of the library, filtered by user's profile.

**Approach:**
1. Build the library manually. Target ~50 mantras at launch. Each entry includes a real source citation (e.g. Pirkei Avot 4:1, Rambam Hilchot De'ot, etc.). Secular entries cite the source (Marcus Aurelius, Frankl, etc.).
2. Seed the user's pool on next launch with a curated subset based on profile. Existing user-entered mantras are kept.
3. The library browser is filterable by category and source.

**Data model:** No persist change to the library itself (it's a static constant). The user's mantras list grows on seed.

**Acceptance:**
- A new user lands with 8–12 mantras pre-seeded matching their profile.
- The library browser surfaces 50+ vetted mantras.
- Each mantra has a real source citation.

**Test plan:** Manual review of the library with the user. Verify seeding logic.

**Ship vehicle:** OTA-shippable (pure data).

**Risk:** Source vetting requires care — this is user-facing religious content. Mitigation: user reviews the library before it ships.

---

#### 4.2 Ritual library + mirror rituals

**Scope:** Expand the seed ritual list beyond the current 4 (Modeh Ani, Shacharit, 10 min learning, read mantra). Add mirror rituals as a category.

**Files:**
- `src/constants/ritualLibrary.ts` (new) — typed array of suggested rituals categorized (morning, evening, danger-window, mirror, physical, spiritual).
- `src/screens/RitualBuilder.tsx` — "Browse suggestions" CTA that opens the library filtered by category.

**Approach:**
1. Curate ~20 rituals across categories. Mirror rituals get their own category with 3–5 entries (e.g. "Look yourself in the eye and say your identity statement aloud", "Look yourself in the eye and name three things you're grateful for", etc.).
2. Suggestions appear in RitualOnboarding (3.3) and in the regular builder.

**Acceptance:** Library exists, accessible, includes mirror rituals.

**Ship vehicle:** OTA-shippable.

**Risk:** Same as 4.1 — content vetting.

---

#### 4.3 Discipline section (was: "punishment")

**Scope:** New flow letting the user pre-commit to a self-imposed discipline action if they fall. Framed as taking control, never shame-based.

**Files:**
- `src/screens/DisciplineSetup.tsx` (new) — overlay where the user defines their discipline rule. Examples: "If I fall, I do 50 pushups within an hour", "If I fall, I write a 1-paragraph letter to myself", "If I fall, I lose access to [app] for 24h via Watchlist enforcement".
- `src/components/PostFallProtocol/Step7.tsx` — integrate the discipline rule into the 24-hour plan if one is set.
- `src/store/useStore.ts` — `disciplineRule: { type, body, durationHours }`.

**Approach:**
1. Setup flow asks the user to pick from 4 archetype patterns or write their own:
   - **Physical** — pushups / cold shower / run
   - **Reflective** — write a letter, talk to your coach for 30 minutes
   - **Restrictive** — lock an app, no social media for 24h
   - **Spiritual** — extra learning, extra Tehillim, charity commitment
2. After a fall, step 7 of the protocol surfaces the rule with a "Mark complete" affordance. If not completed within the duration, the coach gently follows up on the next session.
3. Tone: never punitive. Copy is "discipline restores agency" not "punishment for failing."

**Data model:** Add `disciplineRule` and `disciplineCompletions[]`. Migration: undefined.

**Acceptance:**
- A user can set a discipline rule from the Profile / new overlay.
- After a fall, step 7 surfaces the rule.
- Coach references uncompleted discipline in next session.

**Ship vehicle:** OTA-shippable.

**Risk:** Easy to slip into shame framing. Mitigation: copy review with the user before ship.

---

#### 4.4 First-run walkthrough

**Scope:** Brief in-app tour after onboarding completes, pointing out where Rituals, Watchlist, Vow, Coach, Calendar live.

**Files:**
- `src/components/Walkthrough/` directory — overlay-based spotlight tour.
- `src/store/useStore.ts` — `walkthroughCompleted: boolean`.
- `src/App.tsx` — after onboarding, if `!walkthroughCompleted`, launch the tour.

**Approach:** 5–7 stops, each with a darkened backdrop + a spotlight on a tab/affordance + a sentence of context. Skippable.

**Acceptance:** New user after onboarding sees the tour; can skip; existing users don't see it.

**Ship vehicle:** OTA-shippable.

**Risk:** Low. Build this *last* in Phase 4 so the tour points at stable surfaces.

---

#### 4.5 Pattern Insights — positive-signal intake

**Scope:** Add a daily 30-second check-in that captures positive signals (sleep, mood, ritual completion, learning done) so the pattern engine has both sides of the data.

**Files:**
- `src/screens/CheckInModal.tsx` — rebuild as a quick-tap survey (4 questions, all single-tap).
- `src/services/notificationService.ts` — the daily reminder (0.4) deep-links to this modal.
- `src/utils/patternEngine.ts` — extend to read positive signals; insights become "what makes a good day for you" not just "what risks you."
- `src/store/useStore.ts` — `dailyCheckIns: { date, sleepQuality, mood, ritualCompletion, learningDone }[]`.

**Approach:**
1. Modal: 4 single-tap questions, swipeable. ~30 seconds.
   - "How'd you sleep?" (0–4 scale icons)
   - "What's your mood right now?" (0–4)
   - "Did you do your rituals?" (yes / partial / no)
   - "Anything you learned today?" (skip / quick text)
2. Pattern engine starts surfacing positive insights: "You report better days after 7+ hours sleep" / "Your best week was when you did all your rituals."

**Acceptance:** Daily check-in fires from the morning notification; pattern insights become two-sided.

**Ship vehicle:** OTA-shippable.

**Risk:** Survey fatigue — 4 questions feels long. Mitigation: single tap per question, swipeable, ~30 seconds total. Drop questions if usage data shows abandonment.

---

#### 4.6 Learn — religious / secular toggle + surprise-me button

**Scope:** Per-session framing toggle, plus a random-pick CTA.

**Files:**
- `src/screens/LearnScreen.tsx` — toggle in the header; surprise-me button in the hero.
- `src/services/aiActions.ts` — `generateLearnRecommendations()` accepts a `frameOverride: 'religious' | 'secular' | null`.

**Approach:** Toggle is session-scoped (resets when user leaves the screen). Surprise-me picks a random recommendation respecting the current frame.

**Ship vehicle:** OTA-shippable.

**Risk:** Low.

---

### Phase 5 — Deferred / awaiting input

#### 5.1 Watchlist native app picker

**Scope:** Only if the user wants it. Significantly harder, especially iOS (Apple restricts the installed-apps API). On Android, `PackageManager.queryIntentActivities` is feasible. On iOS, only `canOpenURL` against known schemes is available — meaning we ship a curated list of known apps (Instagram, TikTok, Reddit, Twitter, YouTube, etc.) and let the user pick from it; we can't enumerate what's actually installed.

**Awaiting:** User decision on whether this is worth the cost.

**Ship vehicle:** APK build required if adding native modules. Curated-list version (no native code) is OTA-shippable.

---

#### 5.2 Community testing

**Scope:** End-to-end test of Supabase auth, partnership invites, urge alerts, leaderboard, forums.

**Awaiting:** Test partner; physical session to walk it through.

---

#### 5.3 Coach prompt tuning pass

**Scope:** Concrete few-shot examples added to `basePreamble()` to lock in coach voice.

**Awaiting:** User-provided "bad reply / good reply" pairs.

---

#### 5.4 Brand pivot (forged-steel / aggressive aesthetic)

**Scope:** Typography, accent saturation, possibly a different gold/red. Layers *on top of* the dark palette — no light-theme reintroduction.

**Awaiting:** User decision on appetite + visual direction. Could be a small typography pass or a full visual refresh.

---

## 4. Cross-cutting concerns

### 4.1 Zustand persist migration plan

Multiple phases bump the schema. To keep migrations clean:

| Version | Phase | Changes |
|---|---|---|
| v7 (current) | — | baseline |
| v8 | 0.1, 0.5 | Drop `themePreference`; add `mantraRotationSeed`, `lastMantraRotationDayIndex` |
| v9 | 1.2 | Add `onboardingVersion`; existing users get the upgrade CTA |
| v10 | 2.1 | Convert `coachSummary` to a pinned note in `coachKnowledge.notes`; add `coachKnowledge` and `styleSignals` |
| v11 | 3.1, 3.3, 4.3, 4.5 | Add `dangerModeSessions`, ritual time fields, `disciplineRule`, `dailyCheckIns` |

Each migration is additive where possible. Test each migration by saving a v(N-1) AsyncStorage dump from a real install and loading it under the new code.

### 4.2 Theme cleanup — concrete grep targets

For 0.1, the surface area is roughly:
- `useColorScheme` — every call site
- `rgba(255,255,255` and `rgba(255, 255, 255` — every literal
- `#F0F2FF`, `#FFFBF0`, `#F7F1E5`, `#C89A3C` — every literal
- `themePreference` — every reference (store, settings UI, any conditional)
- `LIGHT` exported from theme.ts — every import
- `tailwind.config.js` color map for light values

Make a checklist; tick each one off.

### 4.3 Notification scheduling — single source of truth

The current code has multiple ad-hoc scheduling functions (`scheduleDailyReminder`, `scheduleUrgeAlert`, plus per-ritual schedules from 3.3). Consolidate into `bootstrapNotifications(state)` (added in 0.4) which is the single function called on:
- App boot
- Any settings change that affects scheduling
- Any ritual time change
- Any reminder time change

Inside, it cancels all guard-app-scheduled notifications and re-schedules from current state. Idempotent, easy to reason about, no orphaned notifications.

### 4.4 OTA vs. APK build matrix

Most of this plan is OTA-shippable. The only items that require an APK build:
- Watchlist native app picker (5.1) — only if the user wants the native version.
- Brand pivot (5.4) — only if the new direction needs icon/splash changes.

Everything in Phases 0–4 ships via `eas update --branch preview`.

### 4.5 Testing strategy

- **Unit tests (Jest):** Streak math (0.3), localDaysBetween, mantra rotation determinism, migration functions.
- **Manual smoke tests:** End-of-phase checklist walking every modified screen.
- **Real-device test before each OTA push:** Build an APK locally, install, walk through the changed flows.
- **Migration tests:** Save a real AsyncStorage dump at each schema version; load under each subsequent migration.

### 4.6 Coordination

The user is the only person editing this codebase day-to-day. If parallel agents are ever used, follow the global Worktree Isolation and Multi-Agent Coordination rules. For now: single working tree, single agent at a time, plan-and-confirm before each phase.

---

## 5. Risk register

| Risk | Phase | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Light theme cleanup misses some hardcoded colors → visual regressions | 0.1 | Medium | Low | Grep-driven checklist; manual screen walk |
| Streak fix changes existing users' streak count → "the fix broke my streak" | 0.3 | High | Low | Toast on first launch explaining the correction |
| Notification scheduling fails silently on iOS denied permission | 0.4 | High | Medium | Permission check; soft UI prompt to re-enable |
| AI loop refactor breaks working coach flows | 0.6 | Medium | High | Feature-flag the new path for one OTA cycle |
| Deep onboarding causes high abandonment | 1.2 | Medium | High | Skip-friendly design; abandonment telemetry; fallback to 8-step "core" if needed |
| Coach writes too many/noisy notes | 2.x | Medium | Medium | Rate limit (3 per session); confidence threshold; user review prompt |
| Danger Mode auto-trigger feels intrusive | 3.1 | Medium | Medium | Opt-in via onboarding question |
| Mantra/ritual library has bad sources | 4.1, 4.2 | Low | High (religious content) | Manual review with user before ship |
| Discipline section reads as shame-based | 4.3 | Medium | High | Copy review; user veto |

---

## 6. Sequencing summary

```
Phase 0 (3 days)  ─────►  ships independently, each item
   │
   ├─► 0.1 strip light theme
   ├─► 0.2 hide panic
   ├─► 0.3 streak timezone
   ├─► 0.4 wire check-in reminder
   ├─► 0.5 mantra rotation
   └─► 0.6 AI loop fix

Phase 1 (1 week)  ─────►  deep onboarding + question justification doc
   └─► requires user sign-off on the question list before any code

Phase 2 (1–2 weeks)  ─────►  coach memory layer
   └─► best built after 0.6 (clean AI loop) and 1.2 (deep profile feeding the prompt)

Phase 3 (1–2 weeks)  ─────►  UX rebuilds
   ├─► 3.1 danger mode takeover
   ├─► 3.2 streak hype + ranks
   ├─► 3.3 rituals deep
   ├─► 3.4 vow surfacing
   ├─► 3.5 calendar polish
   └─► 3.6 about me / settings split

Phase 4 (1 week)  ─────►  content + strategy
   ├─► 4.1 mantra library
   ├─► 4.2 ritual library
   ├─► 4.3 discipline section
   ├─► 4.4 walkthrough  (do last)
   ├─► 4.5 positive-signal check-in
   └─► 4.6 learn toggle + surprise me

Phase 5  ─────►  deferred — awaiting decisions or external dependencies
```

**Total estimated effort:** 5–7 weeks of focused work for one developer. Each phase is independently shippable via OTA.

---

## 7. What I need from you before starting

For each phase, **explicit go-ahead before any code is written**. In addition:

- **Phase 0:** Confirm the proposed mantra rotation behavior (deterministic, like-weighted) is what you want. Confirm I should add a "your streak count was corrected" toast in 0.3.
- **Phase 1:** Sign off on the proposed onboarding question list in §3.1's table. Cut anything that doesn't earn its place. Add anything I missed.
- **Phase 2:** Sign off on the proposed note categories. They're the schema — adding categories later is fine, but removing them means a migration.
- **Phase 3.2:** Sign off on the proposed rank names (or propose alternatives).
- **Phase 4.1, 4.2:** Review the mantra and ritual libraries before they ship.
- **Phase 4.3:** Review discipline section copy before ship.
- **Phase 5:** Decide whether you want the native app picker and the brand pivot.
