import { describe, expect, it } from "vitest";
import { calculateJournalStreak } from "@/lib/journalStreak";

function isoFromLocal(year: number, monthIndex0: number, day: number, hour = 12, minute = 0) {
  const d = new Date(year, monthIndex0, day, hour, minute, 0, 0);
  return d.toISOString();
}

describe("calculateJournalStreak", () => {
  it("returns 0 when there are no entries", () => {
    expect(calculateJournalStreak([])).toBe(0);
  });

  it("calculates consecutive-day streak (including same-day duplicates)", () => {
    // Freeze “now” for deterministic results.
    const now = new Date(2026, 3, 16, 12, 0, 0, 0); // Apr 16, 2026 (local)

    const today = isoFromLocal(2026, 3, 16, 9, 0);
    const todayDuplicate = isoFromLocal(2026, 3, 16, 21, 30);
    const yesterday = isoFromLocal(2026, 3, 15, 10, 0);
    const dayBeforeYesterday = isoFromLocal(2026, 3, 14, 13, 0);

    expect(
      calculateJournalStreak([today, todayDuplicate, yesterday, dayBeforeYesterday], now),
    ).toBe(3);
  });

  it("returns 1 when there is a gap (missing yesterday)", () => {
    const now = new Date(2026, 3, 16, 12, 0, 0, 0);

    const today = isoFromLocal(2026, 3, 16, 12, 0);
    const twoDaysAgo = isoFromLocal(2026, 3, 14, 12, 0);

    expect(calculateJournalStreak([today, twoDaysAgo], now)).toBe(1);
  });

  it("returns 0 when the most recent entry is older than yesterday", () => {
    const now = new Date(2026, 3, 16, 12, 0, 0, 0);

    const threeDaysAgo = isoFromLocal(2026, 3, 13, 12, 0);

    expect(calculateJournalStreak([threeDaysAgo], now)).toBe(0);
  });

  it("handles same-day vs next-day near midnight (timezone boundary)", () => {
    const now = new Date(2026, 3, 16, 12, 0, 0, 0);

    const yesterdayLate = isoFromLocal(2026, 3, 15, 23, 59);
    const todayEarly = isoFromLocal(2026, 3, 16, 0, 1);

    expect(calculateJournalStreak([yesterdayLate, todayEarly], now)).toBe(2);
  });
});

