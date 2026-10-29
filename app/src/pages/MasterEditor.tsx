import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AnimatePresence, motion, useSpring, useTransform } from 'framer-motion'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Wand2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { LOGIN_PATH } from '@/const'
import ManuscriptPane, {
  type SelectionInfo,
  type ToolbarAction,
} from '@/components/editor/ManuscriptPane'
import ControlRail, {
  countWords,
  type ActLite,
  type ChapterLite,
  type RailTab,
  type RewriteScope,
  type VersionEntry,
} from '@/components/editor/ControlRail'
import ExportMenu, { type ExportFormat } from '@/components/editor/ExportMenu'
import type { VoiceTrait } from '@/components/editor/VoiceRadar'

type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; at: Date }

const STREAM_MS_PER_CHAR = 10
const STREAM_CHARS_PER_TICK = 2

export default function MasterEditor() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const utils = trpc.useUtils()

  // ── Data ──────────────────────────────────────────────────────────────
  const projectsQuery = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
  })
  const projectId = useMemo(() => {
    const fromUrl = Number(searchParams.get('project'))
    if (Number.isInteger(fromUrl) && fromUrl > 0) return fromUrl
    return projectsQuery.data?.[0]?.id ?? null
  }, [searchParams, projectsQuery.data])

  const manuscriptQuery = trpc.generation.getManuscript.useQuery(
    { projectId: projectId! },
    { enabled: isAuthenticated && projectId !== null },
  )
  const chaptersQuery = trpc.generation.listChapters.useQuery(
    { projectId: projectId! },
    { enabled: isAuthenticated && projectId !== null },
  )
  const subscriptionQuery = trpc.tiers.getMySubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  })
  const voicesQuery = trpc.voices.list.useQuery(undefined, { enabled: isAuthenticated })

  const tier = subscriptionQuery.data?.tier ?? 'memory'
  const voiceName = voicesQuery.data?.[0]?.name ?? 'Eleanor'

  // ── Local state ───────────────────────────────────────────────────────
  const [chapters, setChapters] = useState<ChapterLite[]>([])
  const [currentChapterId, setCurrentChapterId] = useState<number | null>(null)
  const [content, setContent] = useState('')
  const [revision, setRevision] = useState(0)
  const [tab, setTab] = useState<RailTab>('style')
  const [styleWeight, setStyleWeight] = useState(3)
  const [scope, setScope] = useState<RewriteScope>('paragraph')
  const [selection, setSelection] = useState<SelectionInfo | null>(null)
  const [rewriting, setRewriting] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' })
  const [versions, setVersions] = useState<VersionEntry[]>([])
  const [split, setSplit] = useState(62)
  const [chapterMenuOpen, setChapterMenuOpen] = useState(false)
  const [recalibrating, setRecalibrating] = useState(false)
  const splitRef = useRef<HTMLDivElement>(null)
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync chapters from the server.
  useEffect(() => {
    if (!chaptersQuery.data) return
    const lite: ChapterLite[] = chaptersQuery.data.map((c) => ({
      id: c.id,
      index: c.index,
      title: c.title,
      wordCount: c.wordCount,
      status: c.status,
    }))
    setChapters(lite)
    setCurrentChapterId((prev) => prev ?? lite[0]?.id ?? null)
  }, [chaptersQuery.data])

  const currentChapter = chaptersQuery.data?.find((c) => c.id === currentChapterId) ?? null

  // Load chapter content when switching chapters.
  useEffect(() => {
    if (!currentChapter) return
    setContent(currentChapter.content ?? '')
    setRevision((r) => r + 1)
    setSelection(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapterId])

  // ── Mutations ─────────────────────────────────────────────────────────
  const updateChapter = trpc.editor.updateChapter.useMutation({
    onMutate: () => setSaveState({ kind: 'saving' }),
    onSuccess: () => {
      setSaveState({ kind: 'saved', at: new Date() })
      utils.generation.listChapters.invalidate()
      utils.generation.getManuscript.invalidate()
    },
    onError: () => setSaveState({ kind: 'idle' }),
  })

  const inpaint = trpc.editor.inpaintRewrite.useMutation()
  const exportMutation = trpc.editor.exportManuscript.useMutation({
    onSuccess: (res) => {
      const blob = new Blob([res.content], { type: res.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.fileName
      a.click()
      URL.revokeObjectURL(url)
    },
  })

  const pushVersion = useCallback(
    (action: string, chapterId: number, chapterTitle: string, before: string, after: string) => {
      setVersions((vs) =>
        [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ts: new Date(),
            action,
            chapterId,
            chapterTitle,
            wordsDelta: countWords(after) - countWords(before),
            content: before,
          },
          ...vs,
        ].slice(0, 30),
      )
    },
    [],
  )

  // ── Streaming rewrite ─────────────────────────────────────────────────
  const runStream = useCallback(
    (selectedText: string, rewritten: string) => {
      const base = content
      const idx = base.indexOf(selectedText)
      if (idx === -1) {
        // Fallback: just swap the whole content.
        setContent(rewritten)
        setRevision((r) => r + 1)
        return
      }
      const before = base.slice(0, idx)
      const after = base.slice(idx + selectedText.length)
      let typed = 0
      setRewriting(true)
      streamTimer.current = setInterval(() => {
        typed = Math.min(rewritten.length, typed + STREAM_CHARS_PER_TICK)
        setContent(before + rewritten.slice(0, typed))
        setRevision((r) => r + 1)
        if (typed >= rewritten.length && streamTimer.current) {
          clearInterval(streamTimer.current)
          streamTimer.current = null
          setContent(before + rewritten + after)
          setRevision((r) => r + 1)
          setRewriting(false)
          setSaveState({ kind: 'saved', at: new Date() })
          utils.generation.listChapters.invalidate()
          utils.generation.getManuscript.invalidate()
        }
      }, STREAM_MS_PER_CHAR)
    },
    [content, utils],
  )

  useEffect(
    () => () => {
      if (streamTimer.current) clearInterval(streamTimer.current)
    },
    [],
  )

  const doRewrite = useCallback(
    (selectedText: string, weight: number, actionLabel: string) => {
      if (!currentChapter || rewriting) return
      const text = selectedText.slice(0, 20_000)
      const before = content
      setRewriting(true)
      inpaint.mutate(
        { chapterId: currentChapter.id, highlightedText: text, styleWeight: weight },
        {
          onSuccess: (res) => {
            pushVersion(actionLabel, currentChapter.id, currentChapter.title, before, before.replace(text, res.rewritten))
            runStream(text, res.rewritten)
          },
          onError: () => setRewriting(false),
        },
      )
    },
    [currentChapter, rewriting, content, inpaint, pushVersion, runStream],
  )

  const handleToolbarAction = (action: ToolbarAction, text: string) => {
    const weight =
      action === 'voice'
        ? 5
        : action === 'shorten'
          ? Math.max(1, styleWeight - 0.5)
          : action === 'expand'
            ? Math.min(5, styleWeight + 0.5)
            : styleWeight
    const label =
      action === 'voice'
        ? 'Rewrite · more her voice'
        : action === 'expand'
          ? 'Expanded passage'
          : action === 'shorten'
            ? 'Shortened passage'
            : `Rewrite @ weight ${weight.toFixed(1)}`
    doRewrite(text, weight, label)
  }

  const handleRailRewrite = () => {
    if (!currentChapter) return
    if (scope === 'paragraph' && selection) {
      doRewrite(selection.text, styleWeight, `Rewrite @ weight ${styleWeight.toFixed(1)}`)
    } else if (scope === 'chapter') {
      doRewrite(content, styleWeight, `Chapter re-voiced @ ${styleWeight.toFixed(1)}`)
    } else {
      // Whole book: sequentially possess each chapter.
      const list = chaptersQuery.data ?? []
      if (list.length === 0) return
      setRewriting(true)
      const run = async () => {
        for (const ch of list) {
          const text = (ch.content ?? '').slice(0, 20_000)
          if (!text) continue
          try {
            await inpaint.mutateAsync({
              chapterId: ch.id,
              highlightedText: text,
              styleWeight,
            })
          } catch {
            // continue with remaining chapters
          }
        }
        await utils.generation.listChapters.invalidate()
        await utils.generation.getManuscript.invalidate()
        const refreshed = await utils.generation.listChapters.fetch({ projectId: projectId! })
        const cur = refreshed.find((c) => c.id === currentChapterId)
        if (cur) {
          pushVersion(`Whole-book possession @ ${styleWeight.toFixed(1)}`, cur.id, cur.title, content, cur.content ?? '')
          setContent(cur.content ?? '')
          setRevision((r) => r + 1)
        }
        setRewriting(false)
      }
      void run()
    }
  }

  // Releasing the slider triggers a targeted rewrite of the current selection.
  const handleWeightCommit = (v: number) => {
    if (selection && scope === 'paragraph') {
      doRewrite(selection.text, v, `Rewrite @ weight ${v.toFixed(1)}`)
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────
  const chapterWords = useMemo(() => countWords(content), [content])
  const totalWords = manuscriptQuery.data?.totalWords ?? chapters.reduce((a, c) => a + c.wordCount, 0)
  const intensityPct = Math.round(((styleWeight - 1) / 4) * 100)
  const voiceMatchTarget = Math.min(99, Math.round(52 + (styleWeight - 1) * 11))
  const voiceMatchSpring = useSpring(voiceMatchTarget, { stiffness: 90, damping: 20 })
  useEffect(() => {
    voiceMatchSpring.set(voiceMatchTarget)
  }, [voiceMatchTarget, voiceMatchSpring])
  const voiceMatchText = useTransform(voiceMatchSpring, (v) => `${Math.round(v)}%`)

  const voiceTraits: VoiceTrait[] = useMemo(() => {
    const w = (styleWeight - 1) / 4
    return [
      { label: 'Idiom', value: 0.45 + w * 0.5 },
      { label: 'Cadence', value: 0.6 + w * 0.3 },
      { label: 'Imagery', value: 0.55 + w * 0.35 },
      { label: 'Syntax', value: 0.5 + w * 0.4 },
      { label: 'Tenderness', value: 0.7 },
      { label: 'Wit', value: 0.4 + w * 0.3 },
    ]
  }, [styleWeight])

  const acts: ActLite[] = useMemo(
    () => manuscriptQuery.data?.blueprint?.acts ?? [],
    [manuscriptQuery.data],
  )

  const currentIndex = chapters.findIndex((c) => c.id === currentChapterId)
  const goChapter = (dir: -1 | 1) => {
    const next = chapters[currentIndex + dir]
    if (next) setCurrentChapterId(next.id)
  }

  // ── Divider drag ──────────────────────────────────────────────────────
  const onDividerPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent) => {
      const wrap = splitRef.current
      if (!wrap) return
      const rect = wrap.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setSplit(Math.min(78, Math.max(42, pct)))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const handleExport = (format: ExportFormat) => {
    if (!projectId) return
    exportMutation.mutate({ projectId, format })
  }

  const handleRestore = (v: VersionEntry) => {
    if (v.chapterId !== currentChapterId) setCurrentChapterId(v.chapterId)
    const before = content
    setContent(v.content)
    setRevision((r) => r + 1)
    pushVersion(`Restored version (${v.action})`, v.chapterId, v.chapterTitle, before, v.content)
    updateChapter.mutate({ chapterId: v.chapterId, content: v.content })
  }

  // ── Auth gates ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-spectral border-t-transparent" />
      </div>
    )
  }
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-display text-4xl font-semibold italic text-parchment">
          The editor awaits its author
        </h1>
        <p className="max-w-sm text-sm text-parchment-dim">
          Sign in with Kimi to open the Master Editor and commune with your manuscript.
        </p>
        <Link
          to={LOGIN_PATH}
          className="rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-6 py-2.5 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)]"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const hasManuscript = (chaptersQuery.data?.length ?? 0) > 0

  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-[540px] flex-col gap-4">
      {/* ── Editor top bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Chapter nav */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => goChapter(-1)}
            disabled={currentIndex <= 0}
            className="rounded-full border border-stroke p-1.5 text-parchment-dim transition-colors hover:border-spectral/60 hover:text-parchment disabled:opacity-30"
            aria-label="Previous chapter"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setChapterMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-stroke bg-ink-900 px-4 py-1.5 hover:border-spectral/60"
            >
              <span className="max-w-56 truncate font-display text-lg italic text-parchment">
                {currentChapter
                  ? `Chapter ${currentChapter.index + 1} — ${currentChapter.title}`
                  : 'No chapter'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-parchment-dim" />
            </button>
            <AnimatePresence>
              {chapterMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setChapterMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 z-40 mt-2 max-h-72 w-80 overflow-y-auto rounded-xl border border-stroke bg-ink-900 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
                  >
                    {chapters.map((c, i) => (
                      <motion.button
                        key={c.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * i }}
                        onClick={() => {
                          setCurrentChapterId(c.id)
                          setChapterMenuOpen(false)
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 border-b border-stroke/40 px-4 py-2.5 text-left text-sm last:border-0 hover:bg-spectral/10',
                          c.id === currentChapterId ? 'text-spectral' : 'text-parchment',
                        )}
                      >
                        <span className="font-mono text-[10px] text-parchment-dim">
                          {String(c.index + 1).padStart(2, '0')}
                        </span>
                        <span className="truncate">{c.title}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => goChapter(1)}
            disabled={currentIndex < 0 || currentIndex >= chapters.length - 1}
            className="rounded-full border border-stroke p-1.5 text-parchment-dim transition-colors hover:border-spectral/60 hover:text-parchment disabled:opacity-30"
            aria-label="Next chapter"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Doc stats */}
        <div className="hidden items-center gap-4 font-mono text-[11px] text-parchment-dim md:flex">
          <span>
            chapter <span className="text-parchment">{chapterWords.toLocaleString()}w</span>
          </span>
          <span className="h-3 w-px bg-stroke" />
          <span>
            total <span className="text-parchment">{totalWords.toLocaleString()}w</span>
          </span>
          <span className="h-3 w-px bg-stroke" />
          <span>
            voice match <motion.span className="text-spectral">{voiceMatchText}</motion.span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {/* Save status pill */}
          <span
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px]',
              saveState.kind === 'saving'
                ? 'border-ember/40 bg-ember/10 text-ember'
                : 'border-verdant/40 bg-verdant/10 text-verdant',
            )}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={cn(
                  'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                  saveState.kind === 'saving' ? 'bg-ember' : 'bg-verdant',
                )}
              />
              <span
                className={cn(
                  'relative inline-flex h-1.5 w-1.5 rounded-full',
                  saveState.kind === 'saving' ? 'bg-ember' : 'bg-verdant',
                )}
              />
            </span>
            {saveState.kind === 'saving'
              ? 'Saving…'
              : saveState.kind === 'saved'
                ? `Saved · ${saveState.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Saved'}
          </span>

          <button
            onClick={() => selection && doRewrite(selection.text, styleWeight, `Rewrite @ weight ${styleWeight.toFixed(1)}`)}
            disabled={!selection || rewriting}
            className={cn(
              'flex items-center gap-2 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-4 py-2 text-sm font-medium text-white transition-all',
              !selection || rewriting
                ? 'cursor-not-allowed opacity-40'
                : 'shadow-[0_0_24px_rgba(139,124,255,0.4)] hover:scale-[1.02] active:scale-95',
            )}
          >
            <Wand2 className={cn('h-4 w-4', rewriting && 'animate-spin')} />
            Rewrite Selected
          </button>

          <ExportMenu tier={tier} exporting={exportMutation.isPending} onExport={handleExport} />
        </div>
      </div>

      {/* ── Split screen ───────────────────────────────────────────── */}
      <div ref={splitRef} className="flex min-h-0 flex-1">
        {/* Manuscript pane */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ width: `${split}%` }}
          className="min-w-0 overflow-hidden rounded-xl border border-stroke bg-ink-900/40"
        >
          {hasManuscript && currentChapter ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentChapterId}
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(4px)' }}
                transition={{ duration: 0.35 }}
                className="h-full"
              >
                <ManuscriptPane
                  chapterId={currentChapter.id}
                  title={currentChapter.title}
                  content={content}
                  revision={revision}
                  rewriting={rewriting}
                  saving={updateChapter.isPending}
                  onSave={(text) => {
                    const before = content
                    setContent(text)
                    pushVersion('Manual edit', currentChapter.id, currentChapter.title, before, text)
                    updateChapter.mutate({ chapterId: currentChapter.id, content: text })
                  }}
                  onSelectionChange={setSelection}
                  onToolbarAction={handleToolbarAction}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-5 p-10 text-center">
              <div
                className="relative flex h-full w-full flex-col items-center justify-center rounded-lg"
                style={{
                  backgroundColor: '#F6F1E4',
                  backgroundImage: 'url(/texture-paper.png)',
                }}
              >
                <img
                  src="/book-mockup.png"
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain opacity-15"
                />
                <h2 className="relative font-display text-3xl font-semibold italic text-[#2A2418]">
                  No manuscript yet
                </h2>
                <p className="relative mt-2 max-w-xs text-sm text-[#2A2418]/70">
                  The pages are blank. Summon the Blueprint and let the swarm write in her hand.
                </p>
                <Link
                  to="/premise"
                  className="relative mt-4 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-6 py-2.5 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)] transition-transform hover:scale-[1.03] active:scale-95"
                >
                  Summon the Blueprint
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Divider */}
        <div
          onPointerDown={onDividerPointerDown}
          className="group relative mx-1 flex w-2 shrink-0 cursor-col-resize items-center justify-center"
        >
          <div className="absolute inset-y-0 w-px bg-stroke transition-colors group-hover:bg-spectral group-active:bg-spectral" />
          <GripVertical className="relative h-5 w-5 rounded-full text-parchment-dim/50 transition-colors group-hover:text-spectral" />
        </div>

        {/* Control rail */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="relative min-w-0 flex-1"
        >
          <ControlRail
            tab={tab}
            onTabChange={setTab}
            styleWeight={styleWeight}
            onWeightChange={setStyleWeight}
            onWeightCommit={handleWeightCommit}
            scope={scope}
            onScopeChange={setScope}
            intensityPct={intensityPct}
            voiceName={voiceName}
            rewriting={rewriting}
            hasSelection={!!selection}
            onRewrite={handleRailRewrite}
            acts={acts}
            chapters={chapters}
            currentChapterId={currentChapterId}
            onSelectChapter={setCurrentChapterId}
            onReorderChapters={setChapters}
            onRegenerateChapter={(id) => {
              const ch = chaptersQuery.data?.find((c) => c.id === id)
              if (!ch?.content) return
              if (ch.id === currentChapterId) {
                doRewrite(ch.content, styleWeight, `Regenerated chapter @ ${styleWeight.toFixed(1)}`)
              } else {
                inpaint.mutate(
                  {
                    chapterId: ch.id,
                    highlightedText: ch.content.slice(0, 20_000),
                    styleWeight,
                  },
                  { onSuccess: () => utils.generation.listChapters.invalidate() },
                )
              }
            }}
            voiceTraits={voiceTraits}
            voiceChips={[
              'long vowels',
              'tide metaphors',
              'em-dashes',
              'second-person asides',
              'Norfolk idioms',
              'understated grief',
            ]}
            onRecalibrate={() => {
              setRecalibrating(true)
              setTimeout(() => setRecalibrating(false), 1600)
            }}
            recalibrating={recalibrating}
            isStudio={tier === 'studio'}
            versions={versions}
            onRestore={handleRestore}
            currentContent={content}
            totalWords={totalWords}
          />
        </motion.div>
      </div>
    </div>
  )
}
