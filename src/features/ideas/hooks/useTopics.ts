import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export type Topic = {
  id: string;
  name: string;
  slug: string;
  position: number;
  is_archived: boolean;
  created_at: string;
};

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  };

  const loadTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      const session = await getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-topics`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      if (!res.ok) throw new Error("Failed to load topics");
      const data = await res.json();
      setTopics(data ?? []);
    } catch (err) {
      console.error(err);
      setError("Failed to load topics");
    } finally {
      setLoading(false);
    }
  };

  const createTopic = async (name: string) => {
    const session = await getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-topic`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ name }),
      },
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to create topic");
    }
    await loadTopics();
  };

  const updateTopic = async (topicId: string, name: string) => {
    const session = await getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-topic/${topicId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ name }),
      },
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to update topic");
    }
    await loadTopics();
  };

  const archiveTopic = async (topicId: string) => {
    const session = await getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/archive-topic/${topicId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      },
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to archive topic");
    }
    await loadTopics();
  };

  useEffect(() => {
    loadTopics();
  }, []);

  return {
    topics,
    loading,
    error,
    refetch: loadTopics,
    createTopic,
    updateTopic,
    archiveTopic,
  };
}
