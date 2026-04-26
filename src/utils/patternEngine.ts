import { format, parseISO, eachDayOfInterval, subDays, isSameMonth, getDay, getHours } from 'date-fns';
import type { LogEntry } from '../store/useStore';

export type { LogEntry };
export type CalendarLog = Record<string, LogEntry>;
export type CheckInTimes = Record<string, string[]>; // Maps 'yyyy-MM-dd' to ISO strings or times

export interface StreakRecord {
  start: string;
  end: string;
  length: number;
}

export interface MonthSummary {
  wins: number;
  falls: number;
  mediums: number;
  streakInMonth: number;
  percentClean: number;
}

export type MotivationLevel = 'critical' | 'struggling' | 'building' | 'thriving';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Returns an array of weekday names where falls occur most (threshold: 2+)
 */
export const getDangerDays = (log: CalendarLog): string[] => {
  const fallCounts = Array(7).fill(0);
  
  Object.entries(log).forEach(([dateStr, status]) => {
    if (status === 'fall') {
      const dayIdx = getDay(parseISO(dateStr));
      fallCounts[dayIdx]++;
    }
  });

  return WEEKDAYS.filter((_, idx) => fallCounts[idx] >= 2);
};

/**
 * Returns the most common hour range of falls based on check-in timestamps.
 * Returns a string like "10:00 PM - 11:00 PM"
 */
export const getDangerHours = (log: CalendarLog, checkInTimes: CheckInTimes): string | null => {
  const hourCounts = Array(24).fill(0);
  let totalFalls = 0;

  Object.entries(log).forEach(([dateStr, status]) => {
    if (status === 'fall' && checkInTimes[dateStr]) {
      checkInTimes[dateStr].forEach(isoStr => {
        const hour = getHours(parseISO(isoStr));
        hourCounts[hour]++;
        totalFalls++;
      });
    }
  });

  if (totalFalls === 0) return null;

  const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
  const start = maxHour;
  const end = (maxHour + 1) % 24;

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:00 ${period}`;
  };

  return `${formatHour(start)} - ${formatHour(end)}`;
};

/**
 * Calculates the longest consecutive win streak leading up to (and including) today.
 */
export const getLongestCurrentStreak = (log: CalendarLog): number => {
  const sortedDates = Object.keys(log).sort().reverse();
  let currentStreak = 0;

  for (const date of sortedDates) {
    if (log[date] === 'win') {
      currentStreak++;
    } else if (log[date] === 'fall') {
      break; 
    }
  }

  return currentStreak;
};

/**
 * Generates a summary for a specific month.
 */
export const getMonthSummary = (log: CalendarLog, year: number, monthLabels: number): MonthSummary => {
  const targetPrefix = `${year}-${String(monthLabels + 1).padStart(2, '0')}`;
  
  let wins = 0;
  let falls = 0;
  let mediums = 0;
  let currentMonthStreak = 0;
  let maxMonthStreak = 0;

  // Sorting keys to process chronologically for month-specific streak
  const keys = Object.keys(log).filter(k => k.startsWith(targetPrefix)).sort();

  keys.forEach(key => {
    const status = log[key];
    if (status === 'win') {
      wins++;
      currentMonthStreak++;
      maxMonthStreak = Math.max(maxMonthStreak, currentMonthStreak);
    } else if (status === 'fall') {
      falls++;
      currentMonthStreak = 0;
    } else {
      mediums++;
    }
  });

  const total = wins + falls;
  const percentClean = total > 0 ? Math.round((wins / total) * 100) : 0;

  return {
    wins,
    falls,
    mediums,
    streakInMonth: maxMonthStreak,
    percentClean
  };
};

/**
 * Returns an array of all past streak intervals and their lengths.
 */
export const getStreakHistory = (log: CalendarLog): StreakRecord[] => {
  const sortedDates = Object.keys(log).sort();
  const history: StreakRecord[] = [];
  
  let currentStart: string | null = null;
  let currentLen = 0;

  sortedDates.forEach((date, idx) => {
    if (log[date] === 'win') {
      if (currentStart === null) currentStart = date;
      currentLen++;
    }
    
    // If it's a fall or the last item, close the current streak
    if (log[date] === 'fall' || idx === sortedDates.length - 1) {
      if (currentStart && currentLen > 0) {
        history.push({
          start: currentStart,
          end: log[date] === 'win' ? date : sortedDates[idx-1] || currentStart,
          length: currentLen
        });
      }
      currentStart = null;
      currentLen = 0;
    }
  });

  return history;
};

/**
 * Returns a human-readable insight based on historical patterns.
 */
export const getInsightMessage = (log: CalendarLog): string => {
  const dangerDays = getDangerDays(log);
  
  if (dangerDays.length > 0) {
    const daysStr = dangerDays.join('s and ') + 's';
    if (dangerDays.includes('Friday')) {
      return `You've struggled on Fridays — consider extra precautions before Shabbat.`;
    }
    return `History shows ${daysStr} are difficult for you. Increase your guard.`;
  }

  const streaks = getStreakHistory(log);
  if (streaks.length > 0 && streaks[streaks.length - 1].length > 7) {
    return "You're showing strong momentum. Stay focused on the 30-day milestone.";
  }

  return "Consistency is the seed of victory. Log your progress every day.";
};

/**
 * Determines a motivation level based on the last 14 days of activity.
 */
export const getMotivationLevel = (log: CalendarLog): MotivationLevel => {
  const today = new Date();
  const last14Days = eachDayOfInterval({
    start: subDays(today, 13),
    end: today
  }).map(d => format(d, 'yyyy-MM-dd'));

  let wins = 0;
  let falls = 0;

  last14Days.forEach(date => {
    if (log[date] === 'win') wins++;
    if (log[date] === 'fall') falls++;
  });

  if (falls >= 3) return 'critical';
  if (falls >= 1) return 'struggling';
  if (wins >= 10) return 'thriving';
  return 'building';
};
