import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { supabase } from "../../supabaseClient.ts";
import Sidebar from "./Sidebar.tsx";
import Topbar from "./Topbar.tsx";
import "./AppLayout.scss";
import Footer from "./Footer.tsx";
import WelcomeScreen from "../../features/profile/components/WelcomeScreen.tsx";
import TourInvitation from "../../features/profile/components/TourInvitation.tsx";
import {
  UserProfileProvider,
  useUserProfile,
  type OnboardingData,
} from "../../features/profile/hooks/useUserProfile.tsx";
import PastDueBanner from "../../components/ui/PastDueBanner.tsx";
import {
  WorkspaceProvider,
  useWorkspace,
} from "../../features/workspace/hooks/useWorkspace.tsx";
import {
  SubscriptionProvider,
  useSubscription,
} from "../../features/subscription/hooks/useSubscription.tsx";
import { useIdleTimer } from "../../hooks/useIdleTimer.ts";
import IdleWarningModal from "../../components/ui/IdleWarningModal.tsx";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [topbarContext, setTopbarContext] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleIdleTimeout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login?reason=idle";
  };

  const { showWarning, secondsLeft, stayActive } =
    useIdleTimer(handleIdleTimeout);

  return (
    <UserProfileProvider>
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
            showWarning={showWarning}
            secondsLeft={secondsLeft}
            stayActive={stayActive}
          />
        </WorkspaceProvider>
      </SubscriptionProvider>
    </UserProfileProvider>
  );
}

/* =========================
   INNER COMPONENT
   Vive DENTRO de UserProfileProvider/SubscriptionProvider/
   WorkspaceProvider — único lugar donde sus respectivos hooks
   pueden llamarse legítimamente. Por eso toda la lógica de
   onboarding/tour (que depende de useUserProfile) vive aquí
   ahora, y ya no en el AppLayout externo.
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
  showWarning,
  secondsLeft,
  stayActive,
}: AppLayoutContentProps) {
  const { loadWorkspaces, currentWorkspace, workspaces, switchWorkspace } =
    useWorkspace();
  const { loadSubscription, isCreator } = useSubscription();
  const {
    isFirstSession,
    needsOnboarding,
    completeOnboarding,
    skipOnboarding,
    loading: profileLoading,
    showTourInvitation,
    updateTourStatus,
  } = useUserProfile();

  /* =========================
     GATING DE WORKSPACES POR PLAN — solo al aterrizar
     Se ejecuta una única vez, cuando la app carga y el
     workspace guardado como activo ya no es válido (por
     ejemplo, justo después de revocar acceso piloto). Si el
     usuario, después, navega deliberadamente a un workspace
     bloqueado desde el selector, se respeta esa navegación
     en modo lectura — no se lo vuelve a expulsar.
  ========================= */

  const hasCheckedInitialGating = useRef(false);

  useEffect(() => {
    if (hasCheckedInitialGating.current) return;
    if (!currentWorkspace) return; // esperar a que cargue de verdad

    hasCheckedInitialGating.current = true;

    if (isCreator || currentWorkspace.is_personal) return;

    const personalWorkspace = workspaces.find((w) => w.is_personal);
    if (personalWorkspace) {
      switchWorkspace(personalWorkspace.id);
    }
  }, [currentWorkspace, isCreator, workspaces, switchWorkspace]);

  const [showTourInvite, setShowTourInvite] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    if (!showTourInvitation) return;
    const timer = setTimeout(() => {
      setShowTourInvite(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [showTourInvitation]);

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

  /* =========================
     ONBOARDING + WORKSPACE/SUBSCRIPTION SYNC
     create-user-profile crea workspace y trial del usuario
     nuevo; sin este refetch explícito, WorkspaceProvider y
     SubscriptionProvider seguían con sus datos por defecto
     hasta un logout/login manual.
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
