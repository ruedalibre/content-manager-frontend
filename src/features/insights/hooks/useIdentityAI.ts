import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient.ts";
import { type ContentDNA, type StandoutInsight, type CreativeStyleTag } from "../types/insights.types.ts";

type IdentityAIResult = {
  standout_insights: StandoutInsight[];
  creative_style_tags: CreativeStyleTag[];
};

export function useIdentityAI(dna: ContentDNA | null) {
  const [result, setResult] = useState<IdentityAIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dna) return;
    if (!dna.primary_topic && !dna.publishing_rhythm) return;

    const fetch_insights = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-identity-insights`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ dna }),
          },
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error("Identity AI error:", err);
        setError("Failed to load AI insights");
      } finally {
        setLoading(false);
      }
    };

    fetch_insights();
  }, [dna?.primary_topic]);

  return { result, loading, error };
}
