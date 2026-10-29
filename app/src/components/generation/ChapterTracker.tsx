import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Circle, X, PenLine } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import type { Chapter } from '@db/schema'

function StateIcon({ status }: { status: Chapter['status'] }) {
  if (status === 'done') return <Check className="h-3.5 w-3.5 text-verdant" />
  if (status === 'writing')
    return (
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 1.3, repeat: Infinity }}
        className="h-2.5 w-2.5 rounded-full bg-spectral shadow-[0_0_8px_rgba(139,124,255,0.8)]"
      />
    )
  if (status === 'error') return <X className="h-3.5 w-3.5 text-blood" />
  return <Circle className="h-3.5 w-3.5 text-ink-700" />
}

export default function ChapterTracker({ chapters }: { chapters: Chapter[] }) {
  const [selected, setSelected] = useState<Chapter | null>(null)

  if (chapters.length === 0) {
    return (
      <section className="rounded-xl border border-stroke bg-ink-900/60 p-6 text-center">
        <img src="/swarm-illustration.svg" alt="" className="mx-auto h-36 opacity-70" />
        <p className="mt-3 text-sm text-parchment-dim">
          Chapters appear here once the Blueprint Agent locks the outline.
        </p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-parchment">Chapter Tracker</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {chapters.map((ch) => (
          <motion.button
            key={ch.id}
            type="button"
            layout="position"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            disabled={ch.status !== 'done'}
            onClick={() => setSelected(ch)}
            className={cn(
              'rounded-lg border p-3 text-left transition-all',
              ch.status === 'done' &&
                'border-verdant/40 bg-verdant/5 hover:-translate-y-0.5 hover:border-verdant/70',
              ch.status === 'writing' &&
                'border-spectral/60 bg-spectral/10 shadow-[0_0_14px_rgba(139,124,255,0.2)]',
              (ch.status === 'queued' || ch.status === 'error') && 'border-stroke bg-ink-900',
              ch.status !== 'done' && 'cursor-default',
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-parchment-dim">CH {ch.index + 1}</span>
              <StateIcon status={ch.status} />
            </div>
            <div className="mt-1.5 line-clamp-2 font-display text-xs italic leading-snug text-parchment">
              {ch.title}
            </div>
            {ch.wordCount > 0 && (
              <div className="mt-1 font-mono text-[9px] text-parchment-dim/70">
                {ch.wordCount.toLocaleString()}w
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Excerpt drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-ink-950/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-[80] w-full max-w-lg overflow-y-auto border-l border-stroke bg-ink-900 p-6"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-spectral">
                    Chapter {selected.index + 1}
                  </div>
                  <h3 className="mt-1 font-display text-2xl font-semibold italic text-parchment">
                    {selected.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-parchment-dim hover:text-parchment"
                  aria-label="Close excerpt"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="rounded-xl bg-[#F6F1E4] p-6 shadow-[inset_0_2px_12px_rgba(42,36,24,0.12)]">
                <p className="whitespace-pre-wrap font-display text-lg leading-relaxed text-[#2A2418]">
                  {(selected.content ?? '').split(/\s+/).slice(0, 300).join(' ')}
                  {(selected.content ?? '').split(/\s+/).length > 300 ? '…' : ''}
                </p>
              </div>
              <Link
                to="/editor"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-6 py-3 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.4)]"
              >
                <PenLine className="h-4 w-4" /> Open in Master Editor
              </Link>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
