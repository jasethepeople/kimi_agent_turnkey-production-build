import { motion } from 'framer-motion'
import { Check, Eye, FileUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ScanStatus = 'uploaded' | 'processing' | 'vectorized' | 'failed'

export interface PipelineScan {
  id: number
  fileName: string
  status: ScanStatus
}

const STAGES = [
  { key: 'ingesting', label: 'Ingesting', icon: FileUp, statuses: ['uploaded'] as ScanStatus[] },
  { key: 'analysis', label: 'Vision Analysis', icon: Eye, statuses: ['processing'] as ScanStatus[] },
  { key: 'vectorized', label: 'Vectorized', icon: Check, statuses: ['vectorized', 'failed'] as ScanStatus[] },
]

/** 3-stage processing stepper; per-file cards slide between columns. */
export default function PipelineStrip({ scans }: { scans: PipelineScan[] }) {
  const active = scans.some((s) => s.status === 'uploaded' || s.status === 'processing')
  if (scans.length === 0) return null

  return (
    <div className="rounded-xl border border-stroke bg-ink-900/80 p-5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-parchment-dim">
          Processing Pipeline
        </h3>
        {active && (
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-spectral">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spectral opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-spectral" />
            </span>
            Kimi K3 reading ink…
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {STAGES.map((stage, si) => {
          const stageScans = scans.filter((s) => stage.statuses.includes(s.status))
          const isActive = stageScans.some(
            (s) => s.status === 'uploaded' || s.status === 'processing',
          )
          return (
            <div key={stage.key} className="relative">
              {si < STAGES.length - 1 && (
                <div className="absolute -right-2 top-5 hidden h-px w-4 bg-stroke md:block" />
              )}
              <div
                className={cn(
                  'mb-3 flex items-center gap-2 rounded-full border px-3 py-1.5',
                  isActive
                    ? 'border-spectral/50 bg-spectral/10'
                    : stage.key === 'vectorized'
                      ? 'border-verdant/40 bg-verdant/5'
                      : 'border-stroke bg-ink-800',
                )}
              >
                <motion.span
                  animate={isActive ? { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] } : {}}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  <stage.icon
                    className={cn(
                      'h-3.5 w-3.5',
                      isActive
                        ? 'text-spectral'
                        : stage.key === 'vectorized'
                          ? 'text-verdant'
                          : 'text-parchment-dim',
                    )}
                  />
                </motion.span>
                <span className="font-mono text-[11px] text-parchment">{stage.label}</span>
                <span className="ml-auto font-mono text-[10px] text-parchment-dim">
                  {stageScans.length}
                </span>
              </div>

              <div className="space-y-2">
                {stageScans.map((s) => (
                  <motion.div
                    key={s.id}
                    layout="position"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'rounded-lg border px-3 py-2',
                      s.status === 'failed'
                        ? 'border-blood/50 bg-blood/5'
                        : s.status === 'vectorized'
                          ? 'border-verdant/30 bg-ink-800'
                          : 'border-spectral/30 bg-ink-800',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[11px] text-parchment">
                        {s.fileName}
                      </span>
                      {s.status === 'vectorized' && (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-verdant">
                          <Sparkles className="h-3 w-3" /> done
                        </span>
                      )}
                      {s.status === 'failed' && (
                        <span className="font-mono text-[10px] text-blood">failed</span>
                      )}
                    </div>
                    {(s.status === 'uploaded' || s.status === 'processing') && (
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-700">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-spectral to-spectral-deep"
                          initial={{ width: '10%' }}
                          animate={{ width: s.status === 'processing' ? '70%' : '35%' }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
                {stageScans.length === 0 && (
                  <p className="py-3 text-center font-mono text-[10px] text-parchment-dim/50">
                    —
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
