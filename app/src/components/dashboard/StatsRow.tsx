import { motion } from 'framer-motion'
import { BookOpen, Archive, PenLine, AudioWaveform } from 'lucide-react'
import CountUp from './CountUp'

interface StatsRowProps {
  activeProjects: number
  maxProjects: number | null
  scansCount: number
  scansLimit: number | null
  wordsGenerated: number
  voiceProfiles: number
  voiceLimit: number | null
}

export default function StatsRow({
  activeProjects,
  maxProjects,
  scansCount,
  scansLimit,
  wordsGenerated,
  voiceProfiles,
  voiceLimit,
}: StatsRowProps) {
  const projectPct = maxProjects ? Math.min(100, (activeProjects / maxProjects) * 100) : 0

  const cards = [
    {
      icon: BookOpen,
      label: 'Active Projects',
      value: (
        <span className="font-mono">
          <CountUp value={activeProjects} duration={0.9} />
          {maxProjects !== null && (
            <span className="text-parchment-dim"> / {maxProjects}</span>
          )}
        </span>
      ),
      extra: maxProjects !== null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-spectral to-spectral-deep"
            initial={{ width: 0 }}
            animate={{ width: `${projectPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      ),
    },
    {
      icon: Archive,
      label: 'Scans in Vault',
      value: (
        <span className="font-mono">
          <CountUp value={scansCount} duration={1} />
        </span>
      ),
      extra: (
        <span className="mt-2 inline-flex w-fit rounded-full border border-spectral/40 bg-spectral/10 px-2 py-0.5 font-mono text-[10px] text-spectral">
          {scansLimit === null ? 'unlimited' : `${scansLimit} max / profile`}
        </span>
      ),
    },
    {
      icon: PenLine,
      label: 'Words Generated',
      value: (
        <span className="font-mono">
          <CountUp value={wordsGenerated} duration={1.2} />
        </span>
      ),
      extra: (
        <span className="mt-2 block font-mono text-[10px] text-parchment-dim">
          across all manuscripts
        </span>
      ),
    },
    {
      icon: AudioWaveform,
      label: 'Voice Profiles',
      value: (
        <span className="font-mono">
          <CountUp value={voiceProfiles} duration={0.8} />
          {voiceLimit !== null && (
            <span className="text-parchment-dim"> / {voiceLimit}</span>
          )}
        </span>
      ),
      extra: (
        <span className="mt-2 block font-mono text-[10px] text-parchment-dim">
          voices preserved
        </span>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 * i, duration: 0.45, ease: 'easeOut' }}
          whileHover={{ y: -4 }}
          className="rounded-xl border border-stroke bg-ink-900/80 p-5 backdrop-blur transition-shadow hover:shadow-[0_0_28px_rgba(139,124,255,0.18)] hover:border-spectral/50"
        >
          <div className="flex items-center gap-2 text-parchment-dim">
            <c.icon className="h-4 w-4 text-spectral" />
            <span className="text-xs uppercase tracking-wider">{c.label}</span>
          </div>
          <div className="mt-3 text-2xl font-semibold text-parchment">{c.value}</div>
          {c.extra}
        </motion.div>
      ))}
    </div>
  )
}
