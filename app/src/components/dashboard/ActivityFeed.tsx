import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  ScanLine,
  PenLine,
  Sparkles,
  AudioWaveform,
  CheckCircle2,
  FolderPlus,
} from 'lucide-react'

export interface ActivityItem {
  id: string
  icon: 'book' | 'scan' | 'pen' | 'sparkles' | 'voice' | 'check' | 'folder'
  text: string
  at: Date | string | number
}

const ICONS = {
  book: BookOpen,
  scan: ScanLine,
  pen: PenLine,
  sparkles: Sparkles,
  voice: AudioWaveform,
  check: CheckCircle2,
  folder: FolderPlus,
} as const

const ICON_COLORS: Record<keyof typeof ICONS, string> = {
  book: 'text-spectral',
  scan: 'text-ember',
  pen: 'text-parchment-dim',
  sparkles: 'text-spectral',
  voice: 'text-verdant',
  check: 'text-verdant',
  folder: 'text-ember',
}

function monoTime(at: Date | string | number): string {
  const d = new Date(at)
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1d'
  return `${days}d`
}

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, 10)

  return (
    <div className="rounded-xl border border-stroke bg-ink-900/80 p-5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-parchment-dim">Recent Activity</h3>
        <span className="font-mono text-[10px] text-parchment-dim">{items.length} events</span>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center font-mono text-xs text-parchment-dim">
          Nothing yet — the archive waits.
        </p>
      ) : (
        <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
          {visible.map((item, i) => {
            const Icon = ICONS[item.icon]
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-ink-800/60"
              >
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${ICON_COLORS[item.icon]}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-parchment">{item.text}</p>
                  <p className="font-mono text-[10px] text-parchment-dim">
                    {monoTime(item.at)} ago
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
      {items.length > 10 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full rounded-lg border border-stroke py-1.5 text-xs text-parchment-dim transition-colors hover:border-spectral/60 hover:text-parchment"
        >
          {expanded ? 'Show less' : 'View all'}
        </button>
      )}
    </div>
  )
}
