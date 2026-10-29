import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  CreditCard,
  Globe,
  Loader2,
  Lock,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LOGIN_PATH } from '@/const'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { isUpgrade } from '@contracts/tiers'
import type { TierId } from '@contracts/tiers'
import TierBadge from '@/components/billing/TierBadge'
import UsageMeter from '@/components/billing/UsageMeter'
import PlanSwitchModal from '@/components/billing/PlanSwitchModal'
import CancelDialog from '@/components/billing/CancelDialog'
import PaymentDrawer from '@/components/billing/PaymentDrawer'
import InvoiceTable, { MOCK_INVOICES } from '@/components/billing/InvoiceTable'
import {
  TIER_DISPLAY,
  TIER_IDS,
  accentText,
} from '@/components/billing/data'

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number]

// Mock usage telemetry until a usage endpoint ships; limits come from the API.
const MOCK_USAGE = { projects: 3, wordsThisCycle: 214_000 }

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-spectral" />
      </div>
    )
  }
  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center text-center">
        <Lock className="h-8 w-8 text-spectral" />
        <h2 className="mt-4 font-display text-3xl font-semibold text-parchment">
          Sign in to view billing
        </h2>
        <p className="mt-2 text-sm text-parchment-dim">
          Your plan powers the archive — sign in to manage it.
        </p>
        <Link
          to={LOGIN_PATH}
          className="mt-6 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-6 py-2.5 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)]"
        >
          Sign in
        </Link>
      </div>
    )
  }
  return <>{children}</>
}

function CurrentPlanCard({
  tier,
  renewal,
  onCancel,
}: {
  tier: TierId
  renewal: Date | null
  onCancel: () => void
}) {
  const t = TIER_DISPLAY[tier]
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: easeOut }}
      className="rounded-2xl border border-stroke bg-ink-900/80 p-7 backdrop-blur lg:p-9"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <TierBadge tier={tier} />
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-5xl font-bold text-parchment">
              ${t.monthlyPrice}
            </span>
            <span className="font-mono text-sm text-parchment-dim">/month</span>
          </div>
          <p className="mt-2 font-mono text-xs text-parchment-dim">
            {renewal
              ? `Renews ${renewal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : tier === 'memory'
                ? 'Free forever — no renewal'
                : 'Renews Dec 1, 2025'}
          </p>
          <p className="mt-1 font-hand text-lg text-parchment-dim/80">
            “{t.tagline}” · billed monthly
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
          <a
            href="#plan-switcher"
            className="rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-6 py-2.5 text-center text-sm font-medium text-white shadow-[0_0_24px_rgba(139,124,255,0.45)] transition-transform hover:scale-[1.03]"
          >
            Change Plan
          </a>
          {tier !== 'memory' && (
            <button
              onClick={onCancel}
              className="rounded-full border border-blood/50 px-6 py-2.5 text-sm text-blood transition-colors hover:bg-blood/10"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <UsageMeter
          label="Projects"
          used={MOCK_USAGE.projects}
          limit={tier === 'memory' ? 1 : tier === 'legacy' ? 5 : null}
        />
        <UsageMeter
          label="Words this cycle"
          used={MOCK_USAGE.wordsThisCycle}
          limit={null}
          displayUsed={`${Math.round(MOCK_USAGE.wordsThisCycle / 1000)}k`}
          displayLimit="∞"
        />
        <UsageMeter
          label="Queue priority"
          used={null}
          limit={null}
          displayUsed={tier === 'studio' ? 'Priority' : 'Standard'}
          displayLimit=""
          qualitative={tier === 'studio' ? 0.9 : 0.45}
        />
      </div>
    </motion.section>
  )
}

function PlanSwitcher({
  current,
  onSelect,
}: {
  current: TierId
  onSelect: (tier: TierId) => void
}) {
  return (
    <section id="plan-switcher" className="scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold text-parchment">
        Switch plans
      </h2>
      <p className="mt-1 text-sm text-parchment-dim">
        Changes apply instantly; charges are prorated.
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {TIER_IDS.map((id, i) => {
          const t = TIER_DISPLAY[id]
          const isCurrent = id === current
          const upgrade = isUpgrade(current, id)
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: 0.1 * i, duration: 0.5, ease: easeOut }}
              className={cn(
                'relative flex flex-col rounded-xl border bg-ink-900/80 p-6 transition-shadow',
                isCurrent
                  ? 'border-verdant/60 shadow-[0_0_28px_rgba(92,201,138,0.15)]'
                  : 'border-stroke hover:border-spectral/50',
              )}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 right-4 rounded-full border border-verdant/50 bg-ink-950 px-3 py-0.5 font-mono text-[10px] uppercase tracking-widest text-verdant">
                  Current
                </span>
              )}
              <span className={cn('font-hand text-xl', accentText[t.accent])}>
                {t.name}
              </span>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold text-parchment">
                  ${t.monthlyPrice}
                </span>
                <span className="font-mono text-xs text-parchment-dim">/mo</span>
              </div>
              <ul className="mt-4 flex-1 space-y-2">
                {t.cardFeatures.slice(0, 4).map((f) => (
                  <li
                    key={f.label}
                    className="flex items-start gap-2 text-xs text-parchment-dim"
                  >
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-verdant" />
                    {f.value}
                  </li>
                ))}
              </ul>
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={isCurrent}
                onClick={() => onSelect(id)}
                className={cn(
                  'mt-5 rounded-full py-2.5 text-sm font-medium transition-all',
                  isCurrent
                    ? 'cursor-default border border-verdant/40 bg-verdant/10 text-verdant'
                    : upgrade
                      ? 'bg-gradient-to-r from-spectral to-spectral-deep text-white shadow-[0_0_20px_rgba(139,124,255,0.4)] hover:scale-[1.02]'
                      : 'border border-parchment/25 text-parchment hover:border-spectral hover:text-spectral',
                )}
              >
                {isCurrent ? 'Current plan' : upgrade ? 'Upgrade' : 'Downgrade'}
              </motion.button>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function PaymentMethodCard({ onUpdate }: { onUpdate: () => void }) {
  return (
    <section className="rounded-xl border border-stroke bg-ink-900/80 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-14 items-center justify-center rounded-lg border border-stroke bg-ink-800 font-mono text-[10px] font-semibold italic tracking-wide text-parchment">
            VISA
          </div>
          <div>
            <div className="font-mono text-sm text-parchment">
              Visa ···· 4242
            </div>
            <div className="mt-0.5 font-mono text-xs text-parchment-dim">
              Expires 12/28 · Default
            </div>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onUpdate}
          className="flex items-center gap-2 rounded-full border border-parchment/25 px-5 py-2 text-sm text-parchment transition-colors hover:border-spectral hover:text-spectral"
        >
          <CreditCard className="h-4 w-4" /> Update
        </motion.button>
      </div>
      <p className="mt-4 border-t border-stroke/50 pt-3 text-[11px] italic text-parchment-dim/60">
        Stripe-ready: card entry is stubbed pending Stripe keys — no live
        charges are processed.
      </p>
    </section>
  )
}

function StudioExtras({ tier }: { tier: TierId }) {
  if (tier === 'studio') {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: easeOut }}
        className="rounded-xl border border-verdant/40 bg-ink-900/80 p-7"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-verdant" />
          <h3 className="font-display text-xl font-semibold text-parchment">
            Studio extras
          </h3>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div>
            <div className="mb-2 flex justify-between font-mono text-xs">
              <span className="text-parchment-dim">Vector vault storage</span>
              <span className="text-verdant">41.2 GB / 500 GB</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '8.2%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: easeOut }}
                className="h-full rounded-full bg-gradient-to-r from-verdant to-spectral"
              />
            </div>
          </div>
          <div>
            <span className="font-mono text-xs text-parchment-dim">
              Custom domain export
            </span>
            <div className="mt-2 flex items-center gap-2">
              <Globe className="h-4 w-4 text-parchment-dim" />
              <input
                defaultValue="stories.ourfamily.org"
                className="w-full rounded-lg border border-stroke bg-ink-800 px-3 py-1.5 font-mono text-xs text-parchment outline-none focus:border-spectral"
              />
              <span className="whitespace-nowrap rounded-full border border-ember/50 bg-ember/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ember">
                DNS Pending
              </span>
            </div>
          </div>
          <div>
            <span className="font-mono text-xs text-parchment-dim">
              Priority queue SLA
            </span>
            <p className="mt-2 text-sm text-parchment">
              Chapters begin within{' '}
              <span className="font-mono text-verdant">90 seconds</span>, or the
              cycle is free.
            </p>
          </div>
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: easeOut }}
      className="relative overflow-hidden rounded-xl border border-stroke bg-ink-900/80 p-8"
    >
      <motion.img
        src="/swarm-illustration.svg"
        alt=""
        aria-hidden
        initial={{ opacity: 0.1 }}
        animate={{ opacity: [0.1, 0.22, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -right-8 -top-8 w-64 select-none"
      />
      <div className="relative max-w-lg">
        <p className="font-hand text-2xl text-verdant">
          your stories could run in parallel
        </p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-parchment">
          Meet The Studio Tier
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-parchment-dim">
          A multi-agent chapter swarm, voice blending across the whole family,
          a dedicated vector vault, and custom domain publishing — everything in
          the writers' room at once.
        </p>
        <Link
          to="/pricing"
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-spectral/60 px-6 py-2.5 text-sm font-medium text-spectral transition-all hover:bg-spectral/10 hover:shadow-[0_0_20px_rgba(139,124,255,0.3)]"
        >
          Explore Studio <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.section>
  )
}

function BillingInner() {
  const utils = trpc.useUtils()
  const sub = trpc.tiers.getMySubscription.useQuery(undefined, { retry: false })
  const upgrade = trpc.tiers.upgradeTier.useMutation({
    onSuccess: async () => {
      await utils.tiers.getMySubscription.invalidate()
      setSwitchTarget(null)
      setSwitchOpen(false)
    },
  })

  const [switchOpen, setSwitchOpen] = useState(false)
  const [switchTarget, setSwitchTarget] = useState<TierId | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

  const tier: TierId = useMemo(() => {
    const t = sub.data?.tier
    return t === 'legacy' || t === 'studio' ? t : 'memory'
  }, [sub.data])

  const renewal = useMemo(() => {
    const end = sub.data?.subscription.currentPeriodEnd
    return end ? new Date(end) : null
  }, [sub.data])

  const onSelect = (target: TierId) => {
    setSwitchTarget(target)
    setSwitchOpen(true)
  }

  if (sub.isLoading) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-spectral" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-4xl font-semibold text-parchment md:text-[40px]">
          Billing
        </h1>
        <p className="mt-2 text-parchment-dim">
          Your plan powers the archive.
        </p>
      </header>

      <CurrentPlanCard
        tier={tier}
        renewal={renewal}
        onCancel={() => setCancelOpen(true)}
      />

      <PlanSwitcher current={tier} onSelect={onSelect} />

      <section>
        <h2 className="mb-4 font-display text-2xl font-semibold text-parchment">
          Payment method
        </h2>
        <PaymentMethodCard onUpdate={() => setPayOpen(true)} />
      </section>

      <InvoiceTable invoices={MOCK_INVOICES} />

      <StudioExtras tier={tier} />

      <PlanSwitchModal
        open={switchOpen}
        target={switchTarget}
        current={tier}
        pending={upgrade.isPending}
        onClose={() => setSwitchOpen(false)}
        onConfirm={(t) => upgrade.mutate({ tier: t })}
      />
      <CancelDialog
        open={cancelOpen}
        pending={upgrade.isPending}
        onClose={() => setCancelOpen(false)}
        onPause={() => {
          // Retention stub — pausing will ride the Stripe schedule once wired.
          setCancelOpen(false)
        }}
        onCancel={() => upgrade.mutate({ tier: 'memory' }, {
          onSuccess: () => setCancelOpen(false),
        })}
      />
      <PaymentDrawer open={payOpen} onOpenChange={setPayOpen} />

      {sub.isError && (
        <p className="text-center text-xs text-parchment-dim/60">
          Showing The Memory Tier — subscription service is unreachable.
        </p>
      )}
    </div>
  )
}

export default function Billing() {
  return (
    <main className="mx-auto w-full max-w-5xl p-6 lg:p-10">
      <AuthGate>
        <BillingInner />
      </AuthGate>
    </main>
  )
}
