import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { AudioWaveform, Plus } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import DropZone from '@/components/vault/DropZone'
import PipelineStrip from '@/components/vault/PipelineStrip'
import ScanGallery, { type GalleryScan } from '@/components/vault/ScanGallery'
import VoiceVectorPanel from '@/components/vault/VoiceVectorPanel'

const DEMO_SCANS: GalleryScan[] = [
  {
    id: 'demo-1',
    fileName: 'letter-to-thomas-1947.png',
    url: '/handwriting-sample-1.png',
    status: 'sample',
    type: 'Letter',
    isDemo: true,
  },
  {
    id: 'demo-2',
    fileName: 'journal-margins-1952.png',
    url: '/handwriting-sample-2.png',
    status: 'sample',
    type: 'Journal',
    isDemo: true,
  },
  {
    id: 'demo-3',
    fileName: 'postcard-lisbon.png',
    url: '/handwriting-sample-3.png',
    status: 'sample',
    type: 'Postcard',
    isDemo: true,
  },
]

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function guessType(name: string): GalleryScan['type'] {
  const n = name.toLowerCase()
  if (n.includes('journal') || n.includes('diary')) return 'Journal'
  if (n.includes('postcard') || n.includes('card')) return 'Postcard'
  if (n.includes('note')) return 'Note'
  return 'Letter'
}

export default function ArchiveVault() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const utils = trpc.useUtils()

  const voicesQuery = trpc.voices.list.useQuery(undefined, { enabled: isAuthenticated })
  const subscriptionQuery = trpc.tiers.getMySubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  })
  const voices = useMemo(() => voicesQuery.data ?? [], [voicesQuery.data])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    if (selectedId === null && voices.length > 0) setSelectedId(voices[0].id)
  }, [voices, selectedId])

  const selected = voices.find((v) => v.id === selectedId) ?? voices[0] ?? null

  const scansQuery = trpc.voices.listScans.useQuery(
    { voiceProfileId: selected?.id ?? 0 },
    { enabled: isAuthenticated && !!selected },
  )
  const scans = useMemo(() => scansQuery.data ?? [], [scansQuery.data])
  const hasActive = scans.some((s) => s.status === 'uploaded' || s.status === 'processing')

  // Poll while scans process
  useEffect(() => {
    if (!hasActive || !selected) return
    const t = window.setInterval(() => {
      void utils.voices.listScans.invalidate({ voiceProfileId: selected.id })
    }, 3000)
    return () => window.clearInterval(t)
  }, [hasActive, selected, utils])

  const uploadMutation = trpc.voices.uploadScan.useMutation({
    onSuccess: () => {
      if (selected) void utils.voices.listScans.invalidate({ voiceProfileId: selected.id })
    },
  })
  const createVoice = trpc.voices.create.useMutation({
    onSuccess: (v) => {
      void utils.voices.list.invalidate()
      setSelectedId(v.id)
    },
  })

  const [uploadingCount, setUploadingCount] = useState(0)
  const uploadQueue = useRef(0)

  const onFiles = useCallback(
    async (files: File[]) => {
      if (!selected) return
      uploadQueue.current += files.length
      setUploadingCount(uploadQueue.current)
      for (const file of files) {
        try {
          const dataUrl = await readAsDataUrl(file)
          await uploadMutation.mutateAsync({
            voiceProfileId: selected.id,
            fileName: file.name,
            fileUrl: dataUrl,
            mimeType: file.type || 'image/png',
          })
        } catch {
          // surfaced via query state; individual failures stay visible in pipeline
        } finally {
          uploadQueue.current -= 1
          setUploadingCount(uploadQueue.current)
        }
      }
    },
    [selected, uploadMutation],
  )

  const galleryScans = useMemo<GalleryScan[]>(() => {
    const real: GalleryScan[] = scans.map((s) => ({
      id: String(s.id),
      fileName: s.fileName,
      url: s.fileUrl,
      status: s.status,
      type: guessType(s.fileName),
      isDemo: false,
    }))
    return [...real, ...DEMO_SCANS]
  }, [scans])

  const [newVoiceName, setNewVoiceName] = useState('')
  const limits = subscriptionQuery.data?.limits
  const tier = subscriptionQuery.data?.tier ?? 'memory'

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-80 animate-pulse rounded-lg bg-ink-800" />
        <div className="h-80 animate-pulse rounded-2xl bg-ink-800" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-display text-3xl text-parchment">The vault is sealed.</p>
        <p className="text-sm text-parchment-dim">Sign in to feed the voice.</p>
        <Link
          to="/login"
          className="rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-6 py-2.5 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)]"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const strength = Math.min(100, 20 + scans.filter((s) => s.status === 'vectorized').length * 12)

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-start justify-between gap-5"
      >
        <div>
          <h1 className="font-display text-[40px] font-semibold leading-tight text-parchment">
            The Archive Vault
          </h1>
          <p className="mt-1 max-w-xl text-sm text-parchment-dim">
            Feed the voice. Letters, journals, postcards — every page deepens the profile.
          </p>
        </div>

        {/* Voice profile health card */}
        {selected ? (
          <div className="flex items-center gap-4 rounded-xl border border-stroke bg-ink-900/80 px-5 py-4 backdrop-blur">
            <div className="relative h-14 w-14">
              <svg width={56} height={56} className="-rotate-90">
                <circle cx={28} cy={28} r={24} fill="none" stroke="#2C2740" strokeWidth={4} />
                <motion.circle
                  cx={28}
                  cy={28}
                  r={24}
                  fill="none"
                  stroke="#8B7CFF"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 24}
                  initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 24 * (1 - strength / 100),
                  }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-parchment">
                {strength}%
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <AudioWaveform className="h-4 w-4 text-spectral" />
                {voices.length > 1 ? (
                  <select
                    value={selected.id}
                    onChange={(e) => setSelectedId(Number(e.target.value))}
                    className="rounded-lg border border-stroke bg-ink-800 px-2 py-1 font-hand text-xl text-ember focus:border-spectral/60 focus:outline-none"
                  >
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-hand text-xl leading-none text-ember">{selected.name}</span>
                )}
              </div>
              <div className="mt-1 font-mono text-[10px] text-parchment-dim">
                {scans.length} scan{scans.length === 1 ? '' : 's'} · profile strength
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-stroke bg-ink-900/80 px-4 py-3 backdrop-blur">
            <input
              value={newVoiceName}
              onChange={(e) => setNewVoiceName(e.target.value)}
              placeholder="Name the voice…"
              className="w-40 rounded-lg border border-stroke bg-ink-800 px-3 py-2 font-hand text-lg text-ember placeholder:text-parchment-dim/40 focus:border-spectral/60 focus:outline-none"
            />
            <button
              disabled={!newVoiceName.trim() || createVoice.isPending}
              onClick={() => createVoice.mutate({ name: newVoiceName.trim() })}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> Create profile
            </button>
          </div>
        )}
      </motion.div>

      {/* 2. Drop zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
      >
        <DropZone onFiles={onFiles} disabled={!selected || uploadMutation.isPending} />
        {!selected && (
          <p className="mt-2 text-center font-hand text-lg text-ember">
            create a voice profile above to begin feeding the vault
          </p>
        )}
        {uploadingCount > 0 && (
          <p className="mt-2 text-center font-mono text-[11px] text-spectral">
            uploading {uploadingCount} file{uploadingCount === 1 ? '' : 's'}…
          </p>
        )}
      </motion.div>

      {/* 3. Processing pipeline strip */}
      {(hasActive || uploadingCount > 0) && (
        <PipelineStrip
          scans={scans.slice(0, 9).map((s) => ({
            id: s.id,
            fileName: s.fileName,
            status: s.status,
          }))}
        />
      )}

      {/* 4 + 5. Gallery + Voice vector panel */}
      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-parchment-dim">Sample Gallery</h2>
            <span className="font-mono text-[10px] text-parchment-dim">
              {galleryScans.length} pages
            </span>
          </div>
          {scansQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-56 animate-pulse rounded-xl bg-ink-800" />
              ))}
            </div>
          ) : galleryScans.length === 0 ? (
            <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-stroke py-16 text-center">
              <img src="/vector-vault-illustration.svg" alt="" className="h-36 w-auto opacity-60" />
              <p className="font-display text-2xl text-parchment">
                The vault is quiet. Add the first page.
              </p>
            </div>
          ) : (
            <ScanGallery
              scans={galleryScans}
              onRefresh={() => {
                if (selected)
                  void utils.voices.listScans.invalidate({ voiceProfileId: selected.id })
              }}
            />
          )}
        </section>

        {selected && (
          <aside className="space-y-5">
            <VoiceVectorPanel
              profileName={selected.name}
              profileId={selected.id}
              scanCount={scans.length}
              styleSummary={selected.styleSummary}
            />
          </aside>
        )}
      </div>

      {/* 6. Footer row */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-stroke bg-ink-900/80 p-5 backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-parchment-dim">Storage</span>
            <span className="font-mono text-[10px] text-parchment-dim">
              {limits?.maxScansPerVoiceProfile === null
                ? 'Unlimited scans'
                : `${limits?.maxScansPerVoiceProfile ?? 20} max / profile`}{' '}
              · {scans.length} stored
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-spectral to-spectral-deep"
              initial={{ width: 0 }}
              animate={{
                width:
                  limits?.maxScansPerVoiceProfile != null
                    ? `${Math.min(100, (scans.length / limits.maxScansPerVoiceProfile) * 100)}%`
                    : '18%',
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-2 font-mono text-[10px] text-parchment-dim/70">
            {tier === 'memory'
              ? 'Memory tier · upgrade for deeper archives'
              : `${tier.charAt(0).toUpperCase() + tier.slice(1)} tier`}
          </p>
        </div>
        <div className="flex items-center rounded-xl border border-stroke bg-ink-900/80 p-5 backdrop-blur">
          <p className="font-hand text-xl leading-snug text-ember">
            “Letters with full sentences teach the voice faster than signatures.”
          </p>
        </div>
      </div>
    </div>
  )
}
