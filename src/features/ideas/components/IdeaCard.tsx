import { useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      setError(t("ideas.failedUpdate"));
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
      setError(t("ideas.failedDelete"));
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
          {isGenerated ? t("ideas.generated") : t("ideas.manual")}
        </span>

        {!isEditing && (
          <div className="idea-card__controls">
            <button
              className="btn-icon"
              onClick={() => setIsEditing(true)}
              title={t("common.edit")}
            >
              ✏️
            </button>
            <button
              className="btn-icon btn-icon--danger"
              onClick={handleDelete}
              disabled={deleting}
              title={t("common.delete")}
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
            placeholder={t("ideas.ideaTitlePlaceholder")}
            autoFocus
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder={t("ideas.descriptionOptional")}
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
              {saving ? t("common.saving") : t("common.save")}
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
              {t("ideas.useIdea")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
