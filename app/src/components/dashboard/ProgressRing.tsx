import { motion } from 'framer-motion'

/** Animated SVG progress ring (stroke-dashoffset from 0). */
export default function ProgressRing({
  percent,
  size = 56,
  stroke = 5,
}: {
  percent: number
  size?: number
  stroke?: number
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#2C2740"
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#ring-grad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * clamped) / 100 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      />
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B7CFF" />
          <stop offset="100%" stopColor="#5B4BC4" />
        </linearGradient>
      </defs>
    </svg>
  )
}
