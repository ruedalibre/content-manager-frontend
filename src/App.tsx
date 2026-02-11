import { Routes, Route } from "react-router-dom"
import DashboardLayout from "./layout/DahboardLayout.tsx"

function Dashboard() {
  return <div>Dashboard Page</div>
}

function Admin() {
  return <div>Admin Page</div>
}

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}
