import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Chapter } from '@db/schema'

interface BlueprintLike {
  title: string
  logline: string
  acts: Array<{ act: number; goal: string; chapters: number[] }>
  chapters: Array<{ index: number; title: string; summary: string; targetWords: number }>
}

const PHASES = [
  { id: 'blueprint', label: '1 · Blueprint' },
  { id: 'swarm', label: '2 · Writer Swarm' },
  { id: 'consistency', label: '3 · Consistency Weave' },
] as const

const ACT_NAMES = ['Setup', 'Confrontation', 'Resolution']

function phaseState(current: string, id: string): 'done' | 'active' | 'pending' {
  const order = ['blueprint', 'swarm', 'consistency']
  if (current === 'done') return 'done'
  if (current === 'failed') return 'pending'
  const ci = order.indexOf(current)
  const ii = order.indexOf(id)
  if (ii < ci) return 'done'
  if (ii === ci) return 'active'
  return 'pending'
}

const AGENT_NAMES = [
  'Quill-1', 'Quill-2', 'Quill-3', 'Quill-4', 'Quill-5', 'Quill-6',
  'Quill-7', 'Quill-8', 'Quill-9', 'Quill-10', 'Quill-11', 'Quill-12',
]

function BlueprintPanel({ blueprint, chapters }: { blueprint: BlueprintLike | null; chapters: Chapter[] }) {
  const [open, setOpen] = useState(false)
  if (!blueprint) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-stroke bg-ink-900/60 p-6">
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="h-2.5 w-2.5 rounded-full bg-spectral"
        />
        <p className="text-sm text-parchment-dim">
          Blueprint Agent is drafting the 3-act arc and chapter breakdown…
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {blueprint.acts.slice(0, 3).map((act, i) => (
          <motion.div
            key={act.act}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.4 }}
            className="rounded-xl border border-stroke bg-ink-900 p-4"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-spectral">
              Act {act.act} — {ACT_NAMES[i] ?? ''}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-parchment-dim">{act.goal}</p>
            <div className="mt-2 font-mono text-[10px] text-parchment-dim/70">
              {act.chapters.length} chapters
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-stroke bg-ink-900 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-parchment">
            Chapter breakdown — {blueprint.chapters.length} chapters
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-xs text-spectral hover:underline"
          >
            <FileText className="h-3.5 w-3.5" /> Read the full outline
          </button>
        </div>
        <ul className="grid gap-1 sm:grid-cols-2">
          {blueprint.chapters.slice(0, 8).map((ch) => (
            <li key={ch.index} className="flex justify-between gap-2 font-mono text-[11px] text-parchment-dim">
              <span className="truncate">
                {ch.index + 1}. {ch.title}
              </span>
              <span className="shrink-0 text-parchment-dim/60">{ch.targetWords.toLocaleString()}w</span>
            </li>
          ))}
          {blueprint.chapters.length > 8 && (
            <li className="font-mono text-[11px] text-parchment-dim/60">
              + {blueprint.chapters.length - 8} more…
            </li>
          )}
        </ul>
      </div>

      {/* Outline drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-ink-950/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-[80] w-full max-w-md overflow-y-auto border-l border-stroke bg-ink-900 p-6"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-display text-2xl font-semibold italic text-parchment">
                    {blueprint.title}
                  </h3>
                  <p className="mt-1 text-xs text-parchment-dim">{blueprint.logline}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-parchment-dim hover:text-parchment"
                  aria-label="Close outline"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ul className="space-y-3">
                {blueprint.chapters.map((ch) => (
                  <li key={ch.index} className="rounded-lg border border-stroke/60 bg-ink-800/60 p-3">
                    <div className="flex justify-between gap-2">
                      <span className="font-display text-sm italic text-parchment">
                        {ch.index + 1}. {ch.title}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-parchment-dim">
                        {ch.targetWords.toLocaleString()}w
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-parchment-dim">{ch.summary}</p>
                  </li>
                ))}
              </ul>
              {chapters.length > 0 && (
                <p className="mt-4 font-mono text-[10px] text-parchment-dim">
                  {chapters.filter((c) => c.status === 'done').length} of {chapters.length} drafted
                </p>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function SwarmPanel({ chapters, parallel }: { chapters: Chapter[]; parallel: boolean }) {
  const agentCount = parallel ? Math.min(12, Math.max(3, chapters.length)) : 3
  const writing = chapters.filter((c) => c.status === 'writing')
  const done = chapters.filter((c) => c.status === 'done')
  const agents = Array.from({ length: agentCount }).map((_, i) => {
    const ch = writing[i] ?? null
    const myDone = done.filter((_, di) => di % agentCount === i).length
    return { name: AGENT_NAMES[i], chapter: ch, doneCount: myDone }
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a, i) => {
          const status = a.chapter ? (i % 4 === 3 ? 'checking outline' : 'writing') : a.doneCount > 0 ? 'done' : 'idle'
          const total = chapters.length
          const barPct = a.chapter ? 55 : status === 'done' ? 100 : 0
          return (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.35 }}
              className={cn(
                'rounded-xl border bg-ink-900 p-4',
                a.chapter ? 'border-spectral/60 shadow-[0_0_16px_rgba(139,124,255,0.15)]' : 'border-stroke',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-spectral">Agent {a.name}</span>
                <span
                  className={cn(
                    'flex items-center gap-1.5 font-mono text-[10px]',
                    status === 'done' ? 'text-verdant' : a.chapter ? 'text-spectral' : 'text-parchment-dim/60',
                  )}
                >
                  {a.chapter && (
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="h-1.5 w-1.5 rounded-full bg-spectral"
                    />
                  )}
                  {status}
                </span>
              </div>
              <div className="mt-2 truncate font-display text-sm italic text-parchment">
                {a.chapter ? `Ch. ${a.chapter.index + 1} — “${a.chapter.title}”` : total === 0 ? 'awaiting blueprint' : 'between chapters'}
              </div>
              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-spectral to-spectral-deep"
                  animate={{ width: `${barPct}%` }}
                  transition={{ duration: 0.6 }}
                />
                {a.chapter && (
                  <motion.div
                    aria-hidden
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    animate={{ x: ['-100%', '300%'] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
              <div className="mt-1.5 font-mono text-[10px] text-parchment-dim/70">
                {a.doneCount} chapter{a.doneCount === 1 ? '' : 's'} delivered
              </div>
            </motion.div>
          )
        })}
      </div>
      {!parallel && (
        <p className="font-mono text-[11px] text-ember">
          Priority queue unlocks the parallel swarm — Upgrade to Studio for up to 12 agents.
        </p>
      )}
    </div>
  )
}

const CONSISTENCY_ITEMS = [
  'Character names consistent',
  'Timeline audit',
  'Voice match 94%',
  'Callbacks to Ch. 2 planted',
]

function ConsistencyPanel({ active, done }: { active: boolean; done: boolean }) {
  return (
    <ul className="space-y-2 rounded-xl border border-stroke bg-ink-900 p-5">
      {CONSISTENCY_ITEMS.map((item, i) => {
        const checked = done || (active && i < 2)
        return (
          <motion.li
            key={item}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i }}
            className="flex items-center gap-3 text-sm"
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border',
                checked ? 'border-verdant bg-verdant/20 text-verdant' : 'border-stroke text-transparent',
              )}
            >
              <Check className="h-3 w-3" />
            </span>
            <span className={checked ? 'text-parchment' : 'text-parchment-dim/60'}>{item}</span>
            {active && !checked && i === 2 && (
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-spectral"
              />
            )}
          </motion.li>
        )
      })}
    </ul>
  )
}

export default function PipelineStepper({
  phase,
  blueprint,
  chapters,
  parallel,
}: {
  phase: string
  blueprint: BlueprintLike | null
  chapters: Chapter[]
  parallel: boolean
}) {
  const activePanel =
    phase === 'blueprint' ? 'blueprint' : phase === 'swarm' ? 'swarm' : phase === 'consistency' || phase === 'done' ? 'consistency' : null

  return (
    <section className="space-y-5">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {PHASES.map((p, i) => {
          const st = phaseState(phase, p.id)
          return (
            <div key={p.id} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  'flex flex-1 items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs transition-colors',
                  st === 'active' && 'border-spectral bg-spectral/15 text-parchment',
                  st === 'done' && 'border-verdant/50 bg-verdant/10 text-verdant',
                  st === 'pending' && 'border-ink-700 bg-ink-900 text-parchment-dim/60',
                )}
              >
                {st === 'done' ? (
                  <Check className="h-3.5 w-3.5" />
                ) : st === 'active' ? (
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="h-2 w-2 rounded-full bg-spectral"
                  />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-ink-700" />
                )}
                <span className="truncate">{p.label}</span>
              </div>
              {i < PHASES.length - 1 && <span className="text-parchment-dim/40">→</span>}
            </div>
          )
        })}
      </div>

      {/* Active panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePanel ?? 'none'}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="overflow-hidden"
        >
          {activePanel === 'blueprint' && <BlueprintPanel blueprint={blueprint} chapters={chapters} />}
          {activePanel === 'swarm' && <SwarmPanel chapters={chapters} parallel={parallel} />}
          {activePanel === 'consistency' && (
            <ConsistencyPanel active={phase === 'consistency'} done={phase === 'done'} />
          )}
          {activePanel === null && (
            <p className="rounded-xl border border-stroke bg-ink-900/60 p-6 text-sm text-parchment-dim">
              Waiting for a generation job to begin…
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
