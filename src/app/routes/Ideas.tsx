import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  useIdeas,
  type Idea,
  type IdeaTopic,
  type CreativeSession,
} from "../../features/ideas/hooks/useIdeas.ts";
import { useTopics, type Topic } from "../../features/ideas/hooks/useTopics.ts";
import { useContentSystem } from "../../features/ideas/hooks/useContentSystem.ts";
import { usePlatforms } from "../../features/contents/hooks/usePlatforms.ts";
import { useFormats } from "../../features/contents/hooks/useFormats.ts";
import CreateContentModal from "../../features/contents/modals/CreateContentModal.tsx";
import CreateIdeaModal from "../../features/ideas/modals/CreateIdeaModal.tsx";
import ConfirmModal from "../../components/ui/ConfirmModal.tsx";
import RecipeCard from "../../features/ideas/components/RecipeCard.tsx";
import RecipePanel from "../../features/ideas/components/RecipePanel.tsx";
import EditIdeaModal from "../../features/ideas/components/EditIdeaModal.tsx";
import "./Ideas.scss";

type IdeaForContent = {
  id: string;
  title: string;
  description?: string | null;
  topics?: IdeaTopic[];
  platform_id?: string;
  format?: string;
  content_role?: string;
};

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
  const [activeTab, setActiveTab] = useState<"ideas" | "topics">("ideas");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "manual" | "generated">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaForContent | null>(null);
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
  const [expandedLetters, setExpandedLetters] = useState<
    Record<string, boolean>
  >({});
  const [openSystemTopics, setOpenSystemTopics] = useState<
    Record<string, boolean>
  >({});
  const [openSystemIdeas, setOpenSystemIdeas] = useState<
    Record<string, boolean>
  >({});
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
  const [discardedIdeaIds, setDiscardedIdeaIds] = useState<Set<string>>(
    new Set(),
  );

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
    deleteIdea,
    regenerateAspect,
    updateRecipeAspect,
  } = useIdeas(filter);

  const {
    topics,
    loading: topicsLoading,
    createTopic,
    updateTopic,
    archiveTopic,
  } = useTopics();

  const { topics: systemTopics, loading: contentSystemLoading } =
    useContentSystem();

  const { platforms } = usePlatforms();
  const { loadFormats } = useFormats();

  const toggleSystemTopic = (id: string) => {
    setOpenSystemTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSystemIdea = (id: string) => {
    setOpenSystemIdeas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandLetter = (letter: string) => {
    setExpandedLetters((prev) => ({ ...prev, [letter]: !prev[letter] }));
  };

  const chunkIntoColumns = (
    items: typeof topics,
    maxPerCol: number,
    maxCols: number,
  ) => {
    const columns: (typeof topics)[] = [];
    for (let i = 0; i < items.length; i += maxPerCol) {
      if (columns.length >= maxCols) break;
      columns.push(items.slice(i, i + maxPerCol));
    }
    return columns;
  };

  useEffect(() => {
    if (!ideas.length) return;

    setRecipeState((prev) => {
      const updated = { ...prev };
      ideas.forEach((idea) => {
        if (!updated[idea.id] && idea.sessions && idea.sessions.length > 0) {
          const latest = idea.sessions.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )[0];
          updated[idea.id] = {
            platform_id: latest.platform_id ?? "",
            format: latest.format ?? "",
            content_role: latest.content_role ?? "",
            generating: false,
            error: null,
          };
        }
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

  const filteredSystemTopics = systemTopics.filter((t) => {
    if (topicSearch) {
      return t.name.toLowerCase().includes(topicSearch.toLowerCase());
    }
    if (selectedLetter) {
      return normalizeFirstLetter(t.name) === selectedLetter;
    }
    return true;
  });

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
          error: "A recipe already exists for this exact combination.",
        });
        return;
      }
      updateRecipeState(idea.id, { generating: false });
    } catch (err) {
      updateRecipeState(idea.id, {
        generating: false,
        error: err instanceof Error ? err.message : "Failed to generate recipe",
      });
    }
  };

  const getLatestSession = (idea: Idea): CreativeSession | null => {
    if (!idea.sessions || idea.sessions.length === 0) return null;
    return idea.sessions.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
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
      setEditError("Failed to update idea.");
    } finally {
      setEditSaving(false);
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
          setActionError("Failed to delete idea.");
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
      await updateIdeaTopics(editingIdeaTopics, selectedTopicIds);
      setEditingIdeaTopics(null);
    } catch {
      setActionError("Failed to update idea topics.");
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
        err instanceof Error ? err.message : "Failed to create topic.",
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
      setActionError("Failed to update topic.");
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
          setActionError("Failed to archive topic.");
        }
      },
    );
  };

  return (
    <div className="ideas-page">
      {/* PAGE HEADER */}
      <div className="ideas-page__header">
        <div>
          <h2 className="ideas-page__title">{t("ideas.title")}</h2>
          <p className="ideas-page__subtitle">{t("ideas.subtitle")}</p>
        </div>
        {activeTab === "ideas" ? (
          <button
            className="btn-primary"
            onClick={() => setShowIdeaModal(true)}
            type="button"
          >
            {t("ideas.newIdea")}
          </button>
        ) : (
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
          </div>
        )}
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
                  const latestSession = getLatestSession(idea);
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
                                title="Edit"
                                type="button"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-icon btn-icon--danger"
                                onClick={() => handleDeleteIdea(idea.id)}
                                title="Delete"
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
                              placeholder="Idea title"
                              autoFocus
                            />
                            <textarea
                              value={editDescription}
                              onChange={(e) =>
                                setEditDescription(e.target.value)
                              }
                              placeholder="Description (optional)"
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
                                Cancel
                              </button>
                              <button
                                className="btn-primary"
                                onClick={handleEditSave}
                                disabled={editSaving || !editTitle.trim()}
                                type="button"
                              >
                                {editSaving ? "Saving..." : "Save"}
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
                                  No topics
                                </span>
                              )}
                              <button
                                className="topic-chip topic-chip--add"
                                onClick={() => handleOpenTopicSelector(idea)}
                                type="button"
                                title="Edit topics"
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
                            </div>
                          </>
                        )}
                      </div>

                      {/* RECIPE CARD */}
                      <RecipeCard
                        session={latestSession}
                        generating={state.generating}
                        showDiscardMessage={discardedIdeaIds.has(idea.id)}
                        onClick={() =>
                          latestSession &&
                          setExpandedSession({ session: latestSession, idea })
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
          {/* TOOLBAR CON SEARCH Y FILTRO ALFABÉTICO */}
          <div className="topics-toolbar">
            <input
              type="text"
              placeholder={t("ideas.searchTopics")}
              value={topicSearch}
              onChange={(e) => {
                setTopicSearch(e.target.value);
                setSelectedLetter(null);
              }}
              className="ideas-search"
            />
            <div className="topics-alphabet">
              {ALL_LETTERS.map((letter) => (
                <button
                  key={letter}
                  className={`topics-alphabet__btn${selectedLetter === letter ? " topics-alphabet__btn--active" : ""}${!lettersWithTopics.has(letter) ? " topics-alphabet__btn--disabled" : ""}`}
                  onClick={() => {
                    if (!lettersWithTopics.has(letter)) return;
                    setSelectedLetter(
                      selectedLetter === letter ? null : letter,
                    );
                    setTopicSearch("");
                  }}
                  type="button"
                  disabled={!lettersWithTopics.has(letter)}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {topicsLoading && <p className="ideas-loading">Loading topics...</p>}

          {!topicsLoading && (
            <>
              {/* LISTA ALFABÉTICA */}
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
                  {filteredTopicGroups.map(({ letter, items }) => {
                    const MAX_COLS = 4;
                    const MAX_PER_COL = 5;
                    const MAX_VISIBLE = MAX_COLS * MAX_PER_COL;
                    const isExpanded = expandedLetters[letter];
                    const hasMore = items.length > MAX_VISIBLE;
                    const visibleItems = isExpanded
                      ? items
                      : items.slice(0, MAX_VISIBLE);
                    const itemsPerCol = isExpanded
                      ? Math.ceil(items.length / MAX_COLS)
                      : MAX_PER_COL;
                    const columns = chunkIntoColumns(
                      visibleItems,
                      itemsPerCol,
                      MAX_COLS,
                    );

                    return (
                      <div key={letter} className="topics-alpha-group">
                        <div className="topics-alpha-group__header">
                          <span className="topics-alpha-group__letter">
                            {letter}
                          </span>
                          {hasMore && (
                            <button
                              type="button"
                              className="topics-alpha-group__more"
                              onClick={() => toggleExpandLetter(letter)}
                            >
                              {isExpanded
                                ? t("ideas.seeLess")
                                : `+${items.length - MAX_VISIBLE} ${t("ideas.seeMore")}`}
                            </button>
                          )}
                        </div>

                        <div className="topics-alpha-group__columns">
                          {columns.map((col, colIndex) => (
                            <div
                              key={colIndex}
                              className="topics-alpha-group__col"
                            >
                              {col.map((topic) => (
                                <div key={topic.id} className="topic-list-item">
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
                                          Cancel
                                        </button>
                                        <button
                                          className="btn-primary"
                                          onClick={handleEditTopicSave}
                                          disabled={savingTopic}
                                          type="button"
                                        >
                                          {savingTopic ? "..." : "Save"}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="topic-list-item__name">
                                        {topic.name}
                                      </span>
                                      <div className="topic-list-item__controls">
                                        <button
                                          className="btn-icon"
                                          onClick={() => {
                                            setEditingTopic(topic);
                                            setEditTopicName(topic.name);
                                          }}
                                          type="button"
                                          title="Edit"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          className="btn-icon btn-icon--danger"
                                          onClick={() =>
                                            handleArchiveTopic(topic.id)
                                          }
                                          type="button"
                                          title="Archive"
                                        >
                                          🗄️
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CONTENT SYSTEM VIEW */}
              <div className="content-system">
                <div className="content-system__header">
                  <span className="section-label">
                    {t("ideas.contentSystem")}
                  </span>
                  <p className="content-system__subtitle">
                    {t("ideas.contentSystemSubtitle")}
                  </p>
                  <div className="content-system__legend">
                    <span className="content-system__legend-item">
                      <span className="content-system__legend-dot content-system__legend-dot--topic" />
                      Topic
                    </span>
                    <span className="content-system__legend-item">
                      <span className="content-system__legend-dot content-system__legend-dot--idea" />
                      Idea
                    </span>
                    <span className="content-system__legend-item">
                      <span className="content-system__legend-dot content-system__legend-dot--content" />
                      Content
                    </span>
                  </div>
                </div>

                {contentSystemLoading ? (
                  <p className="ideas-loading">Loading...</p>
                ) : filteredSystemTopics.length === 0 ? (
                  <p className="ideas-empty">
                    <span>{t("ideas.linkIdeasToTopics")}</span>
                  </p>
                ) : (
                  <div className="cs-tree">
                    {filteredSystemTopics.map((topic) => (
                      <div key={topic.id} className="cs-topic">
                        <div
                          className="cs-topic__header"
                          onClick={() => toggleSystemTopic(topic.id)}
                        >
                          <span
                            className={`cs-chevron ${openSystemTopics[topic.id] ? "cs-chevron--open" : ""}`}
                          >
                            ▶
                          </span>
                          <div className="cs-topic__dot" />
                          <span className="cs-topic__name">{topic.name}</span>
                          <span className="cs-topic__stats">
                            {topic.ideas.length} idea
                            {topic.ideas.length !== 1 ? "s" : ""} ·{" "}
                            {topic.ideas.reduce(
                              (s, i) => s + i.contents.length,
                              0,
                            )}{" "}
                            contents
                          </span>
                        </div>

                        {openSystemTopics[topic.id] && (
                          <div className="cs-ideas">
                            {topic.ideas.map((idea) => (
                              <div key={idea.id} className="cs-idea">
                                <div
                                  className="cs-idea__header"
                                  onClick={() => toggleSystemIdea(idea.id)}
                                >
                                  <span
                                    className={`cs-chevron ${openSystemIdeas[idea.id] ? "cs-chevron--open" : ""}`}
                                  >
                                    ▶
                                  </span>
                                  <div className="cs-idea__dot" />
                                  <span className="cs-idea__name">
                                    {idea.title}
                                  </span>
                                  <span className="cs-idea__count">
                                    {idea.contents.length} content
                                    {idea.contents.length !== 1 ? "s" : ""}
                                  </span>
                                </div>

                                {openSystemIdeas[idea.id] && (
                                  <div className="cs-contents">
                                    {idea.contents.length === 0 ? (
                                      <div className="cs-content">
                                        <span className="cs-content__empty">
                                          No contents yet
                                        </span>
                                      </div>
                                    ) : (
                                      idea.contents.map((content) => (
                                        <div
                                          key={content.id}
                                          className="cs-content"
                                        >
                                          <div className="cs-content__dot" />
                                          <span className="cs-content__title">
                                            {content.title}
                                          </span>
                                          <span className="cs-content__platform">
                                            {content.platform}
                                          </span>
                                          <span className="cs-content__format">
                                            {content.format}
                                          </span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
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
            setExpandedSession(null);
          }}
          onDiscard={async () => {
            await updateSessionStatus(expandedSession.session.id, "discarded");
            setDiscardedIdeaIds(
              (prev) => new Set([...prev, expandedSession.idea.id]),
            );
            setExpandedSession(null);
          }}
          onCreateContent={() => {
            setSelectedIdea({
              id: expandedSession.idea.id,
              title: expandedSession.idea.title,
              description: expandedSession.idea.description,
              topics: expandedSession.idea.topics ?? [],
              platform_id: expandedSession.session.platform_id,
              format: expandedSession.session.format,
              content_role: expandedSession.session.content_role ?? undefined,
            });
            setExpandedSession(null);
            setShowCreateModal(true);
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

      {/* CREATE CONTENT MODAL */}
      {showCreateModal && (
        <CreateContentModal
          isOpen={showCreateModal}
          idea={selectedIdea}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            refetch();
            setShowCreateModal(false);
          }}
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

      {/* CONFIRM MODAL */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          danger={true}
          onConfirm={confirmModal.onConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}
