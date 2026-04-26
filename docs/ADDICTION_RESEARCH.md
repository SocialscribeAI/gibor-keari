# Addiction Recovery — What Actually Works

A research dossier of proven methods from the addiction literature (alcohol, cigarettes, gambling, porn, compulsive behaviour broadly) and how each maps onto Guard. The thesis of this app is that **no single method works for everyone** — so our job is to offer the best tools from each tradition and let the user's profile decide which to surface.

Every section ends with **"How we implement"** — concrete, file-level suggestions.

---

## 1. Allen Carr — *The Easy Way to Stop Smoking* (1985)

**Why it matters.** Carr's method has helped an estimated 50M+ people quit smoking, with published RCT data showing ~19% one-year abstinence vs ~6% for standard NHS counselling (Keogan et al., *Addiction*, 2019 — Irish smoking RCT). For a book written by a non-clinician, that's an astonishing result. No nicotine replacement, no willpower — just a cognitive reframe.

**The core move.** Dismantle the *perceived benefit* of the addiction. Carr's claim: you don't fail because you lack willpower, you fail because a part of you still believes the cigarette gives you something real (relaxation, focus, pleasure). Once you genuinely believe it gives you *nothing* — that the relief you feel is just the withdrawal from the previous one ending — the urge dissolves.

**Key mechanics:**
- **Reframe the withdrawal as the addiction, not the cure.** The "craving" you feel is the drug leaving your system, not your body needing it. Every urge is proof it's working.
- **No willpower framing.** Willpower-based methods fail because they frame quitting as sacrifice. Carr frames quitting as escape from a trap.
- **Celebrate the urges.** Each craving = your last dependency loop dying. Reframe pain → progress.
- **"Little monster" metaphor.** Externalize the urge. You are not your addiction.

### How we implement
- Add a **"Reframe" content pack** to [src/screens/Learn.tsx](src/screens/Learn.tsx) — Carr-style micro-essays (150-300 words each) that users read during urges.
- When the user logs a Close Call or hits the Panic Button, the intervention screen should include **one Carr-style reframe** selected at random from the pack: *"What you're feeling right now is the addiction dying, not you failing. It will peak in 3 minutes and pass."*
- Build the **"Little Monster" mantra variant** into [src/screens/MantraBuilder.tsx](src/screens/MantraBuilder.tsx) defaults for the `clinical` and `gentle` tones.
- **No shame framing.** Align all default copy with Carr's stance: you are not weak, you were trapped. Especially important for the `gentle` tone preset.

---

## 2. Alcoholics Anonymous — *The Big Book* (1939) & the 12-Step model

**Why it matters.** 85+ years, tens of millions of members, the single most-studied recovery framework in the world. Meta-analyses (Kelly et al., *Cochrane Review*, 2020) find AA and 12-step facilitation produce **higher continuous abstinence rates than CBT** for alcohol use disorder — the first time a peer-support model beat a clinical one in a Cochrane review.

**The core moves:**
- **Surrender / admission of powerlessness.** Step 1: you can't white-knuckle this alone.
- **Higher power.** Step 2-3: outsource the ultimate authority — God, the group, the program. For our users this maps *perfectly* to Hashem for the frum tier and to "the program itself" for secular users.
- **Moral inventory.** Step 4-5: written inventory of resentments, fears, harms done. Share with one person. This is structured journaling with a social accountability layer.
- **Daily amends + check-in.** Step 10: daily self-review. Did I act out of character today? Fix it same-day.
- **Sponsorship.** One-on-one mentorship from someone further along.
- **Meetings.** Weekly group ritual. Hearing other people's stories is the active ingredient.

### How we implement
- The **check-in system** ([src/components/CheckInModal.tsx](src/components/CheckInModal.tsx)) is already a weak Step 10. Strengthen it: "Did you act out of character today? One thing to make right tomorrow?"
- **Sponsorship = partner mode.** The existing `accountabilityMode: 'partner'` already matches the AA sponsor concept. Build out the partner screen (see [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md) §"Accountability partner") as a proper sponsor tool: daily one-line status, "call me" button, shared streak visibility.
- **"Group" mode = meetings.** Small circles (3–6) with shared anonymous board. Don't build chat — build presence. "4 of 5 members checked in today."
- **Moral inventory template** in [src/screens/Learn.tsx](src/screens/Learn.tsx) — weekly prompt (opt-in) that walks the user through a structured Step 4/10.
- **Surrender framing for the `spiritual` tone.** Default mantras and coach tone should lean into "I can't do this on my own" rather than the harsh "I am strong, I will conquer" framing. Two very different recovery psychologies, both valid, tone-gated.

---

## 3. SMART Recovery — CBT-based, secular (Ellis, 1994 onward)

**Why it matters.** Evidence-based alternative to 12-step. Built on Rational Emotive Behaviour Therapy. Best fit for users who set `tone: clinical` or `religiousLevel: secular`.

**The four pillars:**
1. **Building motivation** — Cost/benefit analysis worksheets. Write out what the addiction *costs* you and what abstinence *gives* you. Review weekly.
2. **Coping with urges** — The **DEADS** toolkit: Delay, Escape, Accept, Dispute, Substitute. Every urge is met with one of these 5 concrete moves.
3. **Managing thoughts, feelings, behaviours** — ABC model (Activating event → Beliefs → Consequences). Catch the irrational belief between the trigger and the action.
4. **Living a balanced life** — Lifestyle rebuilding. Recovery isn't the goal; a life worth protecting is the goal.

**Urge surfing (Marlatt, relapse prevention).** Core CBT move: the urge is a wave. Watch it rise, peak (always < 30 min), and fall *without acting*. Build evidence that urges pass.

### How we implement
- **Cost/Benefit exercise** in onboarding. Already TODO to expand intake — add a step where the user writes 3 costs + 3 benefits. Store in [useStore.ts](src/store/useStore.ts), surface weekly in Profile.
- **DEADS in the Panic Button flow.** Instead of one action, present the 5 as cards. User picks which one feels right *right now*. Teaches the taxonomy over time.
- **ABC journal template** in [src/screens/Coach.tsx](src/screens/Coach.tsx) — a structured prompt: "What happened? What did you tell yourself? What did you do?" This is better starter content than blank-box journaling.
- **Urge-surfing timer.** Expand [src/components/EmergencyCountdown.tsx](src/components/EmergencyCountdown.tsx) with optional "Watch the wave" mode — 5 min countdown with calming visuals, periodic text: "Peaking now. It will fall. Don't act."
- Tag all SMART-derived content `tone: clinical` by default.

---

## 4. *Atomic Habits* — James Clear (2018)

**Why it matters.** Not an addiction book per se, but the modern canonical text on behaviour change. Millions of copies, extremely well-synthesized from the academic habit-formation literature (Duhigg, Wood, Lally).

**Key mechanics we can use:**
- **Make it invisible** (cue removal). Porn recovery maps directly: block, filter, remove triggers from the environment. Already matches our [RiskyAppsSettings.tsx](src/screens/RiskyAppsSettings.tsx) + lights-out.
- **Make it hard** (friction). Increase the number of steps between urge and action.
- **Make it unsatisfying** (immediate cost). Accountability partner = immediate social cost. Punishment mode = immediate app cost.
- **Make the *good* habit obvious, easy, attractive, satisfying.** Mirror image for rituals.
- **Habit stacking.** "After [existing habit], I will [new habit]." E.g. "After I brush my teeth at night, I will text my partner my check-in."
- **Identity-based change.** Not "I want to quit porn" but "I am a man who doesn't consume porn." Every clean day is a *vote* for that identity. This is why streaks work — they're not just counting, they're accumulating evidence for a new self-concept.
- **Never miss twice.** One slip doesn't kill a habit; two slips in a row redefine the habit. Recovery allows for falls but insists on immediate re-engagement.

### How we implement
- **Identity mantras.** The existing mantra "I am who I choose to be" is already identity-based. Expand the defaults library with tone-variants: *"I am a man of my word"* (harsh), *"I am becoming the husband my future wife deserves"* (gentle), *"Ani ovde Hashem"* (spiritual).
- **Habit stacking in [src/screens/RitualBuilder.tsx](src/screens/RitualBuilder.tsx).** Let users anchor each ritual to an existing daily event: "After wake → Modeh Ani → cold shower → mantra". Visualize the chain.
- **"Never miss twice" rule in the post-fall flow.** The LogFall protocol (see [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md) §14) should end with: *"The fall is done. The only thing that matters now is tomorrow. One miss is a moment; two is a pattern. What's your plan for the next 24 hours?"*
- **Friction for risky apps.** Go beyond "quiet hours." Offer: delay timer before the app opens, mandatory mantra recitation before it opens, partner notification on open. Graduated friction = graduated willpower support.

---

## 5. *The Power of Habit* — Charles Duhigg (2012)

**Why it matters.** Popularized the **cue → routine → reward** loop, which is the best-known lay framework for understanding compulsive behaviour. Pre-Atomic-Habits canon.

**The key insight for our use case:** you can't *eliminate* a habit loop — the cue (stress, loneliness, boredom, late night) will keep firing for the rest of the user's life. What you can change is the **routine**. Keep the cue, keep the reward, swap the middle.

The therapeutic question: *what reward is the user actually getting?* It's almost never sexual. It's usually:
- Escape from stress
- Escape from loneliness
- Relief from boredom
- A dopamine hit to avoid a painful feeling
- Self-soothing after rejection / failure

If the reward is *loneliness relief*, prescribing "10 pushups" is absurd. Prescribe "call your friend." Match the replacement routine to the actual reward.

### How we implement
- **Trigger tagging in [src/components/LogFallModal.tsx](src/components/LogFallModal.tsx).** Already TODO to expand. Categories should map to rewards, not just stimuli: *Stressed · Lonely · Bored · Rejected · Tired · Aroused · Curious · Numb*.
- **Reward-matched tactics.** In [src/screens/Learn.tsx](src/screens/Learn.tsx), tag each tactic with what reward it substitutes for. When a user logs "lonely" as the trigger, surface social tactics first. When they log "bored," surface engagement tactics. This is the hidden secret — the toolkit isn't generic, it's reward-matched.
- **[src/utils/patternEngine.ts](src/utils/patternEngine.ts) is the right place for this.** The file already exists. It should learn from `calendarLog` + trigger tags which cue-reward pairs the user struggles with most, and nudge accordingly: "You've fallen 4 Tuesdays in a row. What's going on Tuesdays?"

---

## 6. *Your Brain on Porn* — Gary Wilson (2014) & the NoFap / reboot canon

**Why it matters.** This is the body of literature closest to our exact use case. Critique: much of it is pop-neuroscience and some claims (dopamine receptor downregulation specifics) are contested. But the lived wisdom from the NoFap community — millions of posts over 10+ years — has surfaced patterns worth respecting.

**Useful mechanics:**
- **The 90-day reboot.** Neural recovery windows are roughly 30 / 60 / 90 days. Our milestones already match this. Good.
- **Chaser effect.** The 2-5 days after a fall have elevated relapse risk. App should *know* this and respond — extra check-ins, pre-committed panic button visibility, don't lift punishment mode early.
- **HALT.** Never let yourself get Hungry, Angry, Lonely, Tired. Any of the four = urge amplifier. Precursor check.
- **Flatline.** Weeks 2-6 often feel *worse* than week 1. Libido crashes, motivation crashes, user thinks "this isn't working." Prepare the user for this in advance — it's the single biggest reason guys quit the reboot.
- **Accountability partner / community.** NoFap subreddit's most-cited success factor is not willpower, it's the community check-in.

### How we implement
- **Chaser-effect awareness in [src/utils/patternEngine.ts](src/utils/patternEngine.ts).** For 5 days after a logged fall, escalate: more reminders, Panic Button pinned to Home, partner auto-notified of high-risk window (opt-in).
- **HALT check in the daily check-in.** Four quick toggles before submission. If 2+ are flagged, suggest a tactic *before* the urge arrives.
- **Flatline education in [src/screens/Learn.tsx](src/screens/Learn.tsx).** A dedicated "What to expect in week 3" article. Pre-warned users don't panic.
- **Milestones already align with reboot windows.** Keep 7/14/30/60/90. Consider removing 180/365 from the "reboot" framing and repositioning them as "life milestones" — different psychology.

---

## 7. Torah / Jewish sources (for `religiousLevel: traditional` / `modern-orthodox` / `chareidi`)

Guard has a Jewish heritage built into its defaults (Modeh Ani, Shacharit, Shmirat Einayim). The user feedback is clear that this is a core differentiator — but the content must be **vetted by someone frum**, not LLM-generated.

**Canonical sources worth pulling from:**
- **Mesillat Yesharim** (R' Moshe Chaim Luzzatto) — the chapter on *Zehirut* (watchfulness) is the tightest Mussar framework for avoiding compulsive behaviour. Pre-Carr, pre-CBT, same principles.
- **Shaar HaBitachon** (Chovot HaLevavot) — the trust-in-Hashem framework. Maps onto the AA "higher power" step for a Torah audience.
- **Rambam — Hilchot De'ot** — the middle path. Character change through deliberate repeated action. Pre-Atomic-Habits.
- **Chofetz Chaim** — Shmirat HaEinayim sources and tefillos.
- **Rav Twerski** — z"l was a frum psychiatrist who wrote extensively on addiction and 12-step integration. Any book of his is fair game. He's the single best bridge between AA and Torah.
- **The Garden of Peace** (Shalom Arush) — controversial but widely read, the "personal prayer" technique has helped many.
- **Pirkei Avot** — *"Who is strong? He who conquers his yetzer."* Classic source text.

### How we implement
- **Vet the existing SEGULOT in [src/screens/Learn.tsx](src/screens/Learn.tsx)** with a rav before beta. Current list (Shema, Tehillim 51, Shmirat Einayim, Tzedakah) is reasonable but should have sources attached.
- **Rav Twerski content pack.** If rights permit, short excerpts from his books with attribution. If not, summaries with citation.
- **Mesillat Yesharim daily micro-learning.** 5 min/day for 30 days = one full cycle of the early chapters. Ship as an optional "Learn with the streak" track.
- **Segregation is critical.** A secular user should *never* see Torah content. A chareidi user should see Torah content prioritized. The existing `personalityProfile.religiousLevel` gate is the right mechanism — make sure every piece of content has the tag.

---

## 8. Cross-cutting findings — what every proven program has in common

Across all 7 sources above, five mechanisms show up everywhere:

1. **Daily ritual / daily check-in.** Every successful program has a daily touchpoint. Ours does. Keep protecting it.
2. **Social accountability.** No method works as well alone. AA meetings, NoFap partners, SMART groups, AC's smoker's club, Twerski's community focus. **This is our biggest gap** (see [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md) §"Accountability partner").
3. **Identity reframe.** "I am a non-smoker" (Carr), "I am an alcoholic in recovery" (AA), "I am someone who doesn't miss twice" (Clear). The user must adopt a new self-concept. Mantras are the vehicle; make them count.
4. **Post-fall protocol.** The difference between successful programs and unsuccessful ones is often just what happens *after* a slip. AA: go to a meeting same day. Carr: understand the mechanism that tricked you. Clear: never miss twice. **We must build this.** Currently the LogFall modal is a dead-end form.
5. **Pre-commitment.** Agreements made in a clear-headed moment that bind the user in a weak moment. Vows, punishment mode, risky-app windows, partner notifications — all pre-commitment. We already do this well; expand it.

---

## 9. Prioritized implementation shortlist

Given our beta timeline, the highest-leverage content additions:

| Priority | What | From | Effort |
|----------|------|------|--------|
| P0 | Vet all Learn.tsx tactics + add sources/citations | All | Medium — mostly content work |
| P0 | Reward-matched trigger tagging in LogFallModal | Duhigg | Low — data model change + UI |
| P0 | Post-fall protocol (next-24h plan) | Clear, Carr | Low — new screen, existing data |
| P1 | Carr-style reframe pack (30 entries, tone-tagged) | Carr | Medium — writing |
| P1 | HALT check in daily check-in | Reboot canon | Low |
| P1 | Habit stacking in RitualBuilder | Clear | Low — UI change |
| P1 | Partner mode screens | AA | High — but critical for beta feedback |
| P2 | Chaser-effect logic in patternEngine | Reboot | Medium |
| P2 | Flatline / week-3 education article | Reboot | Low — writing |
| P2 | DEADS cards in Panic Button flow | SMART | Medium |
| P2 | Torah content vetted by rav | Torah sources | High — requires external review |
| P3 | Mesillat Yesharim daily track | Torah | High — long-form content |
| P3 | Cost/benefit onboarding step | SMART | Low |

---

## References / further reading

- Carr, A. (1985). *The Easy Way to Stop Smoking.*
- Keogan, S. et al. (2019). "Allen Carr's Easy Way to Stop Smoking — a randomised clinical trial." *Addiction*, 114(7).
- Alcoholics Anonymous World Services. (1939, 4th ed. 2001). *The Big Book.*
- Kelly, J.F. et al. (2020). "Alcoholics Anonymous and other 12-step programs for alcohol use disorder." *Cochrane Database of Systematic Reviews*.
- Ellis, A. & Velten, E. (1992). *When AA Doesn't Work for You* (SMART Recovery foundations).
- Marlatt, G.A. & Donovan, D.M. (2005). *Relapse Prevention, 2nd ed.*
- Clear, J. (2018). *Atomic Habits.*
- Duhigg, C. (2012). *The Power of Habit.*
- Wilson, G. (2014). *Your Brain on Porn.*
- Twerski, A. (various). *Addictive Thinking*, *Self-Improvement? I'm Jewish!*, etc.
- Luzzatto, M.C. *Mesillat Yesharim.*
- Ibn Paquda, B. *Chovot HaLevavot — Shaar HaBitachon.*
