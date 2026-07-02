import { useState, useRef, useEffect } from "react";
import { Folder, ChevronDown, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "../../features/workspace/hooks/useWorkspace";
import "./WorkspaceSelector.scss";

type Props = {
  isCollapsed: boolean;
};

export default function WorkspaceSelector({ isCollapsed }: Props) {
  const { t } = useTranslation();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
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

  if (workspaces.length === 0) return null;

  const label = currentWorkspace?.is_personal
    ? t("workspace.personal")
    : currentWorkspace?.name ?? "";

  if (isCollapsed) {
    return (
      <div className="workspace-selector workspace-selector--collapsed" ref={ref}>
        <button
          type="button"
          className="workspace-selector__badge"
          onClick={() => setIsOpen((v) => !v)}
          title={label}
          aria-label={t("workspace.switchWorkspace")}
        >
          <Folder size={16} />
        </button>
        <span className="workspace-selector__label-mini">{t("workspace.shortLabel")}</span>

        {isOpen && (
          <div className="workspace-selector__dropdown workspace-selector__dropdown--collapsed">
            <WorkspaceList
              workspaces={workspaces}
              currentId={currentWorkspace?.id}
              onSelect={handleSelect}
              t={t}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="workspace-selector" ref={ref}>
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
            t={t}
          />
        </div>
      )}
    </div>
  );
}

function WorkspaceList({
  workspaces,
  currentId,
  onSelect,
  t,
}: {
  workspaces: ReturnType<typeof useWorkspace>["workspaces"];
  currentId?: string;
  onSelect: (id: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="workspace-selector__list">
      {workspaces.map((ws) => (
        <button
          key={ws.id}
          type="button"
          className={`workspace-selector__item${ws.id === currentId ? " workspace-selector__item--active" : ""}`}
          onClick={() => onSelect(ws.id)}
        >
          <Folder size={16} />
          <span className="workspace-selector__item-name">
            {ws.is_personal ? t("workspace.personal") : ws.name}
          </span>
          {ws.id === currentId && <Check size={16} />}
        </button>
      ))}

      {/* Acto 2 — descomentar para activar creación de workspace
      <div className="workspace-selector__divider" />
      <button type="button" className="workspace-selector__create">
        <Plus size={16} />
        <span>{t("workspace.create")}</span>
      </button>
      */}
    </div>
  );
}
