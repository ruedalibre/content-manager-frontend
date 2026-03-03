import DashboardLayout from "./layout/DashboardLayout.tsx";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Contents from "./pages/Contents";
import Reusable from "./pages/Reusable";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import AuthGuard from "./auth/AuthGuard";

export default function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas privadas */}
      <Route
        element={
          <AuthGuard>
            <DashboardLayout />
          </AuthGuard>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contents" element={<Contents />} />
        <Route path="/reusable" element={<Reusable />} />
        <Route path="/admin" element={<Admin />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Login />} />
    </Routes>
  );
}
