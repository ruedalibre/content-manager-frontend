import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "../hooks/useWorkspace.tsx";
import { useSubscription } from "../../subscription/hooks/useSubscription";
import UpgradePrompt from "../../../components/ui/UpgradePrompt";
import "../../../styles/modals.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CreateWorkspaceModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const { createWorkspace } = useWorkspace();
  const { canCreateWorkspace } = useSubscription();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSubmitError(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setSubmitError(null);

    try {
      await createWorkspace(name.trim(), description.trim() || undefined);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (
        message.includes("already exists") ||
        message.toLowerCase().includes("duplicate")
      ) {
        setSubmitError(t("workspace.nameExists"));
      } else {
        setSubmitError(t("workspace.createError"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const content = !canCreateWorkspace ? (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t("workspace.createTitle")}</h3>
        <UpgradePrompt
          title={t("workspace.upgradeTitle")}
          description={t("workspace.upgradeDesc")}
        />
        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClose}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t("workspace.createTitle")}</h3>

        <form onSubmit={handleSubmit}>
          <label htmlFor="workspace-name" className="modal__label">
            {t("workspace.nameLabel")}
          </label>
          <input
            id="workspace-name"
            placeholder={t("workspace.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
            autoFocus
          />

          <label htmlFor="workspace-description" className="modal__label">
            {t("workspace.descriptionLabel")}
          </label>
          <textarea
            id="workspace-description"
            placeholder={t("workspace.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            style={{
              resize: "vertical",
              minHeight: "72px",
              maxHeight: "120px",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              color: "var(--color-text-tertiary)",
              display: "block",
              textAlign: "right",
              marginTop: "4px",
            }}
          >
            {description.length}/300
          </span>

          {submitError && <p className="modal__error">{submitError}</p>}

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={loading}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !name.trim()}
            >
              {loading ? t("workspace.creating") : t("common.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}