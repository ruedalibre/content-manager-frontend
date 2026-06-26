import { type Idea } from "../hooks/useIdeas.ts";
import { useTranslation } from "react-i18next";

type EditIdeaModalProps = {
  idea: Idea;
  editTitle: string;
  editDescription: string;
  editError: string | null;
  editSaving: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function EditIdeaModal({
  editTitle,
  editDescription,
  editError,
  editSaving,
  onTitleChange,
  onDescriptionChange,
  onSave,
  onCancel,
}: EditIdeaModalProps) {
  const { t } = useTranslation();
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{t("ideas.editIdeaTitle")}</h3>
        <input
          value={editTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t("ideas.titlePlaceholder")}
          autoFocus
        />
        <textarea
          value={editDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t("ideas.contextPlaceholder")}
          rows={3}
        />
        {editError && <p className="modal__error">{editError}</p>}
        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={onCancel}
            disabled={editSaving}
            type="button"
          >
            {t("common.cancel")}
          </button>
          <button
            className="btn-primary"
            onClick={onSave}
            disabled={editSaving || !editTitle.trim()}
            type="button"
          >
            {editSaving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
