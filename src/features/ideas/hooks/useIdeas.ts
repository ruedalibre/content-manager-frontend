import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export type IdeaTopic = {
  id: string;
  name: string;
};

export type CreativeSession = {
  id: string;
  idea_id: string;
  topic_ids: string[];
  platform_id: string;
  format: string;
  content_role: string | null;
  recipe: {
    angle: string;
    hook: string;
    tone: string;
    structure: string[];
    reuse_suggestions: string[];
    strategic_note: string;
  };
  feedback: Record<string, number> | null;
  status: "generated" | "reviewed" | "executed" | "discarded";
  content_id: string | null;
  downloaded_at: string | null;
  created_at: string;
};

export type Idea = {
  id: string;
  title: string;
  description: string | null;
  source: string;
  created_at: string;
  contents?: { count: number }[];
  topics?: IdeaTopic[];
  sessions?: CreativeSession[];
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

  const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

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

      // Cargar conteos, topics y sesiones en paralelo
      const [countsRes, sessionsRes, ...topicsResponses] = await Promise.all([
        fetch(`${base}/me-ideas-counts`, { headers }),
        fetch(`${base}/me-creative-sessions`, { headers }),
        ...(data ?? []).map((idea) =>
          fetch(`${base}/me-idea-topics?idea_id=${idea.id}`, { headers }),
        ),
      ]);

      const countsData: { creative_unit_id: string; count: number }[] =
        countsRes.ok ? await countsRes.json() : [];

      const sessionsData: CreativeSession[] = sessionsRes.ok
        ? await sessionsRes.json()
        : [];

      const countsMap = new Map(
        countsData.map((c) => [c.creative_unit_id, c.count]),
      );

      // Agrupar sesiones por idea_id
      const sessionsMap = new Map<string, CreativeSession[]>();
      sessionsData.forEach((s) => {
        const existing = sessionsMap.get(s.idea_id) ?? [];
        sessionsMap.set(s.idea_id, [...existing, s]);
      });

      const topicsData = await Promise.all(
        topicsResponses.map((r) => (r.ok ? r.json() : [])),
      );

      if (data) {
        const mapped = data.map((idea, i) => ({
          ...idea,
          contents: [{ count: countsMap.get(idea.id) ?? 0 }],
          topics: topicsData[i] ?? [],
          sessions: sessionsMap.get(idea.id) ?? [],
        }));

        const sortedIdeas = [...mapped].sort((a, b) => {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
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
     GENERATE RECIPE
  ========================= */

  const generateRecipe = async (params: {
    idea_id: string;
    topic_ids: string[];
    platform_id: string;
    format: string;
    content_role?: string;
  }): Promise<{
    session_id: string;
    recipe: CreativeSession["recipe"];
    duplicate: boolean;
    message?: string;
    session?: CreativeSession;
  }> => {
    const session = await getSession();
    const res = await fetch(`${base}/generate-recipe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to generate recipe");
    }

    // Actualizar solo la idea afectada en el array local
    if (!data.duplicate && data.session) {
      setIdeas((prev) =>
        prev.map((idea) => {
          if (idea.id !== params.idea_id) return idea;
          const existingSessions = idea.sessions ?? [];
          return {
            ...idea,
            sessions: [...existingSessions, data.session],
          };
        }),
      );
    }

    return data;
  };

  /* =========================
     UPDATE RECIPE STATUS
  ========================= */

  const updateSessionStatus = async (
    sessionId: string,
    status: CreativeSession["status"],
  ) => {
    const session = await getSession();
    const res = await fetch(`${base}/update-creative-session/${sessionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to update session");
    }
    setIdeas((prev) =>
      prev.map((idea) => ({
        ...idea,
        sessions: idea.sessions?.map((s) =>
          s.id !== sessionId ? s : { ...s, status }
        ),
      }))
    );
  };

  /* =========================
     SAVE FEEDBACK
  ========================= */

  const saveFeedback = async (
    sessionId: string,
    feedback: Record<string, number>,
    notes?: string,
  ) => {
    const session = await getSession();
    const res = await fetch(`${base}/update-creative-session/${sessionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ feedback, feedback_notes: notes }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save feedback");
    }
    setIdeas((prev) =>
      prev.map((idea) => ({
        ...idea,
        sessions: idea.sessions?.map((s) =>
          s.id !== sessionId ? s : { ...s, feedback }
        ),
      }))
    );
  };

  /* =========================
     UPDATE IDEA
  ========================= */

  const updateIdea = async (
    ideaId: string,
    updates: { title: string; description?: string; status?: string },
  ) => {
    const session = await getSession();
    const res = await fetch(`${base}/update-idea/${ideaId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to update idea");
    }
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id !== ideaId
          ? idea
          : {
              ...idea,
              title: updates.title,
              description: updates.description ?? idea.description,
            }
      )
    );
  };

  /* =========================
     UPDATE IDEA TOPICS
  ========================= */

  const updateIdeaTopics = async (
    ideaId: string,
    topicIds: string[],
    topicObjects: IdeaTopic[],
  ) => {
    const session = await getSession();
    const res = await fetch(`${base}/update-idea-topics/${ideaId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ topic_ids: topicIds }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to update idea topics");
    }
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id !== ideaId ? idea : { ...idea, topics: topicObjects }
      )
    );
  };

  /* =========================
     REGENERATE ASPECT
  ========================= */

  const regenerateAspect = async (params: {
    session_id: string;
    aspect: "angle" | "hook" | "tone" | "structure";
    rating: number;
    current_value: string;
    previous_alternatives: string[];
    recipe_context: CreativeSession["recipe"];
    idea_title: string;
    topics: string[];
    platform: string;
    format: string;
  }): Promise<{ alternative: string | string[] }> => {
    const session = await getSession();
    const res = await fetch(`${base}/regenerate-aspect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to regenerate");
    return data;
  };

  /* =========================
     UPDATE RECIPE ASPECT
  ========================= */

  const updateRecipeAspect = async (
    sessionId: string,
    recipe: CreativeSession["recipe"],
  ) => {
    const session = await getSession();
    const res = await fetch(`${base}/update-creative-session/${sessionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ recipe }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to update recipe");
    }
    setIdeas((prev) =>
      prev.map((idea) => ({
        ...idea,
        sessions: idea.sessions?.map((s) =>
          s.id !== sessionId ? s : { ...s, recipe }
        ),
      }))
    );
  };

  /* =========================
     MARK AS DOWNLOADED
  ========================= */

  const markAsDownloaded = async (sessionId: string) => {
    const downloadedAt = new Date().toISOString();
    // Actualización optimista — el icono aparece de inmediato
    setIdeas((prev) =>
      prev.map((idea) => ({
        ...idea,
        sessions: idea.sessions?.map((s) =>
          s.id !== sessionId ? s : { ...s, downloaded_at: downloadedAt }
        ),
      }))
    );
    // Persistir en BD (best-effort, no bloquea la UI)
    try {
      const session = await getSession();
      await fetch(`${base}/update-creative-session/${sessionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ downloaded_at: downloadedAt }),
      });
    } catch {
      // Silent — el icono ya está visible en local
    }
  };

  /* =========================
     DELETE IDEA
  ========================= */

  const deleteIdea = async (ideaId: string) => {
    const session = await getSession();
    const res = await fetch(`${base}/delete-idea/${ideaId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete idea");
    }
    setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
  };

  useEffect(() => {
    loadIdeas();
  }, [filter]);

  return {
    ideas,
    loading,
    error,
    refetch: loadIdeas,
    generateRecipe,
    updateSessionStatus,
    saveFeedback,
    updateIdea,
    updateIdeaTopics,
    deleteIdea,
    regenerateAspect,
    updateRecipeAspect,
    markAsDownloaded,
  };
}
