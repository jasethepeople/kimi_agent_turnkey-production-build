import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Download, FileDown, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ExportFormat = 'txt' | 'epub' | 'pdf'

interface Props {
  tier: 'memory' | 'legacy' | 'studio'
  exporting: boolean
  onExport: (format: ExportFormat, opts: { trimSize: string; titlePage: boolean }) => void
}

const FORMATS: Array<{ id: ExportFormat; label: string; blurb: string }> = [
  { id: 'epub', label: 'EPUB', blurb: 'Reflowable ebook for Kindle & Kobo' },
  { id: 'pdf', label: 'PDF', blurb: 'Print-ready manuscript, typeset' },
  { id: 'txt', label: 'TXT', blurb: 'Plain text — always available' },
]

const TRIM_SIZES = ['5.5 × 8.5 in', '6 × 9 in', 'A5', 'A4']

/** Export dropdown (staggered items) + options modal with progress → download. */
export default function ExportMenu({ tier, exporting, onExport }: Props) {
  const [open, setOpen] = useState(false)
  const [modalFormat, setModalFormat] = useState<ExportFormat | null>(null)
  const [trimSize, setTrimSize] = useState(TRIM_SIZES[0])
  const [titlePage, setTitlePage] = useState(true)
  const [progress, setProgress] = useState<number | null>(null)

  const allowed = (f: ExportFormat) => (tier === 'memory' ? f === 'txt' : true)

  const startExport = () => {
    if (!modalFormat) return
    setProgress(0)
    const fmt = modalFormat
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = (p ?? 0) + 20
        if (next >= 100) {
          clearInterval(timer)
          onExport(fmt, { trimSize, titlePage })
          setTimeout(() => {
            setProgress(null)
            setModalFormat(null)
          }, 500)
          return 100
        }
        return next
      })
    }, 120)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-stroke bg-ink-800 px-4 py-2 text-sm text-parchment transition-colors hover:border-spectral/60"
      >
        <FileDown className="h-4 w-4" />
        Export
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-stroke bg-ink-900 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
            >
              {FORMATS.map((f, i) => {
                const ok = allowed(f.id)
                return (
                  <motion.button
                    key={f.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.18 }}
                    onClick={() => {
                      setOpen(false)
                      if (ok) setModalFormat(f.id)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-stroke/50 px-4 py-3 text-left last:border-0 transition-colors',
                      ok ? 'hover:bg-spectral/10' : 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <Download className="h-4 w-4 shrink-0 text-parchment-dim" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm text-parchment">
                        {f.label}
                        {!ok && (
                          <span className="flex items-center gap-1 rounded-full bg-ember/15 px-2 py-0.5 font-mono text-[9px] text-ember">
                            <Lock className="h-2.5 w-2.5" /> LEGACY+
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-[11px] text-parchment-dim">
                        {ok ? f.blurb : 'Upgrade to remove the watermark'}
                      </span>
                    </span>
                  </motion.button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Options modal */}
      <AnimatePresence>
        {modalFormat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-6 backdrop-blur-sm"
            onClick={() => progress === null && setModalFormat(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-stroke bg-ink-900 p-6 shadow-[0_0_50px_rgba(139,124,255,0.18)]"
            >
              <h3 className="font-display text-2xl font-semibold italic text-parchment">
                Export {modalFormat.toUpperCase()}
              </h3>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-parchment-dim">
                    Trim size
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TRIM_SIZES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setTrimSize(s)}
                        className={cn(
                          'rounded-full border px-3 py-1 font-mono text-[11px] transition-colors',
                          trimSize === s
                            ? 'border-spectral bg-spectral/15 text-parchment'
                            : 'border-stroke text-parchment-dim hover:border-spectral/50',
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-stroke bg-ink-800/60 px-3 py-2.5">
                  <span className="text-xs text-parchment">Include title page</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setTitlePage((v) => !v)
                    }}
                    className={cn(
                      'flex h-5 w-9 items-center rounded-full p-0.5 transition-colors',
                      titlePage ? 'justify-end bg-spectral' : 'justify-start bg-ink-700',
                    )}
                  >
                    <motion.span layout className="h-4 w-4 rounded-full bg-white" />
                  </button>
                </label>

                {tier === 'memory' && (
                  <p className="rounded-lg border border-ember/30 bg-ember/10 px-3 py-2 text-[11px] text-ember">
                    Memory tier exports carry a “GhostWriter Studio” watermark. Upgrade to Legacy
                    for clean EPUB/PDF.
                  </p>
                )}

                {progress !== null ? (
                  <div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                      <motion.div
                        animate={{ width: `${progress}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-spectral to-spectral-deep"
                      />
                    </div>
                    <div className="mt-2 text-center font-mono text-[10px] text-parchment-dim">
                      {progress < 100 ? `Binding pages… ${progress}%` : 'Summoning download…'}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalFormat(null)}
                      className="flex-1 rounded-full border border-stroke px-4 py-2.5 text-sm text-parchment-dim hover:text-parchment"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={startExport}
                      disabled={exporting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-4 py-2.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(139,124,255,0.4)] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      {exporting ? 'Exporting…' : 'Export'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
