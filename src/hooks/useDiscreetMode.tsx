import { useEffect, useState } from "react";
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

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!user) {
        if (!isMounted) return;
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

      if (!isMounted) return;

      if (!error && data) {
        setDiscreetMode(!!(data as { discreet_mode?: boolean }).discreet_mode);
      }

      setLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return { discreetMode, loading };
};
