import { useMemo, useState } from 'react'
import { AnimatePresence, Reorder, motion } from 'framer-motion'
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  GripVertical,
  History,
  LineChart,
  Lock,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Wand2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import StyleWeightSlider from './StyleWeightSlider'
import VoiceRadar, { type VoiceTrait } from './VoiceRadar'
import { countWords, wordDiff } from './wordDiff'

export interface ChapterLite {
  id: number
  index: number
  title: string
  wordCount: number
  status: 'queued' | 'writing' | 'done' | 'error'
}

export interface ActLite {
  act: number
  goal: string
  chapters: number[]
}

export interface VersionEntry {
  id: string
  ts: Date
  action: string
  chapterId: number
  chapterTitle: string
  wordsDelta: number
  content: string
}

export type RailTab = 'style' | 'plot' | 'voice' | 'history'
export type RewriteScope = 'paragraph' | 'chapter' | 'book'

interface Props {
  tab: RailTab
  onTabChange: (t: RailTab) => void
  // style
  styleWeight: number
  onWeightChange: (v: number) => void
  onWeightCommit: (v: number) => void
  scope: RewriteScope
  onScopeChange: (s: RewriteScope) => void
  intensityPct: number
  voiceName: string
  rewriting: boolean
  hasSelection: boolean
  onRewrite: () => void
  // plot
  acts: ActLite[]
  chapters: ChapterLite[]
  currentChapterId: number | null
  onSelectChapter: (id: number) => void
  onReorderChapters: (ordered: ChapterLite[]) => void
  onRegenerateChapter: (id: number) => void
  // voice
  voiceTraits: VoiceTrait[]
  voiceChips: string[]
  onRecalibrate: () => void
  recalibrating: boolean
  isStudio: boolean
  // history
  versions: VersionEntry[]
  onRestore: (v: VersionEntry) => void
  currentContent: string
  totalWords: number
}

const TABS: Array<{ id: RailTab; label: string; icon: typeof SlidersHorizontal }> = [
  { id: 'style', label: 'Style', icon: SlidersHorizontal },
  { id: 'plot', label: 'Plot', icon: BookOpen },
  { id: 'voice', label: 'Voice', icon: LineChart },
  { id: 'history', label: 'History', icon: History },
]

const STATUS_DOT: Record<ChapterLite['status'], string> = {
  queued: 'bg-parchment-dim/40',
  writing: 'bg-spectral animate-pulse',
  done: 'bg-verdant',
  error: 'bg-blood',
}

export default function ControlRail(props: Props) {
  const {
    tab,
    onTabChange,
    styleWeight,
    onWeightChange,
    onWeightCommit,
    scope,
    onScopeChange,
    intensityPct,
    voiceName,
    rewriting,
    hasSelection,
    onRewrite,
    acts,
    chapters,
    currentChapterId,
    onSelectChapter,
    onReorderChapters,
    onRegenerateChapter,
    voiceTraits,
    voiceChips,
    onRecalibrate,
    recalibrating,
    isStudio,
    versions,
    onRestore,
    currentContent,
    totalWords,
  } = props

  const [bookConfirm, setBookConfirm] = useState(false)
  const [diffOpenId, setDiffOpenId] = useState<string | null>(null)

  const bookCost = useMemo(
    () => Math.round(totalWords * (styleWeight - 1 + 0.5)),
    [totalWords, styleWeight],
  )

  const currentAct = useMemo(() => {
    const ch = chapters.find((c) => c.id === currentChapterId)
    if (!ch) return null
    return acts.find((a) => a.chapters.includes(ch.index)) ?? null
  }, [acts, chapters, currentChapterId])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-stroke bg-ink-900">
      {/* Tab bar */}
      <div className="flex border-b border-stroke/70">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium transition-colors',
              tab === t.id ? 'text-spectral' : 'text-parchment-dim hover:text-parchment',
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {tab === t.id && (
              <motion.span
                layoutId="rail-tab-underline"
                className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-spectral shadow-[0_0_8px_rgba(139,124,255,0.8)]"
              />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          {tab === 'style' && (
            <motion.div
              key="style"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              <StyleWeightSlider
                value={styleWeight}
                onChange={onWeightChange}
                onCommit={onWeightCommit}
                disabled={rewriting}
              />

              {/* Scope toggle */}
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-parchment-dim">
                  Rewrite scope
                </div>
                <div className="flex gap-2">
                  {(
                    [
                      { id: 'paragraph', label: 'Paragraph' },
                      { id: 'chapter', label: 'Chapter' },
                      { id: 'book', label: 'Whole Book' },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (s.id === 'book') setBookConfirm(true)
                        else onScopeChange(s.id)
                      }}
                      className={cn(
                        'flex-1 rounded-full border px-3 py-1.5 text-xs transition-all',
                        scope === s.id
                          ? 'border-spectral bg-spectral/15 text-parchment shadow-[0_0_12px_rgba(139,124,255,0.25)]'
                          : 'border-stroke text-parchment-dim hover:border-spectral/50 hover:text-parchment',
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity readout */}
              <div className="rounded-lg border border-stroke/70 bg-ink-800/70 p-3">
                <div className="font-mono text-[11px] leading-relaxed text-parchment-dim">
                  Pulling{' '}
                  <motion.span
                    key={intensityPct}
                    initial={{ opacity: 0.3, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-block text-spectral"
                  >
                    {intensityPct}%
                  </motion.span>{' '}
                  more idioms from {voiceName}&rsquo;s archive
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-700">
                  <motion.div
                    animate={{ width: `${intensityPct}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    className="h-full rounded-full bg-gradient-to-r from-ember to-spectral"
                  />
                </div>
              </div>

              <button
                onClick={onRewrite}
                disabled={rewriting || (!hasSelection && scope === 'paragraph')}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-4 py-2.5 text-sm font-medium text-white transition-all',
                  rewriting || (!hasSelection && scope === 'paragraph')
                    ? 'cursor-not-allowed opacity-40'
                    : 'shadow-[0_0_24px_rgba(139,124,255,0.4)] hover:scale-[1.02] active:scale-95',
                )}
              >
                <Wand2 className={cn('h-4 w-4', rewriting && 'animate-spin')} />
                {rewriting
                  ? 'Rewriting…'
                  : scope === 'paragraph'
                    ? hasSelection
                      ? 'Rewrite Selection'
                      : 'Select text to rewrite'
                    : scope === 'chapter'
                      ? 'Rewrite Chapter'
                      : 'Rewrite Whole Book'}
              </button>
              <p className="font-hand text-base leading-snug text-ember/80">
                *higher weights let her hand take over the sentence entirely
              </p>
            </motion.div>
          )}

          {tab === 'plot' && (
            <motion.div
              key="plot"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              {/* 3-act mini map */}
              {acts.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {acts.map((a) => (
                    <div
                      key={a.act}
                      className={cn(
                        'rounded-lg border p-2.5 transition-colors',
                        currentAct?.act === a.act
                          ? 'border-spectral bg-spectral/10 shadow-[0_0_14px_rgba(139,124,255,0.2)]'
                          : 'border-stroke bg-ink-800/60',
                      )}
                    >
                      <div className="font-hand text-base leading-none text-ember">Act {a.act}</div>
                      <div className="mt-1 line-clamp-3 text-[10px] leading-snug text-parchment-dim">
                        {a.goal}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-parchment-dim">
                  Chapters · drag to reorder
                </div>
                <Reorder.Group
                  axis="y"
                  values={chapters}
                  onReorder={onReorderChapters}
                  className="space-y-1.5"
                >
                  {chapters.map((c) => (
                    <Reorder.Item
                      key={c.id}
                      value={c}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className={cn(
                        'group flex cursor-grab items-center gap-2 rounded-lg border px-2.5 py-2 active:cursor-grabbing',
                        c.id === currentChapterId
                          ? 'border-spectral/70 bg-spectral/10'
                          : 'border-stroke/70 bg-ink-800/50 hover:border-stroke',
                      )}
                      onClick={() => onSelectChapter(c.id)}
                    >
                      <GripVertical className="h-3.5 w-3.5 shrink-0 text-parchment-dim/50" />
                      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT[c.status])} />
                      <span className="min-w-0 flex-1 truncate text-xs text-parchment">
                        <span className="mr-1.5 font-mono text-[10px] text-parchment-dim">
                          {String(c.index + 1).padStart(2, '0')}
                        </span>
                        {c.title}
                      </span>
                      <span className="font-mono text-[10px] text-parchment-dim/70">
                        {c.wordCount.toLocaleString()}w
                      </span>
                      <button
                        title="Regenerate chapter"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm(`Regenerate “${c.title}”? The current text will be replaced.`)) {
                            onRegenerateChapter(c.id)
                          }
                        }}
                        className="shrink-0 text-parchment-dim/40 opacity-0 transition-opacity hover:text-spectral group-hover:opacity-100"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            </motion.div>
          )}

          {tab === 'voice' && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              <div>
                <div className="mb-1 text-center font-hand text-lg text-ember">
                  {voiceName}&rsquo;s voice vector
                </div>
                <VoiceRadar traits={voiceTraits} />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {voiceChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-stroke bg-ink-800 px-2.5 py-1 font-mono text-[10px] text-parchment-dim"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <button
                onClick={onRecalibrate}
                disabled={recalibrating}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-spectral/60 px-4 py-2 text-sm text-spectral transition-all hover:bg-spectral/10 active:scale-95 disabled:opacity-40"
              >
                <RotateCcw className={cn('h-4 w-4', recalibrating && 'animate-spin')} />
                {recalibrating ? 'Recalibrating…' : 'Recalibrate from vault'}
              </button>

              <div>
                <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-parchment-dim">
                  Per-chapter voice override
                  {!isStudio && <Lock className="h-3 w-3 text-ember" />}
                </div>
                <div className="relative">
                  <select
                    disabled={!isStudio}
                    className={cn(
                      'w-full appearance-none rounded-lg border border-stroke bg-ink-800 px-3 py-2 text-xs text-parchment outline-none',
                      !isStudio && 'cursor-not-allowed opacity-50',
                    )}
                    defaultValue="inherit"
                  >
                    <option value="inherit">Inherit project voice ({voiceName})</option>
                    <option value="soft">Softer blend — 60% archive</option>
                    <option value="full">Full possession — 100% archive</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-parchment-dim" />
                </div>
                {!isStudio && (
                  <p className="mt-1.5 text-[10px] text-ember/80">
                    Blended per-chapter voices are a Studio tier feature.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-2"
            >
              {versions.length === 0 ? (
                <p className="py-8 text-center text-xs text-parchment-dim">
                  No versions yet. Edits and rewrites will be recorded here.
                </p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="rounded-lg border border-stroke/70 bg-ink-800/50">
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs text-parchment">{v.action}</div>
                        <div className="font-mono text-[10px] text-parchment-dim">
                          {v.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                          {v.chapterTitle} ·{' '}
                          <span className={v.wordsDelta >= 0 ? 'text-verdant' : 'text-blood'}>
                            {v.wordsDelta >= 0 ? '+' : ''}
                            {v.wordsDelta}w
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setDiffOpenId(diffOpenId === v.id ? null : v.id)}
                        className="rounded-full border border-stroke px-2.5 py-1 text-[10px] text-parchment-dim hover:border-spectral/60 hover:text-parchment"
                      >
                        Diff
                      </button>
                      <button
                        onClick={() => onRestore(v)}
                        className="rounded-full border border-spectral/50 px-2.5 py-1 text-[10px] text-spectral hover:bg-spectral/10"
                      >
                        Restore
                      </button>
                    </div>
                    <AnimatePresence>
                      {diffOpenId === v.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-stroke/60"
                        >
                          <div className="max-h-48 overflow-y-auto p-3 text-[11px] leading-relaxed">
                            {wordDiff(v.content, currentContent).map((t, i) => (
                              <span
                                key={i}
                                className={cn(
                                  t.type === 'add' && 'bg-verdant/15 text-verdant',
                                  t.type === 'remove' && 'bg-blood/15 text-blood line-through',
                                  t.type === 'same' && 'text-parchment-dim',
                                )}
                              >
                                {t.text}{' '}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Whole-book confirm dialog */}
      <AnimatePresence>
        {bookConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-ink-950/80 p-6 backdrop-blur-sm"
            onClick={() => setBookConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 6 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-xl border border-stroke bg-ink-900 p-5 shadow-[0_0_40px_rgba(139,124,255,0.15)]"
            >
              <div className="flex items-center gap-2 text-ember">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Whole-book possession?</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-parchment-dim">
                Every chapter will be re-voiced at weight {styleWeight.toFixed(1)}. Estimated cost:
                <span className="font-mono text-parchment"> {bookCost.toLocaleString()} words</span> of
                generation budget.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setBookConfirm(false)}
                  className="flex-1 rounded-full border border-stroke px-3 py-2 text-xs text-parchment-dim hover:text-parchment"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onScopeChange('book')
                    setBookConfirm(false)
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-3 py-2 text-xs font-medium text-white"
                >
                  <Check className="h-3.5 w-3.5" /> Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { countWords }
