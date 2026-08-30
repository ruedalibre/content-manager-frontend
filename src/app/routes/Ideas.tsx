import { useState, useEffect } from "react";
import { Pencil, Archive, ChevronRight, Undo2, X } from "lucide-react";
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
import { useIdeaCardState } from "../../features/ideas/hooks/useIdeaCardState.ts";
import IdeaCard from "../../features/ideas/components/IdeaCard.tsx";
import CreateIdeaModal from "../../features/ideas/modals/CreateIdeaModal.tsx";
import ConfirmModal from "../../components/ui/ConfirmModal.tsx";
import BriefList from "../../features/ideas/components/BriefList.tsx";
import RecipePanel from "../../features/ideas/components/RecipePanel.tsx";
import EditIdeaModal from "../../features/ideas/components/EditIdeaModal.tsx";
import StatusBadge from "../../features/ideas/components/StatusBadge.tsx";
import { downloadBrief } from "../../utils/downloadBrief.ts";
import { supabase } from "../../supabaseClient.ts";
import { useSubscription } from "../../features/subscription/hooks/useSubscription.tsx";
import UpgradePrompt from "../../components/ui/UpgradePrompt";
import StepsGuide from "../../components/ui/StepsGuide";
import { useWorkspace } from "../../features/workspace/hooks/useWorkspace.tsx";
import "./Ideas.scss";

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
  const COLLAPSE_THRESHOLD = 10;
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [expandedSession, setExpandedSession] = useState<{
    session: CreativeSession;
    idea: Idea;
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [systemModalTopic, setSystemModalTopic] = useState<
    (typeof systemTopics)[0] | null
  >(null);

  const { currentWorkspaceId } = useWorkspace();

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
  } = useIdeas(filter, currentWorkspaceId);

  const {
    topics,
    loading: topicsLoading,
    createTopic,
    updateTopic,
    archiveTopic,
  } = useTopics();

  const { topics: systemTopics } = useContentSystem(currentWorkspaceId);

  const { platforms } = usePlatforms();
  const { canCreateBriefs, isFree, trialActive } = useSubscription();
  const {
    ideaFormats,
    getRecipeStateForIdea,
    updateRecipeState,
    handlePlatformChange,
  } = useIdeaCardState(ideas);

  useEffect(() => {
    if (!ideas.length) return;
    if (ideas.length > COLLAPSE_THRESHOLD) {
      setCollapsedIds(new Set(ideas.map((i) => i.id)));
      setAllCollapsed(true);
    }
  }, [ideas.length]);

  const toggleCollapse = (ideaId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ideaId)) next.delete(ideaId);
      else next.add(ideaId);
      return next;
    });
  };

  const toggleAllCollapse = () => {
    if (allCollapsed) {
      setCollapsedIds(new Set());
      setAllCollapsed(false);
    } else {
      setCollapsedIds(new Set(ideas.map((i) => i.id)));
      setAllCollapsed(true);
    }
  };

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

  const handleGenerateRecipe = async (idea: Idea) => {
    if (!currentWorkspaceId) {
      updateRecipeState(idea.id, { error: t("common.error") });
      return;
    }
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
          content_goal: state.content_goal || undefined,
          cta_intent: state.cta_intent || undefined,
          target_audience: state.target_audience || undefined,
          ready_to_use: state.ready_to_use ?? false,
          workspace_id: currentWorkspaceId ?? "",
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
          error:
            err instanceof Error ? err.message : "Failed to generate recipe",
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
      setTimeout(() => setActionError(null), 3000); // ← auto-limpiar
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
  }, [activeTab, currentWorkspaceId]);

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
    if (!currentWorkspaceId) throw new Error("Workspace not loaded yet");

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
          content_goal: session.content_goal ?? null,
          cta_intent: session.cta_intent ?? null,
          target_audience: session.target_audience ?? null,
          creative_unit_id: idea.id,
          entry_channel: "recipe",
          session_id: session.id,
          workspace_id: currentWorkspaceId,
        }),
      },
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

  useEffect(() => {
    const fetchArchivedCount = async () => {
      if (!currentWorkspaceId) return;

      try {
        const { count } = await supabase
          .from("creative_units")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", currentWorkspaceId)
          .not("archived_at", "is", null);

        setArchivedCount(count ?? 0);
      } catch (err) {
        console.error("Archived count error:", err);
      }
    };

    fetchArchivedCount();
  }, [currentWorkspaceId]);

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
            <button
              type="button"
              className="ideas-toggle-all"
              onClick={toggleAllCollapse}
            >
              {allCollapsed ? t("ideas.expandAll") : t("ideas.collapseAll")}
            </button>
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
              {filteredIdeas.length === 0 && search === "" && (
                <div className="ideas-empty-state">
                  <div className="ideas-empty-state__icon">✦</div>
                  <h3 className="ideas-empty-state__title">
                    {t("ideas.emptyTitle")}
                  </h3>
                  <p className="ideas-empty-state__subtitle">
                    {t("ideas.emptySubtitle")}
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => setShowIdeaModal(true)}
                    type="button"
                  >
                    {t("ideas.newIdea")}
                  </button>
                </div>
              )}
              {filteredIdeas.length === 0 && search !== "" && (
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
                  const isEditingThis = editingIdea?.id === idea.id;
                  const isEditingTopicsThis = editingIdeaTopics === idea.id;
                  const state = getRecipeStateForIdea(idea.id);
                  const formats = ideaFormats[idea.id] ?? [];

                  return (
                    <div
                      key={idea.id}
                      className={`ideas-dual-row${collapsedIds.has(idea.id) ? " ideas-dual-row--collapsed" : ""}`}
                    >
                      {/* IDEA CARD */}
                      <IdeaCard
                        idea={idea}
                        state={state}
                        formats={formats}
                        platforms={platforms}
                        topics={topics}
                        canCreateBriefs={canCreateBriefs}
                        isEditing={isEditingThis}
                        isEditingTopics={isEditingTopicsThis}
                        editTitle={editTitle}
                        editDescription={editDescription}
                        editError={editError}
                        editSaving={editSaving}
                        selectedTopicIds={selectedTopicIds}
                        savingTopics={savingTopics}
                        onEditOpen={() => handleEditOpen(idea)}
                        onEditSave={handleEditSave}
                        onEditCancel={() => setEditingIdea(null)}
                        onEditTitleChange={setEditTitle}
                        onEditDescriptionChange={setEditDescription}
                        onDuplicate={() => handleDuplicateIdea(idea)}
                        onArchive={() => handleArchiveIdea(idea.id)}
                        onDelete={() => handleDeleteIdea(idea.id)}
                        onPlatformChange={(platformId) =>
                          handlePlatformChange(idea.id, platformId)
                        }
                        onFormatChange={(format) =>
                          updateRecipeState(idea.id, { format })
                        }
                        onRoleChange={(role) =>
                          updateRecipeState(idea.id, { content_role: role })
                        }
                        onGoalChange={(goal) =>
                          updateRecipeState(idea.id, { content_goal: goal })
                        }
                        onCtaIntentChange={(cta) =>
                          updateRecipeState(idea.id, { cta_intent: cta })
                        }
                        onAudienceChange={(audience) =>
                          updateRecipeState(idea.id, {
                            target_audience: audience,
                          })
                        }
                        onReadyToUseChange={(value) =>
                          updateRecipeState(idea.id, { ready_to_use: value })
                        }
                        onGenerate={() => handleGenerateRecipe(idea)}
                        onOpenTopicSelector={() =>
                          handleOpenTopicSelector(idea)
                        }
                        onToggleTopic={handleToggleTopic}
                        onSaveTopics={handleSaveIdeaTopics}
                        onCancelTopics={() => setEditingIdeaTopics(null)}
                        isCollapsed={collapsedIds.has(idea.id)}
                        onToggleCollapse={() => toggleCollapse(idea.id)}
                      />

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
          <div className="topics-alphabet" translate="no">
            {ALL_LETTERS.map((letter) => {
              const hasTopics = lettersWithTopics.has(letter);
              return (
                <button
                  key={letter}
                  type="button"
                  className={`topics-alphabet__btn ${selectedLetter === letter ? "topics-alphabet__btn--active" : ""} ${hasTopics ? "topics-alphabet__btn--has" : "topics-alphabet__btn--empty"}`}
                  onClick={() => {
                    if (!hasTopics) return;
                    setSelectedLetter(
                      selectedLetter === letter ? null : letter,
                    );
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

          {topicsLoading && (
            <p className="ideas-loading">{t("common.loading")}</p>
          )}

          {!topicsLoading && (
            <>
              {filteredTopicGroups.length === 0 ? (
                <div className="ideas-empty">
                  <span>
                    {topics.length === 0
                      ? t("ideas.noTopics")
                      : t("ideas.noTopicsMatch")}
                  </span>
                </div>
              ) : (
                <div className="topics-alpha-list">
                  {filteredTopicGroups.map(({ letter, items }) => (
                    <div key={letter} className="topics-alpha-group">
                      {/* Header de letra */}
                      <div className="topics-alpha-group__header">
                        <span className="topics-alpha-group__letter">
                          {letter}
                        </span>
                        <span className="topics-alpha-group__count">
                          {items.length} {t("ideas.topicsCount")}
                        </span>
                      </div>

                      {/* Grid 4 columnas */}
                      <div className="topics-alpha-group__grid">
                        {items.map((topic) => (
                          <div
                            key={topic.id}
                            className={`topic-list-item${editingTopic?.id === topic.id ? " topic-list-item--editing" : ""}`}
                          >
                            {editingTopic?.id === topic.id ? (
                              <div className="topic-list-item__edit">
                                <input
                                  value={editTopicName}
                                  onChange={(e) =>
                                    setEditTopicName(e.target.value)
                                  }
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
                                    {savingTopic
                                      ? t("common.saving")
                                      : t("common.save")}
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
                                    const systemTopic = systemTopics.find(
                                      (s) => s.id === topic.id,
                                    );
                                    setSystemModalTopic(
                                      systemTopic ?? {
                                        id: topic.id,
                                        name: topic.name,
                                        ideas: [],
                                      },
                                    );
                                  }}
                                >
                                  <span className="topic-list-item__dot" />
                                  {topic.name}
                                </button>
                                <div className="topic-list-item__controls">
                                  <button
                                    className="btn-icon"
                                    onClick={() => {
                                      setEditingTopic(topic);
                                      setEditTopicName(topic.name);
                                    }}
                                    type="button"
                                    title={t("common.edit")}
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    className="btn-icon btn-icon--danger"
                                    onClick={() => handleArchiveTopic(topic.id)}
                                    type="button"
                                    title={t("common.archive")}
                                  >
                                    <Archive size={14} />
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
            downloadBrief(
              expandedSession.session,
              {
                title: expandedSession.idea.title,
                description: expandedSession.idea.description,
                topics: expandedSession.idea.topics ?? [],
              },
              platforms.find(
                (p) => p.id === expandedSession.session.platform_id,
              )?.slug ?? "",
              t,
            );
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
          platformSlug={
            platforms.find((p) => p.id === expandedSession.session.platform_id)
              ?.slug ?? ""
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
        <div
          className="modal-overlay"
          onClick={() => setSystemModalTopic(null)}
        >
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
                      <p className="topic-system-modal__idea-name">
                        {idea.title}
                      </p>
                      {idea.contents.length === 0 ? (
                        <p className="topic-system-modal__no-contents">
                          {t("ideas.noContentsYet")}
                        </p>
                      ) : (
                        <div className="topic-system-modal__contents">
                          {idea.contents.map((content) => (
                            <div
                              key={content.id}
                              className="topic-system-modal__content"
                            >
                              <span className="topic-system-modal__content-dot" />
                              <span className="topic-system-modal__content-title">
                                {content.title}
                              </span>
                              <span className="topic-system-modal__content-meta">
                                {content.platform} ·{" "}
                                {t(`formats.${content.format}`, {
                                  defaultValue: content.format,
                                })}
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
