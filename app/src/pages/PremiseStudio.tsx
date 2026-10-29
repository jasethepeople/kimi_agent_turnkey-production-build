import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { LOGIN_PATH } from '@/const'
import PremiseEditor from '@/components/premise/PremiseEditor'
import GenreGrid from '@/components/premise/GenreGrid'
import VoicePicker from '@/components/premise/VoicePicker'
import GenerationSettings from '@/components/premise/GenerationSettings'
import StoryBrief from '@/components/premise/StoryBrief'
import InkTransition from '@/components/premise/InkTransition'

export default function PremiseStudio() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()

  const [title, setTitle] = useState('The Letters You Left')
  const [premise, setPremise] = useState('')
  const [genre, setGenre] = useState<string | null>(null)
  const [subGenre, setSubGenre] = useState('')
  const [primaryVoice, setPrimaryVoice] = useState<number | null>(null)
  const [secondaryVoice, setSecondaryVoice] = useState<number | null>(null)
  const [blendEnabled, setBlendEnabled] = useState(false)
  const [blendRatio, setBlendRatio] = useState(60)
  const [targetWords, setTargetWords] = useState(40_000)
  const [structure, setStructure] = useState('Classic 3-Act')
  const [pov, setPov] = useState('1st')
  const [tense, setTense] = useState('Past')
  const [chapters, setChapters] = useState(22)
  const [inkOrigin, setInkOrigin] = useState<{ x: number; y: number } | null>(null)
  const [summonError, setSummonError] = useState<string | null>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  const voicesQuery = trpc.voices.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  })
  const tierQuery = trpc.tiers.getMySubscription.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  })

  const startGeneration = trpc.generation.startGeneration.useMutation()
  const createProject = trpc.projects.create.useMutation({
    onSuccess: async (project) => {
      try {
        await startGeneration.mutateAsync({ projectId: project.id })
      } catch {
        // Job may already exist; dashboard still polls the latest job.
      }
      const rect = ctaRef.current?.getBoundingClientRect()
      setInkOrigin({
        x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
        y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
      })
      window.setTimeout(() => navigate(`/generate?project=${project.id}`), 850)
    },
    onError: (err) => setSummonError(err.message),
  })

  const profiles = voicesQuery.data ?? []
  const limits = tierQuery.data?.limits
  const maxWords = limits?.maxWordsPerGeneration ?? 15_000
  const blendingAllowed = limits?.allowVoiceBlending ?? false

  const effectiveWords = Math.min(targetWords, maxWords)
  const ready =
    premise.trim().length > 0 && genre !== null && (primaryVoice !== null || profiles.length === 0)
  const summoning = createProject.isPending || startGeneration.isPending

  const summon = () => {
    if (!ready || summoning) return
    setSummonError(null)
    createProject.mutate({
      title: title.trim() || 'Untitled Manuscript',
      premise,
      genre: subGenre ? `${genre} · ${subGenre}` : (genre ?? undefined),
      targetWords: effectiveWords,
    })
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-10 text-center">
        <h1 className="font-display text-4xl font-semibold text-parchment">The Premise Studio</h1>
        <p className="max-w-md text-sm text-parchment-dim">
          Sign in to give the swarm its north star — a premise, a genre, a voice.
        </p>
        <button
          onClick={() => navigate(LOGIN_PATH)}
          className="rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-6 py-3 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)]"
        >
          Sign in to continue
        </button>
      </div>
    )
  }

  const primaryName = profiles.find((p) => p.id === primaryVoice)?.name ?? null
  const secondaryName =
    blendEnabled && blendingAllowed
      ? (profiles.find((p) => p.id === secondaryVoice)?.name ?? null)
      : null

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[40px] font-semibold leading-tight text-parchment">
            The Premise Studio
          </h1>
          <p className="mt-1 text-sm text-parchment-dim">
            Give the swarm its north star — a premise, a genre, a voice.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-stroke bg-ink-900 px-4 py-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Project name"
            className="w-48 bg-transparent font-display text-lg italic text-parchment focus:outline-none"
          />
          <Pencil className="h-3.5 w-3.5 text-parchment-dim" />
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-5">
        {/* Left: configuration */}
        <div className="space-y-10 lg:col-span-3">
          <PremiseEditor value={premise} onChange={setPremise} />

          <GenreGrid
            value={genre}
            subGenre={subGenre}
            onChange={setGenre}
            onSubGenreChange={setSubGenre}
          />

          <VoicePicker
            profiles={profiles}
            primaryId={primaryVoice}
            secondaryId={secondaryVoice}
            blendEnabled={blendEnabled}
            blendRatio={blendRatio}
            blendingAllowed={blendingAllowed}
            onSelectPrimary={setPrimaryVoice}
            onSelectSecondary={setSecondaryVoice}
            onToggleBlend={setBlendEnabled}
            onBlendChange={setBlendRatio}
          />

          <GenerationSettings
            targetWords={targetWords}
            maxWords={maxWords}
            structure={structure}
            pov={pov}
            tense={tense}
            chapters={chapters}
            onWords={setTargetWords}
            onStructure={setStructure}
            onPov={setPov}
            onTense={setTense}
            onChapters={setChapters}
          />
        </div>

        {/* Right: sticky Story Brief */}
        <div ref={ctaRef} className="lg:col-span-2">
          <StoryBrief
            title={title}
            genre={genre}
            subGenre={subGenre}
            voiceName={primaryName}
            secondaryVoiceName={secondaryName}
            blendRatio={blendRatio}
            structure={structure}
            targetWords={effectiveWords}
            ready={ready}
            summoning={summoning}
            onSummon={summon}
          />
          {summonError && (
            <p className="mt-3 rounded-lg border border-blood/40 bg-blood/10 px-3 py-2 text-xs text-blood">
              {summonError}
            </p>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="mt-12 flex items-center justify-between border-t border-stroke/60 pt-6">
        <button
          type="button"
          className="rounded-full border border-stroke px-5 py-2.5 text-sm text-parchment-dim transition-colors hover:border-spectral/50 hover:text-parchment"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={summon}
          disabled={!ready || summoning}
          className="rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-6 py-2.5 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {summoning ? 'Summoning…' : 'Summon the Blueprint →'}
        </button>
      </div>

      <AnimatePresence>{inkOrigin && <InkTransition origin={inkOrigin} />}</AnimatePresence>
    </div>
  )
}
