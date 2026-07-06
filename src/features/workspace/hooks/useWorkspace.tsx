import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "../../../supabaseClient";

export type Workspace = {
  id: string;
  name: string;
  description: string | null;
  is_personal: boolean;
  role: "owner" | "editor" | "viewer";
  created_at: string;
};

type WorkspaceContextValue = {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentWorkspaceId: string | null;
  loading: boolean;
  error: string | null;
  loadWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
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
    setCurrentWorkspaceId(workspaceId); // optimistic — ahora visible para TODOS los consumidores del Context

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

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        currentWorkspaceId,
        loading,
        error,
        loadWorkspaces,
        switchWorkspace,
        createWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}