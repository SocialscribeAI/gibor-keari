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

## 7. Torah / Jewish sources — psychological depth from the Charedi tradition

The Charedi corpus is the only continuous body of literature that has treated this specific compulsion as a primary spiritual battle for thousands of years. The frameworks below are not "religious window dressing" on top of secular CBT — they are independently-derived psychological technologies that often *anticipate* modern interventions by centuries (the Ramchal's stage-model precedes Prochaska by 250 years; the Rambam's behavioral framework precedes James Clear by 850 years; Rebbe Nachman's Tikkun HaKlali is a structured post-relapse protocol from 1808). For a user at `religiousLevel: traditional` / `modern-orthodox` / `chareidi`, these sources carry an authority and density that no secular framework can match — *and* they double as clinical-grade cognitive technology.

**Two non-negotiable rules for this section.** (1) **Every piece of user-facing content derived from these sources must be vetted by a qualified rav before shipping** — never LLM-generated. (2) **Strict segregation by `personalityProfile.religiousLevel`** — a secular user should never be served Torah content, and a chareidi user should see it prioritized over the secular frameworks above. The map below is a research map for the team, not user-facing copy.

### 7.1 Mesillat Yesharim — Ramchal (R' Moshe Chaim Luzzatto, 1740)

**Why it matters.** A graduated stage-model of self-mastery written 250 years before the Stages of Change literature, structured as a ladder: Zehirut → Zerizut → Nekiyut → Perishut → Taharah → Chassidut → Anavah → Yiras Chet → Kedushah. The book is required learning in virtually every chareidi yeshiva and is THE canonical Mussar work on the architecture of behavior change. For shmiras habris specifically, Chapters 11 (Nekiyut) and 13–14 (Perishut) are the precision instruments.

**The core move.** Recovery is sequential, not heroic. You do not will your way to Kedushah; you climb to it, one rung at a time. The Ramchal's diagnosis: almost every recovery attempt fails because the user is aiming at Stage 6–7 (Chassidut, holiness) when he hasn't built Stage 1–2 (basic watchfulness and prompt action). Aspirational over-reach is the single biggest predictor of collapse.

**Key mechanics:**
- **Zehirut (Watchfulness).** The cognitive monitoring stage. Before behavior change, attention; before attention, the disposition to attend. Practical form: a daily five-minute Cheshbon HaNefesh — what did I do today, with what motivation. Modern parallel: metacognitive therapy (Wells).
- **Zerizut (Promptness).** Acting on the right impulse before the yetzer hara files its appeal. Carr's "willpower-as-sacrifice" reframe applied 245 years earlier — when the soul sees clearly, action is fast and weightless.
- **Nekiyut (Cleanliness).** Chapter 11. The Ramchal catalogs rationalization patterns ("just this once," "I deserve it," "no one will know," "this is harmless," "I'm tired") that map almost line-for-line onto the cognitive distortions in modern CBT. Reading Nekiyut alongside Beck's distortion list is uncanny.
- **Perishut (Separation).** Voluntary abstention from the technically permitted. Not just blocking porn but removing borderline content — even kosher content that primes the mind. This is the rung most users skip; it's why they relapse.
- **The Beraita of R' Pinchas ben Yair.** The whole book unpacks one Talmudic source. The Ramchal's claim: this is the only psychology of teshuvah you need.

**How we implement:**
- **Stage-graded onboarding.** [src/screens/Onboarding.tsx](src/screens/Onboarding.tsx) currently treats all users as starting at the same point. Add a brief assessment that places the user on Stages 1–7 — most starting at Zehirut. Surface tactics calibrated to their stage. Don't ask a man not yet at Nekiyut to attempt Perishut; don't show Kedushah content to someone still building Zehirut.
- **Daily Cheshbon HaNefesh template** in [src/screens/Coach.tsx](src/screens/Coach.tsx). Three lines: *What did I notice in myself today? What rationalization did I almost believe? What's tomorrow's one stage-up move?* This is structured Zehirut.
- **Rationalization library.** Build a "voice of the yetzer" pack drawn from Chapter 11, surfaced when [src/utils/patternEngine.ts](src/utils/patternEngine.ts) detects high-risk windows: *"You're about to tell yourself you 'need this to relax.' Watch for it."* Pre-emptive cognitive defusion.
- **Tag tactics by stage** in [src/screens/Learn.tsx](src/screens/Learn.tsx). A user on Zehirut gets attention tactics; a user on Perishut gets environmental restructuring; a user on Kedushah gets contemplative practice.

---

### 7.2 Tanya — Baal HaTanya (R' Schneur Zalman of Liadi, 1796)

**Why it matters.** The foundational text of Chabad chassidus and the most psychologically rigorous treatment of the inner war between the two souls (Nefesh HaElokis vs Nefesh HaBahamis) in the entire Jewish canon. For a man trapped in compulsive behavior, Tanya delivers what may be the single most therapeutically useful identity reframe in any tradition: **you are aiming to be a Beinoni** — not a tzaddik, not a rasha, but the realistic recovery archetype whose heart still races and whose hands stay clean.

**The core move.** Reframe the goal of recovery itself. The user's mistake: *"I have to become someone who doesn't want this."* The Baal HaTanya: *"No. You're aiming to be a Beinoni — someone who fully wants it AND simply doesn't act on it."* The Beinoni's heart is not pacified; his thoughts are not gone. He just owns Machshavah, Dibbur, Maaseh — thought, speech, action — even while his Nefesh HaBahamis is alive and roaring. This is *radically* liberating for someone who has been fighting his own desire as if its presence were already failure.

**Key mechanics:**
- **Two souls, not one self.** Modern parallel: Internal Family Systems (Schwartz), parts work, ACT's "self-as-context." The user is not the urge; there is a self that can witness the urge from outside it.
- **Hisbonenus (deep contemplative meditation).** Slow, deep cognition on a single Hashem-truth (e.g., *ein od milvado*, the soul's source, continuous re-creation of the world) until the higher self is activated and the lower soul quiets. Tanya's prescription is dosage-specific: 30–60 minutes daily, not 5.
- **Mochin d'Gadlut (expanded mind-state).** The user falls when his cognition narrows to tunnel vision on the urge. The therapeutic move is deliberate widening — pull the lens back to soul-level reality. The urge cannot survive expanded mind.
- **Iggeres HaTeshuvah.** A separate booklet inside Tanya. The Alter Rebbe's stance: teshuvah is NOT crushing yourself with guilt. **Excessive guilt is a tool of the yetzer hara** — it produces atzvus (despair), which produces the next fall. True teshuvah is brisk, surgical, immediate.
- **The yetzer's three weapons (atzvus, gaavah, taavah).** Tanya identifies them as connected: fix the depression and the lust loses its food source. This anticipates the modern observation that mood disorders and addictions are deeply comorbid.

**How we implement:**
- **Beinoni identity onboarding.** Most identity work in [src/screens/MantraBuilder.tsx](src/screens/MantraBuilder.tsx) aims at "tzaddik" identities — *"I am pure," "I am holy."* For most users this is aspirational fantasy and breaks under pressure. Add a Beinoni-tier mantra pack: *"Ich bin a beinoni — my hands, my mouth, my eyes are mine. The thoughts can come. I don't have to follow them."* This is closer to ACT than to traditional mantra work, and it survives contact with reality.
- **Hisbonenus practice in [src/screens/Coach.tsx](src/screens/Coach.tsx).** A guided 7-minute audio meditation: slow contemplation of one Tanya idea (e.g., *ein od milvado*) with prompts to feel it land. This is Mochin d'Gadlut training.
- **Atzvus → action protocol.** [src/utils/patternEngine.ts](src/utils/patternEngine.ts) should treat sustained low mood (3+ "down" check-ins) as a primary risk signal — not just cravings. Surface a "lift first, fight second" tactic pack: simchah-builders, Tehillim, calling someone.
- **Iggeres HaTeshuvah framing in [src/components/LogFallModal.tsx](src/components/LogFallModal.tsx).** Strip any guilt-amplifying language. The Tanya stance: *"Charatah is felt for one moment, sharp as a needle. Then we move. Self-flagellation is the yetzer's second move — don't give it the win."*

---

### 7.3 Likutei Moharan & Tikkun HaKlali — Rebbe Nachman of Breslov (1808)

**Why it matters.** Rebbe Nachman addressed the compulsive struggles of his generation with a triad that is *exactly* what modern addiction psychology now prescribes: structured journaling/talk therapy (Hisbodedus), a defined post-fall protocol (Tikkun HaKlali), and a non-negotiable joy practice (Simchah). This is the closest thing in pre-modern literature to a complete addiction treatment program — and Rebbe Nachman is the only major chassidic master who repeatedly, openly addresses *pgam habris* by name and provides specific tools. This is why Breslov is over-represented in baal teshuva recovery work.

**The core move.** Break the despair-relapse loop at two points. (1) **Pre-empt** the loop with daily Hisbodedus — process your inner state out of the head and into language before it metastasizes. (2) **Interrupt** the loop after a fall with Tikkun HaKlali — a structured ritual that prevents shame from becoming the next fall. (3) **Maintain** with simchah — the recovered man cannot live in melancholy, because melancholy is the operating system of the yetzer hara.

**Key mechanics:**
- **Hisbodedus (התבודדות).** One hour a day, alone, talking out loud to Hashem in your own native language — not formal prayer. About anything. Modern parallel: a hybrid of Pennebaker's expressive-writing protocol, talk therapy, and mindfulness. Brings unconscious material into language, which is the first step in regulating it. The empirical literature on this technique alone is enormous.
- **Tikkun HaKlali (התיקון הכללי).** Ten specific chapters of Tehillim — **16, 32, 41, 42, 59, 77, 90, 105, 137, 150** — said with intent after a nocturnal emission or a fall. Rebbe Nachman: *"Even the worst stain can be rectified by these ten capitols."* The psychological mechanism is profound: a structured, definite, *completable* action that says *"the door back is open and short."* This is the single most powerful post-fall protocol in the Jewish canon. Compare to AA's "go to a meeting same day" — same shape, deeper texture.
- **"Mitzvah gedolah lihiyot besimchah tamid."** A great mitzvah to be in joy always. Joy is not a reward for recovery; joy is the engine of recovery. Atzvus is the fuel of every relapse loop.
- **"Ein Yiush Ba'olam Klal."** *"There is no despair in the world at all."* Posted on the wall of every Breslov beis medrash. This is the recovery slogan of Breslov — a refusal of the despair script even in the moment of greatest failure.

**How we implement:**
- **Hisbodedus mode in [src/screens/Coach.tsx](src/screens/Coach.tsx).** A dedicated screen with a 20-minute timer, no-text prompts (*"Just talk. To Hashem. About anything. He's listening."*), and an option to record audio that's stored **encrypted on-device only** — never uploaded. The recording is for the user to either re-listen or delete; this matters for honesty.
- **Tikkun HaKlali post-fall flow.** Currently the LogFall modal is a dead-end form. Replace it (for users with `religiousLevel ≥ traditional`) with a Tikkun HaKlali launcher: *"Your fall is registered. The next 20 minutes is your tikkun. Read with me."* Then auto-load the ten chapters with audio backup. Mark the tikkun complete in `calendarLog`. **This is potentially the single most differentiated post-fall protocol any recovery app could ship.**
- **Simchah builder in patternEngine.ts.** When the user logs three consecutive low-mood check-ins, surface "simchah tactics" *first* — niggun audio, gratitude prompts, dancing for 60 seconds, calling someone — *before* any urge management content. Lift the mood, then deal with the urge that hasn't yet arrived.
- **"Ein Yiush" lock-screen.** When punishment mode triggers, the lock screen shows *Ein Yiush Ba'olam Klal* in large letters. The man at his weakest moment sees the refusal of despair, not the punishment.

---

### 7.4 Shaar HaBitachon — Chovos HaLevavos (Rabbeinu Bachya ibn Paquda, ~1080)

**Why it matters.** Nine hundred years before AA's Step 3 (*"turned our will and our lives over to the care of a higher power"*), Rabbeinu Bachya wrote sixty pages on what bitachon — trust in Hashem — actually is, and how to practice it as a discipline. For our use case, this is the antidote to the white-knuckling failure mode: the man who tries to recover purely through willpower and burns out at week three.

**The core move.** Surgically separate hishtadlut (action) from outcome. You ARE responsible for the effort; you are NOT responsible for the result. This dual frame prevents two failure modes simultaneously: the lazy *"Hashem will help me"* passivity AND the burnt-out *"I have to do it all alone"* white-knuckling. Both are theological errors that produce relapse.

**Key mechanics:**
- **Bitachon ≠ emunah.** Emunah is intellectual belief. Bitachon is the lived dependence — the felt sense of being held. A user can fully believe Hashem is in charge (high emunah) and still operate as if he's alone (low bitachon). The recovery work targets bitachon specifically.
- **The seven prerequisites of bitachon (Sha'ar 1).** Trustworthiness, capability, knowledge of need, care, control, no other influences, abundance. Rabbeinu Bachya proves all seven for Hashem. Once internalized, the user's existential anxiety drops — and existential anxiety is silent fuel for compulsive behavior.
- **The principle of "lev shamaim" (the heart-toward-Heaven).** Outcomes are bracketed. The user does the work, then *releases* the result. Modern parallel: the serenity prayer + ACT's "committed action."
- **Bitachon as immunization against atzvus.** When the user truly trusts Hashem is running the recovery, the despair after a fall becomes theologically incoherent. He can grieve the act, but he cannot collapse into helplessness — because he's not the one in charge. This is psychologically protective in a way pure willpower frameworks cannot match.

**How we implement:**
- **Bitachon micro-content in [src/screens/Learn.tsx](src/screens/Learn.tsx).** A 30-day daily series of 200-word teachings drawn from Sha'ar HaBitachon, paced with the user's streak. Day 1: hishtadlut vs bitachon. Day 7: the seven prerequisites. Day 14: the Chazon Ish on bitachon. Day 30: bitachon in failure.
- **"Hand it over" button in the Panic Button flow.** For religious-level users, an additional option after DEADS: a guided 60-second tefillah of handing over the moment to Hashem — *"Ribono shel olam, this struggle is yours. My hishtadlut is to wait three minutes."* Maps cleanly onto AA Step 3 in chareidi clothing.
- **Fall-flow theology fix.** The post-fall content in [src/components/LogFallModal.tsx](src/components/LogFallModal.tsx) should affirm bitachon, not violate it. Replace any "you let yourself down" framing with *"Hashem hasn't given up on this man. The work continues."* Theologically accurate AND therapeutically optimal.

---

### 7.5 Direct Mussar texts on Shmiras HaBris — Reishis Chochma, Geder Olam, Yesod Yosef

**Why it matters.** These three texts (R' Eliyahu de Vidas, the Chofetz Chaim, R' Yosef of Posen) are the most direct, unflinching Mussar literature on this specific struggle. They predate clinical psychology entirely, but their methods include what we'd now call: aversion conditioning, future-self visualization, somatic awareness training, and explicit consequence modeling. The Chofetz Chaim's *Geder Olam* is particularly important because it elevates the daily struggle from "personal failing" to "generational call" — a reframe of high therapeutic order.

**The core move.** Make the abstract concrete. The yetzer hara's first weapon is abstraction (*"it's not a big deal, no one is hurt"*). These Mussar texts dismantle abstraction by forcing the man to *see* — visually, viscerally, specifically — what the act produces and what abstinence prevents. This is identical to modern aversion-based interventions (Marlatt's "playing the tape forward") but with infinitely more cosmic weight.

**Key mechanics:**
- **Reishis Chochma — Sha'ar HaKedushah (R' de Vidas, 16th c. Tzfat, talmid of the Ramak).** Catalogs the spiritual consequences of pgam habris with unflinching detail. The psychological mechanism is identical to Allen Carr's for cigarettes: dismantle the perceived benefit, replace with vivid perceived cost. Different vocabulary — kelipot, neshamos, malachei chabalah — but the same cognitive technology.
- **Geder Olam — Chofetz Chaim.** A small, intense booklet specifically on shmiras habris. The Chofetz Chaim's framing: this is THE struggle of the dor, the one battle the entire generation is being asked to win. Includes specific tefillos, daily reminders, and a structural understanding that converts shame into mission. *Reframing private failure as generational call is therapeutic at a level willpower-based interventions cannot reach.*
- **Yesod Yosef (R' Yosef of Posen, 17th c.).** Focused intensely on tikkun habris through Tehillim, tefillah, tzedakah, and Talmud Torah. Core message: **no fall is irreversible.**
- **The shared therapeutic move: vivid future-self.** All three move the user from present-moment urge to future-moment self. *"After this act, in 5 minutes, what will you feel? In 5 hours? In 5 years, who will you be?"* This is Hal Hershfield's 2011 future-self research — by ~600 years.

**How we implement:**
- **"Play the tape forward" cards in the Panic Button flow.** Drawn from these Mussar sources but stripped to their psychological essence: a 30-second guided visualization of the next 5 minutes / 5 hours / 5 days. Tagged appropriately by religious level — the secular version cites Hershfield/Carr; the chareidi version cites Reishis Chochma directly.
- **Generational reframe in [src/screens/MantraBuilder.tsx](src/screens/MantraBuilder.tsx).** A pack of mantras drawn from *Geder Olam*'s framing: *"This is the battle of my generation, and Hashem put me in it because I can win it."* Converts shame to mission — therapeutic for chronic-fallers.
- **Tefillos library, structured by use-case** in [src/screens/Learn.tsx](src/screens/Learn.tsx): *before sleep*, *before opening phone*, *after a fall*, *when triggered*. Sourced from these three texts plus standard Tehillim. Each entry: Hebrew + transliteration + translation + 1-line Mussar context + citation.
- **Vetting is non-negotiable.** Every entry in this category must have a citation to a printed sefer and rabbinic review before shipping. No LLM-generated content here.

---

### 7.6 Rambam — Hilchos De'os & Hilchos Issurei Biah (12th c.)

**Why it matters.** The Rambam's psychology of behavior change in *Hilchos De'os* Ch. 1–2 is operationally identical to what James Clear synthesizes in *Atomic Habits* — eight centuries earlier and with more rigor. The chapters on character (*de'os*) and the chapters on the laws of forbidden relations (*Issurei Biah*, especially Ch. 21–22) form a behavioral framework that is *halachically* grounded — and therefore non-negotiable for the chareidi user in a way that "best practices" can never be.

**The core move.** Two complementary moves that together resolve the central paradox of recovery. (1) *De'os*: **behavior shapes character** — repeated action in the desired direction creates the disposition. You do not need to feel different first. (2) *Issurei Biah* Ch. 21: when illicit thoughts arise, the prescription is **immediate cognitive replacement** — turn the mind to Torah. Don't wrestle with the thought; redirect.

**Key mechanics:**
- **The Middle Path (Hilchos De'os Ch. 1).** Most middos live on a spectrum, and virtue is the middle. For a man over-corrected into withdrawal/shame from past falls, the Rambam authorizes the corrective swing — temporarily lean further in one direction to land at center. Identical to dialectical therapy's "polarity work."
- **Behavior precedes feeling (Hilchos De'os 1:7).** *"A person should habituate himself in actions… until they become natural to him… for no man is born already wise or pious."* This is identity-based change; this is the foundation of modern habit theory; this is why streaks work — they're not just counting, they're accumulating evidence for a new self-concept. The Rambam wrote it 850 years ago.
- **Cognitive substitution (Issurei Biah 21:19).** *"When evil thoughts arise, turn one's heart to words of Torah, which are 'a graceful doe, a pleasant deer.'"* Don't suppress (Wegner's white-bear effect proves suppression backfires). Don't analyze (DBT: ruminating about the urge feeds it). **Replace.** This is the cleanest cognitive technique in the entire Mussar canon.
- **Halacha as scaffolding (Issurei Biah 21–22).** Yichud, modesty, avoidance of triggering content — for the chareidi user these are not lifestyle suggestions, they're binding law. Halacha as scaffolding produces behavior change at a rate willpower can't match, because compliance is grounded in obligation rather than motivation.

**How we implement:**
- **"Substitute, don't suppress" in the urge flow.** When the user hits the Panic Button at `religiousLevel ≥ traditional`, the first option offered should be a 90-second Torah substitution: a single mishnah, a single Tehillim chapter, a single piece of Chumash with brief insight — pre-loaded, audio-supported. This is direct application of *Issurei Biah* 21:19.
- **Streak as identity vote (Rambam framing).** The streak counter is implicitly identity-positive but unsourced. Add a Rambam-source mantra rotation: *"No person is born good. He becomes good through repeated action. Today is a vote. (Hilchos De'os 1:7)"* This grounds the streak metaphor in halachic anthropology, not pop-psychology motivation.
- **Halachic-grade gedarim in [src/screens/RiskyAppsSettings.tsx](src/screens/RiskyAppsSettings.tsx).** Frame gedarim explicitly as halachic obligation for the chareidi tier — *"Hilchos Issurei Biah requires removing oneself from triggering environments. These app limits are not preferences; they're your gedarim."* Reframing as obligation produces compliance willpower can't.

---

### 7.7 Rav Avraham J. Twerski zt"l (1930–2021)

**Why it matters.** The single most important bridge figure of the 20th century: a Bobover chasid, board-certified psychiatrist, founder of Gateway Rehabilitation Center, author of 80+ books synthesizing 12-step recovery with chareidi Mussar. He is the *only* major source who speaks with full halachic authority *and* full clinical authority on this exact struggle. **Any Guard content tagged for chareidi users should pass a "what would Rav Twerski say" filter.** No other figure in the modern era can do this work.

**The core move.** Twerski's central thesis: the addict's core wound is **low self-worth**, and every addiction is an attempt to medicate that wound. Both 12-step and Mussar address this from different angles, and they are complementary, not contradictory. He demolished the chareidi taboo against AA ("it's a Christian thing") by showing that Steps 1–3 are textually identical to the opening lines of every Mussar sefer.

**Key mechanics:**
- **"I am, I can." (Twerski's foundational concept).** Self-esteem comes not from achievement (Western model) but from being a *tzelem Elokim* (Torah model). The recovering man builds self-worth not by stringing clean days but by recognizing his ontological value. This radically reframes streaks: streaks are *evidence* of who you already are, not what makes you worthy.
- **"Addictive thinking" — the cognitive distortions of the addict.** Twerski's clinical-Mussar synthesis catalogs the lies the addict tells himself: *"I can stop whenever I want," "I deserve this," "no one will know," "this isn't really hurting anyone."* His list overlaps ~80% with the Ramchal's list in Nekiyut. He shows Western CBT and classical Mussar identifying the same cognitive enemies — they just name them differently.
- **Anavah ≠ low self-esteem.** A critical Twerski distinction. The chassidish/yeshivish culture of bittul gets misread by addicts as *"you're worthless."* Twerski: anavah is *accurate* self-estimation, **including accurate appreciation of the soul's worth**. Many frum men's "humility" is actually depression, which feeds addiction.
- **"You are not the voice in your head."** Twerski's clinical observation: the addict identifies with the urge ("I want this") when in fact the urge is the yetzer hara's voice, distinct from the man. Tanya's two-souls framework operationalized for clinical use.
- **The role of community.** Twerski was the first frum voice to insist publicly that frum men needed a "kosher AA" — SA Jewish chapters, GYE groups, partner systems. He named isolation as the largest single accelerant of frum addiction.

**How we implement:**
- **Rav Twerski content pack** as a separate, prioritized tier in [src/screens/Learn.tsx](src/screens/Learn.tsx). Short excerpts (with publisher permission) or carefully-cited summaries from *Addictive Thinking*, *Self-Improvement? I'm Jewish!*, *The Spiritual Self*, *Living Each Day*. **This is the highest-value Torah content we can ship for this exact use case.**
- **"Addictive thinking" cognitive distortion library.** Build a library of the rationalizations Twerski catalogs. When [src/utils/patternEngine.ts](src/utils/patternEngine.ts) detects high-risk windows or post-fall periods, surface one: *"Watch for the thought: 'I can stop whenever I want.' That's the disease talking, not you. — R' Twerski"*
- **Anavah-correction content for over-self-flagellating users.** Track in profile when users repeatedly write self-attacking content in journals. Surface Twerski's anavah-vs-low-self-esteem teaching: *"Anavah is knowing your true worth, not denying it. Hashem made you b'tzelem Elokim. The fall doesn't change that."*
- **Partner-mode framing.** Re-frame the partner system in Twerski's voice: *"isolation is the single largest accelerant; one trusted friend is the single largest protector."* More therapeutically accurate than the current "accountability" framing.

---

### 7.8 Alei Shur — Rav Shlomo Wolbe zt"l (1985–1988)

**Why it matters.** Rav Wolbe was the leading mashgiach of the late 20th century in the chareidi yeshivish world, trained in the Slabodka tradition (which uniquely combines Mussar with deep psychological insight). *Alei Shur* is the most comprehensive modern Mussar work and is required reading in many chareidi yeshivos. Its specific contribution to addiction psychology: the **Va'ad** structure and the discipline of **daily Cheshbon HaNefesh**.

**The core move.** Recovery is not a private war; it's a structured, observed, scheduled discipline. Rav Wolbe's claim, drawn from Slabodka observation over decades: men in isolation lose to their yetzer hara almost without exception, while men in a structured va'ad (small group of 3–5) with a defined weekly meeting and a specific avodah goal succeed at radically higher rates. Note: he and AA arrived independently at the same answer — strong convergent validity.

**Key mechanics:**
- **The Va'ad.** Small group (ideally 3–5 men) meeting weekly with a fixed Mussar text, a fixed cheshbon hanefesh check-in, and an explicit weekly avodah goal. Structure is identical to AA's small-group model and SMART Recovery's group format.
- **Daily Cheshbon HaNefesh.** Rav Wolbe required of his talmidim a five-minute end-of-day review: *what was my middah work today? Where did I fall short? What's tomorrow's specific avodah?* Without this practice, no other Mussar work holds.
- **"The Hour" (Sha'ah).** A weekly hour of dedicated Mussar work — not learning, not davening, *just* working on one self-improvement target. Modern parallel: the deliberate-practice literature (Ericsson) on skill acquisition. **Recovery is a skill; skills require deliberate practice.**
- **Slabodka principle of "gadlus ha'adam."** Greatness of man — emphasizing the soul's grandeur as the primary motivator for self-control. Not *"you're filthy, stop,"* but *"you're a king's son; this is beneath you."* Identity-based reframe at maximum strength.
- **"Avodah without simchah is futile."** Even the most rigorous yeshivish Mussar tradition agreed with Breslov: the work without joy fails.

**How we implement:**
- **"Va'ad mode" — the next stage beyond partner mode.** Currently the partner system is 1-on-1 only. Add a second tier: small circles (3–5), weekly synchronous check-in (audio or text), a shared weekly avodah pulled from a Wolbe-style Mussar curriculum. This is the AA group meeting in chareidi clothing.
- **Daily Cheshbon HaNefesh widget on the Home screen.** A 90-second end-of-day input: *Today's avodah was X. I succeeded / partially / not. Tomorrow I will Y.* Stored in `calendarLog`. patternEngine.ts learns from this stream.
- **Weekly "Sha'ah" reminder.** A scheduled weekly 60-minute slot the user blocks for dedicated Mussar / inner work. Audio-guided options: a chapter of Alei Shur, a chapter of Mesillat Yesharim, a Twerski excerpt, hisbodedus.
- **Gadlus ha'adam mantra pack.** *"Ich bin a ben melech — this is beneath me." "I am a tzelem Elokim, not what I just did."* Tagged for chareidi tier.

---

### 7.9 Bilvavi Mishkan Evneh — Rav Itamar Schwartz (contemporary)

**Why it matters.** Rav Itamar Schwartz (writing under the title *Bilvavi*) is one of the most listened-to mashpiim in the contemporary chareidi world. He is the rare voice writing *now* about *this generation's* specific struggles — phone addiction, internet exposure, pgam habris in the actual lived environment of a 2026 chareidi man, not the world of 1740 or 1985. His shiurim in *Da Es Atzmecha* and *Bilvavi Mishkan Evneh* represent the bleeding edge of charedi inner-work literature.

**The core move.** Recovery work begins inward, not outward. Bilvavi's claim: most current chareidi addiction work is too external — gedarim here, blocking there, partner there — and not enough on the *inner* work of knowing oneself (*Da Es Atzmecha* — "Know Yourself"). **The man who hasn't met himself cannot guard himself.** This is the Mussar version of IFS and parts work, written in 2010s–2020s yeshivish Hebrew.

**Key mechanics:**
- **"Da Es Atzmecha." (Know Yourself).** A multi-volume, structured curriculum on inner self-examination. Bilvavi's claim: most chareidi men have never genuinely asked who they are, what they actually want, what they're actually feeling. The yetzer hara thrives in this self-ignorance.
- **The four elements (yesodos): earth, water, wind, fire.** Bilvavi maps each man's dominant element to his specific yetzer-hara pattern. A "fire" man's lust pattern is different from a "water" man's. This is a chassidic-mussar version of personality-typed addiction treatment (matching a Type A drinker to a different protocol than a Type C). Useful as a self-categorization heuristic; frame for users as a model, not a science.
- **Inner quiet ("nikuda hapenimit").** Bilvavi's daily prescription: 30 minutes of complete external silence — no phone, no learning, no music — sitting with oneself. Modern parallel: vipassana, contemplative prayer. The claim: the fall happens in the gap between man and himself; close the gap and the fall has no room.
- **"Ein od milvado" as a behavioral practice.** Chassidic theology turned into a moment-to-moment lived discipline: every time the urge arises, the practice is to remember *there is nothing else* — what is being seen is Hashem in the form of a test, not a separate thing. Non-dualistic awareness used as relapse prevention.
- **Specifically modern.** Bilvavi explicitly addresses the smartphone, the algorithmic feed, the scroll. Most other authors on this list could not have anticipated the 2026 environment; Bilvavi is writing into it.

**How we implement:**
- **"Nikuda Penimit" silence mode in [src/screens/Coach.tsx](src/screens/Coach.tsx).** A 30-minute timer, full screen-locked (only emergency unlock), no sound, no prompts — just a static visual and the user's own presence. Logs as a Mussar session in `calendarLog`. The technological irony — using the phone to be silent — is the point.
- **Yesod self-assessment in onboarding.** Optional 12-question intake that classifies the user's dominant element (fire/water/earth/wind) and surfaces the matching tactic pack. Tag content in [src/screens/Learn.tsx](src/screens/Learn.tsx) with applicable yesodos. Frame as "Bilvavi's model — try it, see if it lands," not as scientific.
- **"Ein Od Milvado" lock-screen mantra.** When risky-app windows trigger, the lock screen shows *Ein od milvado* large. The man at his weakest moment sees the thesis statement of his own theology.
- **Da Es Atzmecha micro-curriculum.** A 30-day series in Learn.tsx adapted from Bilvavi's framework: Day 1: who are you? Day 5: what do you actually want? Day 10: what are you actually feeling right now? Stripped of jargon, deeply chareidi-vetted, paced with the streak.

---

### 7.10 Common threads across the Charedi sources

Reading these nine authors side-by-side, six mechanisms recur with striking convergence:

1. **Sequential, not heroic, recovery.** Ramchal's ladder, Rambam's middle path, Wolbe's Sha'ah — all reject the all-or-nothing willpower frame.
2. **Identity reframe over behavior suppression.** Beinoni (Tanya), tzelem Elokim (Twerski), ben melech (Wolbe), Da Es Atzmecha (Bilvavi). Every source insists the man works on *who he is* before *what he does*.
3. **Joy as engine, not reward.** Rebbe Nachman explicitly; Wolbe quoting him; Tanya through atzvus-as-yetzer's-tool. **Every Charedi source on recovery agrees: melancholy is the operating system of relapse.**
4. **Defined post-fall protocol.** Tikkun HaKlali (Breslov), Iggeres HaTeshuvah (Tanya), Yesod Yosef. The contrast with secular recovery apps is sharp — the Torah world has been writing serious post-fall protocols for centuries while modern apps treat the fall as an endpoint.
5. **Community / Va'ad as load-bearing.** Twerski, Wolbe, AA. The lone struggler loses; the man inside a structure wins. This convergence (chareidi Mussar + 12-step empirics) is too strong to ignore.
6. **Cognitive substitution over suppression.** Rambam's *Issurei Biah* 21:19; Tanya's Mochin d'Gadlut; Bilvavi's *ein od milvado*. The Mussar tradition independently arrived at what Wegner's white-bear research validated experimentally in 1987.

`★ Insight ─────────────────────────────────────`
The convergence between Charedi Mussar and modern addiction psychology is striking and load-bearing for product decisions: when a 12th-century halachic text (Rambam), an 18th-century chassidic sefer (Tanya), and a 20th-century clinical psychiatrist (Twerski) independently identify the *same* mechanism (cognitive substitution, identity-based change, post-fall ritual), that mechanism is a near-certain feature to ship. The chareidi tier of Guard isn't "religion bolted onto an addiction app" — it's psychological infrastructure with 1000+ years of convergent validation, expressed in a vocabulary the user already trusts.
`─────────────────────────────────────────────────`

---

## 8. Cross-cutting findings — what every proven program has in common

Across all sources above (secular and Torah), six mechanisms show up everywhere — and the convergence between traditions is itself the finding:

1. **Daily ritual / daily check-in.** Carr's hourly self-talk, AA's Step 10, SMART's daily journal, Wolbe's Cheshbon HaNefesh, Bilvavi's nikuda penimit. Every successful program has a daily touchpoint. Ours does. Keep protecting it.
2. **Social accountability.** AA meetings, NoFap partners, SMART groups, Twerski's "kosher AA," Wolbe's Va'ad. **This is our biggest gap** (see [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md) §"Accountability partner"). Multi-tradition convergence on this point is so strong it should override any internal debate about feature priority.
3. **Identity reframe.** *"I am a non-smoker"* (Carr), *"I am an alcoholic in recovery"* (AA), *"I am someone who doesn't miss twice"* (Clear), *"Ich bin a beinoni"* (Tanya), *"I am b'tzelem Elokim"* (Twerski), *"I am a ben melech"* (Wolbe). Every tradition insists the man adopts a new self-concept before he changes behavior.
4. **Post-fall protocol.** AA: meeting same day. Carr: understand the mechanism that tricked you. Clear: never miss twice. Breslov: Tikkun HaKlali within 24h. Tanya: brisk, surgical charatah — never collapse. **We must build this.** Currently the LogFall modal is a dead-end form. The Torah sources here are arguably stronger than the secular ones — Tikkun HaKlali in particular is the most powerful post-fall ritual available to ship.
5. **Pre-commitment.** Vows, punishment mode, risky-app windows, partner notifications, halachic gedarim. We already do this well; expand it.
6. **Cognitive substitution over suppression.** SMART's DEADS (the S = Substitute), Carr's reframe, Rambam *Issurei Biah* 21:19 ("turn one's heart to words of Torah"), Tanya's Mochin d'Gadlut, Bilvavi's *ein od milvado*. **Independently validated by Wegner's 1987 white-bear research.** Don't fight the thought — replace it.

The fact that 12th-century halacha (Rambam), 18th-century chassidus (Tanya), 20th-century AA, and 21st-century cognitive psychology converge on the same six mechanisms is the strongest possible signal that these are the load-bearing features.

---

## 9. Prioritized implementation shortlist

Given our beta timeline, the highest-leverage content additions:

| Priority | What | From | Effort |
|----------|------|------|--------|
| P0 | Vet all Learn.tsx tactics + add sources/citations | All | Medium — mostly content work |
| P0 | Reward-matched trigger tagging in LogFallModal | Duhigg | Low — data model change + UI |
| P0 | Post-fall protocol (next-24h plan) | Clear, Carr, Tanya | Low — new screen, existing data |
| P0 | **Tikkun HaKlali post-fall flow (chareidi tier)** | Breslov | Medium — content + audio + flow |
| P0 | **Beinoni-tier mantra pack** (replace tzaddik fantasy framing) | Tanya | Low — content + tag |
| P0 | **Rav Twerski content pack** (highest-leverage Torah content) | Twerski | High — needs publisher permission or careful summary |
| P1 | Carr-style reframe pack (30 entries, tone-tagged) | Carr | Medium — writing |
| P1 | HALT check in daily check-in | Reboot canon | Low |
| P1 | Habit stacking in RitualBuilder | Clear | Low — UI change |
| P1 | Partner mode screens | AA | High — but critical for beta feedback |
| P1 | **Va'ad mode (3–5 person small circles)** | Wolbe, AA | High — depends on partner-mode foundation |
| P1 | **Hisbodedus mode** (encrypted on-device only) | Breslov | Medium — privacy-critical |
| P1 | **Daily Cheshbon HaNefesh widget** on Home | Wolbe, Ramchal | Low |
| P1 | **"Substitute, don't suppress"** Torah-content option in Panic Button | Rambam (IB 21:19) | Medium — content library |
| P2 | Chaser-effect logic in patternEngine | Reboot | Medium |
| P2 | Flatline / week-3 education article | Reboot | Low — writing |
| P2 | DEADS cards in Panic Button flow | SMART | Medium |
| P2 | **Stage-graded onboarding** (Ramchal's ladder) | Ramchal | Medium — assessment + content tagging |
| P2 | **Bitachon 30-day micro-content series** | Chovos HaLevavos | Medium — content writing + rabbinic vetting |
| P2 | **"Play the tape forward" (5min/5hr/5yr) cards** | Reishis Chochma, Hershfield | Medium — content + visual |
| P2 | **"Ein Yiush" / "Ein Od Milvado" lock-screen** during punishment mode | Breslov, Bilvavi | Low — visual only |
| P2 | **Generational reframe mantra pack** (Geder Olam) | Chofetz Chaim | Low — content |
| P3 | Mesillat Yesharim daily track (30-day curriculum) | Ramchal | High — long-form content |
| P3 | Da Es Atzmecha micro-curriculum | Bilvavi | High — long-form content |
| P3 | Yesod self-assessment (4 elements typing) | Bilvavi | Medium — assessment + tactic-tagging |
| P3 | Nikuda Penimit (30-min silence mode) | Bilvavi | Low — timer + lock |
| P3 | Cost/benefit onboarding step | SMART | Low |
| P3 | Tefillos library (structured by use-case) | Multiple Mussar | Medium — content + rabbinic vetting |

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
- Twerski, A.J. (various). *Addictive Thinking*, *Self-Improvement? I'm Jewish!*, *The Spiritual Self*, *Living Each Day*.
- Luzzatto, M.C. (1740). *Mesillat Yesharim.*
- Ibn Paquda, B. (~1080). *Chovos HaLevavos — Shaar HaBitachon.*
- Schneur Zalman of Liadi (1796). *Likutei Amarim — Tanya* (incl. *Iggeres HaTeshuvah*).
- Nachman of Breslov (1808). *Likutei Moharan*; *Tikkun HaKlali*.
- de Vidas, E. (16th c.). *Reishis Chochma — Sha'ar HaKedushah.*
- Kagan, Y.M. (Chofetz Chaim). *Geder Olam.*
- Yosef of Posen (17th c.). *Yesod Yosef.*
- Maimonides, M. *Mishneh Torah — Hilchos De'os* Ch. 1–2; *Hilchos Issurei Biah* Ch. 21–22.
- Wolbe, S. (1985–88). *Alei Shur*, vols. I–II.
- Schwartz, I. (contemp.). *Bilvavi Mishkan Evneh*; *Da Es Atzmecha*.
- Wegner, D.M. (1987). "Paradoxical effects of thought suppression." *J. Personality and Social Psychology* — empirical validation of the Rambam's anti-suppression principle.
- Hershfield, H. (2011). "Future self-continuity." Empirical validation of the *Reishis Chochma* "play-the-tape-forward" mechanism.
- Pennebaker, J.W. (1997). "Writing about emotional experiences as a therapeutic process." *Psychological Science* — empirical validation of Hisbodedus.
