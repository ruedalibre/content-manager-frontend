import { Menu } from "lucide-react"
import { useLocation } from "react-router-dom"
import "./Topbar.scss"

export default function Topbar({
  onMenuClick,
}: {
  onMenuClick: () => void
}) {
  const location = useLocation()

  const getTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Dashboard"
      case "/contents":
        return "Contents"
      case "/reusable":
        return "Reusable"
      case "/admin":
        return "Admin"
      default:
        return "Dashboard"
    }
  }

  return (
    <header className="topbar">
      <button
        className="topbar__menu-btn"
        onClick={onMenuClick}
      >
        <Menu size={22} />
      </button>

      <h1 className="topbar__title">
        {getTitle()}
      </h1>
    </header>
  )
}