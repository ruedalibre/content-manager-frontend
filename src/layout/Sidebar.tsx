import { LayoutDashboard, FileText, Repeat, Shield, X } from "lucide-react";
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
        <div className="sidebar__header sidebar__header--mobile">
          <h2>Content Manager</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <h2 className="sidebar__title">Content Manager</h2>

        <nav className="sidebar__nav">
          <NavLink to="/dashboard" onClick={onClose}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink to="/contents" onClick={onClose}>
            <FileText size={18} />
            Contents
          </NavLink>

          <NavLink to="/ideas" onClick={onClose}>
            <Repeat size={18} />
            Ideas
          </NavLink>

          <NavLink to="/admin" onClick={onClose}>
            <Shield size={18} />
            Admin
          </NavLink>
        </nav>

        <button className="sidebar__logout" onClick={onLogout}>
          Logout
        </button>
      </aside>
    </>
  );
}
