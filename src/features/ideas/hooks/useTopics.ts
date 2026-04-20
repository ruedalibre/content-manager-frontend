import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export type IdeaTopic = {
  id: string;
  name: string;
};

export type Idea = {
  id: string;
  title: string;
  description: string | null;
  source: string;
  created_at: string;
  contents?: { count: number }[];
  topics?: IdeaTopic[];
};

export function useIdeas(filter: "all" | "manual" | "generated") {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  };

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
        .select("id, title, description, source, created_at")
        .eq("tenant_id", userRecord.tenant_id)
        .order("created_at", { ascending: false });

      if (filter === "manual") query = query.eq("source", "manual");
      if (filter === "generated") query = query.eq("source", "generated");

      const { data, error } = await query;

      if (error) {
        setError("Failed to load ideas");
        return;
      }

      const session = await getSession();
      const headers = { Authorization: `Bearer ${session?.access_token}` };
      const base = import.meta.env.VITE_SUPABASE_URL + "/functions/v1/";

      // Cargar conteos e idea_topics en paralelo
      const [countsRes, ...topicsResponses] = await Promise.all([
        fetch(`${base}me-ideas-counts`, { headers }),
        ...(data ?? []).map((idea) =>
          fetch(`${base}me-idea-topics?idea_id=${idea.id}`, { headers }),
        ),
      ]);

      const countsData: { creative_unit_id: string; count: number }[] =
        countsRes.ok ? await countsRes.json() : [];

      const countsMap = new Map(
        countsData.map((c) => [c.creative_unit_id, c.count]),
      );

      const topicsData = await Promise.all(
        topicsResponses.map((r) => (r.ok ? r.json() : [])),
      );

      if (data) {
        const mapped = data.map((idea, i) => ({
          ...idea,
          contents: [{ count: countsMap.get(idea.id) ?? 0 }],
          topics: topicsData[i] ?? [],
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
    const session = await getSession();
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
  };

  /* =========================
     UPDATE IDEA TOPICS
  ========================= */

  const updateIdeaTopics = async (ideaId: string, topicIds: string[]) => {
    const session = await getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-idea-topics/${ideaId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ topic_ids: topicIds }),
      },
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to update idea topics");
    }
    await loadIdeas();
  };

  /* =========================
     DELETE IDEA
  ========================= */

  const deleteIdea = async (ideaId: string) => {
    const session = await getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-idea/${ideaId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      },
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete idea");
    }
    await loadIdeas();
  };

  useEffect(() => {
    loadIdeas();
  }, [filter]);

  return {
    ideas,
    loading,
    error,
    refetch: loadIdeas,
    updateIdea,
    updateIdeaTopics,
    deleteIdea,
  };
}
