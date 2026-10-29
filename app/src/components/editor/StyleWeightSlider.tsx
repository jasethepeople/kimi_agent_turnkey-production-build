import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const MIN = 1
const MAX = 5
const STEP = 0.5

const STOPS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Whisper' },
  { value: 3, label: 'Presence' },
  { value: 5, label: 'Possession' },
]

/** Fountain-nib thumb glyph. */
function NibIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2c3 4.5 5 8 5 11a5 5 0 0 1-10 0c0-3 2-6.5 5-11Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M12 8v7" stroke="#0B0A10" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="13" r="1.2" fill="#0B0A10" />
      <path d="M6 20h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

interface Props {
  value: number
  onChange: (v: number) => void
  /** Fired when the user releases the slider (or nudges with keys). */
  onCommit: (v: number) => void
  disabled?: boolean
}

/**
 * The signature Style Weight Slider: 1.0 "Whisper" → 5.0 "Possession".
 * Parchment→spectral gradient track, ink tick marks, fountain-nib thumb.
 */
export default function StyleWeightSlider({ value, onChange, onCommit, disabled }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [poppedTick, setPoppedTick] = useState<number | null>(null)

  const pct = ((value - MIN) / (MAX - MIN)) * 100

  const valueFromClientX = (clientX: number) => {
    const track = trackRef.current
    if (!track) return value
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const raw = MIN + ratio * (MAX - MIN)
    const stepped = Math.round(raw / STEP) * STEP
    return Math.min(MAX, Math.max(MIN, Number(stepped.toFixed(1))))
  }

  const handleMove = (clientX: number) => {
    const next = valueFromClientX(clientX)
    if (next !== value) {
      setPoppedTick(next)
      window.setTimeout(() => setPoppedTick(null), 220)
      onChange(next)
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    handleMove(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || disabled) return
    handleMove(e.clientX)
  }
  const endDrag = () => {
    if (!dragging) return
    setDragging(false)
    onCommit(value)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(MAX, Number((value + STEP).toFixed(1)))
      onChange(next)
      onCommit(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(MIN, Number((value - STEP).toFixed(1)))
      onChange(next)
      onCommit(next)
    }
  }

  const ticks: number[] = []
  for (let v = MIN; v <= MAX; v += STEP) ticks.push(Number(v.toFixed(1)))

  return (
    <div className={cn('select-none', disabled && 'pointer-events-none opacity-50')}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-parchment-dim">
          Style Weight
        </span>
        <span className="font-mono text-sm text-spectral">{value.toFixed(1)}</span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={value}
        aria-label="Style weight: how strongly the original handwriting voice possesses the rewrite"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className={cn(
          'relative h-10 cursor-ew-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-spectral/60 rounded-full',
        )}
      >
        <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full border border-stroke bg-gradient-to-r from-parchment via-[#C9B8E8] to-spectral-deep shadow-inner">
          {/* filled shimmer */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-spectral/30 to-spectral/60"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Ink tick marks */}
        {ticks.map((t) => {
          const left = ((t - MIN) / (MAX - MIN)) * 100
          const isMajor = Number.isInteger(t)
          return (
            <motion.span
              key={t}
              animate={poppedTick === t ? { scale: [1, 1.9, 1] } : { scale: 1 }}
              transition={{ duration: 0.22 }}
              className={cn(
                'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full',
                isMajor ? 'h-3.5 w-[3px] bg-[#2A2418]' : 'h-2 w-[2px] bg-[#2A2418]/70',
                t <= value && 'bg-ink-950',
              )}
              style={{ left: `${left}%` }}
            />
          )
        })}

        {/* Nib thumb */}
        <motion.div
          animate={{
            left: `${pct}%`,
            scale: dragging ? 1.25 : 1,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border border-spectral/70 bg-ink-900 text-spectral transition-shadow',
              dragging
                ? 'shadow-[0_0_26px_rgba(139,124,255,0.85)]'
                : 'shadow-[0_0_12px_rgba(139,124,255,0.4)]',
            )}
          >
            <NibIcon className="h-5 w-5" />
          </div>
        </motion.div>
      </div>

      {/* Labels */}
      <div className="mt-1.5 flex justify-between">
        {STOPS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => {
              onChange(s.value)
              onCommit(s.value)
            }}
            className={cn(
              'font-hand text-lg leading-none transition-colors',
              Math.abs(value - s.value) < 0.26 ? 'text-spectral' : 'text-parchment-dim/70 hover:text-parchment-dim',
            )}
          >
            {s.label}
            <span className="ml-1 font-mono text-[9px] text-parchment-dim/50">{s.value.toFixed(1)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
