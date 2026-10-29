import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, RefreshCw, Trash2, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface GalleryScan {
  id: string
  fileName: string
  url: string
  status: 'uploaded' | 'processing' | 'vectorized' | 'failed' | 'sample'
  type: 'Letter' | 'Journal' | 'Postcard' | 'Note'
  isDemo: boolean
}

const TYPE_COLORS: Record<GalleryScan['type'], string> = {
  Letter: 'border-ember/40 bg-ember/10 text-ember',
  Journal: 'border-spectral/40 bg-spectral/10 text-spectral',
  Postcard: 'border-verdant/40 bg-verdant/10 text-verdant',
  Note: 'border-stroke bg-ink-800 text-parchment-dim',
}

const TRAITS = [
  'looped ascenders',
  'em-dash habit',
  'cadence: waltz-like',
  'slanted terminals',
  'generous margins',
  'ink: iron gall',
]

function StatusIcon({ status }: { status: GalleryScan['status'] }) {
  if (status === 'vectorized' || status === 'sample')
    return <CheckCircle2 className="h-3.5 w-3.5 text-verdant" />
  if (status === 'failed') return <XCircle className="h-3.5 w-3.5 text-blood" />
  return <Loader2 className="h-3.5 w-3.5 animate-spin text-spectral" />
}

/** Vector overlay: spectral stroke paths drawn over the scan. */
function VectorOverlay() {
  const paths = [
    'M20,60 C60,30 90,90 130,55 S200,40 240,70',
    'M25,110 C70,85 110,135 160,105 S230,95 265,120',
    'M30,160 C80,140 120,185 170,155 S235,145 270,170',
    'M35,210 C75,190 130,235 180,205 S240,195 268,215',
  ]
  return (
    <svg
      viewBox="0 0 290 250"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
    >
      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke="#8B7CFF"
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.85 }}
          transition={{ duration: 1.5, delay: i * 0.2, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(139,124,255,0.8))' }}
        />
      ))}
    </svg>
  )
}

interface ScanGalleryProps {
  scans: GalleryScan[]
  onRefresh: () => void
}

export default function ScanGallery({ scans, onRefresh }: ScanGalleryProps) {
  const [preview, setPreview] = useState<GalleryScan | null>(null)
  const [showVectors, setShowVectors] = useState(true)

  return (
    <>
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 2xl:columns-4">
        {scans.map((scan, i) => (
          <motion.div
            key={scan.id}
            initial={{ opacity: 0, y: 30, rotate: i % 2 === 0 ? -1.5 : 1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.06 * (i % 12), duration: 0.5, ease: 'easeOut' }}
            whileHover={{ y: -4 }}
            className="group relative mb-5 break-inside-avoid overflow-hidden rounded-xl border border-stroke bg-ink-900"
          >
            <div className="relative overflow-hidden">
              <img
                src={scan.url}
                alt={scan.fileName}
                className="w-full object-cover sepia-[0.35] transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundImage: 'url(/texture-paper.png)' }}
                loading="lazy"
              />
              {/* hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink-950/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-250 group-hover:opacity-100">
                <button
                  onClick={() => {
                    setPreview(scan)
                    setShowVectors(true)
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-spectral px-3 py-1.5 text-xs font-medium text-white"
                >
                  <Eye className="h-3 w-3" /> Preview
                </button>
                {!scan.isDemo && (
                  <>
                    <button
                      onClick={onRefresh}
                      title="Re-analyze"
                      className="rounded-full border border-stroke bg-ink-800 p-1.5 text-parchment hover:border-spectral/60"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      disabled
                      title="Delete (coming soon)"
                      className="cursor-not-allowed rounded-full border border-stroke bg-ink-800 p-1.5 text-parchment-dim/50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
              {scan.isDemo && (
                <span className="absolute left-2 top-2 rounded-full bg-ink-950/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-parchment-dim backdrop-blur">
                  Sample
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <span className="truncate font-mono text-[11px] text-parchment">{scan.fileName}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider',
                    TYPE_COLORS[scan.type],
                  )}
                >
                  {scan.type}
                </span>
                <StatusIcon status={scan.status} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox preview */}
      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl border-stroke bg-ink-900 text-parchment">
          <DialogTitle className="font-display text-xl">{preview?.fileName}</DialogTitle>
          {preview && (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg border border-stroke">
                <img
                  src={preview.url}
                  alt={preview.fileName}
                  className="w-full sepia-[0.25]"
                />
                {showVectors && <VectorOverlay />}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {TRAITS.slice(0, 4 + (preview.id.length % 3)).map((t, i) => (
                    <motion.span
                      key={t}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + i * 0.12 }}
                      className="rounded-full border border-spectral/40 bg-spectral/10 px-2.5 py-1 font-hand text-base text-spectral"
                    >
                      {t}
                    </motion.span>
                  ))}
                </div>
                <button
                  onClick={() => setShowVectors((v) => !v)}
                  className="shrink-0 rounded-full border border-stroke px-3 py-1.5 font-mono text-[10px] text-parchment-dim hover:border-spectral/60 hover:text-parchment"
                >
                  {showVectors ? 'Hide vector overlay' : 'Show vector overlay'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
