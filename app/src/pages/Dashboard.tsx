import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { LayoutGrid, List, Search } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import StatsRow from '@/components/dashboard/StatsRow'
import ProjectCard, { type DashboardProject } from '@/components/dashboard/ProjectCard'
import ActivityFeed, { type ActivityItem } from '@/components/dashboard/ActivityFeed'
import NewProjectDialog from '@/components/dashboard/NewProjectDialog'
import GenerationQueueCard from '@/components/dashboard/GenerationQueueCard'
import { timeAgo } from '@/components/dashboard/utils'

const FILTERS = ['All', 'Drafting', 'Generating', 'In Editing', 'Complete'] as const
type Filter = (typeof FILTERS)[number]

function filterMatches(filter: Filter, status: DashboardProject['status']): boolean {
  if (filter === 'All') return true
  if (filter === 'Drafting') return status === 'draft'
  if (filter === 'Generating') return status === 'generating'
  if (filter === 'Complete') return status === 'complete'
  return status === 'draft' // "In Editing" ≈ draft projects with progress
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const utils = trpc.useUtils()

  const projectsQuery = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
  })
  const subscriptionQuery = trpc.tiers.getMySubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  })
  const voicesQuery = trpc.voices.list.useQuery(undefined, { enabled: isAuthenticated })

  const projects = useMemo(
    () => (projectsQuery.data ?? []) as DashboardProject[],
    [projectsQuery.data],
  )
  const voices = useMemo(() => voicesQuery.data ?? [], [voicesQuery.data])
  const limits = subscriptionQuery.data?.limits
  const tier = subscriptionQuery.data?.tier ?? 'memory'

  // Per-voice scan counts (real data via tRPC useQueries)
  const scanQueries = trpc.useQueries((t) =>
    voices.map((v) => t.voices.listScans({ voiceProfileId: v.id })),
  )
  const scansCount = scanQueries.reduce((sum, q) => sum + (q.data?.length ?? 0), 0)

  // Per-project manuscript word totals
  const manuscriptQueries = trpc.useQueries((t) =>
    projects.map((p) => t.generation.getManuscript({ projectId: p.id })),
  )
  const wordsByProject = useMemo(() => {
    const map = new Map<number, number>()
    projects.forEach((p, i) => {
      map.set(p.id, manuscriptQueries[i]?.data?.totalWords ?? 0)
    })
    return map
  }, [projects, manuscriptQueries])
  const totalWords = [...wordsByProject.values()].reduce((a, b) => a + b, 0)

  // Live generation job (first generating project)
  const runningProject = projects.find((p) => p.status === 'generating')
  const jobQuery = trpc.generation.getJobStatus.useQuery(
    { projectId: runningProject?.id ?? 0 },
    {
      enabled: isAuthenticated && !!runningProject,
      refetchInterval: 4000,
    },
  )

  // Mutations
  const archiveMutation = trpc.projects.update.useMutation({
    onSuccess: () => utils.projects.list.invalidate(),
  })
  const removeMutation = trpc.projects.remove.useMutation({
    onSuccess: () => utils.projects.list.invalidate(),
  })
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => utils.projects.list.invalidate(),
  })

  // Library view state
  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const visibleProjects = projects.filter(
    (p) =>
      filterMatches(filter, p.status) &&
      (search.trim() === '' || p.title.toLowerCase().includes(search.trim().toLowerCase())),
  )

  // Activity feed derived from real projects / voices / scans / jobs
  const activityItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = []
    for (const p of projects) {
      const words = wordsByProject.get(p.id) ?? 0
      items.push({
        id: `p-${p.id}`,
        icon: p.status === 'complete' ? 'check' : p.status === 'generating' ? 'sparkles' : 'pen',
        text:
          p.status === 'generating'
            ? `${p.title} · generation running`
            : p.status === 'complete'
              ? `${p.title} completed · ${words.toLocaleString()} words`
              : `${p.title} edited`,
        at: p.updatedAt,
      })
    }
    for (const v of voices) {
      items.push({
        id: `v-${v.id}`,
        icon: 'voice',
        text: `Voice profile “${v.name}” calibrated`,
        at: v.createdAt,
      })
    }
    scanQueries.forEach((q, i) => {
      const profileName = voices[i]?.name ?? 'profile'
      for (const s of (q.data ?? []).slice(0, 5)) {
        items.push({
          id: `s-${s.id}`,
          icon: 'scan',
          text:
            s.status === 'vectorized'
              ? `Scan “${s.fileName}” vectorized · ${profileName}`
              : s.status === 'processing'
                ? `Scan “${s.fileName}” being read by Kimi K3`
                : `Scan “${s.fileName}” added to vault`,
          at: s.createdAt,
        })
      }
    })
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [projects, voices, scanQueries, wordsByProject])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 5) return 'Burning the midnight oil'
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-72 animate-pulse rounded-lg bg-ink-800" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-ink-800" />
          ))}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-display text-3xl text-parchment">The archive is sealed.</p>
        <p className="text-sm text-parchment-dim">Sign in to open your library.</p>
        <Link
          to="/login"
          className="rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-6 py-2.5 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)]"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const firstName = (user?.name ?? 'Scribe').split(' ')[0]
  const voiceByProject = new Map<number, string>()
  voices.forEach((v) => {
    if (v.projectId) voiceByProject.set(v.projectId, v.name)
  })

  return (
    <div className="space-y-8">
      {/* 1. Greeting header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-[40px] font-semibold leading-tight text-parchment">
            {greeting}, {firstName}.
          </h1>
          <motion.p
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: -2 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="font-hand text-xl text-ember"
          >
            the archive missed you
          </motion.p>
        </div>
        <NewProjectDialog
          voices={voices.map((v) => ({ id: v.id, name: v.name }))}
          onCreated={() => utils.projects.list.invalidate()}
        />
      </motion.div>

      {/* 2. Stats row */}
      <StatsRow
        activeProjects={projects.length}
        maxProjects={limits?.maxProjects ?? null}
        scansCount={scansCount}
        scansLimit={limits?.maxScansPerVoiceProfile ?? null}
        wordsGenerated={totalWords}
        voiceProfiles={voices.length}
        voiceLimit={limits?.maxVoiceProfiles ?? null}
      />

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        {/* 3. Project library */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status filter tabs */}
            <div className="flex gap-1 rounded-full border border-stroke bg-ink-900 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'relative rounded-full px-3.5 py-1.5 text-xs transition-colors',
                    filter === f ? 'text-parchment' : 'text-parchment-dim hover:text-parchment',
                  )}
                >
                  {filter === f && (
                    <motion.span
                      layoutId="filter-pill"
                      className="absolute inset-0 rounded-full bg-spectral/20 ring-1 ring-spectral/50"
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    />
                  )}
                  <span className="relative">{f}</span>
                </button>
              ))}
            </div>

            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-parchment-dim" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search titles…"
                className="w-52 rounded-full border border-stroke bg-ink-900 py-2 pl-9 pr-4 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-spectral/60 focus:outline-none"
              />
            </div>

            <div className="flex gap-1 rounded-full border border-stroke bg-ink-900 p-1">
              <button
                onClick={() => setView('grid')}
                className={cn(
                  'rounded-full p-2',
                  view === 'grid' ? 'bg-spectral/20 text-spectral' : 'text-parchment-dim',
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'rounded-full p-2',
                  view === 'list' ? 'bg-spectral/20 text-spectral' : 'text-parchment-dim',
                )}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {projectsQuery.isLoading ? (
            <div className={cn('grid gap-5', view === 'grid' ? 'sm:grid-cols-2' : 'grid-cols-1')}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-ink-800" />
              ))}
            </div>
          ) : visibleProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-stroke py-16 text-center">
              <img
                src="/swarm-illustration.svg"
                alt=""
                className="h-36 w-auto opacity-40"
              />
              <div>
                <p className="font-display text-2xl text-parchment">
                  {projects.length === 0
                    ? 'Your library is a blank page.'
                    : 'No projects match this filter.'}
                </p>
                <p className="mt-1 text-sm text-parchment-dim">
                  {projects.length === 0
                    ? 'Every novel begins with a single premise.'
                    : 'Try another status or search term.'}
                </p>
              </div>
              {projects.length === 0 && (
                <NewProjectDialog
                  voices={voices.map((v) => ({ id: v.id, name: v.name }))}
                  onCreated={() => utils.projects.list.invalidate()}
                />
              )}
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-5',
                view === 'grid' ? 'sm:grid-cols-2 2xl:grid-cols-3' : 'grid-cols-1',
              )}
            >
              {visibleProjects.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  index={i}
                  words={wordsByProject.get(p.id) ?? 0}
                  voiceName={voiceByProject.get(p.id) ?? null}
                  onArchive={(id) => archiveMutation.mutate({ projectId: id, status: 'archived' })}
                  onDelete={(id) => removeMutation.mutate({ projectId: id })}
                  onDuplicate={(proj) =>
                    createMutation.mutate({
                      title: `${proj.title} (copy)`,
                      genre: proj.genre ?? undefined,
                      targetWords: proj.targetWords,
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* 4. Right rail */}
        <aside className="space-y-5">
          {runningProject && jobQuery.data && (
            <GenerationQueueCard
              projectId={runningProject.id}
              projectTitle={runningProject.title}
              phase={jobQuery.data.phase}
              progress={jobQuery.data.progress}
            />
          )}
          <ActivityFeed items={activityItems} />

          {/* Tier card */}
          <div className="rounded-xl border border-stroke bg-ink-900/80 p-5 backdrop-blur">
            <div className="font-hand text-xl leading-none text-ember">
              {tier === 'memory' ? 'Memory Tier' : tier === 'legacy' ? 'Legacy Tier' : 'Studio Tier'}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-spectral to-spectral-deep"
                initial={{ width: 0 }}
                animate={{
                  width:
                    limits?.maxProjects != null
                      ? `${Math.min(100, (projects.length / limits.maxProjects) * 100)}%`
                      : '35%',
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="mt-2 font-mono text-[10px] text-parchment-dim">
              {limits?.maxProjects != null
                ? `${projects.length} / ${limits.maxProjects} projects`
                : `${projects.length} projects · unlimited`}
            </div>
            <Link
              to="/billing"
              className="mt-3 inline-block text-xs text-spectral underline-offset-4 hover:underline"
            >
              Upgrade plan →
            </Link>
            <p className="mt-2 font-mono text-[10px] text-parchment-dim/70">
              last activity {activityItems[0] ? timeAgo(activityItems[0].at) : '—'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
