import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function useShimmer(dep: unknown) {
  const [tick, setTick] = useState(0)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setTick((t) => t + 1)
  }, [dep])
  return tick
}

function BriefLine({ label, value, dep }: { label: string; value: string; dep: unknown }) {
  const tick = useShimmer(dep)
  return (
    <div className="relative overflow-hidden rounded-md px-2 py-1.5">
      <span className="text-[11px] uppercase tracking-wider text-parchment-dim">{label}</span>
      <div className="mt-0.5 truncate text-sm text-parchment">{value}</div>
      {tick > 0 && (
        <motion.div
          key={tick}
          aria-hidden
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-spectral/15 to-transparent"
        />
      )}
    </div>
  )
}

export default function StoryBrief({
  title,
  genre,
  subGenre,
  voiceName,
  secondaryVoiceName,
  blendRatio,
  structure,
  targetWords,
  ready,
  summoning,
  onSummon,
}: {
  title: string
  genre: string | null
  subGenre: string
  voiceName: string | null
  secondaryVoiceName: string | null
  blendRatio: number
  structure: string
  targetWords: number
  ready: boolean
  summoning: boolean
  onSummon: () => void
}) {
  const estMin = Math.max(3, Math.round(targetWords / 5_500))
  const voiceLabel = secondaryVoiceName
    ? `${voiceName} ${blendRatio}% ⟷ ${secondaryVoiceName} ${100 - blendRatio}%`
    : (voiceName ?? '—')

  return (
    <aside className="sticky top-24 rounded-xl border border-stroke bg-ink-900/80 p-5 backdrop-blur">
      <div className="mb-1 text-[11px] uppercase tracking-widest text-parchment-dim">
        Story Brief
      </div>
      <h3 className="font-display text-2xl font-semibold italic text-parchment">
        {title || 'Untitled Manuscript'}
      </h3>

      <div className="mt-4 space-y-1 divide-y divide-stroke/50">
        <BriefLine
          label="Genre"
          dep={genre + subGenre}
          value={genre ? `${genre}${subGenre ? ` · ${subGenre}` : ''}` : '—'}
        />
        <BriefLine label="Voice" dep={voiceLabel} value={voiceLabel} />
        <BriefLine label="Structure" dep={structure} value={structure} />
        <div className="relative overflow-hidden rounded-md px-2 py-1.5">
          <span className="text-[11px] uppercase tracking-wider text-parchment-dim">
            Target words
          </span>
          <motion.div
            key={targetWords}
            initial={{ opacity: 0.4, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-0.5 font-mono text-sm text-spectral"
          >
            {targetWords.toLocaleString()} words
          </motion.div>
        </div>
        <div className="px-2 py-1.5">
          <span className="text-[11px] uppercase tracking-wider text-parchment-dim">
            Estimated time
          </span>
          <div className="mt-0.5 font-mono text-sm text-parchment">
            ~{estMin} min with standard queue
          </div>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={onSummon}
        disabled={!ready || summoning}
        whileTap={ready ? { scale: 0.97 } : undefined}
        animate={ready && !summoning ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.5 }}
        className={cn(
          'mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-6 py-3.5 font-medium text-white shadow-[0_0_28px_rgba(139,124,255,0.45)] transition-opacity',
          (!ready || summoning) && 'cursor-not-allowed opacity-50',
        )}
      >
        {summoning ? 'Summoning…' : 'Summon the Blueprint'}
        <ArrowRight className="h-4 w-4" />
      </motion.button>
      <p className="mt-3 text-center font-mono text-[10px] leading-relaxed text-parchment-dim">
        Blueprint Agent drafts your 3-act arc before any prose is written.
      </p>
    </aside>
  )
}
