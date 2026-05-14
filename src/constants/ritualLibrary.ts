import type { ReligiousLevel } from '../store/useStore';

/**
 * Ritual library — curated starter rituals across six categories.
 *
 * Mirror rituals get their own category because the user explicitly asked
 * for them (Phase 4.2): saying your identity statement / mantras aloud to
 * your reflection is one of the strongest interventions in the literature —
 * harder to lie to a mirror than to a screen.
 */

export type RitualCategory =
  | 'morning'
  | 'evening'
  | 'mirror'
  | 'spiritual'
  | 'physical'
  | 'danger-window';

export interface RitualEntry {
  text: string;
  category: RitualCategory;
  /** Suggested default time in HH:mm. Drives the per-ritual notification. */
  suggestedTime?: string;
  /** Religious level filter. 'all' = appropriate for everyone. */
  levels: NonNullable<ReligiousLevel>[] | 'all';
  /** One-sentence why-it-helps for users browsing. */
  why?: string;
}

export const RITUAL_LIBRARY: RitualEntry[] = [
  // ─── MORNING ───
  {
    text: 'Modeh Ani — out loud, with kavanah',
    category: 'morning',
    suggestedTime: '06:30',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    why: 'The first thought of the day is gratitude. Sets the spiritual tone before the urges have a foothold.',
  },
  {
    text: 'Daven Shacharit with intention',
    category: 'morning',
    suggestedTime: '07:00',
    levels: ['modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    why: 'A man who starts his day before Hashem has already committed to his identity.',
  },
  {
    text: 'Drink a full glass of cold water immediately',
    category: 'morning',
    suggestedTime: '06:30',
    levels: 'all',
    why: 'Cold water signals the nervous system that the day is on. Cheap, effective, no excuses.',
  },
  {
    text: '10 minutes of learning or reading',
    category: 'morning',
    suggestedTime: '07:30',
    levels: 'all',
    why: 'The first hour shapes the day. Fill it with what you want to grow.',
  },
  {
    text: 'Take a 5-minute walk outside',
    category: 'morning',
    suggestedTime: '07:00',
    levels: 'all',
    why: 'Sunlight in the first hour sets your circadian rhythm and reduces evening risk.',
  },
  {
    text: 'Write down one specific intention for today',
    category: 'morning',
    suggestedTime: '07:15',
    levels: 'all',
    why: 'Intentions you wrote are 3× more likely to happen than intentions you only thought.',
  },

  // ─── EVENING ───
  {
    text: 'Recite Shema with full kavanah before sleep',
    category: 'evening',
    suggestedTime: '22:30',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    why: 'Closes the day with Hashem. The last thought before sleep imprints the most.',
  },
  {
    text: 'Phone in the kitchen drawer, plugged in, by 22:00',
    category: 'evening',
    suggestedTime: '22:00',
    levels: 'all',
    why: 'The single most-mentioned tactic in recovery testimonies. Distance from the device wins more battles than willpower.',
  },
  {
    text: 'Brief review: did I keep my word to myself today?',
    category: 'evening',
    suggestedTime: '22:15',
    levels: 'all',
    why: 'One honest sentence written each night builds the habit of self-accountability faster than any other practice.',
  },
  {
    text: 'No screens 30 minutes before bed',
    category: 'evening',
    suggestedTime: '22:00',
    levels: 'all',
    why: 'Late-night blue light is the #1 correlate of late-night falls in the literature.',
  },
  {
    text: 'Read one paragraph of mussar or philosophy',
    category: 'evening',
    suggestedTime: '22:30',
    levels: 'all',
    why: 'A single paragraph is more durable than a chapter you didn\'t finish.',
  },

  // ─── MIRROR RITUALS ───
  {
    text: 'Look yourself in the eye and say your identity statement aloud',
    category: 'mirror',
    suggestedTime: '07:00',
    levels: 'all',
    why: 'You cannot lie to your own face. Saying it aloud activates a different neural circuit than thinking it.',
  },
  {
    text: 'In the mirror: name three things you\'re grateful for today',
    category: 'mirror',
    suggestedTime: '07:30',
    levels: 'all',
    why: 'Spoken gratitude facing your reflection trains the brain to associate your image with the practice.',
  },
  {
    text: 'In the mirror: "I am the man my children / future family need."',
    category: 'mirror',
    levels: 'all',
    why: 'Identity statement framed by purpose. Tying the work to people outside yourself is the hardest framing to argue against.',
  },
  {
    text: 'Mirror declaration: "Today I am a gibor."',
    category: 'mirror',
    suggestedTime: '07:00',
    levels: 'all',
    why: 'Repeated daily, this becomes the default self-image — the urge becomes a violation of who you already are.',
  },
  {
    text: 'After a fall: look in the mirror and say "I am still the man who fights this. Tomorrow I will fight again."',
    category: 'mirror',
    levels: 'all',
    why: 'Recovery research is clear: how you talk to yourself after a fall matters more than the fall itself.',
  },

  // ─── SPIRITUAL ───
  {
    text: 'Say one perek of Tehillim out loud',
    category: 'spiritual',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    why: 'Choose your perek — Tehillim 27 (lecha amar libi) is the recovery standard.',
  },
  {
    text: 'Light learning during the dangerous hour',
    category: 'danger-window',
    levels: ['modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    why: 'Pre-commit to a chavrusa or shiur during your risk window. Hardest to fall when you\'re mid-Gemara.',
  },
  {
    text: 'Give tzedakah — even one shekel — when the urge strikes',
    category: 'spiritual',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    why: 'Channel the energy into another. Disrupts the loop AND builds something.',
  },
  {
    text: 'Read the daily Tanya / Chumash / Mishna Yomis',
    category: 'spiritual',
    suggestedTime: '08:00',
    levels: ['chareidi', 'chassidish', 'baal-teshuva'],
    why: 'A small commitment, kept daily, builds a man who keeps commitments.',
  },

  // ─── PHYSICAL ───
  {
    text: '20 pushups every morning',
    category: 'physical',
    suggestedTime: '07:00',
    levels: 'all',
    why: 'Physical effort first thing teaches the brain to expect discomfort. Makes everything else easier.',
  },
  {
    text: '60-second cold shower at the end of your normal shower',
    category: 'physical',
    levels: 'all',
    why: 'Voluntary discomfort, daily. The single best training for "I can do hard things on purpose."',
  },
  {
    text: '30-minute walk every day, no phone',
    category: 'physical',
    suggestedTime: '18:00',
    levels: 'all',
    why: 'The walk itself is good. The hour without your phone is better.',
  },
  {
    text: 'Stretch for 5 minutes before bed',
    category: 'physical',
    suggestedTime: '22:15',
    levels: 'all',
    why: 'Lowers cortisol; better sleep means fewer late-night urges.',
  },

  // ─── DANGER WINDOW ───
  {
    text: 'Move the laptop to a different room at 22:00',
    category: 'danger-window',
    suggestedTime: '22:00',
    levels: 'all',
    why: 'Pre-commit when you\'re strong; the device is the trigger you can physically remove.',
  },
  {
    text: 'Text a partner / friend "still standing" at your danger hour',
    category: 'danger-window',
    levels: 'all',
    why: 'Public accountability — even one person — beats private willpower by a wide margin.',
  },
  {
    text: 'Leave the house for 10 minutes at your danger hour',
    category: 'danger-window',
    levels: 'all',
    why: 'Change the room. The urge is location-anchored more than it feels.',
  },
];

export const CATEGORY_LABELS: Record<RitualCategory, string> = {
  morning: 'Morning',
  evening: 'Evening',
  mirror: 'Mirror',
  spiritual: 'Spiritual',
  physical: 'Physical',
  'danger-window': 'Danger window',
};

export const CATEGORY_ORDER: RitualCategory[] = [
  'morning',
  'mirror',
  'spiritual',
  'physical',
  'danger-window',
  'evening',
];

function levelMatches(entry: RitualEntry, level: ReligiousLevel): boolean {
  if (entry.levels === 'all') return true;
  if (!level) return true;
  return entry.levels.includes(level);
}

export function filterRitualLibrary(
  level: ReligiousLevel,
  categories?: Set<RitualCategory>,
): RitualEntry[] {
  return RITUAL_LIBRARY.filter((r) => {
    if (!levelMatches(r, level)) return false;
    if (categories && categories.size > 0 && !categories.has(r.category)) return false;
    return true;
  });
}
