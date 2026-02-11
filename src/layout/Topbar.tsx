import { Menu } from "lucide-react"
import "./Topbar.scss"

export default function Topbar({
  onMenuClick,
}: {
  onMenuClick: () => void
}) {
  return (
    <header className="topbar">

      <button
        className="topbar__menu-btn"
        onClick={onMenuClick}
      >
        <Menu size={22} />
      </button>

      <h1>Dashboard</h1>

    </header>
  )
}
