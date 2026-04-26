// =============================================================================
// AI-powered content moderation.
// Reuses the user's configured AI provider (see aiClient.ts) to screen posts,
// replies, and forum titles/descriptions for: ads, spam, unrelated content,
// explicit material, slurs, self-harm encouragement, doxing.
// Graceful fallback: if no provider configured, a small local keyword filter
// still catches the worst offenders.
// =============================================================================

import { chat, AiConfig } from './aiClient';

export type ModerationCategory =
  | 'ads'
  | 'spam'
  | 'off-topic'
  | 'explicit'
  | 'harassment'
  | 'self-harm-encouragement'
  | 'doxing'
  | 'illegal';

export interface ModerationResult {
  allow: boolean;
  categories: ModerationCategory[];
  reason: string;
}

const BLOCK_KEYWORDS: { kw: RegExp; cat: ModerationCategory }[] = [
  { kw: /\b(buy now|click here|promo code|discount|subscribe)\b/i, cat: 'ads' },
  { kw: /\b(onlyfans|telegram channel|t\.me\/|whatsapp\s*\+\d)/i, cat: 'ads' },
  { kw: /\b(porn|xxx|nsfw)\b/i, cat: 'explicit' },
  { kw: /\b(kill yourself|kys)\b/i, cat: 'harassment' },
];

function localCheck(text: string): ModerationResult {
  const cats: ModerationCategory[] = [];
  for (const { kw, cat } of BLOCK_KEYWORDS) {
    if (kw.test(text) && !cats.includes(cat)) cats.push(cat);
  }
  if (cats.length === 0) return { allow: true, categories: [], reason: '' };
  return { allow: false, categories: cats, reason: `Blocked by local filter: ${cats.join(', ')}` };
}

const SYSTEM = `You are a content-safety classifier for a Jewish men's shmirat-einayim (addiction recovery) app.
The community is for MUTUAL SUPPORT around urges, slips, emotional triggers, and spiritual growth.

Classify the user-submitted text. Return ONLY a compact JSON object — no prose, no markdown:
{"allow": boolean, "categories": string[], "reason": string}

Block (allow=false) if the text contains any of:
- ads / promotions / affiliate links / selling anything
- spam / link farms / repeated gibberish
- off-topic content unrelated to addiction recovery, accountability, growth, faith, or emotional support
- explicit sexual content, erotica, or links to such material
- harassment, slurs, personal attacks
- encouragement of self-harm or suicide
- doxing / sharing identifying personal info of others
- clearly illegal content

Allow (allow=true) discussions of urges, slips, shame, depression, spiritual struggle, therapy,
medication, relationships — even raw and graphic descriptions of internal experience — as long as
they are the user's own recovery journey and not designed to titillate or promote.

categories: subset of ["ads","spam","off-topic","explicit","harassment","self-harm-encouragement","doxing","illegal"].
reason: one short sentence for the user. Empty string if allow=true.`;

/**
 * Moderate a piece of user content. Falls back to local keyword check if AI
 * is not configured or fails.
 */
export async function moderate(text: string, aiConfig: AiConfig): Promise<ModerationResult> {
  const local = localCheck(text);
  if (!local.allow) return local;
  if (aiConfig.provider === 'none' || !text.trim()) return { allow: true, categories: [], reason: '' };

  try {
    const reply = await chat(aiConfig, [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: text.slice(0, 4000) },
    ]);
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { allow: true, categories: [], reason: '' };
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      allow: !!parsed.allow,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    };
  } catch {
    // AI unavailable — trust the local check only.
    return { allow: true, categories: [], reason: '' };
  }
}
