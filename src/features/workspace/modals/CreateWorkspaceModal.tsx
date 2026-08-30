import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "../hooks/useWorkspace.tsx";
import { useSubscription } from "../../subscription/hooks/useSubscription.tsx";
import UpgradePrompt from "../../../components/ui/UpgradePrompt";
import "../../../styles/modals.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type WorkspaceType = "own_brand" | "client_brand" | "internal_team" | "other";

export default function CreateWorkspaceModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const { createWorkspace } = useWorkspace();
  const { canCreateWorkspace } = useSubscription();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [referents, setReferents] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType | "">("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setReferents("");
    setGuidelines("");
    setWorkspaceType("");
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
      await createWorkspace(name.trim(), {
        description: description.trim() || undefined,
        referents: referents.trim() || undefined,
        guidelines: guidelines.trim() || undefined,
        workspace_type: workspaceType || undefined,
      });
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
          <button type="button" className="btn-secondary" onClick={handleClose}>
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal modal--content-edit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h3>{t("workspace.createTitle")}</h3>
          <button
            type="button"
            className="modal__close"
            onClick={handleClose}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className="modal__body">
          <form onSubmit={handleSubmit}>
            {/* NOMBRE */}
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

            {/* TIPO DE WORKSPACE */}
            <label htmlFor="workspace-type" className="modal__label">
              {t("workspace.typeLabel")}
            </label>
            <select
              id="workspace-type"
              value={workspaceType}
              onChange={(e) =>
                setWorkspaceType(e.target.value as WorkspaceType | "")
              }
            >
              <option value="">{t("workspace.typeSelectPlaceholder")}</option>
              <option value="own_brand">{t("workspace.typeOwnBrand")}</option>
              <option value="client_brand">
                {t("workspace.typeClientBrand")}
              </option>
              <option value="internal_team">
                {t("workspace.typeInternalTeam")}
              </option>
              <option value="other">{t("workspace.typeOther")}</option>
            </select>

            {/* SOBRE QUÉ TRATA */}
            <label htmlFor="workspace-description" className="modal__label">
              {t("workspace.descriptionLabel")}
            </label>
            <p className="modal__hint">{t("workspace.descriptionHint")}</p>
            <textarea
              id="workspace-description"
              placeholder={t("workspace.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2500}
              rows={6}
              style={{
                resize: "vertical",
                minHeight: "140px",
                maxHeight: "300px",
              }}
            />
            <span className="modal__char-count">{description.length}/2500</span>

            {/* PUNTOS A TENER EN CUENTA */}
            <label htmlFor="workspace-guidelines" className="modal__label">
              {t("workspace.guidelinesLabel")}
            </label>
            <p className="modal__hint">{t("workspace.guidelinesHint")}</p>
            <textarea
              id="workspace-guidelines"
              placeholder={t("workspace.guidelinesPlaceholder")}
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              maxLength={300}
              rows={2}
              style={{
                resize: "vertical",
                minHeight: "56px",
                maxHeight: "100px",
              }}
            />
            <span className="modal__char-count">{guidelines.length}/300</span>

            {/* REFERENTES */}
            <label htmlFor="workspace-referents" className="modal__label">
              {t("workspace.referentsLabel")}
            </label>
            <p className="modal__hint">{t("workspace.referentsHint")}</p>
            <textarea
              id="workspace-referents"
              placeholder={t("workspace.referentsPlaceholder")}
              value={referents}
              onChange={(e) => setReferents(e.target.value)}
              maxLength={300}
              rows={2}
              style={{
                resize: "vertical",
                minHeight: "56px",
                maxHeight: "100px",
              }}
            />
            <span className="modal__char-count">{referents.length}/300</span>

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
    </div>
  );

  return createPortal(content, document.body);
}
