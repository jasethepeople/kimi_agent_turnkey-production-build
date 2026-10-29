import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Feather, UploadCloud, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf']
const MAX_BYTES = 50 * 1024 * 1024

export interface PendingFile {
  id: string
  file: File
  preview: string | null
  error?: string
}

interface DropZoneProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export default function DropZone({ onFiles, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [rejections, setRejections] = useState<{ id: string; name: string; reason: string }[]>([])
  const [ripples, setRipples] = useState<{ id: string; x: number; y: number }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const zoneRef = useRef<HTMLDivElement>(null)
  const dragDepth = useRef(0)

  const handleFiles = useCallback(
    (list: FileList | File[]) => {
      const accepted: File[] = []
      const rejected: { id: string; name: string; reason: string }[] = []
      for (const f of Array.from(list)) {
        if (!ACCEPTED.includes(f.type) && !/\.(jpe?g|png|tiff?|pdf)$/i.test(f.name)) {
          rejected.push({ id: crypto.randomUUID(), name: f.name, reason: 'Unsupported format' })
        } else if (f.size > MAX_BYTES) {
          rejected.push({ id: crypto.randomUUID(), name: f.name, reason: 'Over 50MB' })
        } else {
          accepted.push(f)
        }
      }
      if (rejected.length > 0) {
        setRejections((r) => [...r, ...rejected])
        window.setTimeout(() => {
          setRejections((r) => r.filter((x) => !rejected.some((y) => y.id === x.id)))
        }, 3500)
      }
      if (accepted.length > 0) onFiles(accepted)
    },
    [onFiles],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    if (disabled) return
    const rect = zoneRef.current?.getBoundingClientRect()
    if (rect) {
      const id = crypto.randomUUID()
      setRipples((r) => [
        ...r,
        { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
      ])
      window.setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 900)
    }
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="relative">
      <motion.div
        ref={zoneRef}
        onDragEnter={(e) => {
          e.preventDefault()
          dragDepth.current += 1
          setDragging(true)
        }}
        onDragLeave={() => {
          dragDepth.current -= 1
          if (dragDepth.current <= 0) setDragging(false)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        aria-label="Upload handwriting scans"
        className={cn(
          'relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed transition-colors duration-300',
          dragging
            ? 'border-solid border-spectral bg-spectral/[0.06]'
            : 'border-stroke bg-ink-900/50 hover:border-spectral/50',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        {/* radial spectral glow on drag-over */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(139,124,255,0.15), transparent 65%)',
          }}
          animate={{ opacity: dragging ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        {/* marching ants */}
        {dragging && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background:
                'repeating-linear-gradient(90deg, transparent 0 12px, rgba(139,124,255,0.35) 12px 24px)',
              mask: 'linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              padding: 2,
            }}
            animate={{ backgroundPositionX: ['0px', '24px'] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          />
        )}
        {/* ink-drop ripples at drop point */}
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              className="pointer-events-none absolute rounded-full border-2 border-spectral"
              style={{ left: r.x, top: r.y }}
              initial={{ width: 8, height: 8, x: -4, y: -4, opacity: 0.9 }}
              animate={{ width: 140, height: 140, x: -70, y: -70, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>

        <motion.div
          animate={dragging ? { y: [0, -8, 0] } : { y: 0 }}
          transition={dragging ? { repeat: Infinity, duration: 1.1, ease: 'easeInOut' } : {}}
        >
          <Feather className={cn('h-12 w-12', dragging ? 'text-spectral' : 'text-parchment-dim')} />
        </motion.div>
        <div className="text-center">
          <p className="font-display text-[28px] font-semibold text-parchment">
            {dragging ? 'Release the pages' : 'Drag handwriting scans here'}
          </p>
          <p className="mt-2 font-mono text-xs text-parchment-dim">
            or browse files · JPG, PNG, PDF, TIFF · up to 50MB each
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-stroke bg-ink-800 px-4 py-2 text-xs text-parchment transition-colors hover:border-spectral/60">
          <UploadCloud className="h-3.5 w-3.5 text-spectral" /> Browse files
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.tif,.tiff,.pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </motion.div>

      {/* rejection toasts (shake + blood border) */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-10 space-y-2">
        <AnimatePresence>
          {rejections.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: [0, -8, 8, -8, 8, 0] }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.5 }}
              className="pointer-events-auto flex items-center gap-2 rounded-lg border border-blood bg-ink-900 px-3 py-2 text-xs text-blood shadow-lg"
              title={`${r.name}: ${r.reason}`}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-[220px] truncate">
                {r.name} — {r.reason}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
