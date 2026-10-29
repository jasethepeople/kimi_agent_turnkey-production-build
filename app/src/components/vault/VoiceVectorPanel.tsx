import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

const AXES = ['Cadence', 'Vocabulary', 'Imagery', 'Humor', 'Formality', 'Punctuation'] as const

/** Deterministic pseudo-random traits seeded from profile id + scan count. */
function traitValues(profileId: number, scanCount: number): number[] {
  return AXES.map((_, i) => {
    const seed = Math.sin(profileId * 12.9898 + i * 78.233) * 43758.5453
    const base = 0.35 + (Math.abs(seed) % 0.35)
    return Math.min(1, base + scanCount * 0.045)
  })
}

interface VoiceVectorPanelProps {
  profileName: string
  profileId: number
  scanCount: number
  styleSummary?: string | null
}

export default function VoiceVectorPanel({
  profileName,
  profileId,
  scanCount,
  styleSummary,
}: VoiceVectorPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [recalibrating, setRecalibrating] = useState(false)
  const [animKey, setAnimKey] = useState(0)

  const values = useMemo(() => traitValues(profileId, scanCount), [profileId, scanCount])
  const strength = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100)

  // Canvas radar chart with outward animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = 260
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const R = 95
    const n = AXES.length
    let raf = 0
    let start: number | null = null

    const draw = (t: number) => {
      if (start === null) start = t
      const p = Math.min(1, (t - start) / 1000)
      const eased = 1 - Math.pow(1 - p, 3)

      ctx.clearRect(0, 0, size, size)

      // web rings
      for (let ring = 1; ring <= 4; ring++) {
        ctx.beginPath()
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2
          const r = (R * ring) / 4
          const x = cx + Math.cos(a) * r
          const y = cy + Math.sin(a) * r
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = 'rgba(58,52,80,0.8)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      // axis spokes + labels
      ctx.font = '10px "IBM Plex Mono", monospace'
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R)
        ctx.strokeStyle = 'rgba(58,52,80,0.8)'
        ctx.stroke()
        ctx.fillStyle = '#B9B0A0'
        ctx.textAlign = 'center'
        ctx.fillText(AXES[i], cx + Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16) + 3)
      }
      // value polygon
      ctx.beginPath()
      for (let i = 0; i <= n; i++) {
        const idx = i % n
        const a = (idx / n) * Math.PI * 2 - Math.PI / 2
        const r = R * values[idx] * eased
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fillStyle = 'rgba(139,124,255,0.22)'
      ctx.fill()
      ctx.strokeStyle = '#8B7CFF'
      ctx.lineWidth = 2
      ctx.shadowColor = 'rgba(139,124,255,0.8)'
      ctx.shadowBlur = 8
      ctx.stroke()
      ctx.shadowBlur = 0
      // vertex dots
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2
        const r = R * values[i] * eased
        ctx.beginPath()
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#E8A15C'
        ctx.fill()
      }

      if (p < 1) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [values, animKey])

  const recalibrate = () => {
    if (recalibrating) return
    setRecalibrating(true)
    window.setTimeout(() => {
      setAnimKey((k) => k + 1)
      setRecalibrating(false)
    }, 3000)
  }

  // trait chips from style summary keywords
  const chips = useMemo(() => {
    if (!styleSummary) return ['awaiting more evidence', 'ink still drying']
    const words = styleSummary
      .split(/[\n,;.]+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 8 && w.length < 60)
    return Array.from(new Set(words)).slice(0, 5)
  }, [styleSummary])

  // strength ring
  const ringC = 2 * Math.PI * 30

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl border border-stroke bg-ink-900/80 p-5 backdrop-blur"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {recalibrating && (
        <motion.div
          className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-spectral/25 to-transparent"
          animate={{ x: ['-100%', '600%'] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        />
      )}

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold text-parchment">
          Voice Vector — <span className="text-spectral">{profileName}</span>
        </h3>
        {/* strength ring */}
        <div className="relative h-16 w-16">
          <svg width={64} height={64} className="-rotate-90">
            <circle cx={32} cy={32} r={30} fill="none" stroke="#2C2740" strokeWidth={4} />
            <motion.circle
              cx={32}
              cy={32}
              r={30}
              fill="none"
              stroke="#8B7CFF"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={ringC}
              initial={{ strokeDashoffset: ringC }}
              animate={{ strokeDashoffset: ringC - (ringC * strength) / 100 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-parchment">
            {strength}%
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <canvas ref={canvasRef} style={{ width: 260, height: 260 }} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <span
            key={c}
            className="max-w-[220px] truncate rounded-full border border-stroke bg-ink-800 px-2.5 py-1 font-hand text-base text-ember"
            title={c}
          >
            {c}
          </span>
        ))}
      </div>

      <button
        onClick={recalibrate}
        disabled={recalibrating}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-stroke py-2 text-xs text-parchment-dim transition-colors hover:border-spectral/60 hover:text-parchment disabled:opacity-60"
      >
        <RefreshCw className={recalibrating ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
        {recalibrating ? 'Recalibrating profile…' : 'Recalibrate profile'}
      </button>
    </motion.div>
  )
}
