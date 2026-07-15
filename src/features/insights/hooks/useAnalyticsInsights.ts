import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient.ts";
import { type AnalyticsInsight } from "../types/insights.types.ts";

export function useAnalyticsInsights(
  period: "7d" | "30d" | "90d",
  workspaceId: string | null,
) {
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-insights?period=${period}&workspace_id=${workspaceId}`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          },
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setInsights(data ?? []);
      } catch (err) {
        console.error("Analytics insights error:", err);
        setError("Failed to load insights");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [period, workspaceId]);

  return { insights, loading, error };
}
