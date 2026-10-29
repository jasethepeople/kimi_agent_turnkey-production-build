import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, MoonStar, X } from 'lucide-react'

interface CancelDialogProps {
  open: boolean
  pending: boolean
  onClose: () => void
  onPause: () => void
  onCancel: () => void
}

/** Multi-step cancel flow with a retention offer. */
export default function CancelDialog({
  open,
  pending,
  onClose,
  onPause,
  onCancel,
}: CancelDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)

  const close = () => {
    setStep(1)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/80 p-6 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-stroke bg-ink-900 p-7"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-display text-2xl font-semibold text-parchment">
                {step === 1 ? 'Before you close the cover…' : 'Are you certain?'}
              </h3>
              <button
                onClick={close}
                className="text-parchment-dim transition-colors hover:text-parchment"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {step === 1 ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-parchment-dim">
                  Your voice profiles and manuscripts stay archived for 90 days,
                  but generation stops at the end of this billing period.
                </p>
                <div className="mt-5 rounded-xl border border-ember/40 bg-ember/5 p-5">
                  <div className="flex items-center gap-2 font-hand text-xl text-ember">
                    <MoonStar className="h-5 w-5" /> a gentler option
                  </div>
                  <p className="mt-2 text-sm text-parchment-dim">
                    Pause for 2 months instead? Keep every scan, vector, and
                    chapter untouched — no charges until you return.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={pending}
                    onClick={onPause}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-ember/60 py-2.5 text-sm font-medium text-ember transition-colors hover:bg-ember/10 disabled:opacity-60"
                  >
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Pause for 2 months
                  </motion.button>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="mt-4 w-full text-center text-xs text-parchment-dim/70 underline-offset-2 transition-colors hover:text-blood hover:underline"
                >
                  No thanks — continue to cancel
                </button>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-relaxed text-parchment-dim">
                  Cancelling moves you to{' '}
                  <span className="text-ember">The Memory Tier</span> at the end
                  of the current period. Extra projects become read-only; nothing
                  is deleted.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={close}
                    className="flex-1 rounded-full border border-parchment/25 py-2.5 text-sm text-parchment transition-colors hover:border-parchment/60"
                  >
                    Keep my plan
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={pending}
                    onClick={onCancel}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-blood/60 bg-blood/10 py-2.5 text-sm font-medium text-blood transition-colors hover:bg-blood/20 disabled:opacity-60"
                  >
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm cancel
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
