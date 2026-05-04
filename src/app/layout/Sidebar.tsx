import { Lightbulb, FileText, Sparkles, BarChart3, Shield, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Sidebar.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  isAdmin: boolean;
};

export default function Sidebar({ isOpen, onClose, onLogout, isAdmin }: Props) {
  const { t } = useTranslation();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        {/* MOBILE HEADER */}

        <div className="sidebar__header sidebar__header--mobile">
          <h2>Content Intelligence Platform</h2>

          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* TITLE */}

        <h2 className="sidebar__title">Content Intelligence Platform</h2>

        {/* NAVIGATION */}

        <nav className="sidebar__nav">
          <NavLink to="/ideas" onClick={onClose}>
            <Lightbulb size={18} />
            {t("nav.ideas")}
          </NavLink>

          <NavLink to="/contents" onClick={onClose}>
            <FileText size={18} />
            {t("nav.contents")}
          </NavLink>

          <NavLink to="/identity" onClick={onClose}>
            <Sparkles size={18} />
            {t("nav.identity")}
          </NavLink>

          <NavLink to="/activity" onClick={onClose}>
            <BarChart3 size={18} />
            {t("nav.activity")}
          </NavLink>

          {/* ADMIN */}

          {isAdmin && (
            <NavLink to="/admin" onClick={onClose}>
              <Shield size={18} />
              {t("nav.admin")}
            </NavLink>
          )}
        </nav>

        {/* LOGOUT */}

        <button className="sidebar__logout" onClick={onLogout}>
          {t("nav.logout")}
        </button>
      </aside>
    </>
  );
}
