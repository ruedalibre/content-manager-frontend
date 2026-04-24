import AppLayout from "./app/layout/AppLayout.tsx";
import { Routes, Route } from "react-router-dom";
import Activity from "./app/routes/Activity.tsx";
import Contents from "./app/routes/Contents.tsx";
import Ideas from "./app/routes/Ideas.tsx";
import Admin from "./app/routes/Admin.tsx";
import Login from "./app/routes/Login.tsx";
import AuthGuard from "./auth/AuthGuard.tsx";
import { useEffect } from "react";
import { supabase } from "./supabaseClient.ts";
import Insights from "./app/routes/Insights.tsx";
import Identity from "./app/routes/Identity.tsx";

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
        <Route path="/identity" element={<Identity />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/admin" element={<Admin />} />
        
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Login />} />
    </Routes>
  );
}