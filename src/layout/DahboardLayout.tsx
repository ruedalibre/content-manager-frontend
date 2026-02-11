import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import "./DashboardLayout.scss"

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false)

  return (
    <div className="dashboard-layout">

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() =>
          setIsSidebarOpen(false)
        }
      />

      <div className="dashboard-layout__content">

        <Topbar
          onMenuClick={() =>
            setIsSidebarOpen(true)
          }
        />

        <main className="dashboard-layout__main">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
