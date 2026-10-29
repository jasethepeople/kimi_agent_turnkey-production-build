import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface UsageMeterProps {
  label: string
  used: number | null // null => qualitative meter (e.g. queue priority)
  limit: number | null // null => unlimited
  displayUsed?: string
  displayLimit?: string
  /** 0..1 fill when used/limit unavailable. */
  qualitative?: number
}

export default function UsageMeter({
  label,
  used,
  limit,
  displayUsed,
  displayLimit,
  qualitative,
}: UsageMeterProps) {
  const unlimited = limit === null
  const ratio =
    qualitative !== undefined
      ? qualitative
      : unlimited
        ? used !== null && used > 0
          ? 0.06
          : 0.02
        : Math.min(1, (used ?? 0) / Math.max(1, limit ?? 1))
  const hot = !unlimited && ratio > 0.7
  const valueText =
    displayUsed && displayLimit
      ? `${displayUsed} / ${displayLimit}`
      : unlimited
        ? `${used ?? 0} / ∞`
        : `${used ?? 0} / ${limit ?? 0}`

  return (
    <div className="rounded-xl border border-stroke bg-ink-800/60 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-parchment-dim">{label}</span>
        <span
          className={cn(
            'font-mono text-xs',
            hot ? 'text-ember' : 'text-verdant',
          )}
        >
          {valueText}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(3, ratio * 100)}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'h-full rounded-full',
            hot
              ? 'bg-gradient-to-r from-ember to-[#c67f3e]'
              : 'bg-gradient-to-r from-spectral to-verdant',
          )}
        />
      </div>
    </div>
  )
}
