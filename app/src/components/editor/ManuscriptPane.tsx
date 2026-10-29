import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Expand, Minimize2, Quote, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToolbarAction = 'rewrite' | 'expand' | 'shorten' | 'voice'

export interface SelectionInfo {
  text: string
  top: number
  left: number
}

interface Props {
  chapterId: number
  title: string
  content: string
  /** Bump to force the paper to re-render from props (streaming rewrite). */
  revision: number
  rewriting: boolean
  saving: boolean
  onSave: (content: string) => void
  onSelectionChange: (sel: SelectionInfo | null) => void
  onToolbarAction: (action: ToolbarAction, selectedText: string) => void
}

/** Manuscript paper surface: parchment texture, ink text, editable prose. */
export default function ManuscriptPane({
  chapterId,
  title,
  content,
  revision,
  rewriting,
  saving,
  onSave,
  onSelectionChange,
  onToolbarAction,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [toolbar, setToolbar] = useState<SelectionInfo | null>(null)
  const [annotateHover, setAnnotateHover] = useState(false)

  const paragraphs = useMemo(
    () => content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    [content],
  )

  const clearSelection = useCallback(() => {
    setToolbar(null)
    onSelectionChange(null)
  }, [onSelectionChange])

  // Capture text selection inside the paper.
  useEffect(() => {
    const handler = () => {
      const paper = paperRef.current
      const wrap = wrapRef.current
      if (!paper || !wrap) return
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        clearSelection()
        return
      }
      const text = sel.toString().trim()
      if (!text || !paper.contains(sel.anchorNode)) {
        return
      }
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const wrapRect = wrap.getBoundingClientRect()
      const info: SelectionInfo = {
        text,
        top: rect.top - wrapRect.top + wrap.scrollTop,
        left: rect.left - wrapRect.left + rect.width / 2,
      }
      setToolbar(info)
      onSelectionChange(info)
    }
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [clearSelection, onSelectionChange])

  const handleInput = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const paper = paperRef.current
      if (!paper) return
      onSave(paper.innerText.replace(/\n{3,}/g, '\n\n').trim())
    }, 1200)
  }

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    },
    [],
  )

  const annotationParagraph = paragraphs.length > 2 ? 1 : -1

  return (
    <div ref={wrapRef} className="relative h-full overflow-y-auto">
      {/* Paper sheet */}
      <motion.div
        key={`${chapterId}:${revision}`}
        initial={false}
        className="relative mx-auto my-8 max-w-2xl rounded-sm border border-[#E2D7BE] shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
        style={{
          backgroundColor: '#F6F1E4',
          backgroundImage: 'url(/texture-paper.png)',
          backgroundRepeat: 'repeat',
        }}
      >
        {/* Rewrite shimmer sweep */}
        <AnimatePresence>
          {rewriting && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-transparent via-[#8B7CFF]/25 to-transparent"
            />
          )}
        </AnimatePresence>

        {/* Saving ink dot */}
        <div className="absolute right-4 top-4 z-10 font-mono text-[10px] text-[#2A2418]/50">
          {saving ? 'inking…' : ''}
        </div>

        {/* Margin annotation */}
        {annotationParagraph >= 0 && (
          <div
            className="absolute -left-2 top-[22rem] hidden w-36 -translate-x-full xl:block"
            onMouseEnter={() => setAnnotateHover(true)}
            onMouseLeave={() => setAnnotateHover(false)}
          >
            <div className="font-hand text-lg leading-tight text-ember">
              *this line is very {title.split(' ')[0] === 'Chapter' ? 'her' : 'Eleanor'}
            </div>
            <div className="ml-6 mt-1 h-px w-16 bg-ember/50" />
          </div>
        )}

        <div className="px-10 py-12 sm:px-14">
          <h2 className="mb-8 font-display text-[32px] font-semibold italic leading-tight text-[#2A2418]">
            {title}
          </h2>

          <div
            ref={paperRef}
            contentEditable={!rewriting}
            suppressContentEditableWarning
            onInput={handleInput}
            spellCheck={false}
            className={cn(
              'min-h-[40dvh] font-display text-[19px] leading-[1.75] text-[#2A2418] outline-none',
              rewriting && 'select-none',
            )}
          >
            {paragraphs.map((p, i) => (
              <p
                key={`${chapterId}-${i}`}
                className={cn(
                  'mb-6 transition-colors duration-200',
                  i === 0 &&
                    'first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-[64px] first-letter:font-semibold first-letter:leading-[0.85] first-letter:text-[#2A2418]',
                  annotateHover && i === annotationParagraph && 'rounded bg-ember/20',
                )}
              >
                {p}
              </p>
            ))}
            {paragraphs.length === 0 && (
              <p className="italic text-[#2A2418]/40">This chapter is still blank ink…</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Floating selection toolbar */}
      <AnimatePresence>
        {toolbar && !rewriting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 4 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            style={{ top: toolbar.top - 56, left: toolbar.left }}
            className="absolute z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-stroke bg-ink-900/95 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(139,124,255,0.15)] backdrop-blur"
          >
            {(
              [
                { id: 'rewrite', label: 'Rewrite', icon: Sparkles },
                { id: 'expand', label: 'Expand', icon: Expand },
                { id: 'shorten', label: 'Shorten', icon: Minimize2 },
                { id: 'voice', label: 'More her voice', icon: Quote },
              ] as const
            ).map((b) => (
              <button
                key={b.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onToolbarAction(b.id, toolbar.text)
                  window.getSelection()?.removeAllRanges()
                  clearSelection()
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors',
                  b.id === 'voice'
                    ? 'bg-ember/15 text-ember hover:bg-ember/25'
                    : 'text-parchment hover:bg-spectral/20 hover:text-spectral',
                )}
              >
                <b.icon className="h-3.5 w-3.5" />
                {b.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
