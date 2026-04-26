import { useStore } from '../store/useStore';
import { format, isValid } from 'date-fns';
import { useMemo } from 'react';

/**
 * Custom hook to compute and format streak data 
 * from the persistent Gibor KeAri store.
 */
export function useStreak() {
  const { currentStreak, longestStreak, streakStart } = useStore();

  const formattedStartDate = useMemo(() => {
    if (!streakStart) return 'Not started';
    const date = new Date(streakStart);
    return isValid(date) ? format(date, 'MMM do, yyyy') : 'Invalid date';
  }, [streakStart]);

  const level = useMemo(() => {
    // Lion progression — the cub grows into a gibor ka'ari.
    if (currentStreak >= 365) return 'King of the Pride';
    if (currentStreak >= 180) return 'Pride Leader';
    if (currentStreak >= 90) return 'Gibor KeAri';
    if (currentStreak >= 30) return 'Lion';
    if (currentStreak >= 14) return 'Young Lion';
    if (currentStreak >= 7) return 'Cub on its Feet';
    return 'New Cub';
  }, [currentStreak]);

  return {
    currentStreak,
    longestStreak,
    formattedStartDate,
    level,
    isActive: !!streakStart
  };
}
