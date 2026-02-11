import {
  LayoutDashboard,
  FileText,
  Repeat,
  Shield,
  X
} from "lucide-react"
import { NavLink } from "react-router-dom"
import "./Sidebar.scss"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({
  isOpen,
  onClose,
}: Props) {
  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`sidebar ${
          isOpen ? "sidebar--open" : ""
        }`}
      >
        {/* Header mobile */}
        <div className="sidebar__header sidebar__header--mobile">
          <h2>Content Manager</h2>

          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Header desktop */}
        <h2 className="sidebar__title">
          Content Manager
        </h2>

        {/* Navigation */}
        <nav className="sidebar__nav">

          <NavLink to="/" onClick={onClose}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink to="/contents" onClick={onClose}>
            <FileText size={18} />
            Contents
          </NavLink>

          <NavLink to="/reusable" onClick={onClose}>
            <Repeat size={18} />
            Reusable
          </NavLink>

          <NavLink to="/admin" onClick={onClose}>
            <Shield size={18} />
            Admin
          </NavLink>

        </nav>
      </aside>
    </>
  )
}
