// =============================================================================
// High-level AI actions. Each returns typed results and handles prompt shape.
// Called from screens; never from the store directly (keeps store pure).
// =============================================================================

import type { AiConfig } from './aiService';
import { callAI, callAIJson, type CallResult } from './aiService';
import type {
  PersonalityProfile,
  CoachStylePrefs,
  TacticEffectivenessEntry,
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
  // App is Jewish-only. Tone is calibrated by frame, but the source pool is
  // always Torah / Chazal / mussar / chassidus / contemporary Torah-grounded
  // recovery teachers.
  if (!r || r === 'secular') {
    return [
      'User identifies as secular Jewish. Default to clinical & psychological framing',
      '(CBT, ACT, polyvagal, Carnes, Wilson, Allen Carr-style addiction work).',
      'You may *occasionally* surface a Jewish source if it lands as wisdom rather',
      'than religion (Pirkei Avos, Mesillas Yesharim) — but never preach.',
    ].join(' ');
  }
  if (r === 'traditional' || r === 'baal-teshuva') {
    return [
      'User is Jewish, traditional / baal teshuva. Mix evidence-based recovery',
      'with accessible Jewish sources (Pirkei Avos, Tanya, Mesillas Yesharim,',
      'Shaarei Teshuvah, Rav Avigdor Miller, Rav Shafier / The Shmuz, GYE).',
    ].join(' ');
  }
  if (r === 'modern-orthodox') {
    return [
      'User is Modern Orthodox. Blend top-tier addiction science with mainstream',
      'mussar / hashkafa (Mesillas Yesharim, Michtav Me\'Eliyahu, Rav Hutner,',
      'Rav Soloveitchik, Rav Aharon Lichtenstein, Aleinu L\'Shabeach).',
    ].join(' ');
  }
  if (r === 'chassidish') {
    return [
      'User is Chassidish. Lead with chassidus (Tanya, Likutei Moharan, Sefas',
      'Emes, Mei Hashiloach, Chovos Halevavos) and tzaddikim (Reb Nachman, the',
      'Baal Shem Tov, Rebbe Rashab\'s Kuntres HaAvodah). Pair with mussar and',
      'modern recovery only when it serves the avodah.',
    ].join(' ');
  }
  if (r === 'chareidi') {
    return [
      'User is Chareidi / yeshivish. Lead with mussar and gedolei Yisrael',
      '(Mesillas Yesharim, Orchos Tzaddikim, Michtav Me\'Eliyahu, Chofetz Chaim,',
      'Rav Wolbe\'s Alei Shur, Rav Pincus, Rav Miller, Rav Shafier, GYE).',
    ].join(' ');
  }
  return 'User is Jewish but did not specify. Default to mussar + practical recovery; follow the user\'s lead on depth.';
}

/** Sefaria citation rule, appended to every system prompt. */
const SEFARIA_RULE = [
  'SEFARIA RULE — when you quote ANY Jewish sefer (Tanach, Mishnah, Gemara,',
  'Midrash, Rishonim, Acharonim, mussar, chassidus, Shulchan Aruch, etc.):',
  '1. Quote it briefly and accurately. Do not invent quotes.',
  '2. Add a Sefaria link in this exact format: https://www.sefaria.org/<Book>.<Chapter>.<Verse>',
  '   Examples: https://www.sefaria.org/Pirkei_Avot.4.1 ,',
  '             https://www.sefaria.org/Mesilat_Yesharim.1 ,',
  '             https://www.sefaria.org/Tanya,_Likutei_Amarim.1 ,',
  '             https://www.sefaria.org/Genesis.1.1',
  '3. If you are NOT certain of the exact chapter/verse, link to the book index instead',
  '   (e.g. https://www.sefaria.org/Mesilat_Yesharim) and say so honestly.',
  '4. Never fabricate a citation. If a source isn\'t on Sefaria, omit the link rather than guess.',
].join('\n');

/** World-class addiction-recovery toolkit the AI is expected to draw from. */
const RECOVERY_TOOLKIT = [
  'Recovery toolkit you may draw from (use what fits the moment, never name-drop):',
  '- Patrick Carnes (Out of the Shadows; Facing the Shadow): trauma + sex addiction cycle.',
  '- Gabor Mate (In the Realm of Hungry Ghosts): addiction as an unmet need.',
  '- William Glasser (Choice Theory): addiction as a chosen relief, replaceable.',
  '- Steven Hayes (ACT): defusion, values-based action, urge surfing.',
  '- Marsha Linehan (DBT): TIPP, distress tolerance, opposite action.',
  '- Andrew Huberman: dopamine reset, cold exposure, morning sunlight, sleep.',
  '- Nir Eyal (Indistractable): identity pacts, time boxing, traction vs distraction.',
  '- Allen Carr (Easyway): re-framing the substance / behavior as a fraud.',
  '- AA / SA Big Books: powerlessness, daily reprieve, sponsor model.',
  '- 12-step + SMART Recovery hybrid moves.',
  '- Jewish: Mesillas Yesharim chapters on zerizus / nekius / perishus;',
  '  Tanya Ch. 12-14 (beinoni model — the war IS the win);',
  '  Likutei Moharan I:6 (azamra — find the good point) and I:282;',
  '  Chovos Halevavos Shaar Yichud Hamaaseh and Shaar Habechinah;',
  '  Rav Wolbe Alei Shur II (avodas hamiddos);',
  '  GYE / Guard Your Eyes Handbook (the practical playbook for shmiras einayim).',
].join('\n');

function coachStyleDirective(
  prefs: CoachStylePrefs | null | undefined,
  effectiveness: Record<string, TacticEffectivenessEntry> | null | undefined,
): string {
  if (!prefs) return '';

  const lines: string[] = ['', 'PERSONALIZATION — CRITICAL: follow these instructions exactly.'];

  if (prefs.coachingApproach) {
    const desc: Record<string, string> = {
      'drill-sergeant': 'Be demanding, direct, and hold no punches. Push back. No excuses accepted.',
      'warm-mentor': 'Be warm, compassionate, and encouraging. Believe in him even when he doesn\'t.',
      'accountability': 'Always bring it back to his vow, his commitments, and what he said he would do.',
      'clinical': 'Use CBT/ACT framing. Be analytical. Skip inspiration, stick to techniques and data.',
      'spiritual': 'Ground every response in Torah, mussar, or chassidus. This is his avodah.',
      'socratic': 'Ask questions more than you answer. Help him arrive at the insight himself.',
    };
    lines.push(`Coaching approach: ${prefs.coachingApproach}. ${desc[prefs.coachingApproach] ?? ''}`);
  }

  if (prefs.goHard) {
    lines.push('GO HARD: User explicitly requested you do NOT go easy on him. Push back, challenge, demand more. This is what he wants.');
  }

  if (prefs.mantraStyles.length > 0) {
    const styleDesc: Record<string, string> = {
      warrior: 'bold, masculine, fighter — "I am a lion, not a victim"',
      torah: 'Hebrew/Torah-sourced — "Eizehu gibor? Hakovesh et yitzro"',
      clinical: 'neuroscience-grounded — "Urges peak in 20 min and pass"',
      compassionate: 'warm, gentle — "You are not your urges"',
      'short-punch': 'under 5 words, punchy — "Not today."',
      reflective: 'contemplative, meaningful — "Every breath is a choice"',
    };
    const styleLabels = prefs.mantraStyles.map((s) => styleDesc[s] ?? s).join('; ');
    lines.push(`Mantra style — when generating mantras, write them in these styles: ${styleLabels}`);
  }

  if (prefs.likedMantraTexts.length > 0) {
    lines.push(`Mantras that resonated with this user (write NEW mantras in a similar vein):\n${prefs.likedMantraTexts.slice(-5).map((m) => `  - "${m}"`).join('\n')}`);
  }

  if (prefs.dislikedMantraTexts.length > 0) {
    lines.push(`Mantras that did NOT resonate (avoid this style completely):\n${prefs.dislikedMantraTexts.slice(-3).map((m) => `  - "${m}"`).join('\n')}`);
  }

  if (prefs.tacticPreferences.length > 0) {
    lines.push(`Tactic categories that work for this user (lead with these): ${prefs.tacticPreferences.join(', ')}`);
  }

  if (prefs.firstMoveWhenUrgeHits) {
    lines.push(`Emergency first move: ${prefs.firstMoveWhenUrgeHits} — always suggest this category FIRST in crisis.`);
  }

  if (prefs.preferredDuration) {
    const desc: Record<string, string> = {
      instant: '~30 seconds',
      '2min': 'under 2 minutes',
      '5min': 'under 5 minutes',
      '10min+': 'longer sessions ok',
    };
    lines.push(`Preferred tactic length: ${desc[prefs.preferredDuration] ?? prefs.preferredDuration}`);
  }

  // Top effective tactics from tracked history
  if (effectiveness) {
    const topTactics = Object.entries(effectiveness)
      .filter(([, e]) => e.timesUsed >= 2)
      .sort(([, a], [, b]) => (b.timesWorked / b.timesUsed) - (a.timesWorked / a.timesUsed))
      .slice(0, 4)
      .map(([id, e]) => `${id} (worked ${e.timesWorked}/${e.timesUsed} times)`);
    if (topTactics.length > 0) {
      lines.push(`Most effective tactics for this user (reference and suggest these):\n${topTactics.map((t) => `  - ${t}`).join('\n')}`);
    }
  }

  return lines.join('\n');
}

function basePreamble(
  profile: PersonalityProfile,
  stylePrefs?: CoachStylePrefs | null,
  effectiveness?: Record<string, TacticEffectivenessEntry> | null,
): string {
  return [
    'You are Guard / Gibor KeAri — a private, Torah-grounded recovery coach for a',
    'Jewish man working to break free from compulsive sexual / pornography behavior.',
    `Tone: ${toneDirective(profile)}.`,
    religionDirective(profile),
    '',
    RECOVERY_TOOLKIT,
    '',
    SEFARIA_RULE,
    coachStyleDirective(stylePrefs, effectiveness),
    '',
    'Be concrete, short, and identity-forming. Speak to the gibor he is becoming,',
    'not the falls he\'s had. Never moralize. Never shame. Never repeat sensitive',
    'content back verbatim. When you cite a source, it should illuminate — not lecture.',
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
  stylePrefs?: CoachStylePrefs | null;
  tacticEffectiveness?: Record<string, TacticEffectivenessEntry> | null;
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
    basePreamble(profile, context.stylePrefs, context.tacticEffectiveness),
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
  stylePrefs?: CoachStylePrefs | null,
): Promise<CallResult<MantraSuggestion[]>> {
  const system = [
    basePreamble(profile, stylePrefs),
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
  stylePrefs?: CoachStylePrefs | null,
  effectiveness?: Record<string, TacticEffectivenessEntry> | null,
): Promise<CallResult<TacticSuggestion[]>> {
  const system = [
    basePreamble(profile, stylePrefs, effectiveness),
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
  const includeTorah =
    r === 'traditional' ||
    r === 'modern-orthodox' ||
    r === 'chareidi' ||
    r === 'chassidish' ||
    r === 'baal-teshuva' ||
    r === 'other';
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
