import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const LINE_COUNT = 9

const ENHANCED =
  'A lighthouse keeper on a decaying northern coast discovers a bundle of letters written in his late wife’s unmistakable hand — each one describing events that have not happened yet. As the predictions begin to come true, he must decide whether her words are warnings to obey or a story he is being written into. Three acts: the finding, the following, the reckoning with whoever — or whatever — has been holding the pen.'

export default function PremiseEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [enhancing, setEnhancing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const enhance = () => {
    if (enhancing) return
    setEnhancing(true)
    onChange('')
    let i = 0
    timerRef.current = setInterval(() => {
      i += 1
      onChange(ENHANCED.slice(0, i))
      if (i >= ENHANCED.length) {
        if (timerRef.current) clearInterval(timerRef.current)
        setEnhancing(false)
      }
    }, 12)
  }

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <label className="text-sm font-medium text-parchment">Core Premise &amp; Plot Points</label>
        <button
          type="button"
          onClick={enhance}
          disabled={enhancing}
          className="flex items-center gap-1.5 rounded-full border border-stroke px-3 py-1.5 text-xs text-parchment-dim transition-colors hover:border-spectral/60 hover:text-spectral disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {enhancing ? 'Channeling…' : 'Enhance with AI'}
        </button>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-stroke bg-[#F6F1E4] shadow-[inset_0_2px_12px_rgba(42,36,24,0.12)] transition-shadow focus-within:border-spectral focus-within:shadow-[0_0_0_3px_rgba(139,124,255,0.25),inset_0_2px_12px_rgba(42,36,24,0.12)]">
        {/* ruled lines draw in on mount */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 bottom-0 px-5 pt-4">
          {Array.from({ length: LINE_COUNT }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.03 * i, duration: 0.35, ease: 'easeOut' }}
              className="h-[34px] origin-left border-b border-[#2A2418]/15"
            />
          ))}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={LINE_COUNT}
          spellCheck={false}
          placeholder="A lighthouse keeper discovers letters written by his late wife that describe events that haven't happened yet…"
          className="relative z-10 block min-h-[180px] w-full resize-y bg-transparent px-5 pt-4 pb-4 font-display text-xl italic leading-[34px] text-[#2A2418] placeholder:text-[#2A2418]/35 focus:outline-none"
        />
      </div>
      <div className="mt-2 flex justify-end font-mono text-[11px] text-parchment-dim">
        {value.length.toLocaleString()} chars
      </div>
    </section>
  )
}
