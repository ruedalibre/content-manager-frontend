import { useState, useRef, useEffect } from "react";
import {
  Folder,
  ChevronDown,
  Check,
  Plus,
  Lock,
  Pencil,
  Archive,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useWorkspace,
  type Workspace,
} from "../../features/workspace/hooks/useWorkspace.tsx";
import { useSubscription } from "../../features/subscription/hooks/useSubscription.tsx";
import CreateWorkspaceModal from "../../features/workspace/modals/CreateWorkspaceModal.tsx";
import { createPortal } from "react-dom";
import "./WorkspaceSelector.scss";

type Props = {
  isCollapsed: boolean;
};

export default function WorkspaceSelector({ isCollapsed }: Props) {
  const { t } = useTranslation();
  const { workspaces, currentWorkspace, switchWorkspace, archiveWorkspace } =
    useWorkspace();
  const { canCreateWorkspace, isCreator } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null,
  );
  const [confirmArchive, setConfirmArchive] = useState<Workspace | null>(null);
  const [archiving, setArchiving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (workspaceId: string) => {
    if (workspaceId === currentWorkspace?.id) {
      setIsOpen(false);
      return;
    }
    try {
      await switchWorkspace(workspaceId);
      setIsOpen(false);
    } catch {
      // El hook ya hace rollback
    }
  };

  const handleOpenCreateModal = () => {
    setIsOpen(false);
    setShowCreateModal(true);
  };

  const handleEditClick = (ws: Workspace) => {
    setIsOpen(false);
    setEditingWorkspace(ws);
  };

  const handleArchiveClick = (ws: Workspace) => {
    setIsOpen(false);
    setConfirmArchive(ws);
  };

  const handleConfirmArchive = async () => {
    if (!confirmArchive) return;
    setArchiving(true);
    try {
      await archiveWorkspace(confirmArchive.id, true);
      setConfirmArchive(null);
    } catch (err) {
      console.error("Archive workspace error:", err);
    } finally {
      setArchiving(false);
    }
  };

  if (workspaces.length === 0) return null;

  const label = currentWorkspace?.is_personal
    ? t("workspace.personal")
    : (currentWorkspace?.name ?? "");

  if (isCollapsed) {
    return (
      <>
        <div
          className="workspace-selector workspace-selector--collapsed"
          ref={ref}
        >
          <div className="workspace-selector__inner">
            <button
              type="button"
              className="workspace-selector__badge"
              onClick={() => setIsOpen((v) => !v)}
              title={label}
              aria-label={t("workspace.switchWorkspace")}
            >
              <Folder size={16} />
            </button>

            {isOpen && (
              <div className="workspace-selector__dropdown workspace-selector__dropdown--collapsed">
                <WorkspaceList
                  workspaces={workspaces}
                  currentId={currentWorkspace?.id}
                  onSelect={handleSelect}
                  onCreateClick={handleOpenCreateModal}
                  onEditClick={handleEditClick}
                  onArchiveClick={handleArchiveClick}
                  canCreate={canCreateWorkspace}
                  isCreator={isCreator}
                  t={t}
                />
              </div>
            )}
          </div>
          <span className="workspace-selector__label-mini">
            {t("workspace.shortLabel")}
          </span>
        </div>

        {showCreateModal && (
          <CreateWorkspaceModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />
        )}
        {editingWorkspace && (
          <CreateWorkspaceModal
            isOpen={!!editingWorkspace}
            onClose={() => setEditingWorkspace(null)}
            workspaceToEdit={editingWorkspace}
          />
        )}
        {confirmArchive && (
          <ConfirmArchiveModal
            workspaceName={confirmArchive.name}
            archiving={archiving}
            onCancel={() => setConfirmArchive(null)}
            onConfirm={handleConfirmArchive}
            t={t}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="workspace-selector" ref={ref}>
        <div className="workspace-selector__inner">
          <button
            type="button"
            className="workspace-selector__trigger"
            onClick={() => setIsOpen((v) => !v)}
          >
            <Folder size={16} />
            <span className="workspace-selector__name">{label}</span>
            <ChevronDown
              size={14}
              className={`workspace-selector__chevron${isOpen ? " workspace-selector__chevron--open" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="workspace-selector__dropdown">
              <WorkspaceList
                workspaces={workspaces}
                currentId={currentWorkspace?.id}
                onSelect={handleSelect}
                onCreateClick={handleOpenCreateModal}
                onEditClick={handleEditClick}
                onArchiveClick={handleArchiveClick}
                canCreate={canCreateWorkspace}
                isCreator={isCreator}
                t={t}
              />
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateWorkspaceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      {editingWorkspace && (
        <CreateWorkspaceModal
          isOpen={!!editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
          workspaceToEdit={editingWorkspace}
        />
      )}
      {confirmArchive && (
        <ConfirmArchiveModal
          workspaceName={confirmArchive.name}
          archiving={archiving}
          onCancel={() => setConfirmArchive(null)}
          onConfirm={handleConfirmArchive}
          t={t}
        />
      )}
    </>
  );
}

function WorkspaceList({
  workspaces,
  currentId,
  onSelect,
  onCreateClick,
  onEditClick,
  onArchiveClick,
  canCreate,
  isCreator,
  t,
}: {
  workspaces: ReturnType<typeof useWorkspace>["workspaces"];
  currentId?: string;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
  onEditClick: (ws: Workspace) => void;
  onArchiveClick: (ws: Workspace) => void;
  canCreate: boolean;
  isCreator: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="workspace-selector__list">
      {workspaces.map((ws) => {
        const isReadOnly = !ws.is_personal && !isCreator;
        const canManage = ws.role === "owner";

        return (
          <div key={ws.id} className="workspace-selector__item-row">
            <button
              type="button"
              className={`workspace-selector__item${ws.id === currentId ? " workspace-selector__item--active" : ""}${isReadOnly ? " workspace-selector__item--readonly" : ""}`}
              onClick={() => onSelect(ws.id)}
              title={isReadOnly ? t("workspace.readOnlyHint") : ws.name}
            >
              <Folder size={16} />
              <span className="workspace-selector__item-name">
                {ws.is_personal ? t("workspace.personal") : ws.name}
              </span>
              {isReadOnly && (
                <Lock size={13} className="workspace-selector__lock" />
              )}
              {ws.id === currentId && <Check size={16} />}
            </button>

            {canManage && (
              <div className="workspace-selector__item-actions">
                <button
                  type="button"
                  className="workspace-selector__item-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(ws);
                  }}
                  title={t("workspace.editTooltip")}
                  aria-label={t("workspace.editTooltip")}
                >
                  <Pencil size={13} />
                </button>
                {!ws.is_personal && (
                  <button
                    type="button"
                    className="workspace-selector__item-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchiveClick(ws);
                    }}
                    title={t("workspace.archiveTooltip")}
                    aria-label={t("workspace.archiveTooltip")}
                  >
                    <Archive size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="workspace-selector__divider" />

      <button
        type="button"
        className="workspace-selector__create"
        onClick={onCreateClick}
      >
        {canCreate ? <Plus size={16} /> : <Lock size={14} />}
        <span>{t("workspace.create")}</span>
      </button>
    </div>
  );
}

function ConfirmArchiveModal({
  workspaceName,
  archiving,
  onCancel,
  onConfirm,
  t,
}: {
  workspaceName: string;
  archiving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal modal--confirm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{t("workspace.confirmArchiveTitle")}</h3>
        <p>{t("workspace.confirmArchiveBody", { name: workspaceName })}</p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={archiving}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onConfirm}
            disabled={archiving}
          >
            {archiving ? t("workspace.archiving") : t("workspace.archive")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
