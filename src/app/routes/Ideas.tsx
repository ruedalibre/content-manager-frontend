import { useState } from "react";
import { useIdeas, type Idea } from "../../features/ideas/hooks/useIdeas.ts";
import CreateContentModal from "../../features/contents/modals/CreateContentModal.tsx";
import CreateIdeaModal from "../../features//ideas/modals/CreateIdeaModal.tsx";
import "./Ideas.scss";

/* =========================
   COMPONENT
========================= */

export default function Ideas() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "manual" | "generated">("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  const [showIdeaModal, setShowIdeaModal] = useState(false);

  const { ideas, loading, refetch, updateIdea, deleteIdea } = useIdeas(filter);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  /* =========================
     SEARCH + SORT
  ========================= */

  const filteredIdeas = ideas
    .filter((idea) => idea.title.toLowerCase().includes(search.toLowerCase()))
    .sort(
      (a, b) => (b.contents?.[0]?.count ?? 0) - (a.contents?.[0]?.count ?? 0),
    );

  /* =========================
     TOP IDEA
  ========================= */

  const highlightIdea = filteredIdeas.length > 0 ? filteredIdeas[0] : null;

  /* =========================
     LOADING
  ========================= */

  if (loading) return <p>Loading ideas...</p>;

  /* =========================
     USE IDEA
  ========================= */

  const handleUseIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setShowCreateModal(true);
  };

  /* =========================
   EDIT IDEA
========================= */

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
      setEditError("Failed to update idea. Please try again.");
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

  /* =========================
   DELETE IDEA
========================= */

  const handleDeleteIdea = async (ideaId: string) => {
    if (!confirm("Delete this idea? This cannot be undone.")) return;
    try {
      await deleteIdea(ideaId);
    } catch {
      alert("Failed to delete idea. Please try again.");
    }
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="ideas-page">
      {/* HEADER */}

      {/* NEW IDEA BUTTON */}

      <button
        className="btn-primary"
        onClick={() => setShowIdeaModal(true)}
        type="button"
      >
        + New Idea
      </button>

      <div className="ideas-header">
        <h2>
          Discover reusable ideas and creative patterns from your content
          history
        </h2>
      </div>

      {/* FILTERS */}

      <div className="ideas-filters">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
          type="button"
        >
          All
        </button>

        <button
          className={filter === "manual" ? "active" : ""}
          onClick={() => setFilter("manual")}
          type="button"
        >
          Manual
        </button>

        <button
          className={filter === "generated" ? "active" : ""}
          onClick={() => setFilter("generated")}
          type="button"
        >
          Generated
        </button>
      </div>

      {/* TOP IDEA */}

      {highlightIdea && (
        <div className="idea-highlight">
          <div className="idea-highlight__label">Top Idea</div>

          <div className="idea-highlight__note">{highlightIdea.title}</div>

          <div className="idea-highlight__meta">
            {highlightIdea.source === "generated" ? "Generated" : "Manual"} •{" "}
            {new Date(highlightIdea.created_at).toLocaleDateString()}
          </div>

          <p className="idea-highlight__explain">
            This idea is part of your creative system and can be reused across
            multiple pieces of content.
          </p>
        </div>
      )}

      {/* IDEAS LIBRARY */}

      <div className="ideas-library">
        <div className="ideas-library__header">
          <h3>Ideas Library</h3>

          <input
            type="text"
            placeholder="Search ideas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* IDEAS LIST */}

        <div className="ideas-list">
          {filteredIdeas.length === 0 && (
            <p className="ideas-empty">No ideas found</p>
          )}

          {filteredIdeas.map((idea) => {
            const contentCount = idea.contents?.[0]?.count ?? 0;
            const isGenerated = idea.source === "generated";

            return (
              <div key={idea.id} className="idea-card">
                <div className="idea-card__header">
                  <div className="idea-card__meta">
                    <span
                      className={`badge ${
                        isGenerated ? "badge--generated" : "badge--manual"
                      }`}
                    >
                      {isGenerated ? "Generated" : "Manual"}
                    </span>

                    <span className="idea-date">
                      {new Date(idea.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="idea-card__controls">
                    <button
                      className="btn-icon"
                      onClick={() => handleEditOpen(idea)}
                      title="Edit idea"
                      type="button"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-icon--danger"
                      onClick={() => handleDeleteIdea(idea.id)}
                      title="Delete idea"
                      type="button"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="idea-card__note">{idea.title}</div>

                <div className="idea-card__stats">
                  {contentCount === 0
                    ? "No contents yet"
                    : `${contentCount} contents created`}
                </div>

                <div className="idea-card__actions">
                  <button
                    className="btn-secondary"
                    onClick={() => handleUseIdea(idea)}
                    type="button"
                  >
                    Use idea
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
    </div>
  );
}
