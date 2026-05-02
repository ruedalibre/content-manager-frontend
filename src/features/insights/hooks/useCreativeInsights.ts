import { useEffect, useState } from "react";
import { apiFetch } from "../../../utils/apiClient";

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
        const res = await apiFetch("me-creative-insights");
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
