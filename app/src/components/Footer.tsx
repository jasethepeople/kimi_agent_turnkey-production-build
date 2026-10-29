import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Archive Vault', href: '/vault' },
      { label: 'Master Editor', href: '/editor' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/' },
      { label: 'The Craft', href: '/#features' },
      { label: 'Careers', href: '/' },
      { label: 'Press', href: '/' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '/' },
      { label: 'Voice Vector Guide', href: '/' },
      { label: 'API', href: '/' },
      { label: 'Community', href: '/' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/' },
      { label: 'Terms', href: '/' },
      { label: 'Ethics Charter', href: '/' },
      { label: 'Rights & Ownership', href: '/' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-stroke/60 bg-ink-900">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-[18vw] italic leading-none text-parchment opacity-5"
      >
        GhostWriter
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="" className="h-8 w-8" />
              <span className="font-display text-xl font-semibold">GhostWriter Studio</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-parchment-dim">
              Turn a handful of handwritten letters into a publication-quality novel, written in a
              voice you thought was gone.
            </p>
            <form
              className="mt-6 flex max-w-xs items-center gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-full border border-stroke bg-ink-800 px-4 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-spectral focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="rounded-full border border-spectral/60 p-2 text-spectral transition-colors hover:bg-spectral hover:text-white"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-parchment-dim">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.href.split('#')[0]}
                      className="text-sm text-parchment-dim/80 transition-colors hover:text-spectral"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-stroke/50 pt-8 text-xs text-parchment-dim/70 md:flex-row">
          <span>© 2025 GhostWriter Studio</span>
          <span className="font-hand text-lg text-ember/80">
            "Every voice deserves a second chapter."
          </span>
        </div>
      </div>
    </footer>
  )
}
