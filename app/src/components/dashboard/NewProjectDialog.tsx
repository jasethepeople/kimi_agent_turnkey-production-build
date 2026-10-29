import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Plus, Lightbulb } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { trpc } from '@/providers/trpc'

const GENRES = ['Memoir', 'Literary Fiction', 'Mystery', 'Romance', 'Historical', 'Fantasy', 'Sci-Fi', 'Other']

interface NewProjectDialogProps {
  voices: { id: number; name: string }[]
  onCreated: () => void
}

export default function NewProjectDialog({ voices, onCreated }: NewProjectDialogProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState(GENRES[0])
  const [voiceId, setVoiceId] = useState<number | null>(voices[0]?.id ?? null)
  const [error, setError] = useState<string | null>(null)

  const create = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      onCreated()
      setOpen(false)
      setTitle('')
      navigate(`/premise?project=${project.id}`)
    },
    onError: (e) => setError(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)] transition-transform hover:scale-[1.03]"
        >
          <Plus className="h-4 w-4" /> New Project
        </motion.button>
      </DialogTrigger>
      <DialogContent className="border-stroke bg-ink-900 text-parchment">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Begin a new manuscript</DialogTitle>
          <DialogDescription className="text-parchment-dim">
            A blank page, a borrowed hand. Configure the seed — the Premise Studio does the rest.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-parchment-dim">
              Project name
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Letters You Left"
              className="w-full rounded-lg border border-stroke bg-ink-800 px-3 py-2.5 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-spectral/60 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-parchment-dim">
              Genre
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={
                    genre === g
                      ? 'rounded-full border border-spectral bg-spectral/15 px-3 py-1.5 text-xs text-spectral'
                      : 'rounded-full border border-stroke bg-ink-800 px-3 py-1.5 text-xs text-parchment-dim hover:border-spectral/40 hover:text-parchment'
                  }
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-parchment-dim">
              Voice profile
            </label>
            {voices.length === 0 ? (
              <p className="font-hand text-lg text-ember">
                no voices yet — visit the Archive Vault first
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {voices.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVoiceId(v.id)}
                    className={
                      voiceId === v.id
                        ? 'rounded-full border border-ember/60 bg-ember/10 px-3 py-1.5 font-hand text-base text-ember'
                        : 'rounded-full border border-stroke bg-ink-800 px-3 py-1.5 font-hand text-base text-parchment-dim hover:border-ember/40'
                    }
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-blood/40 bg-blood/10 px-3 py-2 text-xs text-blood">
              {error}
            </p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!title.trim() || create.isPending}
            onClick={() => {
              setError(null)
              create.mutate({ title: title.trim(), genre })
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Lightbulb className="h-4 w-4" />
            {create.isPending ? 'Opening the studio…' : 'Open Premise Studio'}
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
