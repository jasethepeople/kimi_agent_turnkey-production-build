import { cn } from '@/lib/utils'
import { TIER_DISPLAY, accentPill } from './data'
import type { TierId } from '@contracts/tiers'

export default function TierBadge({
  tier,
  className,
}: {
  tier: TierId
  className?: string
}) {
  const t = TIER_DISPLAY[tier]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-widest',
        accentPill[t.accent],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t.name}
    </span>
  )
}
