import {
  parse,
  format,
  subDays,
  subWeeks,
  previousMonday,
  previousTuesday,
  previousWednesday,
  previousThursday,
  previousFriday,
  previousSaturday,
  previousSunday,
  startOfDay,
  endOfDay,
  isValid,
} from 'date-fns';

export interface ResolvedDateRange {
  startDate: Date;
  endDate: Date;
  label: string;
  isSpecificDate: boolean;
}

/**
 * Parses user input for temporal expressions relative to an anchor date.
 * Example inputs:
 *  - "On Monday we shortlisted..."
 *  - "What did I ask you on 3 November?"
 *  - "Last Tuesday I asked you about Postgres hosting"
 */
export function resolveTemporalReference(
  text: string,
  anchorDate: Date = new Date()
): ResolvedDateRange | null {
  const lower = text.toLowerCase();

  // Pattern 1: Exact day + month (e.g., "3 november", "november 3", "nov 3rd", "3rd nov")
  const monthDayMatch = lower.match(
    /\b(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/
  ) || lower.match(
    /\b(?:on\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/
  );

  if (monthDayMatch) {
    const isDayFirst = !isNaN(Number(monthDayMatch[1]));
    const dayStr = isDayFirst ? monthDayMatch[1] : monthDayMatch[2];
    const monthStr = isDayFirst ? monthDayMatch[2] : monthDayMatch[1];
    const currentYear = anchorDate.getFullYear();

    // Try parsing as MMM d yyyy
    const candidateDate = parse(`${monthStr} ${dayStr} ${currentYear}`, 'MMM d yyyy', new Date());
    if (isValid(candidateDate)) {
      return {
        startDate: startOfDay(candidateDate),
        endDate: endOfDay(candidateDate),
        label: format(candidateDate, 'MMMM d, yyyy'),
        isSpecificDate: true,
      };
    }
  }

  // Pattern 2: "last tuesday", "last monday", etc.
  const lastWeekdayMatch = lower.match(/\blast\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (lastWeekdayMatch) {
    const dayName = lastWeekdayMatch[1];
    const targetDate = getWeekday(dayName, anchorDate, true);
    return {
      startDate: startOfDay(targetDate),
      endDate: endOfDay(targetDate),
      label: `Last ${capitalize(dayName)} (${format(targetDate, 'MMM d')})`,
      isSpecificDate: true,
    };
  }

  // Pattern 3: "on monday", "this monday", or just "monday"
  const weekdayMatch = lower.match(/\b(?:on|this)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (weekdayMatch && !lower.includes('next ' + weekdayMatch[1])) {
    const dayName = weekdayMatch[1];
    const targetDate = getWeekday(dayName, anchorDate, false);
    return {
      startDate: startOfDay(targetDate),
      endDate: endOfDay(targetDate),
      label: `${capitalize(dayName)} (${format(targetDate, 'MMM d')})`,
      isSpecificDate: true,
    };
  }

  // Pattern 4: "yesterday"
  if (lower.includes('yesterday')) {
    const yest = subDays(anchorDate, 1);
    return {
      startDate: startOfDay(yest),
      endDate: endOfDay(yest),
      label: `Yesterday (${format(yest, 'MMM d')})`,
      isSpecificDate: true,
    };
  }

  // Pattern 5: "last week"
  if (lower.includes('last week')) {
    const weekAgo = subWeeks(anchorDate, 1);
    return {
      startDate: startOfDay(subDays(weekAgo, 3)),
      endDate: endOfDay(weekAgo),
      label: 'Last week',
      isSpecificDate: false,
    };
  }

  return null;
}

function getWeekday(dayName: string, anchor: Date, isLast: boolean): Date {
  const currentDayOfWeek = anchor.getDay(); // 0 is Sunday, 1 is Monday, 2 is Tuesday, etc.

  const lookup: Record<string, (d: Date) => Date> = {
    monday: previousMonday,
    tuesday: previousTuesday,
    wednesday: previousWednesday,
    thursday: previousThursday,
    friday: previousFriday,
    saturday: previousSaturday,
    sunday: previousSunday,
  };

  const dayIndices: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const targetDayIndex = dayIndices[dayName.toLowerCase()];
  
  if (isLast) {
    // "Last Tuesday" typically refers to the Tuesday of the previous calendar week
    const prev = lookup[dayName.toLowerCase()](anchor);
    if (Math.abs(currentDayOfWeek - targetDayIndex) < 4) {
      return subDays(prev, 7);
    }
    return prev;
  }

  // Standard "on Monday" refers to the most recent occurrence of that day
  return lookup[dayName.toLowerCase()](anchor);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Formats a timestamp into a readable human-centric relative string
 */
export function formatTemporalContext(dateStr: string, anchor: Date = new Date()): string {
  try {
    const d = new Date(dateStr);
    const dayDiff = Math.round((anchor.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 0) return `Today at ${format(d, 'h:mm a')}`;
    if (dayDiff === 1) return `Yesterday at ${format(d, 'h:mm a')}`;
    if (dayDiff > 1 && dayDiff < 7) return `${format(d, 'EEEE')} (${format(d, 'MMM d')})`;
    return format(d, 'MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}
