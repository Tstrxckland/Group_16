import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getCompletedChallengesCount,
  getJournalEntryDates,
} from "@/services/userStatsService";

interface UserStats {
  completedChallenges: number;
  journalEntries: number;
  journalStreak: number;
  loading: boolean;
}

export const useUserStats = (): UserStats => {
  const { user } = useAuth();
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const [journalEntries, setJournalEntries] = useState(0);
  const [journalStreak, setJournalStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const calculateStreak = (dates: string[]) => {
    if (dates.length === 0) return 0;

    // Get unique dates
    const uniqueDates = [...new Set(dates.map(d => new Date(d).toDateString()))]
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Check if streak is active
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      return 0;
    }

    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const current = new Date(uniqueDates[i - 1]);
      const prev = new Date(uniqueDates[i]);
      const diffDays = Math.round((current.getTime() - prev.getTime()) / 86400000);

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const loadStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const completedCount = await getCompletedChallengesCount(user.id);
      setCompletedChallenges(completedCount);

      const journalDates = await getJournalEntryDates(user.id);
      setJournalEntries(journalDates.length);
      setJournalStreak(calculateStreak(journalDates));
    } catch (error) {
      console.error("Error loading user stats:", error);
      setCompletedChallenges(0);
      setJournalEntries(0);
      setJournalStreak(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { completedChallenges, journalEntries, journalStreak, loading };
};
