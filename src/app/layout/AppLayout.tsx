import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { supabase } from "../../supabaseClient.ts";
import Sidebar from "./Sidebar.tsx";
import Topbar from "./Topbar.tsx";
import "./AppLayout.scss";
import Footer from "./Footer.tsx";
import WelcomeScreen from "../../features/profile/components/WelcomeScreen.tsx";
import TourInvitation from "../../features/profile/components/TourInvitation.tsx";
import { useUserProfile } from "../../features/profile/hooks/useUserProfile.ts";
import PastDueBanner from "../../components/ui/PastDueBanner.tsx";
import {
  WorkspaceProvider,
  useWorkspace,
} from "../../features/workspace/hooks/useWorkspace.tsx";
import { useIdleTimer } from "../../hooks/useIdleTimer.ts";
import IdleWarningModal from "../../components/ui/IdleWarningModal.tsx";
import {
  SubscriptionProvider,
  useSubscription,
} from "../../features/subscription/hooks/useSubscription.tsx";

type OnboardingData = {
  time_availability?: string;
  production_setup?: string;
  idea_sources?: string[];
  referents?: string;
};

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [topbarContext, setTopbarContext] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTourInvite, setShowTourInvite] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  const handleIdleTimeout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login?reason=idle";
  };

  const { showWarning, secondsLeft, stayActive } =
    useIdleTimer(handleIdleTimeout);

  const handleTourStart = () => {
    setShowTourInvite(false);
    setShowTour(true);
  };

  const handleTourLater = () => {
    setShowTourInvite(false);
  };

  const handleTourDismiss = async () => {
    setShowTourInvite(false);
    await updateTourStatus("dismissed");
  };

  const handleTourComplete = async () => {
    setShowTour(false);
    await updateTourStatus("completed");
  };

  const handleTourAction = (action: "next" | "skip") => {
    const TOTAL = 5;
    if (action === "skip" || tourStep >= TOTAL - 1) {
      setShowTour(false);
      setTourStep(0);
      handleTourComplete();
    } else {
      setTourStep((prev) => prev + 1);
    }
  };

  const showWelcome = !profileLoading && (isFirstSession || needsOnboarding);

  return (
    <SubscriptionProvider>
      <WorkspaceProvider>
        <AppLayoutContent
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          topbarContext={topbarContext}
          setTopbarContext={setTopbarContext}
          isAdmin={isAdmin}
          handleLogout={handleLogout}
          showTour={showTour}
          tourStep={tourStep}
          handleTourAction={handleTourAction}
          showWelcome={showWelcome}
          completeOnboarding={completeOnboarding}
          skipOnboarding={skipOnboarding}
          showTourInvite={showTourInvite}
          handleTourStart={handleTourStart}
          handleTourLater={handleTourLater}
          handleTourDismiss={handleTourDismiss}
          showWarning={showWarning}
          secondsLeft={secondsLeft}
          stayActive={stayActive}
        />
      </WorkspaceProvider>
    </SubscriptionProvider>
  );
}

/* =========================
   INNER COMPONENT
   Vive DENTRO de WorkspaceProvider — es el único lugar donde
   useWorkspace() puede llamarse legítimamente. AppLayout (el
   componente externo) es quien RENDERIZA WorkspaceProvider,
   por lo tanto es su ancestro, no su descendiente — el Context
   de React nunca estaría disponible ahí, sin importar que
   WorkspaceProvider aparezca en su JSX.
========================= */

type AppLayoutContentProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (fn: (prev: boolean) => boolean) => void;
  topbarContext: string | null;
  setTopbarContext: (v: string | null) => void;
  isAdmin: boolean;
  handleLogout: () => Promise<void>;
  showTour: boolean;
  tourStep: number;
  handleTourAction: (action: "next" | "skip") => void;
  showWelcome: boolean;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  showTourInvite: boolean;
  handleTourStart: () => void;
  handleTourLater: () => void;
  handleTourDismiss: () => Promise<void>;
  showWarning: boolean;
  secondsLeft: number;
  stayActive: () => void;
};

function AppLayoutContent({
  isSidebarOpen,
  setIsSidebarOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  topbarContext,
  setTopbarContext,
  isAdmin,
  handleLogout,
  showTour,
  tourStep,
  handleTourAction,
  showWelcome,
  completeOnboarding,
  skipOnboarding,
  showTourInvite,
  handleTourStart,
  handleTourLater,
  handleTourDismiss,
  showWarning,
  secondsLeft,
  stayActive,
}: AppLayoutContentProps) {
  const { loadWorkspaces } = useWorkspace();
  const { loadSubscription } = useSubscription();

  /* =========================
     ONBOARDING + SUBSCRIPTION SYNC
     Mismo problema que con workspace: create-user-profile crea
     la suscripción (trial) del usuario, pero SubscriptionProvider
     ya había cargado su estado por defecto (plan free, sin trial)
     antes de que el registro terminara. Sin este refetch, el
     usuario veía "Obtener Creator" pese a tener trial activo
     en la base de datos.
  ========================= */

  const handleOnboardingComplete = async (data: OnboardingData) => {
    await completeOnboarding(data);
    await Promise.all([loadWorkspaces(), loadSubscription()]);
  };

  const handleOnboardingSkip = async () => {
    await skipOnboarding();
    await Promise.all([loadWorkspaces(), loadSubscription()]);
  };

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        tourStep={showTour ? tourStep : null}
        onTourAction={handleTourAction}
      />

      <div
        className={`app-layout__content${isSidebarCollapsed ? " app-layout__content--expanded" : ""}`}
      >
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
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {showTourInvite && !showWelcome && (
        <TourInvitation
          onStart={handleTourStart}
          onLater={handleTourLater}
          onDismiss={handleTourDismiss}
        />
      )}

      {showTour && <div className="tour-backdrop" aria-hidden="true" />}

      {showWarning && (
        <IdleWarningModal secondsLeft={secondsLeft} onStayActive={stayActive} />
      )}
    </div>
  );
}
