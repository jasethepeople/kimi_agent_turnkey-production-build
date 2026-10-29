import { Fragment, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Feather, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LOGIN_PATH } from '@/const'
import { trpc } from '@/providers/trpc'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  FEATURE_MATRIX,
  PRICING_FAQ,
  TIER_DISPLAY,
  TIER_IDS,
  accentHover,
  accentPill,
  accentText,
} from '@/components/billing/data'
import type { MatrixCell } from '@/components/billing/data'

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number]

function Header() {
  const title = 'Plans for every kind of remembrance.'
  return (
    <div className="mx-auto max-w-3xl text-center">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: easeOut }}
        className="font-hand text-2xl text-ember"
      >
        choose how the story continues
      </motion.p>
      <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-parchment md:text-[64px]">
        {title.split(' ').map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i + 0.15, duration: 0.7, ease: easeOut }}
            className="mr-[0.28em] inline-block"
          >
            {word}
          </motion.span>
        ))}
      </h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="mt-5 text-parchment-dim"
      >
        Start free. Upgrade when the story grows.
      </motion.p>
    </div>
  )
}

function BillingToggle({
  yearly,
  onChange,
}: {
  yearly: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="mt-12 flex items-center justify-center gap-4">
      <div className="relative flex rounded-full border border-stroke bg-ink-900 p-1">
        {(['monthly', 'yearly'] as const).map((mode) => {
          const active = (mode === 'yearly') === yearly
          return (
            <button
              key={mode}
              onClick={() => onChange(mode === 'yearly')}
              className={cn(
                'relative z-10 rounded-full px-5 py-2 text-sm capitalize transition-colors',
                active ? 'text-white' : 'text-parchment-dim hover:text-parchment',
              )}
            >
              {active && (
                <motion.span
                  layoutId="billing-toggle-thumb"
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-spectral to-spectral-deep"
                />
              )}
              {mode}
            </button>
          )
        })}
      </div>
      <span
        className={cn(
          'rounded-full border border-ember/50 bg-ember/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ember transition-opacity',
          yearly ? 'opacity-100' : 'opacity-40',
        )}
      >
        2 months free
      </span>
    </div>
  )
}

function TierCards({ yearly }: { yearly: boolean }) {
  // Consume the tier catalog from the backend; display prices are canonical
  // constants, so the page degrades gracefully when logged out.
  const catalog = trpc.tiers.listTierLimits.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="mt-14 grid items-stretch gap-8 md:grid-cols-3">
      {TIER_IDS.map((id, i) => {
        const t = TIER_DISPLAY[id]
        const price = yearly ? t.yearlyMonthly : t.monthlyPrice
        const serverTier = catalog.data?.tiers.find((x) => x.id === id)
        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 * i + 0.2, duration: 0.7, ease: easeOut }}
            whileHover={{ y: -6 }}
            className={cn(
              'relative flex flex-col rounded-xl border bg-ink-900/80 p-8 backdrop-blur transition-shadow',
              t.featured
                ? 'border-spectral/70 shadow-[0_0_44px_rgba(139,124,255,0.32)] md:scale-[1.04]'
                : 'border-stroke',
              accentHover[t.accent],
            )}
          >
            {t.featured && (
              <motion.span
                aria-hidden
                animate={{ opacity: [0.25, 0.7, 0.25] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute inset-0 rounded-xl border border-spectral/60 shadow-[0_0_36px_rgba(139,124,255,0.4)]"
              />
            )}
            {t.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-4 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
                Most Chosen
              </span>
            )}
            <div className={cn('font-hand text-2xl', accentText[t.accent])}>
              {t.name}
            </div>
            <p className="mt-1 font-hand text-lg text-parchment-dim/80">
              “{t.tagline}”
            </p>

            <div className="mt-5 flex h-16 items-end">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${id}-${yearly}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: easeOut }}
                  className="flex items-baseline gap-2"
                >
                  <span className="font-display text-5xl font-bold text-parchment">
                    ${price}
                  </span>
                  <span className="font-mono text-xs text-parchment-dim">
                    {price === 0 ? 'forever' : '/mo'}
                  </span>
                  {yearly && price > 0 && (
                    <span className="font-mono text-xs text-ember">
                      billed yearly
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            {serverTier && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-parchment-dim/50">
                {serverTier.limits.maxProjects ?? 'Unlimited'} projects ·{' '}
                {serverTier.limits.maxWordsPerGeneration.toLocaleString()} words max
              </p>
            )}

            <ul className="mt-7 flex-1 space-y-3">
              {t.cardFeatures.map((f) => (
                <li
                  key={f.label}
                  className="group -mx-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-spectral/5"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-parchment-dim/60">
                    {f.label}
                  </span>
                  <span className="mt-0.5 block text-parchment-dim transition-colors group-hover:text-parchment">
                    {f.value}
                  </span>
                </li>
              ))}
            </ul>

            <motion.div whileTap={{ scale: 0.97 }} className="mt-8">
              <Link
                to={LOGIN_PATH}
                className={cn(
                  'block rounded-full py-3 text-center font-medium transition-colors',
                  t.featured
                    ? 'bg-gradient-to-r from-spectral to-spectral-deep text-white shadow-[0_0_24px_rgba(139,124,255,0.45)]'
                    : 'border border-parchment/25 text-parchment hover:border-current',
                  !t.featured && accentText[t.accent],
                )}
              >
                {t.cta}
              </Link>
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}

function MatrixCellView({ cell }: { cell: MatrixCell }) {
  if (cell.kind === 'check')
    return <Check className="mx-auto h-4 w-4 text-verdant" />
  if (cell.kind === 'dash')
    return <Minus className="mx-auto h-4 w-4 text-ink-700" />
  return (
    <span className="font-mono text-xs text-parchment">{cell.value}</span>
  )
}

function FeatureMatrix() {
  return (
    <div className="mx-auto mt-28 max-w-6xl">
      <h2 className="text-center font-display text-4xl font-semibold text-parchment md:text-5xl">
        Every feature, side by side
      </h2>
      <p className="mt-3 text-center text-parchment-dim">
        The full manuscript of what each tier includes.
      </p>

      <div className="mt-12 overflow-x-auto rounded-xl border border-stroke bg-ink-900/60">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-stroke">
              <th className="sticky left-0 z-10 w-[38%] bg-ink-900 p-4 font-mono text-[10px] uppercase tracking-widest text-parchment-dim">
                Feature
              </th>
              {TIER_IDS.map((id) => {
                const t = TIER_DISPLAY[id]
                return (
                  <th key={id} className="p-4 text-center">
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest',
                        accentPill[t.accent],
                      )}
                    >
                      {t.name}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {FEATURE_MATRIX.map((group, gi) => (
              <Fragment key={group.title}>
                <motion.tr
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: 0.08 * gi, duration: 0.5, ease: easeOut }}
                >
                  <td
                    colSpan={4}
                    className="sticky left-0 bg-ink-800/70 px-4 py-3 font-hand text-xl text-ember"
                  >
                    {group.title}
                  </td>
                </motion.tr>
                {group.rows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-stroke/40 transition-colors last:border-0 hover:bg-spectral/5"
                  >
                    <td className="sticky left-0 bg-ink-900 p-4 text-sm text-parchment-dim">
                      {row.label}
                    </td>
                    {row.cells.map((cell, ci) => (
                      <td key={ci} className="p-4 text-center">
                        <MatrixCellView cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Faq() {
  return (
    <div className="mx-auto mt-28 max-w-3xl">
      <h2 className="text-center font-display text-4xl font-semibold text-parchment">
        Questions from the reading room
      </h2>
      <Accordion type="single" collapsible className="mt-10">
        {PRICING_FAQ.map((item, i) => (
          <AccordionItem
            key={item.q}
            value={`faq-${i}`}
            className="border-stroke/60"
          >
            <AccordionTrigger className="py-5 text-left text-parchment hover:text-spectral hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="leading-relaxed text-parchment-dim">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

function BottomCta() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: easeOut }}
      className="mx-auto mt-28 max-w-4xl rounded-2xl border border-stroke bg-ink-900/80 px-8 py-12 text-center backdrop-blur"
    >
      <Feather className="mx-auto h-6 w-6 text-spectral" />
      <h2 className="mt-4 font-display text-3xl font-semibold text-parchment md:text-4xl">
        Not sure? Write the first 15,000 words free.
      </h2>
      <p className="mt-3 text-parchment-dim">
        One voice, one novella, no card required.
      </p>
      <motion.div whileTap={{ scale: 0.97 }} className="mt-8 inline-block">
        <Link
          to={LOGIN_PATH}
          className="rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-8 py-3.5 font-medium text-white shadow-[0_0_32px_rgba(139,124,255,0.5)] transition-transform hover:scale-[1.03]"
        >
          Start Free
        </Link>
      </motion.div>
    </motion.div>
  )
}

export default function Pricing() {
  const [yearly, setYearly] = useState(false)
  return (
    <main className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
      <Header />
      <BillingToggle yearly={yearly} onChange={setYearly} />
      <TierCards yearly={yearly} />
      <FeatureMatrix />
      <Faq />
      <BottomCta />
    </main>
  )
}
