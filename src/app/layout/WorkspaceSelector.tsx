import { useState, useRef, useEffect } from "react";
import { Folder, ChevronDown, Check, Plus, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "../../features/workspace/hooks/useWorkspace.tsx";
import { useSubscription } from "../../features/subscription/hooks/useSubscription.tsx";
import CreateWorkspaceModal from "../../features/workspace/modals/CreateWorkspaceModal.tsx";
import "./WorkspaceSelector.scss";

type Props = {
  isCollapsed: boolean;
};

export default function WorkspaceSelector({ isCollapsed }: Props) {
  const { t } = useTranslation();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const { canCreateWorkspace, isCreator } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
    </>
  );
}

function WorkspaceList({
  workspaces,
  currentId,
  onSelect,
  onCreateClick,
  canCreate,
  isCreator,
  t,
}: {
  workspaces: ReturnType<typeof useWorkspace>["workspaces"];
  currentId?: string;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
  canCreate: boolean;
  isCreator: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="workspace-selector__list">
      {workspaces.map((ws) => {
        const isReadOnly = !ws.is_personal && !isCreator;
        return (
          <button
            key={ws.id}
            type="button"
            className={`workspace-selector__item${ws.id === currentId ? " workspace-selector__item--active" : ""}${isReadOnly ? " workspace-selector__item--readonly" : ""}`}
            onClick={() => onSelect(ws.id)}
            title={isReadOnly ? t("workspace.readOnlyHint") : undefined}
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
