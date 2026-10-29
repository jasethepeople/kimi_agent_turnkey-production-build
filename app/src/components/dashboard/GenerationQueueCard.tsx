import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const PHASE_LABELS: Record<string, string> = {
  blueprint: 'Blueprint',
  drafting: 'Writing chapters',
  revising: 'Revising',
  complete: 'Complete',
}

export default function GenerationQueueCard({
  projectId,
  projectTitle,
  phase,
  progress,
}: {
  projectId: number
  projectTitle: string
  phase: string
  progress: number
}) {
  return (
    <div className="rounded-xl border border-spectral/40 bg-ink-900/80 p-5 backdrop-blur shadow-[0_0_30px_rgba(139,124,255,0.12)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-parchment-dim">Generation Queue</h3>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-spectral">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spectral opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-spectral" />
          </span>
          LIVE
        </span>
      </div>

      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-spectral" />
        <span className="truncate text-sm font-medium text-parchment">{projectTitle}</span>
      </div>
      <div className="mb-3 font-mono text-[11px] text-parchment-dim">
        {PHASE_LABELS[phase] ?? phase} · {Math.round(progress)}%
      </div>

      {/* shimmer progress bar */}
      <div className="relative h-2 overflow-hidden rounded-full bg-ink-700">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-spectral to-spectral-deep"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          animate={{ x: ['-100%', '400%'] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        />
      </div>

      {/* pulsing agent dots */}
      <div className="mt-3 flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-spectral"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.18 }}
          />
        ))}
        <span className="ml-2 font-mono text-[10px] text-parchment-dim">swarm active</span>
      </div>

      <Link
        to={`/generate?project=${projectId}`}
        className="mt-4 block rounded-lg border border-spectral/50 py-2 text-center text-xs font-medium text-spectral transition-colors hover:bg-spectral/10"
      >
        Open Generation Dashboard
      </Link>
    </div>
  )
}
