import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient.ts";
import { type ContentDNA } from "../types/insights.types.ts";

export function useContentDNA() {
  const [dna, setDNA] = useState<ContentDNA | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDNA = async () => {
      try {
        setLoading(true);

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

        const data = await res.json();

        setDNA(data);
      } catch (err) {
        console.error("Content DNA fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDNA();
  }, []);

  return { dna, loading };
}
