import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { type StrategyInsight } from "../types/insights.types";

export function useStrategyInsights() {
  const [insights, setInsights] = useState<StrategyInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStrategyInsights = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strategy-insights`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          },
        );

        const data = await res.json();

        setInsights(data.insights ?? []);
      } catch (err) {
        console.error("Strategy insights error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStrategyInsights();
  }, []);

  return { insights, loading };
}
