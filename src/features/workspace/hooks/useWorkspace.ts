// src/features/workspace/hooks/useWorkspace.ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../supabaseClient";

export type Workspace = {
  id: string;
  name: string;
  description: string | null;
  is_personal: boolean;
  role: "owner" | "editor" | "viewer";
  created_at: string;
};

export function useWorkspace() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const loadWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${base}/me-workspaces`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to load workspaces");

      const data = await res.json();
      setWorkspaces(data.workspaces ?? []);
      setCurrentWorkspaceId(data.current_workspace_id ?? null);
    } catch (err) {
      console.error(err);
      setError("Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }, []);

  const switchWorkspace = async (workspaceId: string) => {
    const previous = currentWorkspaceId;
    setCurrentWorkspaceId(workspaceId); // optimistic

    try {
      const session = await getSession();
      const res = await fetch(`${base}/switch-workspace`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ workspace_id: workspaceId }),
      });

      if (!res.ok) throw new Error("Failed to switch workspace");

      globalThis.dispatchEvent(new CustomEvent("workspace-switched", { detail: { workspaceId } }));
    } catch (err) {
      console.error("Switch workspace error:", err);
      setCurrentWorkspaceId(previous); // rollback
      throw err;
    }
  };

  const createWorkspace = async (name: string, description?: string) => {
    const session = await getSession();
    const res = await fetch(`${base}/create-workspace`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ name, description }),
    });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Failed to create workspace");
    }

    await loadWorkspaces();
  };

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) ?? null;

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  return {
    workspaces,
    currentWorkspace,
    currentWorkspaceId,
    loading,
    error,
    loadWorkspaces,
    switchWorkspace,
    createWorkspace,
  };
}