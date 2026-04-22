import { useState, useEffect } from "react";
import {
  useIdeas,
  type Idea,
  type IdeaTopic,
  type CreativeSession,
} from "../../features/ideas/hooks/useIdeas.ts";
import { useTopics, type Topic } from "../../features/ideas/hooks/useTopics.ts";
import { usePlatforms } from "../../features/contents/hooks/usePlatforms.ts";
import { useFormats } from "../../features/contents/hooks/useFormats.ts";
import CreateContentModal from "../../features/contents/modals/CreateContentModal.tsx";
import CreateIdeaModal from "../../features/ideas/modals/CreateIdeaModal.tsx";
import ConfirmModal from "../../components/ui/ConfirmModal.tsx";
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

function StatusBadge({ status }: { status: CreativeSession["status"] }) {
  const map = {
    generated: { label: "Generated", cls: "recipe-status--generated" },
    reviewed: { label: "Reviewed", cls: "recipe-status--reviewed" },
    executed: { label: "Implemented", cls: "recipe-status--executed" },
    discarded: { label: "Discarded", cls: "recipe-status--discarded" },
  };
  const s = map[status] ?? map.generated;
  return <span className={`recipe-status ${s.cls}`}>{s.label}</span>;
}

type RecipePanelProps = {
  session: CreativeSession;
  idea: Idea;
  onClose: () => void;
  onApprove: () => void;
  onDiscard: () => void;
  onCreateContent: () => void;
  saveFeedback: (
    sessionId: string,
    feedback: Record<string, number>,
  ) => Promise<void>;
};

function RecipePanel({
  session,
  idea,
  onClose,
  onApprove,
  onDiscard,
  onCreateContent,
  saveFeedback,
}: RecipePanelProps) {
  const [feedback, setFeedback] = useState<Record<string, number>>(
    session.feedback ?? {},
  );
  const [saving, setSaving] = useState(false);

  const handleRate = (key: string, value: number) => {
    setFeedback((prev) => ({ ...prev, [key]: value }));
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      await saveFeedback(session.id, feedback);
      onApprove();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="recipe-panel-overlay" onClick={onClose}>
      <div className="recipe-panel" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="recipe-panel__header">
          <div>
            <h3 className="recipe-panel__title">{idea.title}</h3>
            <div className="recipe-panel__meta">
              <StatusBadge status={session.status} />
              <span className="recipe-panel__date">
                {new Date(session.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="recipe-panel__body">
          {/* LEFT — COMBINATION */}
          <div className="recipe-panel__combination">
            <h4 className="recipe-panel__section-title">Combination</h4>
            <div className="recipe-panel__combo-item">
              <span className="recipe-panel__combo-label">💡 Idea</span>
              <span className="recipe-panel__combo-value">{idea.title}</span>
            </div>
            {idea.topics && idea.topics.length > 0 && (
              <div className="recipe-panel__combo-item">
                <span className="recipe-panel__combo-label">🏷️ Topics</span>
                <div className="recipe-panel__combo-chips">
                  {idea.topics.map((t) => (
                    <span key={t.id} className="topic-chip topic-chip--small">
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="recipe-panel__combo-item">
              <span className="recipe-panel__combo-label">📱 Format</span>
              <span className="recipe-panel__combo-value">
                {session.format}
              </span>
            </div>

            {session.content_role && (
              <div className="recipe-panel__combo-item">
                <span className="recipe-panel__combo-label">🎭 Role</span>
                <span className="recipe-panel__combo-value">
                  {session.content_role}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT — RECIPE */}
          <div className="recipe-panel__recipe">
            <h4 className="recipe-panel__section-title">Recipe</h4>

            {[
              { key: "angle", label: "Angle", text: session.recipe.angle },
              { key: "hook", label: "Hook", text: session.recipe.hook },
              { key: "tone", label: "Tone", text: session.recipe.tone },
            ].map((aspect) => (
              <div key={aspect.key} className="recipe-panel__aspect">
                <div className="recipe-panel__aspect-header">
                  <span className="recipe-panel__aspect-label">
                    {aspect.label}
                  </span>
                  <div className="recipe-panel__rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`rating-dot ${(feedback[aspect.key] ?? 0) >= n ? "rating-dot--active" : ""}`}
                        onClick={() => handleRate(aspect.key, n)}
                      />
                    ))}
                  </div>
                </div>
                <p className="recipe-panel__aspect-text">{aspect.text}</p>
              </div>
            ))}

            <div className="recipe-panel__aspect">
              <div className="recipe-panel__aspect-header">
                <span className="recipe-panel__aspect-label">Structure</span>
                <div className="recipe-panel__rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`rating-dot ${(feedback.structure ?? 0) >= n ? "rating-dot--active" : ""}`}
                      onClick={() => handleRate("structure", n)}
                    />
                  ))}
                </div>
              </div>
              <ol className="recipe-panel__structure">
                {session.recipe.structure.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            {session.recipe.strategic_note && (
              <div className="recipe-panel__strategic-note">
                <span className="recipe-panel__aspect-label">
                  Strategic note
                </span>
                <p>{session.recipe.strategic_note}</p>
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="recipe-panel__actions">
          <button className="btn-secondary" onClick={onDiscard} type="button">
            Discard
          </button>
          <button
            className="btn-primary"
            onClick={onCreateContent}
            type="button"
          >
            Create content →
          </button>
          <button
            className="btn-primary"
            onClick={handleApprove}
            disabled={saving}
            type="button"
          >
            {saving ? "Saving..." : "Approve ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecipeCard({
  session,
  generating,
  onClick,
}: {
  session: CreativeSession | null;
  generating: boolean;
  onClick: () => void;
}) {
  if (generating) {
    return (
      <div className="recipe-card recipe-card--generating">
        <div className="recipe-card__generating">
          <div className="recipe-generating-dots">
            <span />
            <span />
            <span />
          </div>
          <p>Generating recipe...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="recipe-card recipe-card--empty">
        <div className="recipe-card__empty-content">
          <span className="recipe-card__empty-icon">📄</span>
          <p className="recipe-card__empty-text">No recipe yet</p>
          <p className="recipe-card__empty-hint">
            Select platform and format, then generate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-card recipe-card--ready" onClick={onClick}>
      <div className="recipe-card__header">
        <StatusBadge status={session.status} />
        <span className="recipe-card__date">
          {new Date(session.created_at).toLocaleDateString()}
        </span>
      </div>
      <div className="recipe-card__content">
        <p className="recipe-card__angle">{session.recipe.angle}</p>
        <p className="recipe-card__hook">{session.recipe.hook}</p>
      </div>
      <div className="recipe-card__footer">
        <span className="recipe-card__format">{session.format}</span>
        <span className="recipe-card__cta">Ver receta completa →</span>
      </div>
    </div>
  );
}

export default function Ideas() {
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
  } = useIdeas(filter);

  const {
    topics,
    loading: topicsLoading,
    createTopic,
    updateTopic,
    archiveTopic,
  } = useTopics();

  const { platforms } = usePlatforms();
  const { loadFormats } = useFormats();

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

  const filteredIdeas = ideas
    .filter((idea) => idea.title.toLowerCase().includes(search.toLowerCase()))
    .sort(
      (a, b) => (b.contents?.[0]?.count ?? 0) - (a.contents?.[0]?.count ?? 0),
    );

  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(topicSearch.toLowerCase()),
  );

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
      updateRecipeState(idea.id, { error: "Select platform and format first" });
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
      "Delete idea",
      "This idea will be permanently deleted. This cannot be undone.",
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
      "Archive topic",
      "This topic won't appear in selectors but existing associations are preserved.",
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
          <h2 className="ideas-page__title">Ideas & Topics</h2>
          <p className="ideas-page__subtitle">
            Your creative system — ideas, themes, and content combinations
          </p>
        </div>
        {activeTab === "ideas" ? (
          <button
            className="btn-primary"
            onClick={() => setShowIdeaModal(true)}
            type="button"
          >
            + New Idea
          </button>
        ) : (
          <div className="topic-create-inline">
            <div className="topic-create-inline__field">
              <input
                type="text"
                placeholder="Topic name"
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
              {creatingTopic ? "Adding..." : "+ Add"}
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
          Ideas
          <span className="ideas-tab__count">{ideas.length}</span>
        </button>
        <button
          className={`ideas-tab ${activeTab === "topics" ? "ideas-tab--active" : ""}`}
          onClick={() => setActiveTab("topics")}
          type="button"
        >
          Topics
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
              placeholder="Search ideas..."
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
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="ideas-stats">
              <span>{ideas.length} ideas</span>
              <span>·</span>
              <span>
                {ideas.filter((i) => (i.sessions?.length ?? 0) > 0).length} with
                recipe
              </span>
              <span>·</span>
              <span>
                {
                  ideas.filter((i) =>
                    i.sessions?.some((s) => s.status === "executed"),
                  ).length
                }{" "}
                implemented
              </span>
            </div>
          </div>

          {loading && <p className="ideas-loading">Loading ideas...</p>}
          {error && <p className="ideas-error">{error}</p>}

          {/* DUAL GRID */}
          {!loading && (
            <>
              {filteredIdeas.length === 0 && (
                <div className="ideas-empty">
                  <span>No ideas found</span>
                </div>
              )}

              {filteredIdeas.length > 0 && (
                <div className="ideas-dual-headers">
                  <span>Idea</span>
                  <span>Recipe</span>
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
                            {isGenerated ? "Generated" : "Manual"}
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
                                  Select topics:
                                </p>
                                <div className="idea-card__topic-options">
                                  {topics.length === 0 ? (
                                    <p className="idea-card__no-topics">
                                      No topics yet.
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
                                    Cancel
                                  </button>
                                  <button
                                    className="btn-primary"
                                    onClick={handleSaveIdeaTopics}
                                    disabled={savingTopics}
                                    type="button"
                                  >
                                    {savingTopics ? "Saving..." : "Save"}
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
                                <option value="">Platform</option>
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
                                <option value="">Format</option>
                                {formats.map((f) => (
                                  <option key={f} value={f}>
                                    {f}
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
                                <option value="">Role (optional)</option>
                                <option value="educational">Educational</option>
                                <option value="inspirational">
                                  Inspirational
                                </option>
                                <option value="personal">Personal</option>
                                <option value="promotional">Promotional</option>
                                <option value="curated">Curated</option>
                              </select>
                            </div>

                            {state.error && (
                              <p className="idea-card__error">{state.error}</p>
                            )}

                            {/* FOOTER */}
                            <div className="idea-card__footer">
                              <span className="idea-card__stats">
                                {contentCount === 0
                                  ? "No contents yet"
                                  : `${contentCount} content${contentCount !== 1 ? "s" : ""}`}
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
                                  ? "Generating..."
                                  : "✨ Generate"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* RECIPE CARD */}
                      <RecipeCard
                        session={latestSession}
                        generating={state.generating}
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
          <div className="ideas-toolbar">
            <input
              type="text"
              placeholder="Search topics..."
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              className="ideas-search"
            />
          </div>

          {topicsLoading && <p className="ideas-loading">Loading topics...</p>}

          {!topicsLoading && (
            <div className="topics-grid">
              {filteredTopics.length === 0 && (
                <div className="ideas-empty">
                  <span>
                    {topics.length === 0
                      ? "No topics yet. Add your first one above."
                      : "No topics match your search."}
                  </span>
                </div>
              )}

              {filteredTopics.map((topic) => (
                <div key={topic.id} className="topic-card">
                  {editingTopic?.id === topic.id ? (
                    <div className="topic-card__edit">
                      <input
                        value={editTopicName}
                        onChange={(e) => setEditTopicName(e.target.value)}
                        maxLength={50}
                        autoFocus
                      />
                      <div className="topic-card__edit-actions">
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
                      <div className="topic-card__body">
                        <span className="topic-card__name">{topic.name}</span>
                      </div>
                      <div className="topic-card__controls">
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
                          onClick={() => handleArchiveTopic(topic.id)}
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
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Idea</h3>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Idea title"
              autoFocus
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
            />
            {editError && <p className="modal__error">{editError}</p>}
            <div className="modal-actions">
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
        </div>
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
