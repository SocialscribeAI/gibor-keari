// =============================================================================
// High-level AI actions. Each returns typed results and handles prompt shape.
// Called from screens; never from the store directly (keeps store pure).
// =============================================================================

import type { AiConfig } from './aiService';
import { callAI, callAIJson, type CallResult } from './aiService';
import type {
  PersonalityProfile,
  FallEvent,
  CloseCallEvent,
  CheckInEvent,
} from '../store/useStore';

// ---------------------------------------------------------------------------
// System prompt preamble — applied to every call.
// ---------------------------------------------------------------------------

function toneDirective(profile: PersonalityProfile): string {
  const tone = profile.tone ?? 'gentle';
  const map: Record<string, string> = {
    gentle: 'warm, kind, non-shaming',
    harsh: 'direct, drill-sergeant, no excuses — but never cruel',
    spiritual: 'contemplative, rooted in meaning',
    clinical: 'clinical, CBT-style, factual',
    custom: profile.customTone || 'balanced',
  };
  return map[tone] ?? 'balanced';
}

function religionDirective(profile: PersonalityProfile): string {
  const r = profile.religiousLevel;
  if (!r || r === 'secular') return 'Avoid religious framing unless the user initiates it.';
  if (r === 'modern-orthodox' || r === 'chareidi' || r === 'traditional') {
    return 'You may weave in Jewish sources (Torah, Gemara, Chassidus, mussar) when natural.';
  }
  if (r === 'christian') return 'You may reference Christian scripture and tradition when natural.';
  if (r === 'muslim') return 'You may reference Quran and Sunnah when natural.';
  return 'Religious framing: follow the user\'s lead.';
}

function basePreamble(profile: PersonalityProfile): string {
  return [
    'You are Guard — a private recovery coach for a local-first app that helps men break free from compulsive behavior.',
    `Tone: ${toneDirective(profile)}.`,
    religionDirective(profile),
    'Be concrete, short, and identity-forming. Never moralize. Never repeat sensitive content back verbatim.',
    profile.primaryTriggers.length
      ? `User's known triggers: ${profile.primaryTriggers.join(', ')}.`
      : '',
    profile.intensity ? `Intensity preference: ${profile.intensity}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// ---------------------------------------------------------------------------
// Job 1 — Coach reply (with tool use)
// ---------------------------------------------------------------------------

export interface CoachContext {
  currentStreak: number;
  longestStreak: number;
  recentFalls7d: number;
  recentCloseCalls7d: number;
  identityStatement?: string | null;
}

export interface CoachReplyEvent {
  kind: 'tool';
  name: string;
  ok: boolean;
}

export async function generateCoachReply(
  ai: AiConfig,
  profile: PersonalityProfile,
  context: CoachContext,
  history: { role: 'user' | 'coach'; text: string }[],
  userMessage: string,
  opts?: { onToolEvent?: (e: CoachReplyEvent) => void },
): Promise<CallResult<string>> {
  // Lazy-load tools so non-coach callers don't drag this in.
  const {
    buildToolRegistry,
    renderToolManifest,
    renderLiveSnapshot,
    parseToolCalls,
    executeToolCalls,
    renderToolResults,
  } = await import('./coachTools');
  const registry = buildToolRegistry();

  const baseSystem = [
    basePreamble(profile),
    '',
    'LIVE CONTEXT (refreshed every turn):',
    renderLiveSnapshot(),
    '',
    renderToolManifest(registry),
    '',
    'STYLE:',
    '- Max 4 short paragraphs.',
    '- No lists unless the user asks "how" or "what should I do".',
    '- End with one concrete next action when appropriate.',
    '- When you call a WRITE tool, first ASK the user and only run it after they confirm.',
  ]
    .filter(Boolean)
    .join('\n');

  const recentHistory = history.slice(-8);
  const historyBlock = recentHistory.length
    ? 'Recent conversation:\n' +
      recentHistory.map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.text}`).join('\n')
    : '';

  let turnUser = [historyBlock, '', `New user message: ${userMessage}`].filter(Boolean).join('\n');
  let finalText = '';

  // Tool-use loop: max 3 iterations so we can't burn free-tier quota on loops.
  for (let i = 0; i < 3; i++) {
    const res = await callAI(ai, {
      system: baseSystem,
      user: turnUser,
      temperature: 0.7,
      maxTokens: 700,
    });
    if (!res.ok) return res;

    const { cleaned, calls } = parseToolCalls(res.data);
    // Append any prose from this turn to the final reply.
    if (cleaned) finalText = finalText ? `${finalText}\n\n${cleaned}` : cleaned;

    if (!calls.length) break;

    const results = await executeToolCalls(calls, registry);
    if (opts?.onToolEvent) {
      for (const r of results) opts.onToolEvent({ kind: 'tool', name: r.name, ok: r.ok });
    }

    // Feed results back so the model can incorporate them.
    turnUser = [
      historyBlock,
      '',
      `User just said: ${userMessage}`,
      '',
      `Your previous turn made these tool calls. Use the results to continue your reply.`,
      renderToolResults(results),
      '',
      'Continue your reply to the user now. Do not repeat the tool call syntax. Talk to the user directly.',
    ].join('\n');
  }

  return { ok: true, data: finalText || '(no reply)' };
}

// ---------------------------------------------------------------------------
// Job 2 — Mantra generator
// ---------------------------------------------------------------------------

export interface MantraSuggestion {
  text: string;
  source?: string;
}

export async function generateMantras(
  ai: AiConfig,
  profile: PersonalityProfile,
  seed?: string,
): Promise<CallResult<MantraSuggestion[]>> {
  const system = [
    basePreamble(profile),
    '',
    'Generate 5 short, first-person, identity-forming mantras for this user.',
    'Each under 120 characters. Present tense. No hedging.',
    'Respond with JSON: {"mantras":[{"text":"...","source":"optional attribution"}]}',
  ].join('\n');

  const user = seed
    ? `Seed theme or phrase: "${seed}". Build mantras around this.`
    : 'Generate mantras calibrated to my tone, religious frame, and triggers.';

  const res = await callAIJson<{ mantras: MantraSuggestion[] }>(ai, {
    system,
    user,
    temperature: 0.9,
    maxTokens: 700,
  });
  if (!res.ok) return res;
  const list = res.data?.mantras ?? [];
  if (!Array.isArray(list) || list.length === 0) {
    return { ok: false, error: 'AI did not return any mantras.' };
  }
  return { ok: true, data: list.filter((m) => m && typeof m.text === 'string') };
}

// ---------------------------------------------------------------------------
// Job 3 — Tactic suggester
// ---------------------------------------------------------------------------

export interface TacticSuggestion {
  title: string;
  desc: string;
  category: 'body' | 'mind' | 'social' | 'spirit';
  timeNeeded?: string;
}

export async function suggestTactics(
  ai: AiConfig,
  profile: PersonalityProfile,
  recentTriggerSummary: string,
): Promise<CallResult<TacticSuggestion[]>> {
  const system = [
    basePreamble(profile),
    '',
    'Design 5 custom tactics the user can run in under 3 minutes the next time an urge hits.',
    'Each tactic must be physically or mentally concrete — no platitudes.',
    'Categories: body, mind, social, spirit. Mix them.',
    'Respond with JSON: {"tactics":[{"title":"…","desc":"one-sentence how-to","category":"body|mind|social|spirit","timeNeeded":"e.g. 60s"}]}',
  ].join('\n');

  const user = `My recent pattern: ${recentTriggerSummary || 'no data yet — design for my profile defaults'}.`;

  const res = await callAIJson<{ tactics: TacticSuggestion[] }>(ai, {
    system,
    user,
    temperature: 0.8,
    maxTokens: 900,
  });
  if (!res.ok) return res;
  const list = (res.data?.tactics ?? []).filter(
    (t) => t && typeof t.title === 'string' && typeof t.desc === 'string',
  );
  if (list.length === 0) return { ok: false, error: 'AI did not return any tactics.' };
  return { ok: true, data: list };
}

// ---------------------------------------------------------------------------
// Job 4 — Danger-time analyst
// ---------------------------------------------------------------------------

export interface RiskWindow {
  start: string; // HH:mm
  end: string; // HH:mm
  weekdays: number[]; // 0=Sun..6=Sat
  riskLevel: 'high' | 'medium';
  reason: string;
}

export interface DangerAnalysis {
  riskWindows: RiskWindow[];
  summary: string;
  suggestions: string[];
}

export interface EventTimeTuple {
  hour: number; // 0-23
  weekday: number; // 0-6
  type: 'fall' | 'close-call';
}

export function buildTimeTuples(
  falls: FallEvent[],
  closeCalls: CloseCallEvent[],
): EventTimeTuple[] {
  const tuples: EventTimeTuple[] = [];
  for (const f of falls) {
    const d = new Date(f.date);
    tuples.push({ hour: d.getHours(), weekday: d.getDay(), type: 'fall' });
  }
  for (const c of closeCalls) {
    const d = new Date(c.date);
    tuples.push({ hour: d.getHours(), weekday: d.getDay(), type: 'close-call' });
  }
  return tuples;
}

export async function analyzeDangerTimes(
  ai: AiConfig,
  profile: PersonalityProfile,
  tuples: EventTimeTuple[],
): Promise<CallResult<DangerAnalysis>> {
  if (tuples.length === 0) {
    return {
      ok: false,
      error: 'Not enough data yet. Log a few events first so patterns can emerge.',
    };
  }
  const system = [
    basePreamble(profile),
    '',
    'You are analyzing when this user is most at risk. You receive only {hour, weekday, type} tuples — no content.',
    'Find the 1-3 tightest time windows where falls and close-calls cluster. Weekday 0=Sun.',
    'Respond with JSON: {"riskWindows":[{"start":"HH:mm","end":"HH:mm","weekdays":[0,1],"riskLevel":"high|medium","reason":"one sentence"}],"summary":"2-3 sentence plain-language pattern","suggestions":["short actionable step","..."]}',
  ].join('\n');

  const user = 'Events (hour, weekday, type):\n' + JSON.stringify(tuples);

  const res = await callAIJson<DangerAnalysis>(ai, {
    system,
    user,
    temperature: 0.3,
    maxTokens: 700,
  });
  if (!res.ok) return res;
  if (!res.data?.riskWindows) return { ok: false, error: 'AI response missing riskWindows.' };
  return { ok: true, data: res.data };
}

// ---------------------------------------------------------------------------
// Job 5 — Learn recommender
// ---------------------------------------------------------------------------

export type RecKind = 'youtube' | 'torah-shiur' | 'podcast' | 'article' | 'book';

export interface LearnRec {
  title: string;
  kind: RecKind;
  searchQuery: string;
  why: string;
  /** Built from searchQuery on the client — never from AI. */
  url?: string;
}

export function buildRecUrl(rec: Pick<LearnRec, 'kind' | 'searchQuery'>): string {
  const q = encodeURIComponent(rec.searchQuery);
  switch (rec.kind) {
    case 'youtube':
      return `https://www.youtube.com/results?search_query=${q}`;
    case 'torah-shiur':
      return `https://www.torahanytime.com/search?q=${q}`;
    case 'podcast':
      return `https://open.spotify.com/search/${q}`;
    case 'book':
      return `https://www.google.com/search?q=${q}+book`;
    case 'article':
    default:
      return `https://www.google.com/search?q=${q}`;
  }
}

export async function recommendLearnContent(
  ai: AiConfig,
  profile: PersonalityProfile,
  recentStruggle: string,
  opts?: {
    topics?: string[];
    kinds?: RecKind[];
    count?: number;
    /** Max time the user has right now, in minutes. Filters rec length. */
    timeBudgetMin?: number;
  },
): Promise<CallResult<LearnRec[]>> {
  const r = profile.religiousLevel;
  const includeTorah = r === 'traditional' || r === 'modern-orthodox' || r === 'chareidi';
  const style = profile.learningStyle ?? 'watch';
  const count = opts?.count ?? 6;
  const topics = opts?.topics ?? [];
  const kinds = opts?.kinds ?? [];
  const timeBudget = opts?.timeBudgetMin;

  // Describe the time window in a way the AI can reason about.
  let timeLine = '';
  if (timeBudget && timeBudget > 0) {
    if (timeBudget <= 5) {
      timeLine = `The user has ~5 minutes right now. Pick short-form content: YouTube Shorts, tweets/articles readable in under 5 min, 3-5 min podcast clips, or mini shiurim. NO long lectures, NO books, NO multi-part series.`;
    } else if (timeBudget <= 15) {
      timeLine = `The user has ~15 minutes. Favor single videos/shiurim/podcast episodes that run 5-15 min, or articles readable in that window. Avoid anything over 20 min or book recs.`;
    } else if (timeBudget <= 30) {
      timeLine = `The user has ~30 minutes. Favor 15-30 min videos, shiurim, podcast episodes, or longer articles. Avoid full books unless the search can surface a specific chapter/summary.`;
    } else {
      timeLine = `The user has an hour or more. Full-length lectures, long-form podcasts, deep articles, and books are all welcome.`;
    }
  }

  const system = [
    basePreamble(profile),
    '',
    `Recommend ${count} pieces of media that would actually move this user right now.`,
    `Primary learning style: ${style}. ${includeTorah ? 'Torah shiurim are welcome (Rav Miller, Rav Wolbe, Rav Pincus, Rav Shafier, GYE, Guard Your Eyes, etc).' : ''}`,
    timeLine,
    topics.length
      ? `Focus topics (user-selected): ${topics.join(', ')}. Stay within these.`
      : '',
    kinds.length
      ? `Only return these formats: ${kinds.join(', ')}.`
      : 'Mix formats: youtube, torah-shiur (only if relevant), podcast, article, book.',
    'Rules:',
    '- Do NOT fabricate URLs. Return a focused searchQuery instead.',
    '- Prefer well-known creators/titles when possible; the searchQuery should be precise enough to surface the real thing.',
    '- Each "why" must tie to the user\'s specific tone/triggers/topic.',
    '- No shame, no graphic content, no moralizing.',
    timeBudget
      ? `- Every rec must realistically fit within ~${timeBudget} min. Include an estimated duration in the "why" when helpful (e.g. "~8 min read", "12 min video").`
      : '',
    `Respond with JSON: {"recommendations":[{"title":"…","kind":"youtube|torah-shiur|podcast|article|book","searchQuery":"what to search","why":"one sentence"}]}`,
  ]
    .filter(Boolean)
    .join('\n');

  const user = [
    topics.length ? `Topics selected: ${topics.join(', ')}.` : '',
    recentStruggle ? `Current struggle: ${recentStruggle}` : 'Give me a curated starter set for my profile.',
  ]
    .filter(Boolean)
    .join('\n');

  const res = await callAIJson<{ recommendations: LearnRec[] }>(ai, {
    system,
    user,
    temperature: 0.8,
    maxTokens: 1400,
  });
  if (!res.ok) return res;
  const list = (res.data?.recommendations ?? []).filter(
    (x) => x && x.title && x.searchQuery && x.kind,
  );
  if (list.length === 0) return { ok: false, error: 'AI did not return any recommendations.' };
  return { ok: true, data: list.map((x) => ({ ...x, url: buildRecUrl(x) })) };
}

/**
 * Generate a short TL;DR for a learn recommendation so the user can get the
 * core idea without actually watching/reading/listening. Best-effort: the AI
 * does not fetch the actual content, it distills what's likely in it based on
 * title + searchQuery + why + known creator patterns.
 */
export async function generateRecTldr(
  ai: AiConfig,
  profile: PersonalityProfile,
  rec: Pick<LearnRec, 'title' | 'kind' | 'searchQuery' | 'why'>,
): Promise<CallResult<string>> {
  const system = [
    basePreamble(profile),
    '',
    'Give a TL;DR of the following piece of media for someone who does NOT have time to watch/read/listen.',
    'Distill the likely core message, key points, and the single actionable takeaway.',
    'Rules:',
    '- 3-5 short sentences max, or a tight bullet list of up to 4 bullets.',
    '- Be concrete. No fluff, no filler, no "this video discusses…".',
    '- If you genuinely don\'t know the specific piece, summarize what content with this title/search from this type of creator usually covers, and say so briefly.',
    '- No shame, no moralizing, no graphic content.',
    '- End with ONE line starting with "Takeaway:" — the one thing to walk away with.',
  ].join('\n');

  const user = [
    `Title: ${rec.title}`,
    `Format: ${rec.kind}`,
    `Search query that would find it: ${rec.searchQuery}`,
    rec.why ? `Why it was recommended: ${rec.why}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const res = await callAI(ai, {
    system,
    user,
    temperature: 0.5,
    maxTokens: 350,
  });
  if (!res.ok) return res;
  const text = (res.data ?? '').trim();
  if (!text) return { ok: false, error: 'AI returned an empty TL;DR.' };
  return { ok: true, data: text };
}

// ---------------------------------------------------------------------------
// Summarizers used by the UI before hitting AI.
// ---------------------------------------------------------------------------

export function summarizeRecentTriggers(
  falls: FallEvent[],
  closeCalls: CloseCallEvent[],
  checkIns: CheckInEvent[],
): string {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = falls.filter((f) => new Date(f.date).getTime() > sevenDaysAgo);
  const recentCC = closeCalls.filter((c) => new Date(c.date).getTime() > sevenDaysAgo);

  const emotions = new Map<string, number>();
  recent.forEach((f) => f.emotionalTriggers.forEach((e) => emotions.set(e, (emotions.get(e) ?? 0) + 1)));
  const topEmotions = [...emotions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  const situational = new Map<string, number>();
  recent.forEach((f) => f.situationalTriggers.forEach((s) => situational.set(s, (situational.get(s) ?? 0) + 1)));
  const topSit = [...situational.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);

  const parts: string[] = [];
  parts.push(`${recent.length} falls and ${recentCC.length} close calls in the last 7 days`);
  if (topEmotions.length) parts.push(`emotional drivers: ${topEmotions.join(', ')}`);
  if (topSit.length) parts.push(`situations: ${topSit.join(', ')}`);
  const lastCheckIn = checkIns[0];
  if (lastCheckIn) parts.push(`last check-in mood ${lastCheckIn.mood}/10`);
  return parts.join('; ');
}

export function countRecent(events: { date: string }[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return events.filter((e) => new Date(e.date).getTime() > cutoff).length;
}
