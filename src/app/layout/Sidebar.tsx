import { Lightbulb, FileText, Sparkles, BarChart3, Shield, X, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Sidebar.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

export default function Sidebar({ isOpen, onClose, onLogout, isAdmin, isCollapsed, onToggleCollapse }: Props) {
  const { t } = useTranslation();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${isOpen ? " sidebar--open" : ""}${isCollapsed ? " sidebar--collapsed" : ""}`}>
        {/* MOBILE HEADER */}

        <div className="sidebar__header sidebar__header--mobile">
          <h2>Content Intelligence Platform</h2>

          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* TITLE */}

        {!isCollapsed && (
          <h2 className="sidebar__title">Content Intelligence Platform</h2>
        )}

        {/* COLLAPSE BUTTON (desktop only) */}

        <button
          type="button"
          className="sidebar__collapse-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* NAVIGATION */}

        <nav className="sidebar__nav">
          <NavLink to="/ideas" onClick={onClose}>
            <Lightbulb size={18} />
            {!isCollapsed && <span>{t("nav.ideas")}</span>}
          </NavLink>

          <NavLink to="/contents" onClick={onClose}>
            <FileText size={18} />
            {!isCollapsed && <span>{t("nav.contents")}</span>}
          </NavLink>

          <NavLink to="/identity" onClick={onClose}>
            <Sparkles size={18} />
            {!isCollapsed && <span>{t("nav.identity")}</span>}
          </NavLink>

          <NavLink to="/activity" onClick={onClose}>
            <BarChart3 size={18} />
            {!isCollapsed && <span>{t("nav.activity")}</span>}
          </NavLink>

          {/* ADMIN */}

          {isAdmin && (
            <NavLink to="/admin" onClick={onClose}>
              <Shield size={18} />
              {!isCollapsed && <span>{t("nav.admin")}</span>}
            </NavLink>
          )}
        </nav>

        {/* LOGOUT */}

        <button type="button" className="sidebar__logout" onClick={onLogout}>
          <LogOut size={16} />
          {!isCollapsed && <span>{t("nav.logout")}</span>}
        </button>
      </aside>
    </>
  );
}
