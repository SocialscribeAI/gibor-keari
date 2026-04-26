import type {
  Tone,
  ReligiousLevel,
  TriggerTag,
  PersonalityProfile,
} from '../store/useStore';

// =============================================================================
// Content tagging — every piece of user-facing content in Guard (mantras,
// tactics, rituals, reframes, intel articles) carries these tags. The selector
// filters & ranks content by how well it matches the user's 12-axis profile.
// =============================================================================

export type ContentTone = Exclude<Tone, null | 'custom'> | 'neutral';

export type ContentReligion =
  | 'secular'
  | 'traditional'
  | 'modern-orthodox'
  | 'chareidi'
  | 'christian'
  | 'muslim'
  | 'universal';

export type ContentTime = 'panic' | 'quick' | 'medium' | 'deep'; // <30s / 2m / 5-15m / 30m+

export type ContentCategory =
  | 'body'
  | 'mind'
  | 'social'
  | 'spirit'
  | 'reframe'
  | 'emergency'
  | 'environment'
  | 'long-form';

export interface ContentTags {
  tone: ContentTone[]; // works for these tones (empty = all)
  religion: ContentReligion[]; // works for these religious frames
  triggers: TriggerTag[]; // which triggers this helps with
  time: ContentTime;
  category?: ContentCategory;
}

export interface TaggedContent {
  id: string;
  title: string;
  body: string;
  source?: string; // attribution — book/study/clinician
  tags: ContentTags;
}

// =============================================================================
// Selector utilities
// =============================================================================

/**
 * Score a piece of content against a personality profile.
 * Higher = better match. 0 or below = poor fit, likely hidden.
 */
export const scoreContent = (
  content: TaggedContent,
  profile: PersonalityProfile
): number => {
  let score = 0;
  const { tags } = content;

  // --- Tone match ---
  if (tags.tone.length === 0) {
    score += 1; // universal
  } else if (profile.tone && profile.tone !== 'custom') {
    if (tags.tone.includes(profile.tone as ContentTone)) score += 3;
    else score -= 2;
  } else if (tags.tone.includes('neutral')) {
    score += 1;
  }

  // --- Religion match ---
  if (tags.religion.includes('universal')) {
    score += 1;
  } else if (profile.religiousLevel && profile.religiousLevel !== 'custom') {
    if (tags.religion.includes(profile.religiousLevel as ContentReligion)) {
      score += 3;
    } else if (
      profile.religiousLevel === 'secular' &&
      (tags.religion.includes('modern-orthodox') ||
        tags.religion.includes('chareidi') ||
        tags.religion.includes('traditional'))
    ) {
      // Secular users should NOT see frum-only content
      score -= 10;
    }
  }

  // --- Trigger match ---
  const userTriggers = profile.primaryTriggers ?? [];
  const overlap = tags.triggers.filter((t) => userTriggers.includes(t));
  score += overlap.length * 2;

  // --- Learning style (for category/time hints) ---
  if (profile.learningStyle === 'read' && tags.category === 'long-form') score += 1;
  if (profile.learningStyle === 'do' && tags.category === 'body') score += 1;
  if (profile.learningStyle === 'talk' && tags.category === 'mind') score += 1;
  if (profile.learningStyle === 'listen' && tags.time === 'medium') score += 1;

  return score;
};

/**
 * Filter content down to items that are relevant for this user, sorted by
 * relevance. Items with score <= -5 (hard mismatch, e.g. frum content for
 * a secular user) are excluded.
 */
export const selectContent = <T extends TaggedContent>(
  items: T[],
  profile: PersonalityProfile
): T[] => {
  return items
    .map((c) => ({ c, score: scoreContent(c, profile) }))
    .filter((x) => x.score > -5)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);
};

/**
 * For panic/close-call use — pick the single most relevant "panic-time" item.
 */
export const selectForPanic = <T extends TaggedContent>(
  items: T[],
  profile: PersonalityProfile,
  urgency: ContentTime = 'panic'
): T | null => {
  const candidates = items.filter((c) => c.tags.time === urgency);
  if (candidates.length === 0) return null;
  const sorted = selectContent(candidates, profile);
  return sorted[0] ?? null;
};

/**
 * Filter by any explicit trigger (e.g. user just tagged "loneliness" on a fall)
 */
export const selectForTrigger = <T extends TaggedContent>(
  items: T[],
  profile: PersonalityProfile,
  trigger: TriggerTag
): T[] => {
  const matches = items.filter((c) => c.tags.triggers.includes(trigger));
  return selectContent(matches, profile);
};
