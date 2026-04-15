import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getDiscreetModeByUserId,
  subscribeToDiscreetModeChanges,
} from "@/services/discreetModeService";

interface DiscreetModeState {
  discreetMode: boolean;
  loading: boolean;
}

export const useDiscreetMode = (): DiscreetModeState => {
  const { user } = useAuth();
  const [discreetMode, setDiscreetMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setDiscreetMode(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const mode = await getDiscreetModeByUserId(user.id);
      setDiscreetMode(mode);
    } catch (error) {
      console.error("Error loading discreet mode:", error);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Subscribe to realtime changes on the profiles table
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToDiscreetModeChanges(user.id, (mode) => {
      setDiscreetMode(mode);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  return { discreetMode, loading };
};
