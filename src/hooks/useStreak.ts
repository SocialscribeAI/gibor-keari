import { useStore } from '../store/useStore';
import { format, isValid } from 'date-fns';
import { useMemo } from 'react';
import { rankForStreak, nextRankForStreak } from '../constants/milestones';

/**
 * Custom hook to compute and format streak data from the persistent Gibor
 * KeAri store. Rank names + tagline come from the centralized milestones
 * constants so the ladder is a single source of truth.
 */
export function useStreak() {
  const { currentStreak, longestStreak, streakStart } = useStore();

  const formattedStartDate = useMemo(() => {
    if (!streakStart) return 'Not started';
    const date = new Date(streakStart);
    return isValid(date) ? format(date, 'MMM do, yyyy') : 'Invalid date';
  }, [streakStart]);

  const rank = useMemo(() => rankForStreak(currentStreak), [currentStreak]);
  const nextRank = useMemo(() => nextRankForStreak(currentStreak), [currentStreak]);
  const daysToNextRank = nextRank ? nextRank.day - currentStreak : 0;

  return {
    currentStreak,
    longestStreak,
    formattedStartDate,
    /** Short rank label, e.g. "Young Lion". Backwards-compat with old `level`. */
    level: rank.name,
    rank,
    nextRank,
    daysToNextRank,
    isActive: !!streakStart,
  };
}
