import { useMemo } from 'react'

export interface VoiceTrait {
  label: string
  /** 0..1 */
  value: number
}

interface Props {
  traits: VoiceTrait[]
  size?: number
}

/** Voice Vector radar chart — spectral polygon on an ink grid. */
export default function VoiceRadar({ traits, size = 220 }: Props) {
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 26
  const n = traits.length

  const point = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const
  }

  const polygon = useMemo(
    () =>
      traits
        .map((t, i) => {
          const [x, y] = point(i, radius * Math.max(0.05, Math.min(1, t.value)))
          return `${x},${y}`
        })
        .join(' '),
    [traits, radius, n], // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* rings */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={traits
            .map((_, i) => {
              const [x, y] = point(i, radius * f)
              return `${x},${y}`
            })
            .join(' ')}
          fill="none"
          stroke="#3A3450"
          strokeWidth="1"
          opacity={f === 1 ? 0.9 : 0.5}
        />
      ))}
      {/* spokes */}
      {traits.map((_, i) => {
        const [x, y] = point(i, radius)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#3A3450" strokeWidth="1" opacity="0.5" />
      })}
      {/* value polygon */}
      <polygon
        points={polygon}
        fill="rgba(139,124,255,0.22)"
        stroke="#8B7CFF"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {traits.map((t, i) => {
        const [x, y] = point(i, radius * Math.max(0.05, Math.min(1, t.value)))
        return <circle key={t.label} cx={x} cy={y} r="2.6" fill="#8B7CFF" />
      })}
      {/* labels */}
      {traits.map((t, i) => {
        const [x, y] = point(i, radius + 16)
        return (
          <text
            key={t.label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-parchment-dim"
            fontSize="9"
            fontFamily="IBM Plex Mono, monospace"
          >
            {t.label}
          </text>
        )
      })}
    </svg>
  )
}
