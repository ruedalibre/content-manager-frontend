import AppLayout from "./app/layout/AppLayout.tsx";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./app/routes/Dashboard.tsx";
import Contents from "./app/routes/Contents.tsx";
import Ideas from "./app/routes/Ideas.tsx";
import Admin from "./app/routes/Admin.tsx";
import Login from "./app/routes/Login.tsx";
import AuthGuard from "./auth/AuthGuard";
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Insights from "./app/routes/Insights.tsx";
/* =========================
   SUPABASE CLIENT
========================= */

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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

    const base =
      import.meta.env.VITE_SUPABASE_URL + "/functions/v1/";

    const endpoints = [
      "me-dashboard?period=30d",
      "me-insights?period=30d",
      "admin-content-growth?period=30d",
      "admin-content-growth-cumulative?period=30d",
      "admin-content-growth-rate?period=30d",
      "me-activity-heatmap",
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
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas privadas */}
      <Route
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      >
        <Route path="/ideas" element={<Ideas />} />
        <Route path="/contents" element={<Contents />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Login />} />
    </Routes>
  );
}