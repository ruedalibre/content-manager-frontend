import { useState } from "react";
import {
  useIdeas,
  type Idea,
  type IdeaTopic,
} from "../../features/ideas/hooks/useIdeas.ts";
import { useTopics, type Topic } from "../../features/ideas/hooks/useTopics.ts";
import CreateContentModal from "../../features/contents/modals/CreateContentModal.tsx";
import CreateIdeaModal from "../../features/ideas/modals/CreateIdeaModal.tsx";
import ConfirmModal from "../../components/ui/ConfirmModal.tsx";
import "./Ideas.scss";

type IdeaForContent = {
  id: string;
  title: string;
  description?: string | null;
  topics?: IdeaTopic[];
};

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

  const filteredIdeas = ideas
    .filter((idea) => idea.title.toLowerCase().includes(search.toLowerCase()))
    .sort(
      (a, b) => (b.contents?.[0]?.count ?? 0) - (a.contents?.[0]?.count ?? 0),
    );

  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(topicSearch.toLowerCase()),
  );

  const highlightIdea = filteredIdeas.length > 0 ? filteredIdeas[0] : null;

  const handleUseCombination = (idea: Idea) => {
    setSelectedIdea({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      topics: idea.topics ?? [],
    });
    setShowCreateModal(true);
  };

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

  const handleEditCancel = () => {
    setEditingIdea(null);
    setEditTitle("");
    setEditDescription("");
    setEditError(null);
  };

  const handleDeleteIdea = async (ideaId: string) => {
    openConfirm(
      "Delete idea",
      "This idea will be permanently deleted. This cannot be undone.",
      async () => {
        closeConfirm();
        try {
          await deleteIdea(ideaId);
        } catch {
          alert("Failed to delete idea.");
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
      alert("Failed to update topics.");
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

  const handleEditTopicOpen = (topic: Topic) => {
    setEditingTopic(topic);
    setEditTopicName(topic.name);
  };

  const handleEditTopicSave = async () => {
    if (!editingTopic || !editTopicName.trim()) return;
    setSavingTopic(true);
    try {
      await updateTopic(editingTopic.id, editTopicName.trim());
      setEditingTopic(null);
    } catch {
      alert("Failed to update topic.");
    } finally {
      setSavingTopic(false);
    }
  };

  const handleArchiveTopic = async (topicId: string) => {
    openConfirm(
      "Archive topic",
      "This topic won't appear in selectors but existing associations are preserved.",
      async () => {
        closeConfirm();
        try {
          await archiveTopic(topicId);
        } catch {
          alert("Failed to archive topic.");
        }
      },
    );
  };

  const openConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => setConfirmModal(null);

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
          {/* FILTERS */}
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
          </div>

          {loading && <p className="ideas-loading">Loading ideas...</p>}
          {error && <p className="ideas-error">{error}</p>}

          {/* TOP IDEA */}
          {!loading && highlightIdea && (
            <div className="idea-highlight">
              <div className="idea-highlight__eyebrow">
                <span className="idea-highlight__label">⭐ Top Idea</span>
                <span className="idea-highlight__count">
                  {highlightIdea.contents?.[0]?.count ?? 0} contents
                </span>
              </div>
              <h3 className="idea-highlight__title">{highlightIdea.title}</h3>
              {highlightIdea.description && (
                <p className="idea-highlight__desc">
                  {highlightIdea.description}
                </p>
              )}
              <div className="idea-highlight__topics">
                {highlightIdea.topics?.map((t) => (
                  <span key={t.id} className="topic-chip">
                    {t.name}
                  </span>
                ))}
              </div>
              <p className="idea-highlight__explain">
                This idea is part of your creative system and can be reused
                across multiple pieces of content.
              </p>
            </div>
          )}

          {/* IDEAS GRID */}
          {!loading && (
            <div className="ideas-grid">
              {filteredIdeas.length === 0 && (
                <div className="ideas-empty">
                  <span>No ideas found</span>
                </div>
              )}

              {filteredIdeas.map((idea) => {
                const contentCount = idea.contents?.[0]?.count ?? 0;
                const isGenerated = idea.source === "generated";
                const isEditingThis = editingIdea?.id === idea.id;
                const isEditingTopicsThis = editingIdeaTopics === idea.id;

                return (
                  <div key={idea.id} className="idea-card">
                    {/* CARD HEADER */}
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
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description (optional)"
                          rows={2}
                        />
                        {editError && (
                          <p className="idea-card__error">{editError}</p>
                        )}
                        <div className="idea-card__edit-actions">
                          <button
                            className="btn-secondary"
                            onClick={handleEditCancel}
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

                        {/* TOPICS ROW */}
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
                              Select topics for this idea:
                            </p>
                            <div className="idea-card__topic-options">
                              {topics.length === 0 ? (
                                <p className="idea-card__no-topics">
                                  No topics yet. Create some in the Topics tab.
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

                        {/* FOOTER */}
                        <div className="idea-card__footer">
                          <span className="idea-card__stats">
                            {contentCount === 0
                              ? "No contents yet"
                              : `${contentCount} content${contentCount !== 1 ? "s" : ""}`}
                          </span>
                          <button
                            className="btn-combination"
                            onClick={() => handleUseCombination(idea)}
                            type="button"
                          >
                            Use combination →
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================= TOPICS TAB ========================= */}
      {activeTab === "topics" && (
        <div className="ideas-tab-content">
          {/* SEARCH */}
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
                          onClick={() => handleEditTopicOpen(topic)}
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

      {/* MODALS */}
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
                onClick={handleEditCancel}
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
