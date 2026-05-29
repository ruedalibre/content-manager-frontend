import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { supabase } from "../../supabaseClient.ts";
import Sidebar from "./Sidebar.tsx";
import Topbar from "./Topbar.tsx";
import "./AppLayout.scss";
import Footer from "./Footer.tsx";
import WelcomeScreen from "../../features/profile/components/WelcomeScreen.tsx";
import TourInvitation from "../../features/profile/components/TourInvitation.tsx";
import GuidedTour from "../../features/profile/components/GuidedTour.tsx";
import { useUserProfile } from "../../features/profile/hooks/useUserProfile.ts";
import PastDueBanner from "../../components/ui/PastDueBanner";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [topbarContext, setTopbarContext] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTourInvite, setShowTourInvite] = useState(false);
  const [showTour, setShowTour] = useState(false);

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
    showTourInvitation,
    updateTourStatus,
  } = useUserProfile();

  useEffect(() => {
    if (!showTourInvitation) return;
    const timer = setTimeout(() => {
      setShowTourInvite(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [showTourInvitation]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleTourStart = () => {
    setShowTourInvite(false);
    setShowTour(true);
  };

  const handleTourLater = () => {
    setShowTourInvite(false);
  };

  const handleTourDismiss = async () => {
    setShowTourInvite(false);
    await updateTourStatus('dismissed');
  };

  const handleTourComplete = async () => {
    setShowTour(false);
    await updateTourStatus('completed');
  };

  const showWelcome = !profileLoading && (isFirstSession || needsOnboarding);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      <div className={`app-layout__content${isSidebarCollapsed ? " app-layout__content--expanded" : ""}`}>
        <Topbar
          onMenuClick={() => setIsSidebarOpen(true)}
          context={topbarContext}
        />

        <PastDueBanner />

        <main className="app-layout__main">
          <Outlet context={{ setTopbarContext, isAdmin }} />
        </main>

        <Footer />
      </div>

      {showWelcome && (
        <WelcomeScreen
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}

      {showTourInvite && !showWelcome && (
        <TourInvitation
          onStart={handleTourStart}
          onLater={handleTourLater}
          onDismiss={handleTourDismiss}
        />
      )}

      {showTour && (
        <GuidedTour onComplete={handleTourComplete} />
      )}
    </div>
  );
}
