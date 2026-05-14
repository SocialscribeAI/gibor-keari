/**
 * Milestone ladder — single source of truth.
 *
 * The rank names are deliberately weighty. Recovery from compulsive behavior
 * is more like learning to be a man than collecting badges; the names should
 * sound earned. The lion progression is from the cub who can't yet open its
 * eyes through to "Gibor KeAri" — the namesake of the app, claimed only at
 * a year.
 *
 * Rank text format chosen for the streak ring badge:
 *   - `name`  — short, fits in the badge chip (≤14 chars)
 *   - `tagline` — one sentence shown in MilestoneCelebration and the next-rank
 *     teaser
 */
export interface Milestone {
  /** Days into the current streak when this rank is reached. */
  day: number;
  /** Short badge label — keep ≤14 chars so it fits the streak ring chip. */
  name: string;
  /** One-sentence flavor for celebration and teaser. */
  tagline: string;
}

export const MILESTONES: Milestone[] = [
  { day: 0,   name: 'Awakened',          tagline: 'The eyes open. The fight begins.' },
  { day: 7,   name: 'Cub on Its Feet',   tagline: 'A week is no small thing. The cub stands.' },
  { day: 14,  name: 'Claws Sharpening',  tagline: 'Two weeks. The body remembers who it answers to.' },
  { day: 30,  name: 'Young Lion',        tagline: 'A month. The voice deepens. The hunt begins.' },
  { day: 60,  name: 'Of the Pride',      tagline: 'Two months. You are someone other men can lean on.' },
  { day: 90,  name: 'Lion Standing',     tagline: 'Three months. The mane fills in. You stand without flinching.' },
  { day: 180, name: 'Lion of Yehuda',    tagline: 'Six months. A king\'s posture. A king\'s patience.' },
  { day: 365, name: 'Gibor KeAri',       tagline: 'A full year. The name is yours. גיבור כארי — mighty as a lion.' },
];

/** Days at which the celebration overlay fires (first crossing only). */
export const CELEBRATION_DAYS = MILESTONES.filter((m) => m.day > 0).map((m) => m.day);

/** Find the rank for a given streak length. Returns the highest rank reached. */
export function rankForStreak(days: number): Milestone {
  let current = MILESTONES[0];
  for (const m of MILESTONES) {
    if (days >= m.day) current = m;
    else break;
  }
  return current;
}

/** Find the next unreached rank. Returns null once the user is past day 365. */
export function nextRankForStreak(days: number): Milestone | null {
  return MILESTONES.find((m) => m.day > days) ?? null;
}
