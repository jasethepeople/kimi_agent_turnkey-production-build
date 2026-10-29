import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { LOGIN_PATH } from '@/const'

const centerLinks = [
  { label: 'Product', href: '/#how-it-works' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'The Craft', href: '/#features' },
]

const appLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Vault', href: '/vault' },
  { label: 'Premise', href: '/premise' },
  { label: 'Generate', href: '/generate' },
  { label: 'Editor', href: '/editor' },
  { label: 'Billing', href: '/billing' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-stroke/60 bg-ink-950/70 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="GhostWriter Studio" className="h-8 w-8" />
          <span className="font-display text-xl font-semibold tracking-tight text-parchment">
            GhostWriter Studio
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {centerLinks.map((l) =>
            l.href.startsWith('/#') ? (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-parchment-dim transition-colors hover:text-parchment"
              >
                {l.label}
              </a>
            ) : (
              <NavLink
                key={l.label}
                to={l.href}
                className={({ isActive }) =>
                  cn(
                    'text-sm transition-colors hover:text-parchment',
                    isActive ? 'text-spectral' : 'text-parchment-dim',
                  )
                }
              >
                {l.label}
              </NavLink>
            ),
          )}
          <span className="hidden h-4 w-px bg-stroke xl:block" aria-hidden />
          <div className="hidden items-center gap-5 xl:flex">
            {appLinks.map((l) => (
              <NavLink
                key={l.href}
                to={l.href}
                className={({ isActive }) =>
                  cn(
                    'text-xs uppercase tracking-wider transition-colors hover:text-parchment',
                    isActive ? 'text-spectral' : 'text-parchment-dim/70',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          {/* AUTH-SLOT: wired to useAuth() */}
          {isLoading ? (
            <span
              className="h-9 w-24 animate-pulse rounded-full bg-stroke/40"
              aria-hidden
            />
          ) : isAuthenticated && user ? (
            <>
              <span className="flex items-center gap-2 text-sm text-parchment">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-spectral/30 text-xs font-semibold">
                    {(user.name ?? 'G').slice(0, 1).toUpperCase()}
                  </span>
                )}
                {user.name ?? 'Ghostwriter'}
              </span>
              <button
                onClick={() => logout()}
                className="text-sm text-parchment-dim transition-colors hover:text-parchment"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to={LOGIN_PATH}
                className="text-sm text-parchment-dim transition-colors hover:text-parchment"
              >
                Sign in
              </Link>
              <Link
                to={LOGIN_PATH}
                className="rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-5 py-2 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)] transition-transform hover:scale-[1.03] active:scale-95"
              >
                Begin a Memory
              </Link>
            </>
          )}
        </div>

        <button
          className="text-parchment lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-16 z-40 flex flex-col gap-2 overflow-y-auto bg-ink-950/98 px-8 py-10 backdrop-blur-xl lg:hidden"
          >
            {[...centerLinks, ...appLinks].map((l, i) => (
              <motion.div
                key={l.label + l.href}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.4 }}
              >
                <Link
                  to={l.href.replace('/#', '/')}
                  onClick={() => setOpen(false)}
                  className="font-display text-3xl text-parchment transition-colors hover:text-spectral"
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * (centerLinks.length + appLinks.length), duration: 0.4 }}
              className="mt-8 flex flex-col gap-4"
            >
              {/* AUTH-SLOT: wired to useAuth() */}
              {isLoading ? (
                <span
                  className="h-10 w-32 animate-pulse rounded-full bg-stroke/40"
                  aria-hidden
                />
              ) : isAuthenticated && user ? (
                <>
                  <span className="flex items-center gap-3 text-lg text-parchment">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-spectral/30 text-sm font-semibold">
                        {(user.name ?? 'G').slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    {user.name ?? 'Ghostwriter'}
                  </span>
                  <button
                    onClick={() => {
                      setOpen(false)
                      logout()
                    }}
                    className="w-fit text-lg text-parchment-dim"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to={LOGIN_PATH}
                    onClick={() => setOpen(false)}
                    className="text-lg text-parchment-dim"
                  >
                    Sign in
                  </Link>
                  <Link
                    to={LOGIN_PATH}
                    onClick={() => setOpen(false)}
                    className="w-fit rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-6 py-3 font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)]"
                  >
                    Begin a Memory
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
