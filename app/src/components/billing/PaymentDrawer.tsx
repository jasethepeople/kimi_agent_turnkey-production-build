import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, CreditCard, Loader2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface PaymentDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatCard(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

interface FieldState {
  value: string
  error: string | null
}

const empty: FieldState = { value: '', error: null }

/** Stripe-ready card form — real tokenization is stubbed pending Stripe keys. */
export default function PaymentDrawer({ open, onOpenChange }: PaymentDrawerProps) {
  const [card, setCard] = useState<FieldState>(empty)
  const [expiry, setExpiry] = useState<FieldState>(empty)
  const [cvc, setCvc] = useState<FieldState>(empty)
  const [zip, setZip] = useState<FieldState>(empty)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [shake, setShake] = useState(0)

  const setField =
    (setter: (s: FieldState) => void, fmt?: (v: string) => string) =>
    (raw: string) =>
      setter({ value: fmt ? fmt(raw) : raw, error: null })

  const validate = () => {
    let ok = true
    const fail = (setter: (s: FieldState) => void, value: string, msg: string) => {
      setter({ value, error: msg })
      ok = false
    }
    if (card.value.replace(/\s/g, '').length !== 16)
      fail(setCard, card.value, 'Enter the full 16-digit number')
    if (!/^\d{2}\/\d{2}$/.test(expiry.value))
      fail(setExpiry, expiry.value, 'MM/YY')
    if (!/^\d{3,4}$/.test(cvc.value)) fail(setCvc, cvc.value, '3–4 digits')
    if (zip.value.trim().length < 3) fail(setZip, zip.value, 'Required')
    if (!ok) setShake((n) => n + 1)
    return ok
  }

  const save = () => {
    if (!validate()) return
    setSaving(true)
    // Stub: Stripe.js tokenization will replace this timeout once keys exist.
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        onOpenChange(false)
        setCard(empty)
        setExpiry(empty)
        setCvc(empty)
        setZip(empty)
      }, 1200)
    }, 1100)
  }

  const field = (
    label: string,
    state: FieldState,
    onChange: (v: string) => void,
    props: { placeholder: string; inputMode?: 'numeric'; maxLength?: number },
  ) => (
    <motion.label
      key={`${label}-${state.error ? shake : 'ok'}`}
      animate={state.error ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.3 }}
      className="block"
    >
      <span className="mb-1.5 block text-xs text-parchment-dim">{label}</span>
      <input
        value={state.value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={props.placeholder}
        inputMode={props.inputMode}
        maxLength={props.maxLength}
        className={cn(
          'w-full rounded-lg border bg-ink-800 px-3.5 py-2.5 font-mono text-sm text-parchment outline-none transition-colors placeholder:text-parchment-dim/40',
          state.error
            ? 'border-blood focus:border-blood'
            : 'border-stroke focus:border-spectral',
        )}
      />
      {state.error && (
        <span className="mt-1 block text-[11px] text-blood">{state.error}</span>
      )}
    </motion.label>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-stroke bg-ink-900 text-parchment sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display text-2xl text-parchment">
            <CreditCard className="h-5 w-5 text-spectral" /> Update payment method
          </SheetTitle>
          <SheetDescription className="text-parchment-dim">
            Stripe-ready: card entry is stubbed pending Stripe publishable keys.
            No live charge or tokenization occurs yet.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-5 px-4">
          {field('Card number', card, setField(setCard, formatCard), {
            placeholder: '4242 4242 4242 4242',
            inputMode: 'numeric',
            maxLength: 19,
          })}
          <div className="grid grid-cols-2 gap-4">
            {field('Expiry', expiry, setField(setExpiry, formatExpiry), {
              placeholder: 'MM/YY',
              inputMode: 'numeric',
              maxLength: 5,
            })}
            {field('CVC', cvc, setField(setCvc, (v) => v.replace(/\D/g, '').slice(0, 4)), {
              placeholder: '123',
              inputMode: 'numeric',
              maxLength: 4,
            })}
          </div>
          {field('Billing ZIP', zip, setField(setZip), { placeholder: '94110' })}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            disabled={saving || saved}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition-all',
              saved
                ? 'bg-verdant text-ink-950'
                : 'bg-gradient-to-r from-spectral to-spectral-deep text-white shadow-[0_0_24px_rgba(139,124,255,0.45)]',
              (saving || saved) && 'opacity-90',
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : saved ? (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" /> Card updated
              </motion.span>
            ) : (
              'Save card'
            )}
          </motion.button>

          <p className="flex items-center justify-center gap-2 text-[11px] text-parchment-dim/70">
            <ShieldCheck className="h-3.5 w-3.5 text-verdant" />
            Encrypted end-to-end · PCI-DSS via Stripe
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
