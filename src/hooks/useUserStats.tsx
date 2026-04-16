import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getCompletedChallengesCount,
  getJournalEntryDates,
} from "@/services/userStatsService";
import { calculateJournalStreak } from "@/lib/journalStreak";

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
      setJournalStreak(calculateJournalStreak(journalDates));
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
