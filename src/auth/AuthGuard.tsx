import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useTranslation } from "react-i18next";

type Props = {
  children: React.ReactNode;
};

type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "deactivated";

export default function AuthGuard({ children }: Props) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const { t } = useTranslation();

  useEffect(() => {
    const checkSession = async (session: { user: { id: string } } | null) => {
      if (!session) {
        setStatus("unauthenticated");
        return;
      }

      /* =========================
         DEACTIVATED ACCOUNT CHECK
         Cuentas desactivadas por un admin (public.users.deactivated_at)
         no pueden entrar a la app, aunque su sesión de Supabase Auth
         siga siendo técnicamente válida. Se cierra la sesión activa
         y se redirige a login con un mensaje explicativo.
      ========================= */

      const { data: userRecord } = await supabase
        .from("users")
        .select("deactivated_at")
        .eq("id", session.user.id)
        .single();

      if (userRecord?.deactivated_at) {
        await supabase.auth.signOut();
        setStatus("deactivated");
        return;
      }

      setStatus("authenticated");
    };

    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await checkSession(session);
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Mientras no sabemos el estado
  if (status === "loading") {
    return <div>{t("common.loading")}</div>;
  }

  // Cuenta desactivada
  if (status === "deactivated") {
    return <Navigate to="/login?reason=deactivated" replace />;
  }

  // No autenticado
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  // Autenticado
  return <>{children}</>;
}
