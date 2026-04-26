# AI Strategy — How Guard Uses AI to Lead Recovery

_Last updated: 2026-04-24_

This is the plan for how AI is woven through the whole app — not as a chat bolt-on, but as the **active guide** that tunes every user's experience to them.

## Principles

1. **Bring Your Own Key (BYOK).** No Guard-operated server. The user chooses a provider and pastes a key. We recommend **Groq (llama-3.3-70b-versatile)** as the default — free tier, no credit card, fast.
2. **Local-first.** All logs, mantras, tactics, and recommendations live on device. AI only sees the slice of context we hand it for a specific task.
3. **Open-source models by default.** Groq and Ollama both serve open-weight Llama / Mistral / Qwen models. We never require a paid model.
4. **AI writes into the store.** AI doesn't just chat — it returns structured JSON that becomes new mantras, tactics, watchlist items, and content recommendations. The user reviews before anything replaces existing data.
5. **Every AI call is scoped.** Tone, religious frame, learning style, and triggers are injected as system prompt. Raw event logs are never sent in bulk — only summaries.

## Default Provider: Groq (open-source, free)

- Model: `llama-3.3-70b-versatile`
- Sign-up: https://console.groq.com/keys (free, no CC)
- Endpoint: `https://api.groq.com/openai/v1/chat/completions` (OpenAI-compatible)
- We set Groq as the recommended provider in the AI Config screen with a one-tap "Get free key" flow.

## The 5 AI Jobs

### Job 1 — Coach (on demand)
**Where:** `Coach` tab.
**Input:** Current streak, tone, religious frame, recent event summary (last 7 days counts), user message.
**Output:** A single coach reply in the user's tone. Max 4 short paragraphs.
**Personalization:** `personalityProfile.tone`, `religiousLevel`, `intensity` drive the system prompt.

### Job 2 — Mantra Generator
**Where:** `MantraBuilder` → "AI: generate new mantras".
**Input:** Tone, religious frame, primary triggers, optional seed text.
**Output:** JSON `{ mantras: string[] }` — 5 short, first-person, identity-forming mantras.
**User flow:** Suggestions appear in a review panel. User taps ✓ to add each to their mantra list. Nothing replaces existing mantras without consent.

### Job 3 — Tactic Suggester
**Where:** Tactic Settings → "Get AI suggestions".
**Input:** Profile + recent triggers from fall/close-call events (top 3 emotional + situational).
**Output:** JSON `{ tactics: [{title, desc, category, timeNeeded}] }` — 4-6 custom tactics designed for this user's specific failure mode.
**User flow:** Suggestions appear in-line with ✓ / ✕. ✓ adds to the user's tactic library.

### Job 4 — Danger-Time Analyst
**Where:** `PatternInsights` → "Analyze my danger times".
**Input:** Fall + close-call events with timestamps (hour-of-day + day-of-week aggregation). Never raw content — just `{hour, weekday, type}` tuples.
**Output:** JSON `{ riskWindows: [{start: "HH:mm", end: "HH:mm", weekdays: number[], riskLevel: "high"|"medium", reason: string}], summary: string, suggestions: string[] }`.
**Side effect:** User can one-tap convert each risk window into a `DangerWatchItem` in the watchlist, with a `mantra-gate` or `delay` level. Also updates `dangerHour` in notifications so evening reminders fire at the right time.

### Job 5 — Learn Recommender
**Where:** `Learn` tab (replaces the old static tactic list).
**Input:** Religious frame, primary triggers, learning style (`watch` / `listen` / `read`), current struggle from recent events.
**Output:** JSON `{ recommendations: [{title, kind: "youtube"|"torah-shiur"|"podcast"|"article"|"book", searchQuery, why}] }`.
**Important:** AI returns **search queries**, not raw URLs (hallucinated URLs are a real risk). We convert each into a real link:
- `youtube` → `https://www.youtube.com/results?search_query=...`
- `torah-shiur` → `https://www.torahanytime.com/search?q=...`
- `podcast` → Spotify search
- `article` → Google search
**User flow:** User taps a card, opens the search page in the browser, picks what resonates.

## What AI Can Change

| Artifact | AI writes? | User confirms? |
|---|---|---|
| Mantras | Yes (append) | Yes — per item |
| Custom tactics | Yes (append) | Yes — per item |
| Watchlist risk windows | Yes (append) | Yes — per item |
| Learn recommendations | Yes (full replace) | No — feed is ephemeral |
| Coach messages | Yes | N/A |
| Streak, falls, check-ins | **Never** | — |
| Personality profile | **Never** (user-only) | — |

## Privacy & Trust

- System prompt always contains: _"You are a recovery coach for a private, local-first app aimed at helping the user stop masterbating using the best practices and a perosnalized appraoct. Respect the user's tone."_
- No telemetry. No server. The only outbound request is the one the user just asked for, to the provider they chose.


## Phasing

- **Phase A (this PR):** AI service + 5 actions wired end-to-end. Groq quick-start. Mantras, tactics, danger times, learn recs, coach chat all hit the AI when configured.
- **Phase B:** AI-driven ritual builder (morning/evening flows customized to profile). AI reviews weekly check-in history and proposes profile tweaks.
- **Phase C:** Local Ollama-only mode with full offline embedding of the content library (zero-network recovery).
