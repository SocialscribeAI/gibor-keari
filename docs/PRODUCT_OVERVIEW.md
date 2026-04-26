# Guard — Product Vision

> **Status.** What we have today is a **first prototype**, not the finished product. This doc describes the real vision — what Guard needs to become. Gaps are tracked in the TODO section at the bottom (§11).

---

## 0. The non-negotiables (the foundation everything sits on)

### 0.1 Privacy — nothing leaves the phone. Ever.

**Guard has no database. Guard has no servers. Guard has no accounts. Guard has no telemetry.**

Every single piece of information the user enters — their name, their streak, their falls, their triggers, their mantras, their vows, their partner's phone number, their journal entries, their AI chat history, everything — is stored **only on their device**, in local storage ([AsyncStorage](src/store/useStore.ts)). We cannot see it. We do not collect it. We cannot recover it. If you uninstall the app, it is gone forever.

This is not a marketing claim — it is an architectural fact. The app has no network code that sends user data anywhere. The only network calls that ever happen are:
- When the user opts to use an AI coach, requests go **directly from their phone to their chosen AI provider** using **their own API key** that they entered themselves. We never see the key, the prompt, or the response.
- When the user opts to share progress with a partner, that goes **phone-to-phone**, end-to-end encrypted (details in §4).

**The user must know this, loudly and repeatedly.** People will not put their deepest shame into an app they don't trust. The privacy message is the entire onboarding hook.

**[TODO]** Build this into:
- First screen of onboarding: explicit, plain-language privacy statement — *"We can't see anything you write here. It never leaves your phone. We don't have a server to send it to."*
- Dedicated **"Your Data"** page in Profile showing: what's stored, where (local only), a single "Export everything" button, a single "Delete everything forever" button.
- Every sensitive input (AI chat, journal, partner name) has an inline note: *"Saved on this phone only."*
- A signed commitment at the bottom of the About page: *"If this ever changes, the app will tell you before the change and require your re-consent. Default posture: no network transmission of user data."*

### 0.2 Fully adjustable — the user runs the app, the app doesn't run the user

No two people beat this the same way. The prototype has 4 personalization axes. **The real product has at least 12**, and every single one has a **Custom** option (§1), each feeding into which content, tactics, tone, and tempo the app offers the user.

### 0.3 Learning — the app gets better the longer the user uses it

The app should **learn the person**. The more data it accumulates locally (logs, feedback, falls, wins, check-ins, triggers, timings), the smarter its nudges get. A local pattern engine + optional AI layer turns the same events into personalized guidance. The app that knows a user fell 4 Tuesdays in a row at 11pm after opening Instagram is a fundamentally different app from the one that just has generic advice. See §5 (AI & Learning), §6 (Pattern Engine), §7 (Danger Watchlist).

---

## 1. The personalization axes (this is the product)

Every axis below has a set of presets **and** a **Custom** option where the user can define their own or write free-text. The user can change any axis at any time from Settings. The axes combine into a `PersonalityProfile` that drives content selection everywhere.

| # | Axis | Presets | Custom? | What it controls |
|---|------|---------|---------|------------------|
| 1 | **Tone** | Gentle, Harsh, Spiritual, Clinical | Yes — free-text description of the voice they want | Language of every prompt, mantra, celebration, warning |
| 2 | **Religious frame** | Secular, Traditional, Modern Orthodox, Chareidi, Christian, Muslim, Other | Yes — describe your own | Whether religious content is surfaced, which prayers appear in rituals, which sources are cited |
| 3 | **Motivation style** | Incentive-driven, Punishment-driven, Mixed, Pure-discipline | Yes | Whether the app defaults to rewards, consequences, or neutrality after events |
| 4 | **Accountability** | Solo, Partner, Group, Anonymous community, Sponsor | Yes — describe your setup | Whether partner features, group boards, and community screens are enabled |
| 5 | **Life stage** | Single, Dating, Engaged, Married, Married+kids, Divorced, Widowed | Yes | Framing of *why* this matters — e.g. "the husband your future wife deserves" vs "present with your kids" |
| 6 | **Primary trigger profile** | Stress, Loneliness, Boredom, Fatigue, Visual cues, Late-night spiral, After rejection, After success, Post-travel, Relationship conflict | Yes — multi-select + free text | Which tactics surface first during an urge; what the Panic Button defaults to; what the pattern engine watches for |
| 7 | **Risk time of day** | Morning (0-9), Midday (10-16), Evening (17-21), Late night (22-3) | Yes — pick your own hours | When daily reminders fire, when danger-hour alerts fire, when Panic Button auto-surfaces |
| 8 | **Recovery stage** | Day one, Restarting after long streak, Long-term maintenance, Helping a friend, Post-severe-relapse rebuild | Yes | Pace of content, whether to show beginner reframes or advanced work, milestone spacing |
| 9 | **Intensity / pace** | Gentle (build slowly), Standard, Hardcore (max-effort 30-day sprint), Monk mode | Yes | How aggressive rituals and restrictions default to, milestone cadence, notification frequency |
| 10 | **Learning style** | Read, Listen (audio), Watch (video), Do (exercises), Talk (AI chat) | Yes — describe | Whether Intel content is text, audio, video, or interactive by default |
| 11 | **Privacy sharing level** | Fully private, Partner-only aggregate, Partner-only detailed, Anonymous group, Opt-in leaderboard | Yes | What partner/group mode can see; what shows on any leaderboard |
| 12 | **Language** | English, Hebrew, Yiddish, Spanish, French, … | Yes | UI language and content language |

**Why the Custom option everywhere.** The only people an app can actually serve are people whose identity fits one of its presets. A 28-year-old married ba'al teshuva who was religious, then wasn't, then came back, and wants a drill-sergeant voice but only from a Torah place — he doesn't fit a preset. Custom lets him describe *exactly* what he needs, and an optional AI pass can map his description onto the underlying content tags.

**[TODO]** Full implementation checklist in §11.2.

---

## 2. Screen-by-screen — what exists, what's missing, what it should become

### 2.1 Onboarding ([src/screens/Onboarding.tsx](src/screens/Onboarding.tsx))

**Today.** A 4-step intake: welcome → tone → religious level → accountability.

**Should be.** A full **calibration + setup** flow covering all 12 axes in §1, plus privacy promise, plus initial goal-setting, plus a generated **Day 1 plan**. The user finishes onboarding with:
1. Confirmation of the **privacy promise** (§0.1) before any question is asked.
2. A full `PersonalityProfile` covering all 12 axes.
3. A written **"Why I'm doing this"** — their personal vow, in their own words. Saved as the first mantra.
4. A **personal milestone ladder** — instead of hardcoded 7/14/30/60/90, ask: *what does 30 days mean to you? 100? a year?* Let them name each milestone. These are what Home celebrates.
5. A **cost / benefit inventory** (SMART Recovery): *what does the addiction cost me? what does sobriety give me?* 3 of each, minimum. Shown weekly.
6. A **trigger map** — multi-select from the standard list + free-text. Seeds the pattern engine and pre-populates the Danger Watchlist.
7. An **initial Day 1 plan** — generated from the answers: morning ritual stack, afternoon check-in time, evening danger-hour prep, before-bed ritual. User can edit before confirming.

**Copy guidance.** Drop the military default. The prototype reads like a drill sergeant by default; that voice is available under `tone: harsh` but should not be the floor. Default voice is neutral, warm, respectful.

### 2.2 Home ([src/screens/Home.tsx](src/screens/Home.tsx))

**Today.** Streak ring, urge slider, Win/Close-Call/Fall buttons, daily mantra.

**Should be.** A daily **command center** that surfaces the single most relevant thing for *right now*:
- If it's the user's danger hour → Panic Button pinned to top, pre-loaded with their most-effective tactic based on history.
- If it's a good time → streak ring + today's ritual checklist + daily mantra.
- If they just had a fall → post-fall protocol (§2.3) front and centre, everything else hidden.
- If they've been silent for >12h → a gentle re-engagement nudge.
- A **"Today's risk forecast"** strip generated by the pattern engine (§6): *"Your Tuesday 11pm risk window is in 3h. Partner has been pinged for check-in."*

The three action buttons each need real follow-through:
- **Win** — celebratory micro-animation, streak bump, no modal interruption.
- **Close Call** — opens the full Close Call protocol (§2.14). Not a dead 2h lockout.
- **Fall** — opens the full post-fall protocol (§2.3). Not a silent decrement.

### 2.3 Post-fall protocol (currently [src/components/LogFallModal.tsx](src/components/LogFallModal.tsx))

**Today.** A modal that logs a fall. Dead-end.

**Should be — the single most important flow in the app.** Based on Charles Duhigg (cue-routine-reward), James Clear (never miss twice), Allen Carr (reframe the fall). Multi-step guided flow:

1. **Pause.** One breath. One sentence: *"This moment matters more than the fall."*
2. **Log the trigger** — multi-select + free-text:
   - Emotional: stressed / lonely / bored / rejected / tired / numb / angry / excited
   - Situational: in bed / in bathroom / traveling / alone at home / at work
   - Digital: Instagram / TikTok / YouTube / Reddit / X / Snapchat / browser / specific website / *custom*
   - Temporal: weekday / weekend / late night / morning / after work
3. **Log the precursor** — *what was missing today?* Ritual skipped / check-in missed / slept badly / no exercise / HALT flag (hungry / angry / lonely / tired).
4. **Log the emotional state** — shame slider, anger slider, numbness slider. Feeds mood tracking.
5. **AI reflection (optional)** — if configured, AI responds in the user's tone with a single-paragraph reframe. Carr-style: *"What you're feeling now is the old pattern dying. This fall is data, not defeat."*
6. **Auto-recommendation engine** — based on what was logged:
   - "Add Instagram to your Danger Watchlist" (if logged as trigger)
   - "Move lights-out to 10:30pm" (if late night)
   - "Add an evening check-in call with your partner" (if alone at home)
   - "Schedule 20 min exercise tomorrow" (if HALT flagged tired)
   - User accepts / dismisses each. Accepted ones auto-configure the relevant setting.
7. **Build the 24-hour plan.** Concrete next-step cards: Tonight · Tomorrow morning · Tomorrow danger window · Tomorrow evening. Each one action.
8. **Identity reframe.** *"One miss is a moment. Two is a pattern. What do you commit to for the next 24 hours?"* User types a single sentence. Saved as a "recovery vow," shown at the top of Home for 24h.
9. **Optional partner ping.** If accountability mode = partner, offer a one-tap *"Tell [partner] I fell"* with pre-written message the user edits.
10. **Close.** Back to Home, with punishment-mode respected according to the user's motivation-style setting.

This is the **behavioural-change flywheel**. Every fall becomes data that tightens the app's future recommendations.

### 2.4 Check-in & vow ([src/components/CheckInModal.tsx](src/components/CheckInModal.tsx), [src/screens/VowScreen.tsx](src/screens/VowScreen.tsx))

**Today.** Daily clean / struggled / fell check-in, separate check-in streak.

**Expansions:**
- **HALT check** before submission — 4 toggles (Hungry / Angry / Lonely / Tired). If 2+ flagged, recommend a tactic *before* dismissing.
- **Mood slider** 1-10. Feeds correlation engine.
- **Sleep hours** — optional. Known strong predictor of relapse.
- **Exercise yes/no** — optional. Same.
- **"What I'm proud of today"** — gratitude capture (positive-psychology evidence).
- **"What I'd do differently"** — nightly reflection (AA Step 10, Bullet Journal).
- **Missing check-in** → gentle morning prompt next day, not shame.

### 2.5 Calendar ([src/screens/Calendar.tsx](src/screens/Calendar.tsx))

**Today.** Read-only month view of wins / close calls / falls. **User feedback: "won't let me actually edit the calendar which is a real bassa."**

**Expansions:**
- **Fully editable** — tap any past day to log, edit, add notes. Critical for backfilling during onboarding.
- **Multiple layers** toggleable on the same view: falls · close calls · wins · rituals completed · mood · sleep · danger-hour alerts triggered · trigger tags.
- **Heatmap view** — year-at-a-glance, GitHub-style. Motivating.
- **Pattern overlay** — pattern engine (§6) shades dangerous weekday/hour cells red based on history.
- **Notes per day** — searchable free-text journal.
- **Export** — PDF / CSV / JSON for the user's own use. Stays on device unless they explicitly share.

### 2.6 Strategy → "Intel" library ([src/screens/Learn.tsx](src/screens/Learn.tsx))

**Today.** 8 generic tactics + 4 segulot. Placeholder copy, no sources.

**Rename** to "Intel" (Avi's feedback — drops the military framing) and **expand**:

**Structure.** Categorized: Body · Mind · Social · Spirit · Reframe · Emergency · Environment · Long-form. Each tactic has:
- title · 1-line description · why-it-works paragraph with **source citation** · time-to-execute · category tags · trigger tags (what it's good for) · tone tags · religion tags.
- Filter by user profile — a clinical user never sees segulot; a chareidi user sees them first.

**Content to add** (full list in [ADDICTION_RESEARCH.md](ADDICTION_RESEARCH.md)):
- Carr-style reframe pack (30 short reframes).
- SMART's DEADS toolkit (Delay / Escape / Accept / Dispute / Substitute cards).
- Atomic Habits identity statements + habit-stacking templates.
- Rav Twerski shorts (with attribution).
- Mesillat Yesharim daily micro-learning (frum, opt-in 30-day track).
- Audio tactics — guided breathing, Hisbonenus tracks, short meditations.
- Video tactics — short how-to clips (cold shower form, 4-7-8 breathing).

**Vetting requirement — every tactic ships with a source.** No LLM filler. Each has an attribution line: book, study, or clinician.

### 2.7 Rituals ([src/screens/RitualBuilder.tsx](src/screens/RitualBuilder.tsx))

**Today.** Toggle-able list; ritual streak.

**Expansions:**
- **Habit stacking** (Atomic Habits) — each ritual anchored to an existing event: *"After I wake → Modeh Ani → cold shower → mantra."* Visualize the chain.
- **Morning / midday / evening / night bundles.** Separate ritual stacks per time of day.
- **Timed rituals** — optional per-ritual timer.
- **Ritual templates** — *"Frum morning," "Secular high-performance morning," "Pre-sleep routine," "Panic-mode recovery."* One-tap apply.
- **Per-ritual notes** — why this ritual matters to me.
- **Ritual streak** visualized separately from sobriety streak.

### 2.8 Mantras ([src/screens/MantraBuilder.tsx](src/screens/MantraBuilder.tsx))

**Today.** User list + 3 hardcoded defaults. **User feedback: "the quotes are all cracked."**

**Expansions:**
- **Vetted default library**, curated by tone + religious level:
  - Secular/clinical: Marcus Aurelius, Viktor Frankl, CBT affirmations, James Clear.
  - Harsh: David Goggins, Jocko Willink, classic Mussar.
  - Gentle: Brené Brown, self-compassion research, Psalms.
  - Spiritual: Rambam, Mesillat Yesharim, Chovot HaLevavot, Chazal.
- **AI-assisted mantra generation** (opt-in) — using the user's cost/benefit and identity statement.
- **Mantra rotation** — daily / weekly / situational (morning vs panic vs celebration).
- **Lock-screen integration** (wishlist, platform-dependent).

### 2.9 Coach / AI ([src/screens/Coach.tsx](src/screens/Coach.tsx))

**Today.** Journal stub. No AI wired. **User feedback: "the AI coach isn't working but I do think that is a really good idea — but we need to be veryyyyy careful."**

**See §5 for the full AI spec.** At the screen level:
- Tone-aware system prompt built from the full 12-axis profile.
- User provides their own API key (Anthropic / OpenAI / Groq / Ollama local). Stored only on device.
- **Memory** — local-only conversation history, summarized nightly. The AI "remembers" without re-sending the full history.
- **Scoped modes:**
  - *Urge mode* — short, interruptive, prescriptive. Goal: get through the next 10 min.
  - *Reflection mode* — long-form. Goal: understand a pattern.
  - *Learning mode* — Q&A on the Intel library.
  - *Venting mode* — listening, no advice unless asked.
- **Safety rails:**
  - Hard refusals on requests for sexual content, encouragement to lapse, or any form of rationalization support.
  - **Crisis escalation** — if user indicates self-harm intent, surface crisis hotline numbers and disable the coach until acknowledged.
  - No role-play. No persona as anything other than a recovery coach.
  - Guardrail prompts tested and version-locked before shipping.
- **Lights-out lockout** — keep. Late-night AI chat is a known relapse vector.
- **Cost transparency** — show estimated tokens/cost per message.

### 2.10 Profile ([src/screens/Profile.tsx](src/screens/Profile.tsx))

**Today.** Well-designed — Avi's feedback identifies this as the quality bar for the rest of the app. Keep, and add:
- **Your Data** page (§0.1) — what's stored, export all, delete all.
- **All 12 personalization axes** editable here.
- **Identity statement** — the current *"I am…"* sentence the user is working toward.
- **Personal milestone ladder.**
- **Cost / benefit inventory**, editable.
- **Integrations** panel (§8).
- **AI provider settings.**
- **Backup / restore** (local export file).

### 2.11 Punishment mode ([src/screens/PunishmentSettingsScreen.tsx](src/screens/PunishmentSettingsScreen.tsx), [src/components/PunishmentModeWrapper.tsx](src/components/PunishmentModeWrapper.tsx))

**Today.** Time-bounded restricted mode after a fall.

**Expansions — only if motivation style includes "punishment":**
- **Graduated consequences.** Configurable chain: short (2h) → medium (24h) → long (72h) → custom.
- **Financial stake** (à la Beeminder / StickK): user pre-commits to donating $X to a charity they *don't* like on each fall. User pays out-of-band; app just tracks the debt.
- **Social stake** — auto-post (user's choice of channel) *"I fell today — accountability ping"* to a partner or group.
- **Feature lockouts** — user chooses what punishment mode blocks: social apps, entertainment apps. Via OS-level deep links / recommendations.
- **Override is shameful but possible** — user can always exit punishment mode, but it's logged and partner sees.

### 2.12 Danger Watchlist — new, high-priority

See full spec in §7.

### 2.13 Risky apps & lights-out ([src/screens/RiskyAppsSettings.tsx](src/screens/RiskyAppsSettings.tsx))

**Today.** User lists apps + quiet windows.

**Absorb into Danger Watchlist (§7).** The current screen is a narrow subset of what's needed.

### 2.14 Close Call protocol — new (replaces current dead-end)

**Today.** Close Call button activates a 2h cooldown. **User feedback: "the close call button doesn't have a reaction yet — we will need to create a proper protocol."**

Replace with a **90-second intervention:**
1. Freeze screen, full-bleed calming visual.
2. **4-7-8 breathing** — 3 cycles. Mandatory, cannot skip.
3. **Mantra recitation** — user's current mantra shown, instruction to say it aloud 3x.
4. **One tactic chosen automatically** from their toolkit, based on the trigger they tap:
   - *I'm alone* → call-a-friend card with one-tap dial.
   - *I'm tired* → "lie down for 10 minutes" timer.
   - *I'm bored* → tactic card.
   - *Visual trigger* → close-the-app / change-location prompt.
5. **Rapid logging** — one tap to save as a Close Call win. Feeds pattern engine.
6. **Optional partner ping.**
7. **Back to Home** — streak is **not** reset. A Close Call is a *win that nearly didn't happen.* Celebrate it.

### 2.15 Panic Button — new, distinct from Close Call

**User feedback: "a panic button."** Always accessible — one tap from any screen (persistent floating button, or gesture, or home-screen widget).
- **Triage:** *"How much time do I have?"* → 30 seconds / 2 minutes / 10 minutes / need my partner.
- **Match the intervention:**
  - 30s → immediate full-screen mantra + one breath.
  - 2m → 4-7-8 breathing + tactic card.
  - 10m → short guided meditation + journaling prompt.
  - Partner → initiates the partner emergency protocol (§4.4).

**Panic = urgent rescue. Close Call = urge that passed, logged.** Build both.

### 2.16 Accountability / Partner mode — new

**User feedback: "an accountability section where you and your partner work together."** See §4.

### 2.17 Emergency / crisis screen — new

If the user indicates self-harm ideation (in journal, coach, or via explicit button), surface:
- Local crisis hotline numbers (varies by country — routed via `language` + locale).
- One-tap dial.
- "Call your partner / emergency contact" option.
- Disable coach until user confirms they're okay.

Non-negotiable for a mental-health-adjacent app.

---

## 3. Badges, leaderboards, incentives

**Today.** Milestone celebrations + streak incentive bar.

**Expansions** (Avi's feedback: *"I love the badges idea — maybe we can add a leaderboard"*):
- **Badges** for milestones (7/14/30/…), rituals (30-day ritual streak), check-ins (100 in a row), Close Calls (10 intercepted urges), journal entries, learning completions.
- **Leaderboard — opt-in only, tiered:**
  - **Private leaderboard** — just the user's own history across streaks.
  - **Partner leaderboard** — just the two of them.
  - **Group leaderboard** — small circles (3-6).
  - **Anonymous global** — display name only, no identifying info, fully opt-in, can leave anytime.
- **Vow rewards** — user pre-commits to real-world reward at milestones ($50 gift card to themselves at 30 days, a weekend trip at 100). App tracks, we don't handle money.
- **Donation-to-charity on fall** — inverse of vow rewards. User's choice.
- **Anti-charity** — on fall, donate to a cause the user dislikes (Karlan & Ariely behavioural-economics move).

---

## 4. Accountability Partner / Group — new

**This is the single biggest missing feature.** Every proven recovery program has social accountability at its core.

### 4.1 Partner mode

Two users pair via a one-time pairing code (QR or short numeric), handled **phone-to-phone only**. No account, no server.
- **Handshake.** One phone generates an ephemeral keypair, displays QR. Other scans. Public keys exchanged.
- **Sync options:**
  - **E2E-encrypted relay** — a dumb forwarding server (WebRTC signaling or similar). We can't read the payload.
  - **Manual channel mode** — partners use their existing WhatsApp / iMessage; the app just formats messages.
- Users pick which.

**Partner features:**
- Daily one-line status sent automatically at user's chosen time: *"Avi — Day 17 — clean — feeling solid."*
- "I'm struggling" one-tap ping.
- "I fell" ping with optional reason.
- Shared streak view (what the user chose to share — axis #11).
- Shared milestone celebrations.
- Optional scheduled 5-min call reminder.

### 4.2 Group mode

3-6 person circle. Shared board showing only what members opt into — by default just "clean today? yes/no." No chat (chat becomes a distraction or worse, a trigger surface). **Presence > conversation.**

### 4.3 Sponsor mode

Asymmetric — user has a mentor who is further along. Sponsor sees the user's check-ins; user can ping sponsor. Sponsor doesn't share their own detail by default.

### 4.4 Emergency partner protocol

When the user hits Panic → Partner:
- Partner receives high-priority notification.
- User's phone offers one-tap call.
- If partner doesn't respond within 60s, escalate to a pre-configured secondary contact.

---

## 5. AI & Learning layer

The AI is not a chatbot bolted on the side. It's the **personalization engine**. Everything the app learns about the user, it uses to retune content, timing, and recommendations.

### 5.1 What the AI does (local pattern engine + optional LLM)

**Always-on (local, no network):**
- Pattern detection on the event log: *"You've fallen 4 Tuesdays in a row at 11pm."*
- Trigger correlation: *"78% of your falls follow Instagram sessions over 20 minutes."*
- Ritual correlation: *"You've never fallen on a day you did the morning ritual."*
- Mood / sleep / exercise correlation.
- Tactic effectiveness: *"Cold shower has intercepted 8 of your last 10 Close Calls. Walk outside has failed 3 of 4."* — ranks toolkit.
- Risk forecast: compound score for the next 24h.

**Opt-in LLM layer (user brings their own API key):**
- Personalized weekly summary: *"This week: 2 Close Calls, 5 rituals completed, 1 fall. The fall followed a missed check-in on Tuesday — consider scheduling Tuesday check-ins with Avi."*
- Mantra generation in the user's voice.
- Post-fall reflection (§2.3 step 5).
- Coach conversation (§2.9).
- Natural-language querying of own data: *"when was the last time I fell after seeing my ex?"* (Local-only — data never leaves the phone; the AI call sends minimal context.)

### 5.2 Feedback loops

After every significant event, the app asks for structured feedback, and uses the answers to retune itself:

| Event | Feedback | App response |
|-------|----------|--------------|
| **Fall** | Full post-fall protocol (§2.3) | If Instagram logged → suggest adding to Danger Watchlist. If late night → suggest earlier lights-out. If HALT tired → suggest sleep goal. |
| **Close Call** | Which tactic helped? | Updates tactic effectiveness ranking. |
| **Win streak** | What's working? | Reinforces those rituals. |
| **Milestone hit** | What unlocked this? | Saves as "this worked for me" journal entry. |
| **Check-in skipped 3 days** | Why? | Retunes reminder time; offers to reduce frequency. |
| **Ritual abandoned for 7 days** | Why? | Suggests removing or replacing. |
| **Partner ping ignored** | Why? | Suggests a different partner, different mode, or solo. |

### 5.3 The Instagram example (your scenario)

User falls → post-fall protocol asks for trigger → user selects *Instagram* → app responds:
1. *"Would you like to add Instagram to your Danger Watchlist?"* — one-tap yes.
2. *"Instagram is now on your watchlist. I'll warn you before you open it during your danger hours (10pm-1am) and require a 30-second mantra recitation before I let you through."*
3. *"Want me to also suggest a healthier alternative to open when you reach for Instagram in those hours?"* — user picks: Read app, Audiobook, call partner, journal.

This is the flywheel: **fall → feedback → app gets smarter → next fall less likely.**

---

## 6. Pattern engine ([src/utils/patternEngine.ts](src/utils/patternEngine.ts))

The file exists, mostly empty. It should do:
- **Weekday/hour heatmap** of falls and close calls.
- **Chaser-effect watch** — for 5 days post-fall, elevate everything (more check-ins, Panic Button pinned, more aggressive danger alerts).
- **Flatline awareness** (NoFap reboot literature) — weeks 2-6 have characteristic crashes; warn in advance so user doesn't think "it's not working."
- **HALT compound score** — cached on each check-in.
- **Trigger-tactic matching** — which tactic has worked best for which trigger for this user specifically.
- **Emerging-pattern alerts** — *"Something new: 3 falls in a row after Thursday night calls with your brother."*

All local. All derivable from the existing event log.

---

## 7. Danger Watchlist — new, high-priority

**What it is.** A user-managed list of apps, websites, people, places, times, and situations that have historically triggered a fall. The app uses this list proactively.

### 7.1 What can be watchlisted

- **Apps** — Instagram, TikTok, YouTube, Reddit, X, Snapchat, Telegram, Discord, browser, specific games, dating apps, any installed app.
- **Websites / URL patterns** — specific sites the user has identified.
- **Times** — "every night after 11pm," "Saturday afternoons."
- **Locations** — *"when I'm home alone"* (requires explicit user-enabled location permission; stays on device).
- **People / social situations** — *"after phone calls with X"*, *"after work drinks"*.
- **Emotional states** — *"when I'm feeling rejected"* — flagged via HALT + mood check-in.
- **Events** — *"after a fight with my wife"* — user manually tags.

### 7.2 Escalation levels (user sets per item)

1. **Notice** — silent log, no interruption. For pattern detection only.
2. **Warn** — *"Are you sure you want to open Instagram right now? It's 11:30pm and 4 of your last 5 falls started here."* Confirm to proceed.
3. **Delay** — 30-second forced delay with mantra recitation before the app is allowed.
4. **Mantra gate** — user must type their mantra before proceeding.
5. **Partner alert** — partner gets pinged the moment the app is opened.
6. **Hard block** — app is blocked during danger hours (iOS Screen Time / Android App Timers integration).

### 7.3 Auto-populated suggestions

When the post-fall protocol surfaces a trigger that isn't watchlisted, auto-suggest adding it. When the pattern engine finds a pattern ("4 falls after opening TikTok"), suggest watchlisting it even if the user didn't manually log it.

### 7.4 Scheduling

Each watchlist item has a schedule. Instagram might be fine 8am-8pm but danger after 10pm. Per-item quiet windows.

### 7.5 Platform integrations

- **iOS Screen Time API** — user authorizes once; app can enforce real blocks. Gold standard.
- **Android Digital Wellbeing** — App Timers intent integration.
- **DNS-level filter recommendations** — NextDNS, Canopy, Bark.
- **Covenant Eyes / Accountable2You** — pre-filled config deep-links.
- **Browser extension sibling** — desktop extension mirrors the watchlist.

### 7.6 Data model sketch

```ts
interface DangerWatchItem {
  id: string;
  type: 'app' | 'website' | 'time' | 'location' | 'person' | 'emotion' | 'event' | 'custom';
  label: string;              // user-visible
  detector: WatchDetector;    // how we recognize the condition
  level: 'notice' | 'warn' | 'delay' | 'mantra-gate' | 'partner-alert' | 'hard-block';
  schedule?: { start: string; end: string; days: number[] };  // HH:mm, 0-6
  stats: {
    timesTriggered: number;
    timesFollowedByFall: number;
    timesFollowedByCloseCall: number;
    timesSurvivedClean: number;
  };
  suggestedBy: 'user' | 'post-fall-protocol' | 'pattern-engine';
  createdAt: string;
}
```

---

## 8. Integrations (external tools we recommend)

Guard alone isn't enough for most people. The app knows about and recommends:
- **DNS / content filters:** NextDNS, Canopy, Bark, CleanBrowsing.
- **Accountability software:** Covenant Eyes, Accountable2You, Accountable.
- **Focus / block apps:** Opal, Freedom, Cold Turkey, AppBlock.
- **Meditation / calm:** Headspace, Calm, Insight Timer, Waking Up.
- **Journaling:** Day One, Stoic.
- **Sleep tracking:** iOS Health, Android Health Connect.

Each recommended from the relevant screen (Danger Watchlist → filters; Rituals → meditation) with a why-it-helps blurb and a deep link.

---

## 9. Expanded feature list — everything else

Grouped thematically. Marked P0 (must for beta) / P1 (next) / P2 (later).

### 9.1 Behavioural / psychological
- P0 — **Cost / Benefit worksheet** (SMART).
- P0 — **Identity statement builder** ("I am becoming X").
- P1 — **Weekly reflection / review** (Bullet Journal + AA Step 10).
- P1 — **Monthly review**.
- P2 — **Annual recovery-story generator** (AI-composed, local only).
- P1 — **Letter-to-self at strong moment** → read back during weak moments.
- P2 — **Video/audio message from partner** for panic moments.
- P1 — **Gratitude journal**.
- P1 — **Shame-resilience exercises** (Brené Brown).
- P1 — **Urge journal timeline**.
- P1 — **Relapse autopsy** (deep post-fall analysis at 24h).
- P2 — **Trigger map visualization**.
- P2 — **Cost-in-time calculator** — "porn has taken ~600 hours of your life; that's X books unread."

### 9.2 Tracking / data
- P0 — **Sobriety calculator** — days/hours/minutes/seconds since last fall.
- P2 — **Money saved**.
- P2 — **Time saved** — estimated.
- P1 — **Mood correlation dashboard**.
- P1 — **Sleep correlation**.
- P1 — **Exercise correlation**.
- P2 — **Productivity correlation**.
- P2 — **Relationship quality tracking** (married users).
- P0 — **Full data export** (JSON + PDF).
- P0 — **Full data delete**.

### 9.3 Engagement / retention
- P1 — **Home-screen widget** showing streak.
- P2 — **Apple Watch / WearOS complication**.
- P2 — **Lock-screen widget** (iOS 16+).
- P2 — **Browser extension** mirroring watchlist.
- P0 — **Daily notification at user's time** (exists, refine).
- P0 — **Danger-hour notification** (exists, expand).
- P1 — **Re-engagement nudge** after 48h silence.
- P1 — **Milestone surprise unlocks** (new mantras, new Intel articles).

### 9.4 Content packs (bundled, tone-and-religion-tagged)
- P0 — Allen Carr Reframes (30 entries).
- P1 — Rav Twerski shorts.
- P1 — Mesillat Yesharim 30-day track.
- P0 — SMART / CBT worksheet library.
- P0 — Atomic Habits identity tools.
- P0 — Audio: guided breathing (3 lengths).
- P1 — Audio: Hisbonenus tracks (frum users).
- P2 — Video: tactic demonstrations.
- P2 — Book club / reading plans.

### 9.5 Community (opt-in, privacy-first)
- P1 — Anonymous success stories (curated, no user-generated — moderation burden).
- P1 — Anonymous group boards (3-6 person circles).
- P2 — Sponsor matching (only through partner-code handshake, no directory).
- **Not planned** — moderated forum. Too risky. Reddit already exists.

### 9.6 Safety / crisis
- P0 — Crisis hotline integration (localized).
- P0 — Emergency contact auto-dial.
- P0 — Self-harm ideation escalation from journal / coach.
- P1 — Partner emergency protocol (§4.4).

### 9.7 Developer / beta
- P0 — In-app feedback form (local, export to share).
- P0 — Version tag in-app.
- P1 — "What's new" on update.
- P1 — Debug / log export for bug reports.

---

## 10. Content-quality bar

Every user-facing string needs:
1. **Vetted source.** Book, study, clinician, or rav.
2. **Tone tag** — gentle / harsh / spiritual / clinical.
3. **Religion tag** — secular / traditional / torah-only / etc.
4. **Trigger tag** — which triggers this content is good for.
5. **Time tag** — panic (<30s) / quick (2m) / medium (5-15m) / deep (30m+).

The content table *is* the product. See [ADDICTION_RESEARCH.md](ADDICTION_RESEARCH.md) for the sourcing plan.

---

## 11. TODO — everything that needs to be done

Working list, rough priority order for getting a real beta out.

### 11.1 Foundational — privacy and trust
- [ ] First-screen privacy statement in onboarding (plain language: *"your data never leaves this phone, we have no server"*)
- [ ] Dedicated "Your Data" page in Profile — what's stored, export all, delete all
- [ ] Inline privacy note on every sensitive input (AI chat, journal, partner setup)
- [ ] Commitment statement in About — *"if this ever changes, we'll ask first"*
- [ ] Audit the codebase to confirm zero analytics / telemetry / crash reporters phoning home
- [ ] Document the privacy model in the app (not just the README)

### 11.2 Personalization — all 12 axes
- [ ] Add missing axes to `PersonalityProfile` in [useStore.ts](src/store/useStore.ts): `lifeStage`, `primaryTriggers[]`, `riskTimeOfDay`, `recoveryStage`, `intensity`, `learningStyle`, `privacyLevel`, `language`
- [ ] Add **Custom** option to **every** axis (free text + optional AI-mapping to tags)
- [ ] Expand [Onboarding.tsx](src/screens/Onboarding.tsx) to cover 12 calibration steps + 5 setup steps (privacy, why, milestones, cost/benefit, trigger map, Day 1 plan)
- [ ] Surface all 12 axes as editable fields in [Profile.tsx](src/screens/Profile.tsx)
- [ ] Tag every content item (mantras, tactics, rituals, reframes) with tone/religion/trigger tags
- [ ] Build a content-selector utility that filters by `PersonalityProfile`
- [ ] Soften the default copy voice (drill-sergeant only under `tone: harsh`)

### 11.3 Post-fall protocol (single most important flow)
- [ ] Rebuild [LogFallModal.tsx](src/components/LogFallModal.tsx) into the full 10-step flow (§2.3)
- [ ] Trigger multi-select with free-text (emotional / situational / digital / temporal)
- [ ] Precursor multi-select (ritual / check-in / sleep / exercise / HALT)
- [ ] Mood / shame / anger sliders
- [ ] AI reflection step (optional, only if key configured)
- [ ] Auto-suggest engine: watchlist additions, schedule changes, ritual adjustments
- [ ] 24-hour plan generator
- [ ] Identity reframe + recovery vow saved for 24h, shown on Home
- [ ] Optional partner ping with editable pre-written message

### 11.4 Close Call & Panic Button
- [ ] Replace Home's Close Call dead-end with full protocol (§2.14)
- [ ] Persistent Panic Button — floating / gesture / widget (§2.15)
- [ ] Panic triage → time-budgeted interventions (30s / 2m / 10m / partner)
- [ ] Panic → Partner escalation chain with 60s failover

### 11.5 Calendar — editable
- [ ] Make [Calendar.tsx](src/screens/Calendar.tsx) tap-to-edit any day
- [ ] Add layers (wins / falls / close calls / rituals / mood / sleep / alerts)
- [ ] Year-at-a-glance heatmap view
- [ ] Notes per day, searchable
- [ ] Pattern overlay (shade dangerous cells)
- [ ] Export CSV / PDF / JSON

### 11.6 Danger Watchlist (§7)
- [ ] Build new Watchlist screen (absorb [RiskyAppsSettings.tsx](src/screens/RiskyAppsSettings.tsx))
- [ ] Data model per §7.6
- [ ] All 8 watch types (app / website / time / location / person / emotion / event / custom)
- [ ] 6 escalation levels (notice / warn / delay / mantra-gate / partner-alert / hard-block)
- [ ] Per-item schedules
- [ ] Auto-suggestions from post-fall protocol + pattern engine
- [ ] iOS Screen Time API native module
- [ ] Android App Timers intent integration
- [ ] DNS filter recommendation deep-links
- [ ] Per-item stats (triggered / survived / led-to-fall)
- [ ] Browser extension (P2)

### 11.7 AI & pattern engine
- [ ] Flesh out [patternEngine.ts](src/utils/patternEngine.ts): weekday/hour heatmap, chaser-effect window, HALT score, trigger-tactic ranking, risk forecast
- [ ] Wire AI provider in [Coach.tsx](src/screens/Coach.tsx) — user-supplied API key stored locally
- [ ] Local conversation memory with nightly summarization
- [ ] Safety rails + hard refusal patterns, version-locked prompts
- [ ] Crisis escalation (self-harm detection)
- [ ] Four scoped modes (urge / reflection / learning / venting)
- [ ] Keep lights-out lockout
- [ ] Cost display per message
- [ ] Weekly AI summary
- [ ] AI-assisted mantra generation
- [ ] Natural-language data queries

### 11.8 Accountability / Partner (§4)
- [ ] Pairing flow (QR + short code), phone-to-phone, ephemeral keypair
- [ ] E2E-encrypted sync layer **OR** manual "send via WhatsApp" mode (user chooses)
- [ ] Daily status digest
- [ ] Struggling / fell pings
- [ ] Shared streak view per privacy axis
- [ ] Group mode (3-6 person boards, presence only, no chat)
- [ ] Sponsor asymmetric mode
- [ ] Panic → Partner emergency protocol with failover

### 11.9 Check-in expansion
- [ ] HALT check in [CheckInModal.tsx](src/components/CheckInModal.tsx)
- [ ] Mood slider
- [ ] Optional sleep hours, exercise, gratitude, reflection fields
- [ ] HALT compound score → feed pattern engine

### 11.10 Content
- [ ] Rename "Strategy" → "Intel" in [Learn.tsx](src/screens/Learn.tsx)
- [ ] Vet every existing tactic; add source citation + why-it-works paragraph
- [ ] 30 Carr-style reframes
- [ ] SMART DEADS cards
- [ ] Replace default mantras with vetted ones (tone-tagged + religion-tagged)
- [ ] Rav Twerski content pack (rights check)
- [ ] Mesillat Yesharim 30-day track
- [ ] Audio: 3 guided breathing lengths
- [ ] Audio: Hisbonenus tracks (frum)
- [ ] Video: short tactic demos (P2)

### 11.11 Rituals
- [ ] Habit-stacking UI in [RitualBuilder.tsx](src/screens/RitualBuilder.tsx)
- [ ] Morning / midday / evening / night bundles
- [ ] Per-ritual timer
- [ ] One-tap ritual templates

### 11.12 Milestones, badges, leaderboard
- [ ] User-defined milestone ladder (not hardcoded)
- [ ] Badge library + unlock logic
- [ ] Private / partner / group / opt-in global leaderboard (§3)
- [ ] Vow reward tracking (real-world)
- [ ] Donation-to-charity on fall option
- [ ] Anti-charity option

### 11.13 Safety & crisis
- [ ] Localized crisis hotline numbers (by locale/language)
- [ ] Emergency contact auto-dial
- [ ] Self-harm keyword escalation in journal + coach
- [ ] Disable-coach-until-ack flow

### 11.14 Beta program
- [ ] In-app feedback form (local + export)
- [ ] Version tag visible somewhere
- [ ] "What's new" on update
- [ ] Debug-log export for bug reports
- [ ] Per-release "things we're testing" note for testers
- [ ] Recruit testers from Avi's list

### 11.15 UI polish
- [ ] Audit every screen against Profile's quality bar
- [ ] Drop drill-sergeant default tone
- [ ] Replace cracked quotes with vetted ones
- [ ] Fix anything half-hashed from Avi's feedback

### 11.16 Integrations (P1 / P2)
- [ ] DNS filter recommendation deep-links (NextDNS, Canopy, Bark)
- [ ] Covenant Eyes / Accountable2You deep-links
- [ ] iOS Screen Time API native module
- [ ] Android App Timers intent integration
- [ ] Home-screen widget (streak)
- [ ] Apple Watch / WearOS complication (P2)
- [ ] Browser extension sibling (P2)
- [ ] Meditation app deep-links (Headspace / Calm / Insight Timer)

### 11.17 Data / export
- [ ] JSON export of full state
- [ ] PDF export of calendar + stats
- [ ] Local backup file (restore flow)
- [ ] Full delete + double-confirmation

---

**Bottom line.** The current app is a prototype — scaffolding for the real thing. The real thing is a **fully adjustable, fully private, AI-personalized, pattern-aware recovery OS** that learns the user and meets them where they are. Every item in §11 is what gets us there.
