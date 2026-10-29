import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogLine {
  ts: string
  agent: string
  msg: string
  raw: string
}

function parseLog(log: string): LogLine[] {
  return log
    .split('\n')
    .filter(Boolean)
    .slice(-200)
    .map((raw) => {
      const m = raw.match(/^\[(.+?)\]\s*(.*)$/)
      const rest = m ? m[2] : raw
      const ts = m ? new Date(m[1]).toLocaleTimeString('en-GB', { hour12: false }) : ''
      const am = rest.match(/^([^:▸]{3,32}?)\s*[:▸]\s*(.*)$/)
      return {
        ts,
        agent: am ? am[1].trim() : 'system',
        msg: am ? am[2] : rest,
        raw,
      }
    })
}

export default function SwarmLog({ log }: { log: string }) {
  const [open, setOpen] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const [filter, setFilter] = useState('all')
  const bodyRef = useRef<HTMLDivElement>(null)

  const lines = useMemo(() => parseLog(log), [log])
  const agents = useMemo(() => Array.from(new Set(lines.map((l) => l.agent))), [lines])
  const visible = filter === 'all' ? lines : lines.filter((l) => l.agent === filter)

  useEffect(() => {
    if (autoScroll && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [visible.length, autoScroll, open])

  return (
    <section className="overflow-hidden rounded-xl border border-stroke bg-ink-950">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-stroke/60 px-4 py-2.5 text-left"
      >
        <span className="font-mono text-xs text-parchment">Live Swarm Log</span>
        <span className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-parchment-dim">{lines.length} lines</span>
          {open ? (
            <ChevronDown className="h-4 w-4 text-parchment-dim" />
          ) : (
            <ChevronUp className="h-4 w-4 text-parchment-dim" />
          )}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-stroke/40 px-4 py-2">
              <label className="flex items-center gap-2 font-mono text-[10px] text-parchment-dim">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="accent-[#8B7CFF]"
                />
                auto-scroll
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-md border border-stroke bg-ink-800 px-2 py-1 font-mono text-[10px] text-parchment focus:outline-none"
                aria-label="Filter by agent"
              >
                <option value="all">all agents</option>
                {agents.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div ref={bodyRef} className="h-64 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed">
              {visible.length === 0 && (
                <p className="text-parchment-dim/50">Awaiting first transmissions…</p>
              )}
              <AnimatePresence initial={false}>
                {visible.map((l, i) => (
                  <motion.div
                    key={`${i}-${l.raw.slice(0, 24)}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-pre-wrap"
                  >
                    <span className="text-ember">[{l.ts}]</span>{' '}
                    <span className="text-spectral">{l.agent}</span>{' '}
                    <span className={cn('text-parchment-dim', /fail/i.test(l.msg) && 'text-blood')}>
                      ▸ {l.msg}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mt-1 inline-block h-3.5 w-2 bg-spectral"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
