import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient.ts";
import { type AnalyticsInsight } from "../types/insights.types.ts";

export function useAnalyticsInsights(period: "7d" | "30d" | "90d") {
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-insights?period=${period}`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          }
        );

        const data = await res.json();

        setInsights(data ?? []);
      } catch (err) {
        console.error("Analytics insights error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [period]);

  return { insights, loading };
}