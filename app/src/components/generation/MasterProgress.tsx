import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'

const PHASE_LABEL: Record<string, string> = {
  blueprint: 'Phase 1 of 3 — Blueprint',
  swarm: 'Phase 2 of 3 — Writing',
  consistency: 'Phase 3 of 3 — Consistency Weave',
  done: 'Complete',
  failed: 'Failed',
}

export default function MasterProgress({
  progress,
  phase,
  words,
  targetWords,
}: {
  progress: number
  phase: string
  words: number
  targetWords: number
}) {
  const pct = useMotionValue(0)
  const wordMv = useMotionValue(0)
  const pctText = useTransform(pct, (v) => `${Math.round(v)}`)
  const wordText = useTransform(wordMv, (v) => Math.round(v).toLocaleString())
  const prevWords = useRef(0)

  useEffect(() => {
    const controls = animate(pct, progress, { duration: 0.8, ease: 'easeOut' })
    return () => controls.stop()
  }, [progress, pct])

  useEffect(() => {
    const controls = animate(wordMv, words, {
      duration: Math.min(1.2, 0.15 + Math.abs(words - prevWords.current) / 800),
      ease: 'easeOut',
    })
    prevWords.current = words
    return () => controls.stop()
  }, [words, wordMv])

  const r = 104
  const c = 2 * Math.PI * r

  return (
    <section className="relative overflow-hidden rounded-xl border border-stroke bg-ink-900/80 p-8 backdrop-blur">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-16">
        <div className="relative flex h-[240px] w-[240px] items-center justify-center">
          <svg width="240" height="240" viewBox="0 0 240 240" className="absolute -rotate-90">
            <circle cx="120" cy="120" r={r} fill="none" stroke="#2C2740" strokeWidth="8" />
            <motion.circle
              cx="120"
              cy="120"
              r={r}
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c * (1 - progress / 100) }}
              transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
              style={{ filter: 'drop-shadow(0 0 8px rgba(139,124,255,0.6))' }}
            />
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8B7CFF" />
                <stop offset="100%" stopColor="#5B4BC4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="flex items-baseline font-display text-8xl font-semibold text-spectral">
            <motion.span>{pctText}</motion.span>
            <span className="text-3xl text-spectral/70">%</span>
          </div>
        </div>

        <div className="text-center sm:text-left">
          <div className="font-mono text-2xl text-parchment">
            <motion.span>{wordText}</motion.span>
            <span className="text-parchment-dim"> / {targetWords.toLocaleString()} words</span>
          </div>
          <div className="mt-2 text-sm text-parchment-dim">{PHASE_LABEL[phase] ?? phase}</div>
        </div>
      </div>
    </section>
  )
}
