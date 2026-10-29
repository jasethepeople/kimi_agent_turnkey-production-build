import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { motion } from 'framer-motion'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { LOGIN_PATH } from '@/const'
import MasterProgress from '@/components/generation/MasterProgress'
import PipelineStepper from '@/components/generation/PipelineStepper'
import ChapterTracker from '@/components/generation/ChapterTracker'
import SwarmLog from '@/components/generation/SwarmLog'
import CompletionState from '@/components/generation/CompletionState'

function useElapsed(startIso: string | Date | null, running: boolean) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [running])
  if (!startIso) return 0
  const start = new Date(startIso).getTime()
  return Math.max(0, Math.floor((now - start) / 1000))
}

function fmtElapsed(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function GenerationDashboard() {
  const { isAuthenticated, isLoading } = useAuth()
  const [params] = useSearchParams()
  const projectIdParam = Number(params.get('project') ?? '')
  const projectId = Number.isFinite(projectIdParam) && projectIdParam > 0 ? projectIdParam : null

  const projectsQuery = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  })
  const fallbackProject = useMemo(() => {
    const list = projectsQuery.data ?? []
    return list.find((p) => p.status === 'generating') ?? list[0] ?? null
  }, [projectsQuery.data])
  const effectiveId = projectId ?? fallbackProject?.id ?? null

  const projectQuery = trpc.projects.get.useQuery(
    { projectId: effectiveId! },
    { enabled: isAuthenticated && effectiveId !== null, retry: false },
  )
  const jobQuery = trpc.generation.getJobStatus.useQuery(
    { projectId: effectiveId! },
    {
      enabled: isAuthenticated && effectiveId !== null,
      refetchInterval: 1500,
      retry: false,
    },
  )
  const chaptersQuery = trpc.generation.listChapters.useQuery(
    { projectId: effectiveId! },
    {
      enabled: isAuthenticated && effectiveId !== null,
      refetchInterval: 1500,
      retry: false,
    },
  )
  const manuscriptQuery = trpc.generation.getManuscript.useQuery(
    { projectId: effectiveId! },
    {
      enabled: isAuthenticated && effectiveId !== null,
      refetchInterval: 4000,
      retry: false,
    },
  )
  const tierQuery = trpc.tiers.getMySubscription.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  })

  const job = jobQuery.data ?? null
  const chapters = useMemo(() => chaptersQuery.data ?? [], [chaptersQuery.data])
  const blueprint = manuscriptQuery.data?.blueprint ?? null
  const project = projectQuery.data ?? fallbackProject
  const parallel = tierQuery.data?.limits.parallelSwarm ?? false
  const canExport = (tierQuery.data?.limits.exportFormats ?? ['txt']).includes('epub')

  const phase = job?.phase ?? 'blueprint'
  const running = phase !== 'done' && phase !== 'failed' && job !== null
  const elapsed = useElapsed(job?.createdAt ?? null, running)
  const finalElapsed = job
    ? Math.max(
        0,
        Math.floor(
          (new Date(job.updatedAt).getTime() - new Date(job.createdAt).getTime()) / 1000,
        ),
      )
    : 0
  const shownElapsed = running ? elapsed : finalElapsed
  const words = chapters.reduce((sum, c) => sum + (c.wordCount ?? 0), 0)

  const [confirmCancel, setConfirmCancel] = useState(false)

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-10 text-center">
        <h1 className="font-display text-4xl font-semibold text-parchment">The Generation</h1>
        <p className="max-w-md text-sm text-parchment-dim">
          Sign in to watch the swarm write in their hand.
        </p>
        <Link
          to={LOGIN_PATH}
          className="rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-6 py-3 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)]"
        >
          Sign in to continue
        </Link>
      </div>
    )
  }

  if (effectiveId === null && !projectsQuery.isLoading) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-10 text-center">
        <img src="/swarm-illustration.svg" alt="" className="h-48 opacity-80" />
        <h1 className="font-display text-4xl font-semibold text-parchment">No generation yet</h1>
        <p className="max-w-md text-sm text-parchment-dim">
          Shape a premise in the Studio, then summon the Blueprint Agent to begin.
        </p>
        <Link
          to="/premise"
          className="rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-6 py-3 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)]"
        >
          Open the Premise Studio
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[40px] font-semibold leading-tight text-parchment">
            The Generation
          </h1>
          <p className="mt-1 font-mono text-xs text-parchment-dim">
            {project?.title ?? '…'} · voice profile · started{' '}
            {job ? new Date(job.createdAt).toLocaleTimeString() : '—'} · Kimi K3 · 1M context
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-stroke bg-ink-900 px-4 py-2 font-mono text-sm text-spectral">
            {fmtElapsed(shownElapsed)}
          </span>
          <button
            type="button"
            className="rounded-full border border-stroke px-4 py-2 text-xs text-parchment-dim transition-colors hover:border-spectral/50 hover:text-parchment"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="rounded-full border border-blood/60 px-4 py-2 text-xs text-blood transition-colors hover:bg-blood/10"
          >
            Cancel
          </button>
        </div>
      </header>

      {phase === 'done' ? (
        <CompletionState
          words={words}
          chapters={chapters.length}
          elapsedSec={shownElapsed}
          canExport={canExport}
        />
      ) : (
        <MasterProgress
          progress={job?.progress ?? 0}
          phase={phase}
          words={words}
          targetWords={project?.targetWords ?? 80_000}
        />
      )}

      {phase === 'failed' && (
        <div className="rounded-xl border border-blood/50 bg-blood/10 p-5 text-sm text-blood">
          The generation run failed. Check the swarm log below for details, then restart from the
          Premise Studio.
        </div>
      )}

      <PipelineStepper phase={phase} blueprint={blueprint} chapters={chapters} parallel={parallel} />

      <ChapterTracker chapters={chapters} />

      <SwarmLog log={job?.log ?? ''} />

      {/* Cancel confirm dialog */}
      {confirmCancel && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-ink-950/70 p-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-xl border border-stroke bg-ink-900 p-6"
          >
            <h3 className="font-display text-2xl font-semibold text-parchment">Cancel this run?</h3>
            <p className="mt-2 text-sm text-parchment-dim">
              Chapters already written are kept, but an in-flight run cannot be interrupted once the
              swarm has been summoned.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="rounded-full border border-stroke px-4 py-2 text-xs text-parchment-dim hover:text-parchment"
              >
                Keep writing
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="rounded-full bg-blood/80 px-4 py-2 text-xs text-white hover:bg-blood"
              >
                Understood
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
