import { Lightbulb, FileText, Sparkles, BarChart3, Shield, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import "./Sidebar.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
};

export default function Sidebar({ isOpen, onClose, onLogout }: Props) {
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
            Ideas & Topics
          </NavLink>

          <NavLink to="/contents" onClick={onClose}>
            <FileText size={18} />
            Contents
          </NavLink>

          <NavLink to="/identity" onClick={onClose}>
            <Sparkles size={18} />
            Identity & Insights
          </NavLink>

          <NavLink to="/activity" onClick={onClose}>
            <BarChart3 size={18} />
            Activity
          </NavLink>

           {/* ADMIN */}

          <NavLink to="/admin" onClick={onClose}>
            <Shield size={18} />
            Admin
          </NavLink>
        </nav>

        {/* LOGOUT */}

        <button className="sidebar__logout" onClick={onLogout}>
          Logout
        </button>
      </aside>
    </>
  );
}
