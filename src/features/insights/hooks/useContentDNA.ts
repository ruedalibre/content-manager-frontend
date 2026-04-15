import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient.ts";
import { type ContentDNA } from "../types/insights.types.ts";

export function useContentDNA() {
  const [dna, setDNA] = useState<ContentDNA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDNA = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-dna`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          },
        );

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

  return { dna, loading, error};
}
