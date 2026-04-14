import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AnonymityModeState {
  anonymityEnabled: boolean;
  loading: boolean;
  setAnonymityEnabled: (enabled: boolean) => Promise<{ error: Error | null }>;
}

export const useAnonymityMode = (): AnonymityModeState => {
  const { user } = useAuth();
  const [anonymityEnabled, setAnonymityEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setAnonymityEnabledState(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("is_anonymous")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setAnonymityEnabledState(!!(data as { is_anonymous?: boolean }).is_anonymous);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("anonymity-mode-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as { is_anonymous?: boolean };
          setAnonymityEnabledState(!!newData.is_anonymous);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const setAnonymityEnabled = async (enabled: boolean): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error("No authenticated user") };
    }

    const previousValue = anonymityEnabled;
    setAnonymityEnabledState(enabled);

    const { error } = await supabase
      .from("profiles")
      .update({ is_anonymous: enabled })
      .eq("user_id", user.id);

    if (error) {
      setAnonymityEnabledState(previousValue);
      return { error: new Error(error.message) };
    }

    return { error: null };
  };

  return { anonymityEnabled, loading, setAnonymityEnabled };
};
