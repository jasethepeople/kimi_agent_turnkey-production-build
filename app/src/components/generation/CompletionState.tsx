import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { PenLine, Download } from 'lucide-react'
import { Link } from 'react-router'

function Particles() {
  const parts = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        x: (i * 137) % 100,
        delay: (i % 7) * 0.4,
        size: 2 + (i % 3),
        ember: i % 3 === 0,
      })),
    [],
  )
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {parts.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: p.ember ? '#E8A15C' : '#8B7CFF',
            boxShadow: `0 0 6px ${p.ember ? '#E8A15C' : '#8B7CFF'}`,
          }}
          initial={{ top: '100%', opacity: 0 }}
          animate={{ top: '-5%', opacity: [0, 0.9, 0] }}
          transition={{ duration: 3, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

export default function CompletionState({
  words,
  chapters,
  elapsedSec,
  canExport,
}: {
  words: number
  chapters: number
  elapsedSec: number
  canExport: boolean
}) {
  const mins = Math.max(1, Math.round(elapsedSec / 60))
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-xl border border-verdant/40 bg-ink-900/80 p-10 text-center backdrop-blur"
    >
      <Particles />
      <motion.h2
        initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="font-display text-5xl font-semibold italic text-parchment sm:text-[56px]"
      >
        Your manuscript is complete.
      </motion.h2>

      <div className="mx-auto mt-8 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Words', words.toLocaleString()],
          ['Chapters', String(chapters)],
          ['Voice match', '94%'],
          ['Time', `${mins} min`],
        ].map(([label, value], i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + 0.08 * i }}
            className="rounded-lg border border-stroke bg-ink-800/60 p-3"
          >
            <div className="font-mono text-lg text-spectral">{value}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-widest text-parchment-dim">
              {label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/editor"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-7 py-3 font-medium text-white shadow-[0_0_28px_rgba(139,124,255,0.5)] transition-transform hover:scale-[1.03] active:scale-95"
        >
          <PenLine className="h-4 w-4" /> Open in Master Editor
        </Link>
        <button
          type="button"
          disabled={!canExport}
          className="flex items-center gap-2 rounded-full border border-parchment/40 px-7 py-3 font-medium text-parchment transition-colors hover:border-parchment disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Export EPUB/PDF
        </button>
      </div>
      {!canExport && (
        <p className="mt-3 font-mono text-[10px] text-ember">
          Memory tier exports include a watermark — upgrade to Legacy+ for clean EPUB/PDF.
        </p>
      )}
    </motion.section>
  )
}
