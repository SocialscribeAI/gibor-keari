# Onboarding Question Justification

**Phase 1.1 — every question must earn its place.**

If the "How the coach behaves differently" column is empty or weak, the question is cut. Every answer must materially change at least one of: coach voice, coach content selection, danger-detection thresholds, pattern-engine inputs, default reminders, fallback tactics, or surfacing of the user's own vow/why.

Status: **Proposed.** Mark each row OK / Cut / Modify and tell me what to change.

---

## Personality profile — 12 axes

| # | Axis | Question | Coach behavior change |
|---|---|---|---|
| 1 | `religiousLevel` | "How would you describe your relationship to Yiddishkeit right now?" | Drives Sefaria source selection (secular gets no Chazal citations, chassidish gets Chassidus); changes mantra defaults (English vs. Hebrew/Aramaic); religion directive in basePreamble. **Already collected — keep.** |
| 2 | `tone` | "When you're struggling, what voice helps you get back up?" | Drives the entire coach voice — gentle vs. harsh vs. spiritual vs. clinical. Single most impactful prompt input. **Already collected — keep.** |
| 3 | `motivationStyle` | "What pulls you forward more — what you'll *gain*, or what you'll *avoid losing*?" (incentive / punishment / mixed / pure-discipline) | Coach reframes the same suggestion two different ways. Approach-motivated user hears "imagine the version of you who's done this for 90 days"; avoidance-motivated user hears "remember what falling cost you last time." Drives the discipline section (Phase 4.3) framing. |
| 4 | `accountabilityMode` | "When you fall, what do you want — solitude to process, or someone to text?" (solo / partner / group / anonymous-community / sponsor) | Drives whether the post-fall protocol auto-suggests "ping partner" or stays solo. Drives whether the community partnership invite is surfaced on Day 7. |
| 5 | `lifeStage` | "Where are you in life?" (single / dating / engaged / married / married-kids / divorced / widowed) | Coach analogies and triggers shift (marriage-specific framing, parenting guilt, single loneliness). Watchlist defaults differ (married has different risk surfaces than single). |
| 6 | `primaryTriggers` (multi-select) | "Which of these tend to set you off?" (stress / loneliness / boredom / fatigue / visual / late-night / rejection / success / travel / conflict) | Pattern engine gets a seed before any data exists. Danger-detection thresholds adjust (a user who flags late-night gets earlier evening reminders). Coach first-message after a fall references their own stated triggers. |
| 7 | `riskTimeOfDay` | "When are you most vulnerable?" (morning / midday / evening / late-night) | Drives `dangerHour` default and the danger-window pattern detection. Without this we have to wait for the pattern engine to discover it from ~30 days of data. |
| 8 | `recoveryStage` | "Where are you in this fight?" (day-one / restarting / maintenance / helping-friend / severe-relapse-rebuild) | Coach calibrates intensity and expectation. A day-one user gets more hand-holding; a maintenance user gets more challenge. Different ranks shown on the streak ring. Different first-week protocol. |
| 9 | `intensity` | "How hard do you want this app to push you?" (gentle / standard / hardcore / monk-mode) | Mantra harshness, post-fall protocol depth, milestone naming weight. The same coach with the same tone changes its bite by 30% across this dial. |
| 10 | `learningStyle` | "When you want to learn something deep, what works for you?" (read / listen / watch / do / talk) | Learn recommendations filter by format. A "do" user gets practical exercises; a "read" user gets text+sources; a "watch" user gets shiur/video suggestions. |
| 11 | `privacyLevel` | "How private is this fight for you?" (fully-private / partner-aggregate / partner-detailed / anonymous-group / opt-in-leaderboard) | Default visibility for partner/community features. Determines whether leaderboard opt-in is shown by default. |
| 12 | `language` | "Which feels more natural?" (English / Hebrew / Yiddish / Spanish / French) | Mantra defaults, Sefaria citation language, fallback strings. |

---

## Identity + Vow capture (was its own screen, now folded into onboarding)

| # | Axis | Question | Coach behavior change |
|---|---|---|---|
| 13 | `identityStatement` | "Finish: *I am the kind of man who...*" (free text) | Surfaced on Home when urge ≥7 (Phase 3.4). Coach quotes back in danger moments. The single highest-leverage line in the whole app — if we capture nothing else, capture this. |
| 14 | `whyReasons` (3 slots) | "Why does this matter to you? Three reasons." (free text × 3) | Coach reads on every turn. Surfaced in panic / urge ≥7 / post-fall protocol. Without this the coach is generic; with it the coach can quote back the user's own words at the exact moment they're forgetting them. |
| 15 | `vows` (3 milestone rewards) | "Pick rewards you'll claim at day 7, 30, and 90." | Surfaced on Home as the next milestone approaches. Shifts streak from abstract count to a concrete prize. **Already collected on VowScreen post-onboarding — moving into onboarding so it's universal, not buried.** |

---

## Defaults & soft-skip behavior

- Every question has a **Skip** affordance.
- After ≥3 skips: soft warning *"The coach can only help with what it knows. Are you sure?"*
- Skip writes `null` for that axis. Coach gracefully degrades — if `motivationStyle` is null, no reframing is applied. No code path crashes on null.

---

## What is *not* asked

- **Age / date of birth** — coach behavior doesn't change meaningfully off this. If life stage is captured (axis 5), age is redundant.
- **Specific religion details** beyond religious level — Chabad vs. Litvish vs. Modern Yeshivish differences are sub-noise inside `religiousLevel`. Captured ambiently if it ever matters.
- **Family structure beyond married/kids** — number of children, gender of spouse, etc. Doesn't change coach output.
- **Income / education / occupation** — none of these change coach behavior. Cut.
- **Past addiction history detail** — covered by `recoveryStage`. Detailed history can come ambiently from the coach over time.
- **Religion of partner / spouse** — out of scope, doesn't change coach output to this user.

If you (the user reviewing this doc) want any of these added, tell me what coach behavior they'd change.

---

## Total time estimate

15 screens × ~30 seconds each (1–2 taps on most, free-text on 3) = **~7–8 minutes** for a thorough user, less if they skip.

The user's instruction was *"ask a lot of questions at the beginning"* with *"each question necessary to really help overcome the urge."* 15 questions across 7–8 minutes is the most that can pass the necessity filter.

---

## Sign-off

Reply with:
- **"All approved"** to ship as-is.
- **"Cut X, Y"** to remove specific items.
- **"Modify X: ..."** to adjust wording or options.
- **"Add: ..."** with the new axis and the coach-behavior justification.
