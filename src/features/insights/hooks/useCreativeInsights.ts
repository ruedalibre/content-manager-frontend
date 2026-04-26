import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient.ts";

export function useCreativeInsights() {
  const [insights, setInsights] = useState<
    { type: string; label: string; text: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch_insights = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-creative-insights`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setInsights(data.insights ?? []);
      } catch (err) {
        console.error("Creative insights error:", err);
        setError("Failed to load insights");
      } finally {
        setLoading(false);
      }
    };
    fetch_insights();
  }, []);

  return { insights, loading, error };
}
