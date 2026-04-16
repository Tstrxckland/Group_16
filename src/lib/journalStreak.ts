function toLocalDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function localDayKeyToUtcMidnightMs(dayKey: string): number {
  const [yStr, mStr, dStr] = dayKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);

  // Using UTC midnight avoids DST-related issues when computing “calendar day” differences.
  return Date.UTC(y, m - 1, d);
}

export function calculateJournalStreak(dates: string[], now: Date = new Date()): number {
  if (dates.length === 0) return 0;

  const uniqueDayKeys = Array.from(
    new Set(dates.map((d) => toLocalDayKey(new Date(d)))),
  ).sort((a, b) => localDayKeyToUtcMidnightMs(b) - localDayKeyToUtcMidnightMs(a));

  const todayKey = toLocalDayKey(now);
  const yesterdayKey = toLocalDayKey(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
  );

  // “Active” streak requires at least one entry in the current or immediately previous local day.
  if (uniqueDayKeys[0] !== todayKey && uniqueDayKeys[0] !== yesterdayKey) return 0;

  let streak = 1;
  const dayMs = 86400000; // safe because we compare UTC-midnight values

  for (let i = 1; i < uniqueDayKeys.length; i++) {
    const newerDayMs = localDayKeyToUtcMidnightMs(uniqueDayKeys[i - 1]);
    const olderDayMs = localDayKeyToUtcMidnightMs(uniqueDayKeys[i]);
    const diffDays = (newerDayMs - olderDayMs) / dayMs;

    if (diffDays === 1) streak++;
    else break;
  }

  return streak;
}

