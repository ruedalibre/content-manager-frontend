import { useState, useEffect } from "react";
import { Archive, ChevronRight, Undo2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  useIdeas,
  type Idea,
  type CreativeSession,
} from "../../features/ideas/hooks/useIdeas.ts";
import { useTopics, type Topic } from "../../features/ideas/hooks/useTopics.ts";
import { useContentSystem } from "../../features/ideas/hooks/useContentSystem.ts";
import { usePlatforms } from "../../features/contents/hooks/usePlatforms.ts";
import { useFormats } from "../../features/contents/hooks/useFormats.ts";
import CreateIdeaModal from "../../features/ideas/modals/CreateIdeaModal.tsx";
import ConfirmModal from "../../components/ui/ConfirmModal.tsx";
import BriefList from "../../features/ideas/components/BriefList.tsx";
import RecipePanel from "../../features/ideas/components/RecipePanel.tsx";
import EditIdeaModal from "../../features/ideas/components/EditIdeaModal.tsx";
import StatusBadge from "../../features/ideas/components/StatusBadge.tsx";
import { downloadBrief } from "../../utils/downloadBrief.ts";
import { supabase } from "../../supabaseClient.ts";
import { useSubscription } from "../../features/subscription/hooks/useSubscription";
import UpgradePrompt from "../../components/ui/UpgradePrompt";
import StepsGuide from "../../components/ui/StepsGuide";
import "./Ideas.scss";

type RecipeState = {
  [ideaId: string]: {
    platform_id: string;
    format: string;
    content_role?: string;
    generating: boolean;
    error: string | null;
  };
};

export default function Ideas() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTopbarContext } = useOutletContext<{
    setTopbarContext: (v: string | null) => void;
    isAdmin: boolean;
  }>();

  useEffect(() => {
    setTopbarContext(t("ideas.subtitle"));
    return () => setTopbarContext(null);
  }, [setTopbarContext, t]);

  const [activeTab, setActiveTab] = useState<"ideas" | "topics" | "archived">(
    "ideas",
  );
  const [archivedIdeas, setArchivedIdeas] = useState<Idea[]>([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [expandedArchived, setExpandedArchived] = useState<Set<string>>(
    new Set(),
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "manual" | "generated">("all");
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingIdeaTopics, setEditingIdeaTopics] = useState<string | null>(
    null,
  );
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [savingTopics, setSavingTopics] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editTopicName, setEditTopicName] = useState("");
  const [savingTopic, setSavingTopic] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [recipeState, setRecipeState] = useState<RecipeState>({});
  const [expandedSession, setExpandedSession] = useState<{
    session: CreativeSession;
    idea: Idea;
  } | null>(null);
  const [ideaFormats, setIdeaFormats] = useState<{
    [ideaId: string]: string[];
  }>({});
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [systemModalTopic, setSystemModalTopic] = useState<typeof systemTopics[0] | null>(null);

  const {
    ideas,
    loading,
    error,
    refetch,
    generateRecipe,
    updateSessionStatus,
    saveFeedback,
    updateIdea,
    updateIdeaTopics,
    archiveIdea,
    restoreIdea,
    deleteIdea,
    loadArchivedIdeas: loadArchivedIdeasFromHook,
    regenerateAspect,
    updateRecipeAspect,
    markAsDownloaded,
    duplicateIdea,
  } = useIdeas(filter);

  const {
    topics,
    loading: topicsLoading,
    createTopic,
    updateTopic,
    archiveTopic,
  } = useTopics();

  const { topics: systemTopics } = useContentSystem();

  const { platforms } = usePlatforms();
  const { loadFormats } = useFormats();
  const { canCreateBriefs, isFree, trialActive } = useSubscription();

  useEffect(() => {
    if (!ideas.length) return;

    setRecipeState((prev) => {
      const updated = { ...prev };
      ideas.forEach((idea) => {
        // Solo inicializar si NO existe ya en el estado local
        if (updated[idea.id]) return;

        // Buscar la sesión activa más reciente
        const sessions = idea.sessions ?? [];
        const latest = sessions
          .filter((s) => s.status !== "discarded")
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )[0];

        if (!latest) {
          // Sin sesiones activas — inicializar vacío
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

        // Si la última sesión es de hoy → dejar campos vacíos (ya generó hoy)
        // Si es anterior → pre-llenar para conveniencia
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

  const normalizeFirstLetter = (str: string): string => {
    return str.normalize("NFD").replace(/[̀-ͯ]/g, "")[0]?.toUpperCase() ?? "#";
  };

  const filteredIdeas = ideas.filter((idea) =>
    idea.title.toLowerCase().includes(search.toLowerCase()),
  );

  const ALL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const lettersWithTopics = new Set(
    topics.map((t) => normalizeFirstLetter(t.name)),
  );

  const filteredTopicGroups = (() => {
    let filtered = topics;
    if (topicSearch) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(topicSearch.toLowerCase()),
      );
    }
    if (selectedLetter) {
      filtered = filtered.filter(
        (t) => normalizeFirstLetter(t.name) === selectedLetter,
      );
    }
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((t) => {
      const letter = normalizeFirstLetter(t.name);
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(t);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, items]) => ({ letter, items }));
  })();

  const getRecipeStateForIdea = (ideaId: string) =>
    recipeState[ideaId] ?? {
      platform_id: "",
      format: "",
      content_role: "",
      generating: false,
      error: null,
    };

  const updateRecipeState = (
    ideaId: string,
    updates: Partial<RecipeState[string]>,
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

  const handleGenerateRecipe = async (idea: Idea) => {
    const state = getRecipeStateForIdea(idea.id);
    if (!state.platform_id || !state.format) {
      updateRecipeState(idea.id, { error: t("ideas.selectPlatformError") });
      return;
    }

    const doGenerate = async () => {
      updateRecipeState(idea.id, { generating: true, error: null });
      try {
        const result = await generateRecipe({
          idea_id: idea.id,
          topic_ids: idea.topics?.map((t) => t.id) ?? [],
          platform_id: state.platform_id,
          format: state.format,
          content_role: state.content_role,
        });
        if (result.duplicate) {
          updateRecipeState(idea.id, {
            generating: false,
            error: t("recipe.duplicateCombination"),
          });
          return;
        }
        // Limpiar solo la combinación — los temas pertenecen a la idea, no al brief
        updateRecipeState(idea.id, {
          generating: false,
          platform_id: "",
          format: "",
          content_role: "",
        });
        // Abrir el modal con el brief recién generado
        if (result.session) {
          setExpandedSession({ session: result.session, idea });
        }
      } catch (err) {
        updateRecipeState(idea.id, {
          generating: false,
          error: err instanceof Error ? err.message : "Failed to generate recipe",
        });
      }
    };

    // Advertencia si no hay temas — usa el ConfirmModal del sistema, no window.confirm
    if (!idea.topics || idea.topics.length === 0) {
      openConfirm(
        t("ideas.generateWithoutTopicsTitle"),
        t("ideas.generateWithoutTopicsConfirm"),
        async () => {
          closeConfirm();
          await doGenerate();
        },
      );
      return;
    }

    await doGenerate();
  };

  const openConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };
  const closeConfirm = () => setConfirmModal(null);

  const handleEditOpen = (idea: Idea) => {
    setEditingIdea(idea);
    setEditTitle(idea.title);
    setEditDescription(idea.description ?? "");
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editingIdea || !editTitle.trim()) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await updateIdea(editingIdea.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditingIdea(null);
    } catch {
      setEditError(t("common.failedUpdate"));
    } finally {
      setEditSaving(false);
    }
  };

  const handleDuplicateIdea = async (idea: Idea) => {
    try {
      await duplicateIdea(idea);
    } catch {
      setActionError(t("common.failedCreate"));
    }
  };

  const handleDeleteIdea = (ideaId: string) => {
    openConfirm(
      t("ideas.confirmDeleteIdea"),
      t("ideas.confirmDeleteIdeaMessage"),
      async () => {
        closeConfirm();
        try {
          await deleteIdea(ideaId);
        } catch {
          setActionError(t("common.failedDelete"));
        }
      },
    );
  };

  const handleOpenTopicSelector = (idea: Idea) => {
    setEditingIdeaTopics(idea.id);
    setSelectedTopicIds(idea.topics?.map((t) => t.id) ?? []);
  };

  const handleToggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId],
    );
  };

  const handleSaveIdeaTopics = async () => {
    if (!editingIdeaTopics) return;
    setSavingTopics(true);
    try {
      const selectedTopics = topics
        .filter((t) => selectedTopicIds.includes(t.id))
        .map((t) => ({ id: t.id, name: t.name }));
      await updateIdeaTopics(
        editingIdeaTopics,
        selectedTopicIds,
        selectedTopics,
      );
      setEditingIdeaTopics(null);
    } catch {
      setActionError(t("common.failedUpdate"));
    } finally {
      setSavingTopics(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return;
    setCreatingTopic(true);
    setTopicError(null);
    try {
      await createTopic(newTopicName.trim());
      setNewTopicName("");
    } catch (err) {
      setTopicError(
        err instanceof Error ? err.message : t("common.failedCreate"),
      );
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleEditTopicSave = async () => {
    if (!editingTopic || !editTopicName.trim()) return;
    setSavingTopic(true);
    try {
      await updateTopic(editingTopic.id, editTopicName.trim());
      setEditingTopic(null);
    } catch {
      setActionError(t("common.failedUpdate"));
    } finally {
      setSavingTopic(false);
    }
  };

  const handleArchiveTopic = (topicId: string) => {
    openConfirm(
      t("ideas.confirmArchiveTopic"),
      t("ideas.confirmArchiveTopicMessage"),
      async () => {
        closeConfirm();
        try {
          await archiveTopic(topicId);
        } catch {
          setActionError(t("common.failedDelete"));
        }
      },
    );
  };

  /* =========================
     ARCHIVED IDEAS
  ========================= */

  const fetchArchivedIdeas = async () => {
    setLoadingArchived(true);
    try {
      const data = await loadArchivedIdeasFromHook();
      setArchivedIdeas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingArchived(false);
    }
  };

  useEffect(() => {
    if (activeTab === "archived") fetchArchivedIdeas();
  }, [activeTab]);

  const handleArchiveIdea = (ideaId: string) => {
    openConfirm(
      t("ideas.confirmArchiveIdea"),
      t("ideas.confirmArchiveIdeaMessage"),
      async () => {
        closeConfirm();
        try {
          // Capturar la idea antes de archivarla — aún existe en el array activo
          const ideaToArchive = ideas.find((i) => i.id === ideaId);

          await archiveIdea(ideaId);
          // archiveIdea ya la remueve de `ideas` localmente

          // Actualizar contador
          setArchivedCount((prev) => prev + 1);

          // Actualizar lista si ya fue cargada
          if (ideaToArchive) {
            setArchivedIdeas((prev) => [
              { ...ideaToArchive, archived_at: new Date().toISOString() },
              ...prev,
            ]);
          }
        } catch {
          setActionError(t("common.failedUpdate"));
        }
      },
    );
  };

  const createContentFromBrief = async (): Promise<string> => {
    if (!expandedSession) throw new Error("No session");
    const { session, idea } = expandedSession;
    const sessionAuth = await supabase.auth.getSession();
    const token = sessionAuth.data.session?.access_token;
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-content`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: idea.title,
          description: idea.description ?? null,
          platform_id: session.platform_id,
          format: session.format,
          status: "draft",
          content_role: session.content_role ?? null,
          creative_unit_id: idea.id,
          entry_channel: "recipe",
          session_id: session.id,
        }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create content");
    }
    const data = await res.json();
    const contentId = data.data.id;
    await updateSessionStatus(session.id, "executed");
    refetch();
    return contentId;
  };

  const handleViewContent = (contentId: string) => {
    setExpandedSession(null);
    navigate(`/contents?edit=${contentId}`);
  };

  // Cargar solo el conteo de archivadas al montar — sin el contenido completo
  useEffect(() => {
    const fetchArchivedCount = async () => {
      try {
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

        const { count } = await supabase
          .from("creative_units")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", userRecord.tenant_id)
          .not("archived_at", "is", null);

        setArchivedCount(count ?? 0);
      } catch (err) {
        console.error("Archived count error:", err);
      }
    };

    fetchArchivedCount();
  }, []); // Solo al montar

  return (
    <div className="ideas-page">
      {/* PAGE HEADER */}
      <div className="ideas-page__header">
        {activeTab === "ideas" ? (
          <div className="ideas-top-bar">
            <button
              className="btn-primary"
              onClick={() => setShowIdeaModal(true)}
              type="button"
            >
              {t("ideas.newIdea")}
            </button>
            <StepsGuide />
          </div>
        ) : activeTab === "topics" ? (
          <div className="topic-create-inline">
            <div className="topic-create-inline__field">
              <input
                type="text"
                placeholder={t("ideas.topicPlaceholder")}
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTopic();
                }}
                className="topic-create-inline__input"
              />
              <span
                className={`topic-create-inline__counter ${newTopicName.length >= 45 ? "topic-create-inline__counter--warning" : ""}`}
              >
                {newTopicName.length}/50
              </span>
            </div>
            <button
              className="btn-primary"
              onClick={handleCreateTopic}
              disabled={creatingTopic || !newTopicName.trim()}
              type="button"
            >
              {creatingTopic ? t("common.loading") : t("ideas.addTopic")}
            </button>
            <div className="topic-create-inline__search">
              <input
                type="text"
                placeholder={t("ideas.searchTopicsPlaceholder")}
                value={topicSearch}
                onChange={(e) => {
                  setTopicSearch(e.target.value);
                  setSelectedLetter(null);
                }}
                className="topic-create-inline__input"
              />
              {(topicSearch || selectedLetter) && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setTopicSearch("");
                    setSelectedLetter(null);
                  }}
                >
                  {t("contents.clearFilters")}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {topicError && <p className="error-text">{topicError}</p>}
      {actionError && (
        <div
          className="toast toast--error"
          onClick={() => setActionError(null)}
        >
          <span>⚠️ {actionError}</span>
        </div>
      )}

      {/* TABS */}
      <div className="ideas-tabs">
        <button
          className={`ideas-tab ${activeTab === "ideas" ? "ideas-tab--active" : ""}`}
          onClick={() => setActiveTab("ideas")}
          type="button"
        >
          {t("ideas.tabIdeas")}
          <span className="ideas-tab__count">{ideas.length}</span>
        </button>
        <button
          className={`ideas-tab ${activeTab === "topics" ? "ideas-tab--active" : ""}`}
          onClick={() => setActiveTab("topics")}
          type="button"
        >
          {t("ideas.tabTopics")}
          <span className="ideas-tab__count">{topics.length}</span>
        </button>
        <button
          className={`ideas-tab ${activeTab === "archived" ? "ideas-tab--active" : ""}`}
          onClick={() => setActiveTab("archived")}
          type="button"
        >
          {t("ideas.tabArchived")}
          <span className="ideas-tab__count">{archivedCount}</span>
        </button>
      </div>

      {/* ========================= IDEAS TAB ========================= */}
      {activeTab === "ideas" && (
        <div className="ideas-tab-content">
          {/* TOOLBAR */}
          <div className="ideas-toolbar">
            <input
              type="text"
              placeholder={t("ideas.searchIdeas")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ideas-search"
            />
            <div className="ideas-filters">
              {(["all", "manual", "generated"] as const).map((f) => (
                <button
                  key={f}
                  className={`filter-chip ${filter === f ? "filter-chip--active" : ""}`}
                  onClick={() => setFilter(f)}
                  type="button"
                >
                  {f === "all"
                    ? t("ideas.filterAll")
                    : f === "manual"
                      ? t("ideas.manual")
                      : t("ideas.generated")}
                </button>
              ))}
            </div>
            <div className="ideas-stats">
              <span>
                {ideas.length} {t("ideas.ideasCount")}
              </span>
              <span>·</span>
              <span>
                {ideas.filter((i) => (i.sessions?.length ?? 0) > 0).length}{" "}
                {t("ideas.withRecipe")}
              </span>
              <span>·</span>
              <span>
                {
                  ideas.filter((i) =>
                    i.sessions?.some((s) => s.status === "executed"),
                  ).length
                }{" "}
                {t("ideas.implemented")}
              </span>
            </div>
          </div>

          {/* Upgrade prompt — visible solo en free post-trial */}
          {isFree && !trialActive && (
            <UpgradePrompt
              title={t("upgrade.briefsTitle")}
              description={t("upgrade.briefsDesc")}
              compact
            />
          )}

          {loading && (
            <p className="ideas-loading">{t("ideas.loadingIdeas")}</p>
          )}
          {error && <p className="ideas-error">{error}</p>}

          {/* DUAL GRID */}
          {!loading && (
            <>
              {filteredIdeas.length === 0 && (
                <div className="ideas-empty">
                  <span>{t("ideas.noIdeas")}</span>
                </div>
              )}

              {filteredIdeas.length > 0 && (
                <div className="ideas-dual-headers">
                  <span>{t("ideas.columnIdea")}</span>
                  <span>{t("ideas.columnBrief")}</span>
                </div>
              )}

              <div className="ideas-dual-grid">
                {filteredIdeas.map((idea) => {
                  const isGenerated = idea.source === "generated";
                  const isEditingThis = editingIdea?.id === idea.id;
                  const isEditingTopicsThis = editingIdeaTopics === idea.id;
                  const state = getRecipeStateForIdea(idea.id);
                  const contentCount = idea.contents?.[0]?.count ?? 0;
                  const formats = ideaFormats[idea.id] ?? [];

                  return (
                    <div key={idea.id} className="ideas-dual-row">
                      {/* IDEA CARD */}
                      <div className="idea-card">
                        <div className="idea-card__header">
                          <span
                            className={`badge ${isGenerated ? "badge--generated" : "badge--manual"}`}
                          >
                            {isGenerated
                              ? t("ideas.generated")
                              : t("ideas.manual")}
                          </span>
                          {!isEditingThis && (
                            <div className="idea-card__controls">
                              <button
                                className="btn-icon"
                                onClick={() => handleEditOpen(idea)}
                                title={t("common.edit")}
                                type="button"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-icon"
                                onClick={() => handleDuplicateIdea(idea)}
                                title={t("ideas.duplicate")}
                                type="button"
                              >
                                ⧉
                              </button>
                              <button
                                className="btn-icon"
                                onClick={() => handleArchiveIdea(idea.id)}
                                title={t("ideas.archive")}
                                type="button"
                              >
                                <Archive size={14} />
                              </button>
                              <button
                                className="btn-icon btn-icon--danger"
                                onClick={() => handleDeleteIdea(idea.id)}
                                title={t("common.delete")}
                                type="button"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>

                        {/* EDIT MODE */}
                        {isEditingThis ? (
                          <div className="idea-card__edit">
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder={t("ideas.ideaTitlePlaceholder")}
                              autoFocus
                            />
                            <textarea
                              value={editDescription}
                              onChange={(e) =>
                                setEditDescription(e.target.value)
                              }
                              placeholder={t("ideas.descriptionOptional")}
                              rows={2}
                            />
                            {editError && (
                              <p className="idea-card__error">{editError}</p>
                            )}
                            <div className="idea-card__edit-actions">
                              <button
                                className="btn-secondary"
                                onClick={() => setEditingIdea(null)}
                                disabled={editSaving}
                                type="button"
                              >
                                {t("common.cancel")}
                              </button>
                              <button
                                className="btn-primary"
                                onClick={handleEditSave}
                                disabled={editSaving || !editTitle.trim()}
                                type="button"
                              >
                                {editSaving
                                  ? t("common.saving")
                                  : t("common.save")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="idea-card__title">{idea.title}</h4>
                            {idea.description && (
                              <p className="idea-card__description">
                                {idea.description}
                              </p>
                            )}

                            {/* TOPICS */}
                            <div className="idea-card__topics">
                              {idea.topics && idea.topics.length > 0 ? (
                                idea.topics.map((t) => (
                                  <span
                                    key={t.id}
                                    className="topic-chip topic-chip--small"
                                  >
                                    {t.name}
                                  </span>
                                ))
                              ) : (
                                <span className="idea-card__no-topics">
                                  {t("ideas.noTopicsYet")}
                                </span>
                              )}
                              <button
                                className="topic-chip topic-chip--add"
                                onClick={() => handleOpenTopicSelector(idea)}
                                type="button"
                                title={t("common.editTopics")}
                              >
                                {isEditingTopicsThis ? "✕" : "＋"}
                              </button>
                            </div>

                            {/* TOPIC SELECTOR */}
                            {isEditingTopicsThis && (
                              <div className="idea-card__topic-selector">
                                <p className="idea-card__topic-selector-label">
                                  {t("ideas.selectTopics")}
                                </p>
                                <div className="idea-card__topic-options">
                                  {topics.length === 0 ? (
                                    <p className="idea-card__no-topics">
                                      {t("ideas.noTopicsYet")}
                                    </p>
                                  ) : (
                                    topics.map((t: Topic) => (
                                      <button
                                        key={t.id}
                                        type="button"
                                        className={`topic-chip topic-chip--selectable ${selectedTopicIds.includes(t.id) ? "topic-chip--active" : ""}`}
                                        onClick={() => handleToggleTopic(t.id)}
                                      >
                                        {t.name}
                                      </button>
                                    ))
                                  )}
                                </div>
                                <div className="idea-card__topic-actions">
                                  <button
                                    className="btn-secondary"
                                    onClick={() => setEditingIdeaTopics(null)}
                                    type="button"
                                  >
                                    {t("common.cancel")}
                                  </button>
                                  <button
                                    className="btn-primary"
                                    onClick={handleSaveIdeaTopics}
                                    disabled={savingTopics}
                                    type="button"
                                  >
                                    {savingTopics
                                      ? t("common.saving")
                                      : t("common.save")}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* PLATFORM + FORMAT */}
                            <div className="idea-card__recipe-controls">
                              <select
                                value={state.platform_id}
                                onChange={(e) =>
                                  handlePlatformChange(idea.id, e.target.value)
                                }
                                className="idea-card__select"
                              >
                                <option value="">
                                  {t("ideas.platformPlaceholder")}
                                </option>
                                {platforms.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={state.format}
                                onChange={(e) =>
                                  updateRecipeState(idea.id, {
                                    format: e.target.value,
                                  })
                                }
                                disabled={!state.platform_id}
                                className="idea-card__select"
                              >
                                <option value="">
                                  {t("ideas.formatPlaceholder")}
                                </option>
                                {formats.map((f) => (
                                  <option key={f} value={f}>
                                    {t(`formats.${f}`, { defaultValue: f })}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={state.content_role ?? ""}
                                onChange={(e) =>
                                  updateRecipeState(idea.id, {
                                    content_role: e.target.value,
                                  })
                                }
                                className="idea-card__select"
                              >
                                <option value="">
                                  {t("contentRoles.selectRole")}
                                </option>
                                <option value="educational">
                                  {t("contentRoles.educational")}
                                </option>
                                <option value="inspirational">
                                  {t("contentRoles.inspirational")}
                                </option>
                                <option value="personal">
                                  {t("contentRoles.personal")}
                                </option>
                                <option value="promotional">
                                  {t("contentRoles.promotional")}
                                </option>
                                <option value="curated">
                                  {t("contentRoles.curated")}
                                </option>
                                <option value="sales">
                                  {t("contentRoles.sales")}
                                </option>
                              </select>
                            </div>

                            {state.error && (
                              <p className="idea-card__error">{state.error}</p>
                            )}

                            {/* FOOTER */}
                            <div className="idea-card__footer">
                              <span className="idea-card__stats">
                                {contentCount === 0
                                  ? t("ideas.noContentsYet")
                                  : `${contentCount} ${contentCount === 1 ? t("ideas.content") : t("ideas.contents")}`}
                              </span>
                              {canCreateBriefs ? (
                                <button
                                  className={`btn-generate ${state.generating ? "btn-generate--loading" : ""}`}
                                  onClick={() => handleGenerateRecipe(idea)}
                                  disabled={
                                    state.generating ||
                                    !state.platform_id ||
                                    !state.format
                                  }
                                  type="button"
                                >
                                  {state.generating
                                    ? t("recipe.generating")
                                    : t("recipe.generate")}
                                </button>
                              ) : (
                                <button
                                  className="btn-generate btn-generate--locked"
                                  type="button"
                                  disabled
                                  title={t("upgrade.briefsLocked")}
                                >
                                  ✦ {t("recipe.generate")}
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* BRIEF LIST */}
                      <BriefList
                        sessions={idea.sessions ?? []}
                        generating={state.generating}
                        onOpenSession={(session) =>
                          setExpandedSession({ session, idea })
                        }
                        platformName={(platformId) =>
                          platforms.find((p) => p.id === platformId)?.name ??
                          "—"
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================= TOPICS TAB ========================= */}
      {activeTab === "topics" && (
        <div className="ideas-tab-content">

          {/* ALPHABET + COUNT */}
          <div className="topics-alphabet">
            {ALL_LETTERS.map((letter) => {
              const hasTopics = lettersWithTopics.has(letter);
              return (
                <button
                  key={letter}
                  type="button"
                  className={`topics-alphabet__btn ${selectedLetter === letter ? "topics-alphabet__btn--active" : ""} ${hasTopics ? "topics-alphabet__btn--has" : "topics-alphabet__btn--empty"}`}
                  onClick={() => {
                    if (!hasTopics) return;
                    setSelectedLetter(selectedLetter === letter ? null : letter);
                    setTopicSearch("");
                  }}
                  disabled={!hasTopics}
                >
                  {letter}
                </button>
              );
            })}
            <span className="topics-count">
              {topics.length} {t("ideas.topicsCount")}
            </span>
          </div>

          {topicsLoading && <p className="ideas-loading">{t("common.loading")}</p>}

          {!topicsLoading && (
            <>
              {filteredTopicGroups.length === 0 ? (
                <div className="ideas-empty">
                  <span>{topics.length === 0 ? t("ideas.noTopics") : t("ideas.noTopicsMatch")}</span>
                </div>
              ) : (
                <div className="topics-alpha-list">
                  {filteredTopicGroups.map(({ letter, items }) => (
                    <div key={letter} className="topics-alpha-group">

                      {/* Header de letra */}
                      <div className="topics-alpha-group__header">
                        <span className="topics-alpha-group__letter">{letter}</span>
                        <span className="topics-alpha-group__count">
                          {items.length} {t("ideas.topicsCount")}
                        </span>
                      </div>

                      {/* Grid 4 columnas */}
                      <div className="topics-alpha-group__grid">
                        {items.map((topic) => (
                          <div key={topic.id} className="topic-list-item">
                            {editingTopic?.id === topic.id ? (
                              <div className="topic-list-item__edit">
                                <input
                                  value={editTopicName}
                                  onChange={(e) => setEditTopicName(e.target.value)}
                                  maxLength={50}
                                  autoFocus
                                />
                                <div className="topic-list-item__edit-actions">
                                  <button
                                    className="btn-secondary"
                                    onClick={() => setEditingTopic(null)}
                                    type="button"
                                  >
                                    {t("common.cancel")}
                                  </button>
                                  <button
                                    className="btn-primary"
                                    onClick={handleEditTopicSave}
                                    disabled={savingTopic}
                                    type="button"
                                  >
                                    {savingTopic ? t("common.saving") : t("common.save")}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Nombre clickeable → abre modal sistema */}
                                <button
                                  type="button"
                                  className="topic-list-item__name topic-list-item__name--clickable"
                                  onClick={() => {
                                    const systemTopic = systemTopics.find((s) => s.id === topic.id);
                                    setSystemModalTopic(systemTopic ?? { id: topic.id, name: topic.name, ideas: [] });
                                  }}
                                >
                                  <span className="topic-list-item__dot" />
                                  {topic.name}
                                </button>
                                <div className="topic-list-item__controls">
                                  <button
                                    className="btn-icon"
                                    onClick={() => { setEditingTopic(topic); setEditTopicName(topic.name); }}
                                    type="button"
                                    title={t("common.edit")}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="btn-icon btn-icon--danger"
                                    onClick={() => handleArchiveTopic(topic.id)}
                                    type="button"
                                    title={t("common.archive")}
                                  >
                                    🗄️
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* ========================= ARCHIVED TAB ========================= */}
      {activeTab === "archived" && (
        <div className="ideas-tab-content">
          {loadingArchived ? (
            <p className="ideas-loading">{t("common.loading")}</p>
          ) : archivedIdeas.length === 0 ? (
            <div className="ideas-empty">
              <Archive size={24} style={{ color: "var(--text-faint)" }} />
              <span>{t("ideas.noArchivedIdeas")}</span>
            </div>
          ) : (
            <div className="archived-list">
              {archivedIdeas.map((idea) => {
                const isExpanded = expandedArchived.has(idea.id);
                const activeSessions = (idea.sessions ?? []).filter(
                  (s) => s.status !== "discarded",
                );

                return (
                  <div key={idea.id} className="archived-item">
                    <div
                      className="archived-item__header"
                      onClick={() =>
                        setExpandedArchived((prev) => {
                          const next = new Set(prev);
                          if (next.has(idea.id)) {
                            next.delete(idea.id);
                          } else {
                            next.add(idea.id);
                          }
                          return next;
                        })
                      }
                    >
                      <ChevronRight
                        size={12}
                        className={`archived-item__chevron${isExpanded ? " archived-item__chevron--open" : ""}`}
                        aria-hidden="true"
                      />
                      <span className="archived-item__title">{idea.title}</span>
                      <div className="archived-item__meta">
                        <span className="archived-item__count">
                          {activeSessions.length}{" "}
                          {activeSessions.length === 1
                            ? t("recipe.briefSingular")
                            : t("recipe.briefPlural")}
                        </span>
                        {idea.archived_at && (
                          <span className="archived-item__date">
                            {t("ideas.archivedOn")}{" "}
                            {new Date(idea.archived_at).toLocaleDateString()}
                          </span>
                        )}
                        <button
                          className="btn-restore"
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirm(
                              t("ideas.confirmRestore"),
                              t("ideas.confirmRestoreMessage"),
                              async () => {
                                closeConfirm();
                                try {
                                  await restoreIdea(idea.id);
                                  setArchivedCount((prev) =>
                                    Math.max(0, prev - 1),
                                  );
                                  setArchivedIdeas((prev) =>
                                    prev.filter((i) => i.id !== idea.id),
                                  );
                                } catch {
                                  setActionError(t("common.failedUpdate"));
                                }
                              },
                            );
                          }}
                          type="button"
                        >
                          <Undo2 size={12} aria-hidden="true" />
                          {t("ideas.restore")}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="archived-item__briefs">
                        {activeSessions.length === 0 ? (
                          <p className="archived-item__no-briefs">
                            {t("recipe.noRecipeYet")}
                          </p>
                        ) : (
                          activeSessions.map((session) => {
                            const platform =
                              platforms.find(
                                (p) => p.id === session.platform_id,
                              )?.name ?? "—";
                            const format = t(`formats.${session.format}`, {
                              defaultValue: session.format,
                            });
                            const role = session.content_role
                              ? t(`contentRoles.${session.content_role}`, {
                                  defaultValue: session.content_role,
                                })
                              : null;
                            return (
                              <div
                                key={session.id}
                                className="archived-brief-row"
                              >
                                <div className="archived-brief-row__dot" />
                                <span className="archived-brief-row__combo">
                                  {[platform, format, role]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                                <span
                                  className="archived-brief-row__dots"
                                  aria-hidden="true"
                                />
                                <StatusBadge status={session.status} />
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EXPANDED RECIPE PANEL */}
      {expandedSession && (
        <RecipePanel
          session={expandedSession.session}
          idea={expandedSession.idea}
          onClose={() => setExpandedSession(null)}
          onApprove={async () => {
            await updateSessionStatus(expandedSession.session.id, "reviewed");
          }}
          onDiscard={async () => {
            await updateSessionStatus(expandedSession.session.id, "discarded");
            setExpandedSession(null);
          }}
          onCreateContent={createContentFromBrief}
          onViewContent={handleViewContent}
          onDownload={async () => {
            downloadBrief(expandedSession.session, {
              title: expandedSession.idea.title,
              description: expandedSession.idea.description,
              topics: expandedSession.idea.topics ?? [],
            });
            await markAsDownloaded(expandedSession.session.id);
          }}
          saveFeedback={saveFeedback}
          updateSessionStatus={updateSessionStatus}
          regenerateAspect={regenerateAspect}
          updateRecipeAspect={updateRecipeAspect}
          ideaTopics={expandedSession.idea.topics ?? []}
          platformName={
            platforms.find((p) => p.id === expandedSession.session.platform_id)
              ?.name ?? ""
          }
        />
      )}

      {/* CREATE IDEA MODAL */}
      {showIdeaModal && (
        <CreateIdeaModal
          isOpen={showIdeaModal}
          onClose={() => setShowIdeaModal(false)}
          onCreated={() => {
            refetch();
            setShowIdeaModal(false);
          }}
        />
      )}

      {/* EDIT IDEA MODAL */}
      {editingIdea && (
        <EditIdeaModal
          idea={editingIdea}
          editTitle={editTitle}
          editDescription={editDescription}
          editError={editError}
          editSaving={editSaving}
          onTitleChange={setEditTitle}
          onDescriptionChange={setEditDescription}
          onSave={handleEditSave}
          onCancel={() => setEditingIdea(null)}
        />
      )}

      {/* TOPIC SYSTEM MODAL */}
      {systemModalTopic && (
        <div className="modal-overlay" onClick={() => setSystemModalTopic(null)}>
          <div
            className="modal modal--topic-system"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="topic-system-modal__header">
              <div>
                <p className="topic-system-modal__eyebrow">
                  {t("ideas.contentSystem")}
                </p>
                <h3>{systemModalTopic.name}</h3>
              </div>
              <button
                className="btn-icon"
                onClick={() => setSystemModalTopic(null)}
                type="button"
                aria-label={t("common.close")}
              >
                <X size={16} />
              </button>
            </div>

            {systemModalTopic.ideas.length === 0 ? (
              <p className="topic-system-modal__empty">
                {t("ideas.noIdeasLinkedToTopic")}
              </p>
            ) : (
              <div className="topic-system-modal__tree">
                {systemModalTopic.ideas.map((idea) => (
                  <div key={idea.id} className="topic-system-modal__idea">
                    <span className="topic-system-modal__idea-dot" />
                    <div className="topic-system-modal__idea-body">
                      <p className="topic-system-modal__idea-name">{idea.title}</p>
                      {idea.contents.length === 0 ? (
                        <p className="topic-system-modal__no-contents">
                          {t("ideas.noContentsYet")}
                        </p>
                      ) : (
                        <div className="topic-system-modal__contents">
                          {idea.contents.map((content) => (
                            <div key={content.id} className="topic-system-modal__content">
                              <span className="topic-system-modal__content-dot" />
                              <span className="topic-system-modal__content-title">
                                {content.title}
                              </span>
                              <span className="topic-system-modal__content-meta">
                                {content.platform} · {t(`formats.${content.format}`, { defaultValue: content.format })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setSystemModalTopic(null)}
                type="button"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={t("common.confirm")}
          cancelLabel={t("common.cancel")}
          danger={true}
          onConfirm={confirmModal.onConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}
