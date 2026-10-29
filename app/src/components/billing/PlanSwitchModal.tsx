import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Loader2, X } from 'lucide-react'
import { TIER_DISPLAY, accentText } from './data'
import type { TierId } from '@contracts/tiers'
import { isUpgrade } from '@contracts/tiers'

interface PlanSwitchModalProps {
  open: boolean
  target: TierId | null
  current: TierId
  pending: boolean
  onClose: () => void
  onConfirm: (tier: TierId) => void
}

function proration(current: TierId, target: TierId) {
  const from = TIER_DISPLAY[current].monthlyPrice
  const to = TIER_DISPLAY[target].monthlyPrice
  if (to === from) return { today: 0, note: 'No charge today.' }
  if (isUpgrade(current, target)) {
    // Mock proration: remaining 18 days of a 30-day cycle.
    const today = Math.round(((to - from) * 18) / 30 * 100) / 100
    return { today, note: `Prorated for the 18 days left in this cycle.` }
  }
  return {
    today: 0,
    note: `A credit of $${((from - to) * 18 / 30).toFixed(2)} applies to your next invoice.`,
  }
}

export default function PlanSwitchModal({
  open,
  target,
  current,
  pending,
  onClose,
  onConfirm,
}: PlanSwitchModalProps) {
  const t = target ? TIER_DISPLAY[target] : null
  const pro = target ? proration(current, target) : null
  const upgrading = target ? isUpgrade(current, target) : false

  return (
    <AnimatePresence>
      {open && t && pro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/80 p-6 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-stroke bg-ink-900 p-7 shadow-[0_0_60px_rgba(139,124,255,0.15)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-hand text-xl text-ember">
                  {upgrading ? 'the story grows' : 'a quieter shelf'}
                </p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-parchment">
                  {upgrading ? 'Upgrade' : 'Switch'} to {t.name}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-parchment-dim transition-colors hover:text-parchment"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-lg border border-stroke bg-ink-800/70 px-4 py-3 font-mono text-xs text-parchment-dim">
              <span className={accentText[TIER_DISPLAY[current].accent]}>
                {TIER_DISPLAY[current].name}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className={accentText[t.accent]}>{t.name}</span>
            </div>

            <div className="mt-5 space-y-2 border-t border-stroke/70 pt-5">
              <div className="flex justify-between font-mono text-sm">
                <span className="text-parchment-dim">
                  Due today{upgrading ? ' (prorated)' : ''}
                </span>
                <span className="text-parchment">
                  {pro.today > 0 ? `+$${pro.today.toFixed(2)}` : '$0.00'}
                </span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-parchment-dim">Then, monthly</span>
                <span className="text-parchment">
                  ${t.monthlyPrice.toFixed(2)}/mo
                </span>
              </div>
              <p className="pt-1 text-xs text-parchment-dim/80">{pro.note}</p>
              <p className="text-[11px] italic text-parchment-dim/60">
                Stripe-ready checkout — live charges are stubbed until Stripe
                keys are configured.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-full border border-parchment/25 py-2.5 text-sm text-parchment transition-colors hover:border-parchment/60"
              >
                Keep {TIER_DISPLAY[current].name}
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={pending}
                onClick={() => target && onConfirm(target)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-spectral to-spectral-deep py-2.5 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)] disabled:opacity-60"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm {upgrading ? 'Upgrade' : 'Switch'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
