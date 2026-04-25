import { Menu } from "lucide-react"
import { useLocation } from "react-router-dom"
import "./Topbar.scss"

type Props = {
  onMenuClick: () => void
  context?: string | null
}

export default function Topbar({
  onMenuClick,
  context,
}: Props) {
  const location = useLocation()

  const titles: Record<string, string> = {
    "/insights": "Insights",
    "/contents": "Contents",
    "/ideas": "Ideas & Topics",
    "/dashboard": "Identity & Insights",
    "/admin": "Admin",
  }

  const title = titles[location.pathname] ?? "Dashboard"

  return (
    <header className="topbar">
      <button
        className="topbar__menu-btn"
        onClick={onMenuClick}
      >
        <Menu size={22} />
      </button>

      <div className="topbar__text">
        <h1 className="topbar__title">{title}</h1>

        {context && (
          <span className="topbar__context">
            {context}
          </span>
        )}
      </div>
    </header>
  )
}