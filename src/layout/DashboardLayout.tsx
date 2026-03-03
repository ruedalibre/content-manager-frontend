import { useState } from "react";
import { Outlet } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Sidebar from "./Sidebar.tsx";
import Topbar from "./Topbar.tsx";
import "./DashboardLayout.scss";
import Footer from "../components/Footer.tsx";

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topbarContext, setTopbarContext] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="dashboard-layout__content">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)}
        context={topbarContext} />

        <main className="dashboard-layout__main">
          <Outlet context={{setTopbarContext}}/>
        </main>

        <Footer />
      </div>
    </div>
  );
}
