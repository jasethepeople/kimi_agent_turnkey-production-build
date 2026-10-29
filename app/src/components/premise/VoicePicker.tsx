import { AnimatePresence, motion } from 'framer-motion'
import { Check, Plus, Lock } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import type { VoiceProfile } from '@db/schema'

function StrengthRing({ strength, active }: { strength: number; active: boolean }) {
  const r = 16
  const c = 2 * Math.PI * r
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#2C2740" strokeWidth="3" />
      <motion.circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={active ? '#E8A15C' : '#8B7CFF'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - strength / 100) }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  )
}

function pagesTrained(p: VoiceProfile): number | null {
  if (!p.styleSummary) return null
  return Math.max(1, Math.round(p.styleSummary.length / 220))
}

export default function VoicePicker({
  profiles,
  primaryId,
  secondaryId,
  blendEnabled,
  blendRatio,
  blendingAllowed,
  onSelectPrimary,
  onSelectSecondary,
  onToggleBlend,
  onBlendChange,
}: {
  profiles: VoiceProfile[]
  primaryId: number | null
  secondaryId: number | null
  blendEnabled: boolean
  blendRatio: number
  blendingAllowed: boolean
  onSelectPrimary: (id: number) => void
  onSelectSecondary: (id: number) => void
  onToggleBlend: (v: boolean) => void
  onBlendChange: (v: number) => void
}) {
  const primary = profiles.find((p) => p.id === primaryId)
  const secondary = profiles.find((p) => p.id === secondaryId)
  const secondaryPool = profiles.filter((p) => p.id !== primaryId)

  const card = (p: VoiceProfile, active: boolean, onClick: () => void, i: number) => {
    const pages = pagesTrained(p)
    const strength = pages ? Math.min(96, 40 + pages) : 12
    return (
      <motion.button
        key={`${p.id}-${active ? 'a' : 'b'}`}
        type="button"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 * i, duration: 0.35 }}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={cn(
          'relative w-48 shrink-0 rounded-xl border bg-ink-900 p-4 text-left transition-all',
          active
            ? 'border-ember shadow-[0_0_20px_rgba(232,161,92,0.25)]'
            : 'border-stroke hover:border-ember/50',
        )}
      >
        <div className="flex items-start justify-between">
          <StrengthRing strength={strength} active={active} />
          <AnimatePresence>
            {active && (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-ember text-ink-950"
              >
                <Check className="h-3 w-3" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-2 font-hand text-[28px] leading-none text-parchment">{p.name}</div>
        <div className="mt-1 font-mono text-[10px] text-parchment-dim">
          {pages ? `trained from ${pages} pages` : 'awaiting scans'}
        </div>
      </motion.button>
    )
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-medium text-parchment">Voice Profile</label>
        <div className="flex items-center gap-2">
          {!blendingAllowed && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-ember">
              <Lock className="h-3 w-3" /> Studio
            </span>
          )}
          <button
            type="button"
            onClick={() => blendingAllowed && onToggleBlend(!blendEnabled)}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              blendEnabled ? 'bg-spectral' : 'bg-ink-700',
              !blendingAllowed && 'cursor-not-allowed opacity-40',
            )}
            aria-label="Blend voices"
          >
            <motion.span
              layout="position"
              className="absolute top-0.5 h-5 w-5 rounded-full bg-parchment"
              animate={{ left: blendEnabled ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
          <span className="text-xs text-parchment-dim">Blend voices</span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {profiles.map((p, i) => card(p, p.id === primaryId, () => onSelectPrimary(p.id), i))}
        <Link
          to="/vault"
          className="flex w-40 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stroke text-parchment-dim transition-colors hover:border-spectral/60 hover:text-spectral"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs">New profile</span>
        </Link>
        {profiles.length === 0 && (
          <p className="self-center pl-2 text-xs text-parchment-dim">
            No voices yet — upload handwriting scans in the Archive Vault.
          </p>
        )}
      </div>

      <AnimatePresence initial={false}>
        {blendEnabled && blendingAllowed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-xl border border-stroke bg-ink-900/60 p-4">
              <div className="mb-2 text-xs font-medium text-parchment-dim">Second voice</div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {secondaryPool.map((p, i) => card(p, p.id === secondaryId, () => onSelectSecondary(p.id), i))}
                {secondaryPool.length === 0 && (
                  <p className="self-center text-xs text-parchment-dim">
                    Train another voice profile to blend.
                  </p>
                )}
              </div>
              {primary && secondary && (
                <div className="mt-3">
                  <div className="mb-1.5 flex justify-between font-mono text-[11px]">
                    <span className="font-hand text-base text-ember">{primary.name}</span>
                    <span className="text-parchment">
                      {blendRatio}% ⟷ {100 - blendRatio}%
                    </span>
                    <span className="font-hand text-base text-spectral">{secondary.name}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={blendRatio}
                    onChange={(e) => onBlendChange(Number(e.target.value))}
                    className="w-full accent-[#8B7CFF]"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
