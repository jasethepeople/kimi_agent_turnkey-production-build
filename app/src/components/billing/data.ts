import type { TierId } from '@contracts/tiers'

export type TierAccent = 'ember' | 'spectral' | 'verdant'

export interface TierDisplay {
  id: TierId
  name: string
  tagline: string
  accent: TierAccent
  monthlyPrice: number
  /** Effective monthly price when billed yearly ("2 months free"). */
  yearlyMonthly: number
  cta: string
  featured?: boolean
  cardFeatures: { label: string; value: string }[]
}

export const TIER_DISPLAY: Record<TierId, TierDisplay> = {
  memory: {
    id: 'memory',
    name: 'The Memory Tier',
    tagline: 'a first hello again',
    accent: 'ember',
    monthlyPrice: 0,
    yearlyMonthly: 0,
    cta: 'Start Free',
    cardFeatures: [
      { label: 'Projects', value: '1' },
      { label: 'Scans', value: '20' },
      { label: 'Generation', value: '1 novella test (15k words)' },
      { label: 'Style control', value: 'Basic' },
      { label: 'Voice profiles', value: '1' },
      { label: 'Export', value: 'Watermarked PDF' },
      { label: 'Queue', value: 'Standard' },
      { label: 'Storage', value: '—' },
    ],
  },
  legacy: {
    id: 'legacy',
    name: 'The Legacy Tier',
    tagline: 'the whole novel',
    accent: 'spectral',
    monthlyPrice: 29,
    yearlyMonthly: 24,
    cta: 'Go Legacy',
    featured: true,
    cardFeatures: [
      { label: 'Projects', value: '5 active' },
      { label: 'Scans', value: 'Unlimited' },
      { label: 'Generation', value: 'Full novels, 80k+ words, one sweep' },
      { label: 'Style control', value: 'Advanced style-slider calibration' },
      { label: 'Voice profiles', value: '1 per project' },
      { label: 'Export', value: 'EPUB + PDF' },
      { label: 'Queue', value: 'Standard' },
      { label: 'Storage', value: '—' },
    ],
  },
  studio: {
    id: 'studio',
    name: 'The Studio Tier',
    tagline: 'a house of voices',
    accent: 'verdant',
    monthlyPrice: 99,
    yearlyMonthly: 82,
    cta: 'Build Your Studio',
    cardFeatures: [
      { label: 'Projects', value: 'Unlimited' },
      { label: 'Scans', value: 'Unlimited' },
      { label: 'Generation', value: 'Full novels + parallel multi-agent chapter swarm' },
      { label: 'Style control', value: 'Advanced + per-chapter profiles' },
      { label: 'Voice profiles', value: 'Multi-author blending' },
      { label: 'Export', value: 'EPUB, PDF + custom domain exports' },
      { label: 'Queue', value: 'Priority' },
      { label: 'Storage', value: 'Dedicated vector vault' },
    ],
  },
}

export const TIER_IDS: TierId[] = ['memory', 'legacy', 'studio']

export const accentText: Record<TierAccent, string> = {
  ember: 'text-ember',
  spectral: 'text-spectral',
  verdant: 'text-verdant',
}

export const accentHover: Record<TierAccent, string> = {
  ember: 'hover:border-ember/70 hover:shadow-[0_0_30px_rgba(232,161,92,0.25)]',
  spectral: 'hover:border-spectral/80 hover:shadow-[0_0_36px_rgba(139,124,255,0.35)]',
  verdant: 'hover:border-verdant/70 hover:shadow-[0_0_30px_rgba(92,201,138,0.25)]',
}

export const accentPill: Record<TierAccent, string> = {
  ember: 'border-ember/50 bg-ember/10 text-ember',
  spectral: 'border-spectral/50 bg-spectral/10 text-spectral',
  verdant: 'border-verdant/50 bg-verdant/10 text-verdant',
}

export interface MatrixCell {
  kind: 'check' | 'dash' | 'value'
  value?: string
}

export interface MatrixRow {
  label: string
  cells: [MatrixCell, MatrixCell, MatrixCell]
}

export interface MatrixGroup {
  title: string
  rows: MatrixRow[]
}

const c = (): MatrixCell => ({ kind: 'check' })
const d = (): MatrixCell => ({ kind: 'dash' })
const v = (value: string): MatrixCell => ({ kind: 'value', value })

export const FEATURE_MATRIX: MatrixGroup[] = [
  {
    title: 'Projects & Library',
    rows: [
      { label: 'Active projects', cells: [v('1'), v('5'), v('Unlimited')] },
      { label: 'Archived projects', cells: [v('1'), v('5'), v('Unlimited')] },
      { label: 'Manuscript revisions kept', cells: [v('3'), v('50'), v('Unlimited')] },
    ],
  },
  {
    title: 'Voice Engine',
    rows: [
      { label: 'Handwriting scans per profile', cells: [v('20'), v('Unlimited'), v('Unlimited')] },
      { label: 'Vectorization depth', cells: [v('Basic strokes'), v('Full glyph map'), v('Glyph + pressure')] },
      { label: 'Voice profiles', cells: [v('1'), v('1 per project'), v('Unlimited')] },
      { label: 'Multi-author voice blending', cells: [d(), d(), c()] },
    ],
  },
  {
    title: 'Generation',
    rows: [
      { label: 'Word cap per generation', cells: [v('15,000'), v('80,000+'), v('200,000')] },
      { label: 'Blueprint agent', cells: [c(), c(), c()] },
      { label: 'Swarm parallelism', cells: [d(), d(), c()] },
      { label: 'Priority queue', cells: [d(), d(), c()] },
    ],
  },
  {
    title: 'Editing',
    rows: [
      { label: 'Style slider range', cells: [v('Fixed 2.5'), v('1.0 – 5.0'), v('1.0 – 5.0')] },
      { label: 'Targeted rewrites', cells: [v('3 / chapter'), v('Unlimited'), v('Unlimited')] },
      { label: 'Chapter-level voice profiles', cells: [d(), d(), c()] },
    ],
  },
  {
    title: 'Export & Publishing',
    rows: [
      { label: 'EPUB export', cells: [d(), c(), c()] },
      { label: 'PDF export', cells: [v('Watermarked'), c(), c()] },
      { label: 'Custom domain exports', cells: [d(), d(), c()] },
      { label: 'Print-ready typesetting', cells: [d(), c(), c()] },
    ],
  },
  {
    title: 'Support & Storage',
    rows: [
      { label: 'Support', cells: [v('Community'), v('Email, 48h'), v('Priority, 4h')] },
      { label: 'Dedicated vector vault', cells: [d(), d(), c()] },
      { label: 'Data retention', cells: [v('90 days'), v('While subscribed'), v('Lifetime archive')] },
    ],
  },
]

export const PRICING_FAQ = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. There are no contracts and no cancellation séances. Cancel from your Billing page in two clicks — you keep full access until the end of the current billing period, and every manuscript you have written remains yours forever, in every export format your tier allowed.',
  },
  {
    q: 'What happens to my voice profiles if I downgrade?',
    a: 'Nothing is deleted. Profiles above your new tier limit are placed in a read-only archive: their handwriting vectors stay preserved in the vault, and they wake back up the moment you upgrade again. We never discard a voice you trusted us with.',
  },
  {
    q: 'Do you offer plans for estates and publishers?',
    a: 'Yes. Estate and publisher plans add rights management, multi-seat access for family members or editors, and chain-of-custody documentation for every generated page. Write to estates@ghostwriter.studio and we will craft something bespoke.',
  },
  {
    q: 'Is my handwriting data private?',
    a: 'Completely. Scans are encrypted at rest, voice vectors are stored in an isolated vault per account, and we never train shared models on your loved ones\u2019 hands. You can purge every trace — scans, vectors, and manuscripts — at any time from the Archive Vault.',
  },
]
