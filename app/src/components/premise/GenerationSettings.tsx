import { motion } from 'framer-motion'
import { Lock, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export const STRUCTURES = [
  { id: 'Classic 3-Act', glyph: '△' },
  { id: "Hero's Journey", glyph: '◯' },
  { id: 'Epistolary', glyph: '✉' },
  { id: 'Freeform', glyph: '∿' },
] as const

const POVS = ['1st', '3rd limited', 'Omniscient'] as const
const TENSES = ['Past', 'Present'] as const

function fmt(n: number) {
  return n.toLocaleString()
}

export default function GenerationSettings({
  targetWords,
  maxWords,
  structure,
  pov,
  tense,
  chapters,
  onWords,
  onStructure,
  onPov,
  onTense,
  onChapters,
}: {
  targetWords: number
  maxWords: number
  structure: string
  pov: string
  tense: string
  chapters: number
  onWords: (n: number) => void
  onStructure: (s: string) => void
  onPov: (s: string) => void
  onTense: (s: string) => void
  onChapters: (n: number) => void
}) {
  const capped = targetWords > maxWords
  const pct = ((Math.min(targetWords, 120_000) - 15_000) / (120_000 - 15_000)) * 100

  return (
    <section className="space-y-6">
      <label className="block text-sm font-medium text-parchment">Generation Settings</label>

      {/* Target length */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-parchment-dim">Target length</span>
          <span className="font-mono text-sm text-spectral">
            {fmt(targetWords)} words
            {capped && (
              <span className="ml-2 inline-flex items-center gap-1 text-ember">
                <Lock className="h-3 w-3" /> capped at {fmt(maxWords)}
              </span>
            )}
          </span>
        </div>
        <div className="relative">
          <input
            type="range"
            min={15_000}
            max={120_000}
            step={1_000}
            value={targetWords}
            onChange={(e) => onWords(Number(e.target.value))}
            className="w-full accent-[#8B7CFF]"
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-1 left-0 h-1 rounded-full bg-spectral/30"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-parchment-dim">
          <span>15k · novella</span>
          <span className="flex items-center gap-1">
            <Lock className="h-2.5 w-2.5 text-ember" /> Memory cap · Legacy+ unlocks
          </span>
          <span>120k</span>
        </div>
      </div>

      {/* Structure */}
      <div>
        <span className="mb-2 block text-xs text-parchment-dim">Structure</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STRUCTURES.map((s) => {
            const active = structure === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onStructure(s.id)}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 transition-colors',
                  active
                    ? 'border-transparent bg-spectral/10 text-parchment'
                    : 'border-stroke bg-ink-900 text-parchment-dim hover:text-parchment',
                )}
              >
                {active && (
                  <motion.svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.rect
                      x="1"
                      y="1"
                      width="calc(100% - 2px)"
                      height="calc(100% - 2px)"
                      rx="11"
                      fill="none"
                      stroke="#8B7CFF"
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </motion.svg>
                )}
                <span className={cn('text-xl leading-none', active ? 'text-spectral' : '')}>
                  {s.glyph}
                </span>
                <span className="text-xs">{s.id}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* POV & Tense */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ['POV', POVS, pov, onPov],
            ['Tense', TENSES, tense, onTense],
          ] as const
        ).map(([label, options, val, setter]) => (
          <div key={label}>
            <span className="mb-2 block text-xs text-parchment-dim">{label}</span>
            <div className="flex rounded-full border border-stroke bg-ink-900 p-1">
              {options.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setter(o)}
                  className={cn(
                    'flex-1 rounded-full px-2 py-1.5 text-xs transition-all',
                    val === o
                      ? 'bg-spectral text-white shadow-[0_0_12px_rgba(139,124,255,0.4)]'
                      : 'text-parchment-dim hover:text-parchment',
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Chapter count */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-parchment-dim">Chapter count</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChapters(Math.max(4, chapters - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stroke text-parchment-dim hover:border-spectral/60 hover:text-spectral"
            aria-label="Fewer chapters"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <motion.span
            key={chapters}
            initial={{ scale: 1.15, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-10 text-center font-mono text-lg text-parchment"
          >
            {chapters}
          </motion.span>
          <button
            type="button"
            onClick={() => onChapters(Math.min(40, chapters + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stroke text-parchment-dim hover:border-spectral/60 hover:text-spectral"
            aria-label="More chapters"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  )
}
