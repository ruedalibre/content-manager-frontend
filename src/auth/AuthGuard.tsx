import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useTranslation } from "react-i18next";

type Props = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const [sessionExists, setSessionExists] = useState<boolean | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSessionExists(!!session);
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionExists(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Mientras no sabemos el estado
  if (sessionExists === null) {
    return <div>{t("common.loading")}</div>;
  }

  // No autenticado
  if (!sessionExists) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado
  return <>{children}</>;
}
