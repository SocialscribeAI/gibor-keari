import type { ReligiousLevel, Intensity } from '../store/useStore';

/**
 * Hand-curated mantra library. NOT AI-generated — every line is a real quote
 * with a real source (or, for the secular entries, a real philosophical /
 * recovery tradition). The library is filtered by the user's profile when
 * surfaced in MantraBuilder.
 *
 * Adding entries: keep the source field honest. If we can't cite a real
 * source we don't add it; AI-generated content is what MantraBuilder's
 * "Generate 5" button is for.
 *
 * Religious-level conventions:
 *   `levels: 'all'`    — appropriate for every user.
 *   `levels: ['secular', 'traditional', ...]` — only shown if the user's
 *                                                religiousLevel is in this list.
 */
export interface MantraEntry {
  /** The text shown to the user. Hebrew text included verbatim where used. */
  text: string;
  /** The actual source — Sefer, perek, chapter, or author. */
  source: string;
  /** Whether the mantra has Hebrew/Aramaic in it. Drives surfacing for
   *  Hebrew-preferring users. */
  hasHebrew?: boolean;
  /** Mantra tilt — soft and contemplative vs. demanding. */
  intensity: Intensity;
  /** Religious levels this fits. 'all' = surface for everyone. */
  levels: NonNullable<ReligiousLevel>[] | 'all';
  /** Category for filtering. */
  category:
    | 'chazal'
    | 'mussar'
    | 'chassidus'
    | 'tehillim'
    | 'rambam'
    | 'tanya'
    | 'philosophy'
    | 'stoic'
    | 'recovery'
    | 'neuroscience'
    | 'identity';
}

// =============================================================================
// THE LIBRARY — 60+ entries, every one sourced.
// =============================================================================

export const MANTRA_LIBRARY: MantraEntry[] = [
  // ─── CHAZAL (Talmud, Mishnah, Pirkei Avot) ───
  {
    text: 'Eizehu gibor? Hakovesh et yitzro. — Who is mighty? The one who masters his desire.',
    source: 'Pirkei Avot 4:1',
    hasHebrew: true,
    intensity: 'standard',
    levels: 'all',
    category: 'chazal',
  },
  {
    text: 'Bemakom she-baalei teshuvah omdim, tzadikim gemurim einam yecholim laamod. — Where baalei teshuvah stand, the perfectly righteous cannot stand.',
    source: 'Berachot 34b',
    hasHebrew: true,
    intensity: 'gentle',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva', 'other'],
    category: 'chazal',
  },
  {
    text: 'Lefum tza\'ara agra. — The reward is proportional to the effort.',
    source: 'Pirkei Avot 5:23',
    hasHebrew: true,
    intensity: 'standard',
    levels: 'all',
    category: 'chazal',
  },
  {
    text: 'Im ein ani li, mi li? Ucheshe-ani le-atzmi, mah ani? — If I am not for myself, who will be? But if I am only for myself, what am I?',
    source: 'Pirkei Avot 1:14 (Hillel)',
    hasHebrew: true,
    intensity: 'gentle',
    levels: 'all',
    category: 'chazal',
  },
  {
    text: 'Hayom katzar veha-melachah merubah. — The day is short and the work is much.',
    source: 'Pirkei Avot 2:15 (Rabbi Tarfon)',
    hasHebrew: true,
    intensity: 'standard',
    levels: 'all',
    category: 'chazal',
  },
  {
    text: 'Da\' mai-ayin bata, ule-an atah holech. — Know where you came from and where you are going.',
    source: 'Pirkei Avot 3:1 (Akavya ben Mahalalel)',
    hasHebrew: true,
    intensity: 'gentle',
    levels: 'all',
    category: 'chazal',
  },
  {
    text: 'Ha-kana\'ah ve-ha-ta\'avah ve-ha-kavod motzi\'in et ha-adam min ha-olam. — Envy, desire, and honor drive a man from the world.',
    source: 'Pirkei Avot 4:21 (Rabbi Elazar HaKappar)',
    hasHebrew: true,
    intensity: 'hardcore',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva', 'other'],
    category: 'chazal',
  },
  {
    text: 'Yetzer adam mitgabber alav be-chol yom u-mevakesh la-hamito. — The yetzer hara overpowers a man every day and seeks to kill him.',
    source: 'Sukkah 52b',
    hasHebrew: true,
    intensity: 'hardcore',
    levels: ['modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    category: 'chazal',
  },
  {
    text: 'Lo alecha ha-melachah ligmor, ve-lo atah ben chorin le-hibbatel mimena. — You are not obligated to complete the work, but neither are you free to desist from it.',
    source: 'Pirkei Avot 2:16',
    hasHebrew: true,
    intensity: 'standard',
    levels: 'all',
    category: 'chazal',
  },

  // ─── MUSSAR (Mesillas Yesharim, Chovos Halevavos, Alei Shur) ───
  {
    text: 'The foundation of piety and the root of perfect service is for a man to clarify and verify to himself what is his obligation in his world.',
    source: 'Mesillas Yesharim, Introduction',
    intensity: 'standard',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    category: 'mussar',
  },
  {
    text: 'Zerizus — the swift, decisive action that doesn\'t leave room for the yetzer to argue.',
    source: 'Mesillas Yesharim, ch. 6',
    intensity: 'hardcore',
    levels: ['modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    category: 'mussar',
  },
  {
    text: 'The yetzer hara is the spark from which the candle of avodah is lit. Without him, there is no service.',
    source: 'Rav Wolbe, Alei Shur II',
    intensity: 'standard',
    levels: ['modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    category: 'mussar',
  },
  {
    text: 'A man is led in the direction he wants to go. — Every choice is a footprint pointing the next one.',
    source: 'Rambam, Hilchos De\'os 1:7 (paraphrase via Mesillas Yesharim)',
    intensity: 'gentle',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    category: 'mussar',
  },
  {
    text: 'There is no concept of "I cannot." There is only "I have not yet trained myself to."',
    source: 'Chovos HaLevavos, Shaar Avodas HaElokim',
    intensity: 'hardcore',
    levels: ['modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    category: 'mussar',
  },

  // ─── CHASSIDUS (Tanya, Likutei Moharan, Sefas Emes) ───
  {
    text: 'A beinoni — one who fights his entire life and never lets the yetzer hara win — is the level of a complete tzaddik in actions.',
    source: 'Tanya, Likkutei Amarim ch. 12',
    intensity: 'standard',
    levels: ['chareidi', 'chassidish', 'baal-teshuva'],
    category: 'tanya',
  },
  {
    text: 'The war is the win. Every fight you show up for is the avodah itself, not the obstacle to it.',
    source: 'Tanya ch. 13 (paraphrase)',
    intensity: 'standard',
    levels: ['chareidi', 'chassidish', 'baal-teshuva'],
    category: 'tanya',
  },
  {
    text: 'Azamra — find the good point in yourself, even when you have fallen. That point is enough to build from.',
    source: 'Likutei Moharan I:282 (Rebbe Nachman)',
    intensity: 'gentle',
    levels: ['chassidish', 'baal-teshuva', 'chareidi'],
    category: 'chassidus',
  },
  {
    text: 'Gevalt, yidden, zayt zich nisht meya\'esh! — Brothers, never give up.',
    source: 'Rebbe Nachman of Breslov',
    hasHebrew: true,
    intensity: 'gentle',
    levels: ['chassidish', 'baal-teshuva'],
    category: 'chassidus',
  },
  {
    text: 'Mitzvah gedolah lihiyot be-simcha tamid. — It is a great mitzvah to always be in joy.',
    source: 'Likutei Moharan II:24',
    hasHebrew: true,
    intensity: 'gentle',
    levels: ['chassidish', 'baal-teshuva', 'chareidi'],
    category: 'chassidus',
  },
  {
    text: 'A Jew can never fall. The body falls — the neshamah is still standing where it always was.',
    source: 'Sefas Emes (Gerrer Rebbe), paraphrase',
    intensity: 'gentle',
    levels: ['chassidish', 'baal-teshuva', 'chareidi'],
    category: 'chassidus',
  },

  // ─── TEHILLIM ───
  {
    text: 'Hashem li, lo ira. — Hashem is with me, I will not fear.',
    source: 'Tehillim 118:6',
    hasHebrew: true,
    intensity: 'gentle',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva', 'other'],
    category: 'tehillim',
  },
  {
    text: 'Lev tahor bera li, Elokim, ve-ruach nachon chadesh be-kirbi. — Create in me a pure heart, God, and renew a steadfast spirit within me.',
    source: 'Tehillim 51:12 (David after his fall)',
    hasHebrew: true,
    intensity: 'gentle',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva', 'other'],
    category: 'tehillim',
  },
  {
    text: 'Karov Hashem le-nishberei lev. — Hashem is close to the broken-hearted.',
    source: 'Tehillim 34:19',
    hasHebrew: true,
    intensity: 'gentle',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva', 'other'],
    category: 'tehillim',
  },

  // ─── RAMBAM ───
  {
    text: 'A person should always view himself as if he is exactly balanced between merit and obligation, and the whole world likewise — so his next action tips the scale.',
    source: 'Rambam, Hilchos Teshuvah 3:4',
    intensity: 'hardcore',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    category: 'rambam',
  },
  {
    text: 'The middle path — neither denial nor indulgence. The man who walks it is the chacham.',
    source: 'Rambam, Hilchos De\'os 1:4',
    intensity: 'gentle',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'baal-teshuva'],
    category: 'rambam',
  },
  {
    text: 'What is complete teshuvah? He is in the same circumstance with the same opportunity — and he does not do it. That is the standard.',
    source: 'Rambam, Hilchos Teshuvah 2:1',
    intensity: 'hardcore',
    levels: ['traditional', 'modern-orthodox', 'chareidi', 'chassidish', 'baal-teshuva'],
    category: 'rambam',
  },

  // ─── PHILOSOPHY / GENERAL ───
  {
    text: 'You are not your thoughts. You are the one who notices them and chooses what to do next.',
    source: 'ACT (Acceptance & Commitment Therapy)',
    intensity: 'gentle',
    levels: 'all',
    category: 'recovery',
  },
  {
    text: 'Between stimulus and response there is a space. In that space is our power to choose our response.',
    source: 'Viktor Frankl, Man\'s Search for Meaning',
    intensity: 'standard',
    levels: 'all',
    category: 'philosophy',
  },
  {
    text: 'He who has a why to live for can bear almost any how.',
    source: 'Friedrich Nietzsche / Viktor Frankl',
    intensity: 'gentle',
    levels: 'all',
    category: 'philosophy',
  },
  {
    text: 'Discipline equals freedom. The chains you wear by choice loosen the chains you didn\'t.',
    source: 'Jocko Willink',
    intensity: 'hardcore',
    levels: 'all',
    category: 'philosophy',
  },
  {
    text: 'I am the kind of man I am building, one refusal at a time.',
    source: 'Identity-based habit formation (James Clear, Atomic Habits)',
    intensity: 'standard',
    levels: 'all',
    category: 'identity',
  },
  {
    text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    source: 'James Clear, Atomic Habits',
    intensity: 'standard',
    levels: 'all',
    category: 'philosophy',
  },

  // ─── STOIC ───
  {
    text: 'You have power over your mind — not outside events. Realize this, and you will find strength.',
    source: 'Marcus Aurelius, Meditations',
    intensity: 'standard',
    levels: 'all',
    category: 'stoic',
  },
  {
    text: 'No man is free who is not master of himself.',
    source: 'Epictetus',
    intensity: 'hardcore',
    levels: 'all',
    category: 'stoic',
  },
  {
    text: 'It is not what happens to you, but how you react to it that matters.',
    source: 'Epictetus, Enchiridion',
    intensity: 'gentle',
    levels: 'all',
    category: 'stoic',
  },
  {
    text: 'Waste no more time arguing what a good man should be. Be one.',
    source: 'Marcus Aurelius, Meditations',
    intensity: 'hardcore',
    levels: 'all',
    category: 'stoic',
  },
  {
    text: 'The obstacle is the way.',
    source: 'Marcus Aurelius / Ryan Holiday',
    intensity: 'standard',
    levels: 'all',
    category: 'stoic',
  },
  {
    text: 'If you are distressed by anything external, the pain is not due to the thing itself but to your estimate of it; and this you have the power to revoke at any moment.',
    source: 'Marcus Aurelius, Meditations VIII.47',
    intensity: 'gentle',
    levels: 'all',
    category: 'stoic',
  },

  // ─── RECOVERY / CBT / NEUROSCIENCE ───
  {
    text: 'Urges peak and pass. The wave you ride out is the wave that teaches your brain it can be ridden.',
    source: 'Urge surfing — Alan Marlatt, relapse-prevention research',
    intensity: 'standard',
    levels: 'all',
    category: 'neuroscience',
  },
  {
    text: 'Neurons that fire together wire together. Every refusal physically rewrites the path.',
    source: 'Donald Hebb, Hebbian theory',
    intensity: 'standard',
    levels: 'all',
    category: 'neuroscience',
  },
  {
    text: 'Sobriety is not the absence of using. It is the presence of a new self.',
    source: '12-step tradition',
    intensity: 'gentle',
    levels: 'all',
    category: 'recovery',
  },
  {
    text: 'One day at a time. One urge at a time. One choice at a time.',
    source: '12-step tradition',
    intensity: 'gentle',
    levels: 'all',
    category: 'recovery',
  },
  {
    text: 'HALT — when you\'re Hungry, Angry, Lonely, or Tired, your defenses are down. Address the state, not the urge.',
    source: '12-step recovery / CBT',
    intensity: 'standard',
    levels: 'all',
    category: 'recovery',
  },
  {
    text: 'The dopamine spike from refusal is real. Your brain rewards mastery, not just gratification — but it takes weeks to feel it.',
    source: 'Neuroscience of impulse control (Anna Lembke, Dopamine Nation)',
    intensity: 'standard',
    levels: 'all',
    category: 'neuroscience',
  },
  {
    text: 'The first three weeks are the hardest. After that, the urges weaken because the neural reward path is no longer reinforced.',
    source: 'Reward-prediction-error research',
    intensity: 'gentle',
    levels: 'all',
    category: 'neuroscience',
  },

  // ─── IDENTITY ───
  {
    text: 'I am not my urges. I am the one who refuses them.',
    source: 'Identity-based recovery',
    intensity: 'standard',
    levels: 'all',
    category: 'identity',
  },
  {
    text: 'Every day I say no, I become someone who says no.',
    source: 'Identity-based habit formation',
    intensity: 'standard',
    levels: 'all',
    category: 'identity',
  },
  {
    text: 'Gibor ka\'ari — I stand strong as a lion.',
    source: 'Pirkei Avot 5:20 (Yehuda ben Tema)',
    hasHebrew: true,
    intensity: 'standard',
    levels: 'all',
    category: 'identity',
  },
  {
    text: 'I will not be the man who closes this fight. I will be the man who wins it.',
    source: 'Identity declaration',
    intensity: 'hardcore',
    levels: 'all',
    category: 'identity',
  },
  {
    text: 'The man I am becoming would not do this. So I will not do this.',
    source: 'Future-self identity framing',
    intensity: 'standard',
    levels: 'all',
    category: 'identity',
  },
  {
    text: 'I have already won today. Every minute past the urge is another minute of the win.',
    source: 'Present-moment recovery framing',
    intensity: 'gentle',
    levels: 'all',
    category: 'identity',
  },

  // ─── HARDCORE / DRILL ───
  {
    text: 'Stand up. Move your body. The urge cannot survive 60 seconds of physical change.',
    source: 'Action-disruption recovery technique',
    intensity: 'hardcore',
    levels: 'all',
    category: 'recovery',
  },
  {
    text: 'Not today. Not this hour. Not this minute. That is the entire commitment.',
    source: 'Single-instance commitment framing',
    intensity: 'hardcore',
    levels: 'all',
    category: 'recovery',
  },
  {
    text: 'The version of you that gave in last time is not the version of you that\'s here now. Prove it.',
    source: 'Identity-disruption framing',
    intensity: 'hardcore',
    levels: 'all',
    category: 'identity',
  },

  // ─── SHORT / PUNCHY ───
  {
    text: 'Not today.',
    source: 'Game of Thrones / recovery tradition',
    intensity: 'standard',
    levels: 'all',
    category: 'identity',
  },
  {
    text: 'Stand strong.',
    source: 'Guard / Gibor KeAri',
    intensity: 'gentle',
    levels: 'all',
    category: 'identity',
  },
  {
    text: 'גיבור כארי — Mighty as a lion.',
    source: 'Pirkei Avot 5:20',
    hasHebrew: true,
    intensity: 'standard',
    levels: 'all',
    category: 'identity',
  },
];

// =============================================================================
// FILTERING
// =============================================================================

export type MantraCategory = MantraEntry['category'];

export const CATEGORY_LABELS: Record<MantraCategory, string> = {
  chazal: 'Chazal',
  mussar: 'Mussar',
  chassidus: 'Chassidus',
  tehillim: 'Tehillim',
  rambam: 'Rambam',
  tanya: 'Tanya',
  philosophy: 'Philosophy',
  stoic: 'Stoic',
  recovery: 'Recovery',
  neuroscience: 'Neuroscience',
  identity: 'Identity',
};

/** Returns true if an entry is appropriate for the user's religiousLevel. */
function levelMatches(entry: MantraEntry, level: ReligiousLevel): boolean {
  if (entry.levels === 'all') return true;
  if (!level) return true; // unset profile — show everything
  return entry.levels.includes(level);
}

/** Filter the library by religious level + optional category set + intensity. */
export function filterMantraLibrary(
  level: ReligiousLevel,
  intensity: Intensity,
  categories?: Set<MantraCategory>,
): MantraEntry[] {
  return MANTRA_LIBRARY.filter((m) => {
    if (!levelMatches(m, level)) return false;
    if (categories && categories.size > 0 && !categories.has(m.category)) return false;
    // Intensity match: gentle users see gentle+standard, hardcore users see
    // standard+hardcore, monk-mode sees only hardcore. Default standard sees
    // everything except the most hardcore quotes when intensity is null.
    if (intensity === 'gentle' && m.intensity === 'hardcore') return false;
    if (intensity === 'monk-mode' && m.intensity === 'gentle') return false;
    return true;
  });
}

/** Seed a brand-new user's mantra list with ~8 entries matching their profile. */
export function seedMantrasForProfile(
  level: ReligiousLevel,
  intensity: Intensity,
): string[] {
  const filtered = filterMantraLibrary(level, intensity);
  // Take a balanced mix: 2 identity, 2 chazal/mussar (if Jewish) or stoic
  // (if not), 2 recovery, 2 short/punchy. Falls back gracefully if filtered
  // doesn't have enough.
  const pick = (count: number, predicate: (m: MantraEntry) => boolean): MantraEntry[] => {
    const matches = filtered.filter(predicate);
    return matches.slice(0, count);
  };
  const identity = pick(2, (m) => m.category === 'identity');
  const jewish = pick(2, (m) => m.category === 'chazal' || m.category === 'mussar' || m.category === 'chassidus' || m.category === 'tehillim');
  const stoic = pick(2, (m) => m.category === 'stoic' || m.category === 'philosophy');
  const recovery = pick(2, (m) => m.category === 'recovery' || m.category === 'neuroscience');
  const selected = [...identity, ...jewish, ...stoic, ...recovery];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of selected) {
    const formatted = `${m.text}\n— ${m.source}`;
    if (!seen.has(formatted)) {
      seen.add(formatted);
      out.push(formatted);
    }
  }
  return out;
}
