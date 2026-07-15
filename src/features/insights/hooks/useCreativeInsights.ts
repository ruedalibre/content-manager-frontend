import { useEffect, useState } from "react";
import { apiFetch } from "../../../utils/apiClient";

export function useCreativeInsights(workspaceId: string | null) {
  const [insights, setInsights] = useState<
    {
      type: string;
      label: string;
      text: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const fetch_insights = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(
          `me-creative-insights?workspace_id=${workspaceId}`,
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
  }, [workspaceId]);

  return { insights, loading, error };
}
