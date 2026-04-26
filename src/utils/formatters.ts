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
