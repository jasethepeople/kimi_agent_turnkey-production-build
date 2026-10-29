import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { MoreHorizontal, PenLine, Archive, Sparkles, Trash2, Copy } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import ProgressRing from './ProgressRing'
import { genreGradient, timeAgo } from './utils'

export interface DashboardProject {
  id: number
  title: string
  genre: string | null
  status: 'draft' | 'generating' | 'complete' | 'archived'
  targetWords: number
  updatedAt: Date | string
}

const STATUS_STYLES: Record<DashboardProject['status'], { label: string; cls: string }> = {
  draft: { label: 'Drafting', cls: 'border-ember/40 bg-ember/10 text-ember' },
  generating: { label: 'Generating', cls: 'border-spectral/40 bg-spectral/10 text-spectral' },
  complete: { label: 'Complete', cls: 'border-verdant/40 bg-verdant/10 text-verdant' },
  archived: { label: 'Archived', cls: 'border-stroke bg-ink-800 text-parchment-dim' },
}

interface ProjectCardProps {
  project: DashboardProject
  index: number
  words: number
  voiceName: string | null
  onArchive: (id: number) => void
  onDelete: (id: number) => void
  onDuplicate: (project: DashboardProject) => void
}

export default function ProjectCard({
  project,
  index,
  words,
  voiceName,
  onArchive,
  onDelete,
  onDuplicate,
}: ProjectCardProps) {
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const status = STATUS_STYLES[project.status] ?? STATUS_STYLES.draft
  const percent = project.targetWords > 0 ? (words / project.targetWords) * 100 : 0

  return (
    <>
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 * index, type: 'spring', stiffness: 120, damping: 18 }}
        whileHover={{ y: -4 }}
        className="group relative overflow-hidden rounded-xl border border-stroke bg-ink-900/80 backdrop-blur transition-colors hover:border-spectral/50"
      >
        {/* Cover thumb */}
        <div
          className={cn(
            'relative h-36 overflow-hidden bg-gradient-to-br',
            genreGradient(project.genre),
          )}
          style={{
            backgroundImage: 'url(/texture-paper.png)',
            backgroundBlendMode: 'overlay',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <div className="font-display text-xl font-semibold leading-tight text-parchment">
              {project.title}
            </div>
          </div>
          <span
            className={cn(
              'absolute right-3 top-3 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider backdrop-blur',
              status.cls,
            )}
          >
            {status.label}
          </span>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full border border-stroke bg-ink-800 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-parchment-dim">
              {project.genre ?? 'Unsorted'}
            </span>
            {voiceName && (
              <span className="font-hand text-base leading-none text-ember">
                Voice: {voiceName}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-sm text-parchment">
                {words.toLocaleString('en-US')}
                <span className="text-parchment-dim"> / {project.targetWords.toLocaleString('en-US')}</span>
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-parchment-dim">
                edited {timeAgo(project.updatedAt)}
              </div>
            </div>
            <div className="relative">
              <ProgressRing percent={percent} size={52} stroke={5} />
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-parchment">
                {Math.round(Math.min(100, percent))}%
              </span>
            </div>
          </div>
        </div>

        {/* Hover quick-action overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-ink-950/70 pb-5 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <Link
              to={`/editor?project=${project.id}`}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-3.5 py-1.5 text-xs font-medium text-white shadow-[0_0_16px_rgba(139,124,255,0.4)]"
            >
              <PenLine className="h-3 w-3" /> Open Editor
            </Link>
            <Link
              to="/vault"
              className="flex items-center gap-1.5 rounded-full border border-stroke bg-ink-800 px-3.5 py-1.5 text-xs text-parchment hover:border-spectral/60"
            >
              <Archive className="h-3 w-3" /> Vault
            </Link>
            <button
              onClick={() => navigate(`/generate?project=${project.id}`)}
              className="flex items-center gap-1.5 rounded-full border border-stroke bg-ink-800 px-3.5 py-1.5 text-xs text-parchment hover:border-spectral/60"
            >
              <Sparkles className="h-3 w-3" /> Generate
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full border border-stroke bg-ink-800 p-1.5 text-parchment hover:border-spectral/60"
                  aria-label="Project actions"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-stroke bg-ink-900 text-parchment">
                <DropdownMenuItem
                  onClick={() => onDuplicate(project)}
                  className="cursor-pointer focus:bg-ink-800 focus:text-parchment"
                >
                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onArchive(project.id)}
                  className="cursor-pointer focus:bg-ink-800 focus:text-parchment"
                >
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-stroke" />
                <DropdownMenuItem
                  onClick={() => setConfirmDelete(true)}
                  className="cursor-pointer text-blood focus:bg-blood/10 focus:text-blood"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="border-stroke bg-ink-900 text-parchment">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Delete this project?</DialogTitle>
            <DialogDescription className="text-parchment-dim">
              “{project.title}” will be removed from your library. The ink, once spilled, cannot be
              gathered back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-full border border-stroke px-4 py-2 text-sm text-parchment hover:border-spectral/60"
            >
              Keep it
            </button>
            <button
              onClick={() => {
                onDelete(project.id)
                setConfirmDelete(false)
              }}
              className="rounded-full bg-blood px-4 py-2 text-sm font-medium text-white hover:bg-blood/90"
            >
              Delete project
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
