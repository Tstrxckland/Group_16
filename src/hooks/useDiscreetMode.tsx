import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
    const { data, error } = await supabase
      .from("profiles")
      .select("discreet_mode")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setDiscreetMode(!!(data as { discreet_mode?: boolean }).discreet_mode);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Subscribe to realtime changes on the profiles table
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('discreet-mode-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as { discreet_mode?: boolean };
          setDiscreetMode(!!newData.discreet_mode);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { discreetMode, loading };
};
