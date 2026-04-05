import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export type Idea = {
  id: string;
  title: string;
  description: string | null;
  source: string;
  created_at: string;
  contents?: { count: number }[];
};

export function useIdeas(filter: "all" | "manual" | "generated") {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD IDEAS
  ========================= */

  const loadIdeas = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: userRecord } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!userRecord) return;

      let query = supabase
        .from("creative_units")
        .select(
          `
          id,
          title,
          description,
          source,
          created_at,
          contents!creative_unit_id(count)
        `,
        )
        .eq("tenant_id", userRecord.tenant_id)
        .order("created_at", { ascending: false });

      if (filter === "manual") {
        query = query.eq("source", "manual");
      }

      if (filter === "generated") {
        query = query.eq("source", "dna_generated");
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        return;
      }

      if (data) setIdeas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     EFFECT
  ========================= */

  useEffect(() => {
    loadIdeas();
  }, [filter]);

  /* =========================
     RETURN
  ========================= */

  return {
    ideas,
    loading,
    refetch: loadIdeas,
  };
}
