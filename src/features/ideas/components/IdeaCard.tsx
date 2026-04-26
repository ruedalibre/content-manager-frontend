import { useState } from "react";

type Props = {
  idea: {
    id: string;
    title: string;
    description?: string | null;
    source: "manual" | "generated";
    status?: string;
  };
  onUseIdea?: (idea: {
    id: string;
    title: string;
    description?: string | null;
  }) => void;
  onUpdate?: (
    ideaId: string,
    updates: { title: string; description?: string; status?: string },
  ) => Promise<void>;
  onDelete?: (ideaId: string) => Promise<void>;
};

export default function IdeaCard({
  idea,
  onUseIdea,
  onUpdate,
  onDelete,
}: Props) {
  const isGenerated = idea.source === "generated";

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editDescription, setEditDescription] = useState(
    idea.description ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onUpdate?.(idea.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setIsEditing(false);
    } catch {
      setError("Failed to update idea. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete idea "${idea.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete?.(idea.id);
    } catch {
      setError("Failed to delete idea. Please try again.");
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(idea.title);
    setEditDescription(idea.description ?? "");
    setError(null);
    setIsEditing(false);
  };

  return (
    <div className="idea-card">
      <div className="idea-card__header">
        <span
          className={`badge ${
            isGenerated ? "badge--generated" : "badge--manual"
          }`}
        >
          {isGenerated ? "Generated" : "Manual"}
        </span>

        {!isEditing && (
          <div className="idea-card__controls">
            <button
              className="btn-icon"
              onClick={() => setIsEditing(true)}
              title="Edit idea"
            >
              ✏️
            </button>
            <button
              className="btn-icon btn-icon--danger"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete idea"
            >
              {deleting ? "..." : "🗑️"}
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
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
          {error && <p className="idea-card__error">{error}</p>}
          <div className="idea-card__edit-actions">
            <button
              className="btn-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || !editTitle.trim()}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <h4>{idea.title}</h4>
          {idea.description && (
            <p className="idea-card__description">{idea.description}</p>
          )}
          <div className="idea-card__actions">
            <button className="btn-secondary" onClick={() => onUseIdea?.(idea)}>
              Use idea
            </button>
          </div>
        </>
      )}
    </div>
  );
}
