/**
 * Formats a number as a string with leading zeros
 */
export function formatStreak(count: number): string {
  return count.toString().padStart(2, '0');
}

/**
 * Calculates percentage of goal reached
 */
export function calculateProgress(current: number, goal: number): number {
  return Math.min(100, Math.round((current / goal) * 100));
}

/**
 * Calendar-days between two dates, measured by the user's *local* clock.
 * `date-fns`' differenceInDays is UTC-aware against UTC midnight, which makes
 * a user in UTC-5 see their streak roll over at 19:00 local — wrong.
 */
export function localDaysBetween(a: Date, b: Date): number {
  const aDay = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bDay = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((bDay - aDay) / 86_400_000);
}
