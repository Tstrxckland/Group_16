import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
      // Get completed challenges count
      const { data: profileData } = await supabase
        .from("profiles")
        .select("completed_challenges")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData?.completed_challenges) {
        setCompletedChallenges(profileData.completed_challenges.length);
      } else {
        setCompletedChallenges(0);
      }

      // Get journal entries count and dates for streak
      const { data: journalData } = await supabase
        .from("journal_entries")
        .select("created_at")
        .eq("user_id", user.id);

      if (journalData) {
        setJournalEntries(journalData.length);
        setJournalStreak(calculateStreak(journalData.map(e => e.created_at)));
      } else {
        setJournalEntries(0);
        setJournalStreak(0);
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { completedChallenges, journalEntries, journalStreak, loading };
};
