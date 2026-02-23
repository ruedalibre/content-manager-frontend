import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar.tsx"
import Topbar from "./Topbar.tsx"
import "./DashboardLayout.scss"
import Footer from "../components/Footer.tsx"

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

        <Footer/>

      </div>
    </div>
  )
}
