import { Routes, Route } from "react-router-dom"
import DashboardLayout from "./layout/DahboardLayout.tsx"

import Dashboard from "./pages/Dashboard"
import Contents from "./pages/Contents"
import Reusable from "./pages/Reusable"
import Admin from "./pages/Admin"

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>

        <Route path="/" element={<Dashboard />} />
        <Route path="/contents" element={<Contents />} />
        <Route path="/reusable" element={<Reusable />} />
        <Route path="/admin" element={<Admin />} />

      </Route>
    </Routes>
  )
}
