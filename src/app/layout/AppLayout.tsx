import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { supabase } from "../../supabaseClient.ts";
import Sidebar from "./Sidebar.tsx";
import Topbar from "./Topbar.tsx";
import "./AppLayout.scss";
import Footer from "./Footer.tsx";
import WelcomeScreen from "../../features/profile/components/WelcomeScreen.tsx";
import { useUserProfile } from "../../features/profile/hooks/useUserProfile.ts";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topbarContext, setTopbarContext] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("role_id")
        .eq("id", user.id)
        .single();

      setIsAdmin(data?.role_id === "3536f72e-c434-4ced-88a1-0320d68d0b9f");
    };
    checkAdmin();
  }, []);

  const {
    isFirstSession,
    needsOnboarding,
    completeOnboarding,
    skipOnboarding,
    loading: profileLoading,
  } = useUserProfile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const showWelcome = !profileLoading && (isFirstSession || needsOnboarding);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />

      <div className="app-layout__content">
        <Topbar
          onMenuClick={() => setIsSidebarOpen(true)}
          context={topbarContext}
        />

        <main className="app-layout__main">
          <Outlet context={{ setTopbarContext }} />
        </main>

        <Footer />
      </div>

      {showWelcome && (
        <WelcomeScreen
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}
    </div>
  );
}
