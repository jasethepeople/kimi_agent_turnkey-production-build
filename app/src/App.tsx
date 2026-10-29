import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import AppShell from './components/AppShell'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ArchiveVault from './pages/ArchiveVault'
import PremiseStudio from './pages/PremiseStudio'
import GenerationDashboard from './pages/GenerationDashboard'
import MasterEditor from './pages/MasterEditor'
import Billing from './pages/Billing'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Marketing layout (Navbar + Footer) — nested-route pattern */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="login" element={<Login />} />
      </Route>

      {/* Authenticated app shell (sidebar + topbar) */}
      <Route element={<AppShell />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="vault" element={<ArchiveVault />} />
        <Route path="premise" element={<PremiseStudio />} />
        <Route path="generate" element={<GenerationDashboard />} />
        <Route path="editor" element={<MasterEditor />} />
        <Route path="billing" element={<Billing />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
