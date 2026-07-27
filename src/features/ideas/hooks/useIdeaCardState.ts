import { useState, useEffect } from "react";
import { useFormats } from "../../contents/hooks/useFormats";
import { type Idea } from "./useIdeas";

type IdeaCardState = {
  platform_id: string;
  format: string;
  content_role?: string;
  content_goal?: string;
  cta_intent?: string;
  target_audience?: string;
  ready_to_use: boolean;
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

        updated[idea.id] = {
          platform_id: "",
          format: "",
          content_role: "",
          content_goal: "",
          cta_intent: "",
          target_audience: "",
          ready_to_use: false,
          generating: false,
          error: null,
        };
      });
      return updated;
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      content_goal: "",
      cta_intent: "",
      target_audience: "",
      ready_to_use: false,
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