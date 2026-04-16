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
  const [error, setError] = useState<string | null>(null);

  /* =========================
     LOAD IDEAS
  ========================= */

  const loadIdeas = async () => {
    try {
      setLoading(true);
      setError(null);

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
          contents!creative_unit_id(id, is_deleted)
        `,
        )
        .eq("tenant_id", userRecord.tenant_id)
        .order("created_at", { ascending: false });

      if (filter === "manual") {
        query = query.eq("source", "manual");
      }

      if (filter === "generated") {
        query = query.eq("source", "generated");
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        type RawContent = { id: string; is_deleted: boolean };

        const mapped = data.map((idea) => ({
          ...idea,
          contents: [
            {
              count:
                (idea.contents as RawContent[])?.filter(
                  (c) => c.is_deleted === false,
                ).length ?? 0,
            },
          ],
        }));

        const sortedIdeas = [...mapped].sort((a, b) => {
          const aCount = a.contents?.[0]?.count ?? 0;
          const bCount = b.contents?.[0]?.count ?? 0;
          return bCount - aCount;
        });

        setIdeas(sortedIdeas);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load ideas");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
   UPDATE IDEA
========================= */

  const updateIdea = async (
    ideaId: string,
    updates: { title: string; description?: string; status?: string },
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-idea/${ideaId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(updates),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update idea");
      }

      await loadIdeas();
    } catch (err) {
      console.error("Update idea error:", err);
      throw err;
    }
  };

  /* =========================
   DELETE IDEA
========================= */

  const deleteIdea = async (ideaId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-idea/${ideaId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete idea");
      }

      await loadIdeas();
    } catch (err) {
      console.error("Delete idea error:", err);
      throw err;
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
    error,
    refetch: loadIdeas,
    updateIdea,
    deleteIdea,
  };
}
