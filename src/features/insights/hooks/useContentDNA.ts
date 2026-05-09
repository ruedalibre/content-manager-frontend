import { useEffect, useState } from "react";
import { type ContentDNA } from "../types/insights.types.ts";
import { apiFetch } from "../../../utils/apiClient";

export function useContentDNA() {
  const [dna, setDNA] = useState<ContentDNA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDNA = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiFetch("content-dna");

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setDNA(data);
      } catch (err) {
        console.error("Content DNA fetch error:", err);
        setError("Failed to load Content DNA");
      } finally {
        setLoading(false);
      }
    };

    fetchDNA();
  }, []);

  return { dna, loading, error };
}
