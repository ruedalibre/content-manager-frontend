import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

type Props = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [sessionExists, setSessionExists] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSessionExists(!!session);
      setLoading(false);
    };

    checkSession();

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setSessionExists(!!session);
      });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!sessionExists) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}