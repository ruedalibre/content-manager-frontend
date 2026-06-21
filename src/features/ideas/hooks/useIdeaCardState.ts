import { useState, useEffect } from "react";
import { useFormats } from "../../contents/hooks/useFormats";
import { type Idea } from "./useIdeas";

type IdeaCardState = {
  platform_id: string;
  format: string;
  content_role?: string;
  generating: boolean;
  error: string | null;
};

type RecipeState = {
  [ideaId: string]: IdeaCardState;
};

export function useIdeaCardState(ideas: Idea[]) {
  const [recipeState, setRecipeState] = useState<RecipeState>({});
  const [ideaFormats, setIdeaFormats] = useState<{ [ideaId: string]: string[] }>({});
  const { loadFormats } = useFormats();

  useEffect(() => {
    if (!ideas.length) return;

    setRecipeState((prev) => {
      const updated = { ...prev };
      ideas.forEach((idea) => {
        if (updated[idea.id]) return;

        const sessions = idea.sessions ?? [];
        const latest = sessions
          .filter((s) => s.status !== "discarded")
          .sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];

        if (!latest) {
          updated[idea.id] = {
            platform_id: "",
            format: "",
            content_role: "",
            generating: false,
            error: null,
          };
          return;
        }

        const isToday =
          new Date(latest.created_at).toDateString() ===
          new Date().toDateString();

        updated[idea.id] = {
          platform_id: isToday ? "" : (latest.platform_id ?? ""),
          format: isToday ? "" : (latest.format ?? ""),
          content_role: isToday ? "" : (latest.content_role ?? ""),
          generating: false,
          error: null,
        };
      });
      return updated;
    });
  }, [ideas]);

  useEffect(() => {
    if (!ideas.length) return;
    ideas.forEach(async (idea) => {
      const state = recipeState[idea.id];
      if (state?.platform_id && !ideaFormats[idea.id]) {
        const fmts = await loadFormats(state.platform_id);
        setIdeaFormats((prev) => ({ ...prev, [idea.id]: fmts ?? [] }));
      }
    });
  }, [recipeState]);

  const getRecipeStateForIdea = (ideaId: string): IdeaCardState =>
    recipeState[ideaId] ?? {
      platform_id: "",
      format: "",
      content_role: "",
      generating: false,
      error: null,
    };

  const updateRecipeState = (
    ideaId: string,
    updates: Partial<IdeaCardState>
  ) => {
    setRecipeState((prev) => ({
      ...prev,
      [ideaId]: { ...getRecipeStateForIdea(ideaId), ...updates },
    }));
  };

  const handlePlatformChange = async (ideaId: string, platformId: string) => {
    updateRecipeState(ideaId, { platform_id: platformId, format: "" });
    if (platformId) {
      const fmts = await loadFormats(platformId);
      setIdeaFormats((prev) => ({ ...prev, [ideaId]: fmts ?? [] }));
    }
  };

  return {
    recipeState,
    ideaFormats,
    getRecipeStateForIdea,
    updateRecipeState,
    handlePlatformChange,
  };
}
