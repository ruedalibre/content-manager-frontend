import AppLayout from "./app/layout/AppLayout.tsx";
import { Routes, Route, Navigate } from "react-router-dom";
import Activity from "./app/routes/Activity.tsx";
import Contents from "./app/routes/Contents.tsx";
import Ideas from "./app/routes/Ideas.tsx";
import Admin from "./app/routes/Admin.tsx";
import Login from "./app/routes/Login.tsx";
import ResetPassword from "./app/routes/ResetPassword.tsx";
import Terms from "./app/routes/Terms.tsx";
import Privacy from "./app/routes/Privacy.tsx";
import FAQ from "./app/routes/FAQ.tsx";
import UpdatePassword from "./app/routes/UpdatePassword.tsx";
import AuthGuard from "./auth/AuthGuard.tsx";
import { useEffect } from "react";
import { supabase } from "./supabaseClient.ts";
import Identity from "./app/routes/Identity.tsx";
import Profile from "./app/routes/Profile.tsx";

/* =========================
   WARM EDGE FUNCTIONS
========================= */

async function warmDashboardEndpoints() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const headers = {
      Authorization: `Bearer ${session.access_token}`,
    };

    const base = import.meta.env.VITE_SUPABASE_URL + "/functions/v1/";

    const endpoints = [
      "me-topics",
      "platforms",
    ];

    endpoints.forEach((endpoint) => {
      fetch(base + endpoint, { headers }).catch(() => {});
    });
  } catch (err) {
    console.warn("Warmup failed:", err);
  }
}

/* =========================
   APP COMPONENT
========================= */

export default function App() {
  useEffect(() => {
    // esperar un poco para no competir con login/render inicial
    const timer = setTimeout(() => {
      warmDashboardEndpoints();
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/faq" element={<FAQ />} />

      {/* Rutas privadas */}
      <Route
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/ideas" replace />} />
        <Route path="/ideas" element={<Ideas />} />
        <Route path="/contents" element={<Contents />} />
        <Route path="/identity" element={<Identity />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Route>

      {/* Raíz */}
      <Route path="/" element={<Navigate to="/ideas" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Login />} />
    </Routes>
  );
}
