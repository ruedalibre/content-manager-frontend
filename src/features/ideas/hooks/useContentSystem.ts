import { useEffect, useState } from "react";
import { apiFetch } from "../../../utils/apiClient";

export type ContentSystemContent = {
  id: string;
  title: string;
  platform: string;
  format: string;
};

export type ContentSystemIdea = {
  id: string;
  title: string;
  contents: ContentSystemContent[];
};

export type ContentSystemTopic = {
  id: string;
  name: string;
  ideas: ContentSystemIdea[];
};

export function useContentSystem(workspaceId: string | null) {
  const [topics, setTopics] = useState<ContentSystemTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const fetchSystem = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(
          `me-content-system?workspace_id=${workspaceId}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setTopics(data.topics ?? []);
      } catch (err) {
        console.error("Content system error:", err);
        setError("Failed to load content system");
      } finally {
        setLoading(false);
      }
    };
    fetchSystem();
  }, [workspaceId]);

  return { topics, loading, error };
}
