import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import {
  LayoutDashboard,
  Archive,
  Lightbulb,
  Sparkles,
  PenLine,
  CreditCard,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Archive Vault', href: '/vault', icon: Archive },
  { label: 'Premise Studio', href: '/premise', icon: Lightbulb },
  { label: 'Generations', href: '/generate', icon: Sparkles },
  { label: 'Master Editor', href: '/editor', icon: PenLine },
  { label: 'Billing', href: '/billing', icon: CreditCard },
]

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-[100dvh] bg-ink-950 text-parchment">
      {/* Sidebar */}
      <aside
        className={cn(
          'sticky top-0 flex h-[100dvh] flex-col border-r border-stroke/60 bg-ink-900 transition-all duration-200',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-stroke/50 px-4">
          <Link to="/" className="flex items-center gap-2 overflow-hidden">
            <img src="/logo.svg" alt="" className="h-7 w-7 shrink-0" />
            {!collapsed && (
              <span className="font-display text-lg font-semibold leading-tight">GhostWriter</span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="text-parchment-dim hover:text-parchment"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'border-spectral bg-spectral/10 text-parchment shadow-[inset_0_0_20px_rgba(139,124,255,0.08)]'
                    : 'border-transparent text-parchment-dim hover:bg-ink-800 hover:text-parchment',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-stroke/50 p-3">
          {!collapsed && (
            <div className="rounded-xl border border-stroke bg-ink-800 p-3">
              <div className="font-hand text-lg leading-none text-ember">Memory Tier</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div className="h-full w-[35%] rounded-full bg-gradient-to-r from-spectral to-spectral-deep" />
              </div>
              <div className="mt-1.5 font-mono text-[10px] text-parchment-dim">7 / 20 scans</div>
            </div>
          )}
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-spectral to-spectral-deep font-mono text-xs text-white">
              GS
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm">Guest Scribe</div>
                <div className="truncate font-mono text-[10px] text-parchment-dim">
                  guest@ghostwriter.studio
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-stroke/60 bg-ink-950/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-parchment-dim">Studio / Workspace</span>
            <button className="flex items-center gap-2 rounded-full border border-stroke bg-ink-800 px-3 py-1.5 text-xs text-parchment hover:border-spectral/60">
              The Letters You Left <ChevronDown className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-2 rounded-full border border-verdant/40 bg-verdant/10 px-3 py-1.5 font-mono text-[11px] text-verdant sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verdant opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-verdant" />
              </span>
              Kimi K3 · 1M context
            </span>
            <button
              className="relative text-parchment-dim hover:text-parchment"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-ember" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
