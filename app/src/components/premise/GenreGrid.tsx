import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  Search,
  Heart,
  Rocket,
  Wand2,
  Landmark,
  Zap,
  Feather,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const GENRES = [
  { id: 'Literary', icon: BookOpen },
  { id: 'Mystery', icon: Search },
  { id: 'Romance', icon: Heart },
  { id: 'Sci-Fi', icon: Rocket },
  { id: 'Fantasy', icon: Wand2 },
  { id: 'Historical', icon: Landmark },
  { id: 'Thriller', icon: Zap },
  { id: 'Memoir', icon: Feather },
] as const

export default function GenreGrid({
  value,
  subGenre,
  onChange,
  onSubGenreChange,
}: {
  value: string | null
  subGenre: string
  onChange: (g: string) => void
  onSubGenreChange: (s: string) => void
}) {
  return (
    <section>
      <label className="mb-3 block text-sm font-medium text-parchment">Genre</label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {GENRES.map((g, i) => {
          const active = value === g.id
          return (
            <motion.button
              key={g.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(g.id)}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm transition-all',
                active
                  ? 'border-spectral bg-spectral/15 text-parchment shadow-[0_0_18px_rgba(139,124,255,0.35)] ring-1 ring-spectral/60'
                  : 'border-stroke bg-ink-900 text-parchment-dim hover:border-spectral/40 hover:text-parchment',
              )}
            >
              <g.icon className={cn('h-5 w-5', active ? 'text-spectral' : '')} />
              {g.id}
              <AnimatePresence>
                {active && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-spectral text-white shadow-[0_0_10px_rgba(139,124,255,0.6)]"
                  >
                    <Check className="h-3 w-3" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence initial={false}>
        {value && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <input
              value={subGenre}
              onChange={(e) => onSubGenreChange(e.target.value)}
              placeholder={`Sub-genre tags — e.g. “gothic ${value.toLowerCase()}”, “slow-burn”…`}
              className="mt-3 w-full rounded-lg border border-stroke bg-ink-800 px-4 py-2.5 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-spectral focus:outline-none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
