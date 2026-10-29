import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'
import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown, Play, Star } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* ------------------------------ Ghost particles ------------------------------ */

function GhostParticles() {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(400 * 3)
    for (let i = 0; i < 400; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (!ref.current) return
    ref.current.rotation.y = t * 0.03
    ref.current.position.y = Math.sin(t * 0.25) * 0.3
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#8B7CFF" size={0.045} sizeAttenuation depthWrite={false} opacity={0.75} />
    </Points>
  )
}

/* --------------------------------- Helpers ---------------------------------- */

function CountUp({ target, suffix }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obj = { v: 0 }
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: () =>
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power3.out',
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString() + (suffix ?? '')
          },
        }),
    })
    return () => st.kill()
  }, [target, suffix])
  return <span ref={ref}>0{suffix}</span>
}

/* ---------------------------------- Page ------------------------------------ */

export default function Home() {
  const root = useRef<HTMLDivElement>(null)

  // Lenis smooth scroll (landing only)
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  useGSAP(
    () => {
      // Hero headline char reveal
      const chars = gsap.utils.toArray<HTMLElement>('.hero-char')
      gsap.from(chars, {
        y: 30,
        opacity: 0,
        stagger: 0.04,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.3,
      })
      gsap.from('.hero-fade', {
        opacity: 0,
        y: 20,
        stagger: 0.12,
        duration: 1,
        ease: 'power3.out',
        delay: 0.9,
      })

      // Hero pinned scroll: content parallax-fades out
      gsap.to('.hero-content', {
        opacity: 0,
        y: -80,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })

      // Empathy card slide-in
      gsap.from('.empathy-card', {
        x: -60,
        rotate: -4,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.empathy-card', start: 'top 75%' },
      })

      // How-it-works pinned step swap
      const steps = gsap.utils.toArray<HTMLElement>('.hiw-step')
      const counter = document.querySelector<HTMLElement>('.hiw-counter')
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.hiw-section',
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: 0.5,
          onUpdate: (self) => {
            const idx = Math.min(2, Math.floor(self.progress * 3))
            steps.forEach((s, i) => {
              gsap.to(s, {
                opacity: i === idx ? 1 : 0,
                y: i === idx ? 0 : 30,
                duration: 0.4,
                overwrite: 'auto',
              })
            })
            if (counter) counter.textContent = `0${idx + 1}`
          },
        },
      })
      void tl

      // Feature bands stagger
      gsap.utils.toArray<HTMLElement>('.feature-band').forEach((band) => {
        gsap.from(band.querySelectorAll('.band-item'), {
          y: 40,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: band, start: 'top 70%' },
        })
        const visual = band.querySelector('.band-visual')
        if (visual) {
          gsap.from(visual, {
            scale: 0.94,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: band, start: 'top 70%' },
          })
        }
      })

      // Pricing cards stagger up
      gsap.from('.tier-card', {
        y: 60,
        opacity: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.tiers', start: 'top 75%' },
      })

      // Signature draw-on for final CTA
      const sig = document.querySelector<SVGPathElement>('.signature-path')
      if (sig) {
        const len = sig.getTotalLength()
        gsap.set(sig, { strokeDasharray: len, strokeDashoffset: len })
        gsap.to(sig, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '.final-cta',
            start: 'top 70%',
            end: 'top 20%',
            scrub: true,
          },
        })
      }

      // Footer watermark drift
      gsap.utils.toArray<HTMLElement>('.footer-drift').forEach((el) => {
        gsap.fromTo(
          el,
          { yPercent: 20 },
          {
            yPercent: 0,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      })
    },
    { scope: root },
  )

  return (
    <div ref={root}>
      <Hero />
      <EmpathyBand />
      <HowItWorks />
      <Features />
      <PricingTeaser />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </div>
  )
}

/* ----------------------------------- Hero ----------------------------------- */

function Hero() {
  const headline = 'Their hand. Their voice. A whole new chapter.'
  return (
    <section className="hero-section relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
      <img
        src="/hero-bg.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#0B0A10_85%)]" />
      <div className="absolute inset-0 opacity-80">
        <Canvas camera={{ position: [0, 0, 8], fov: 55 }} style={{ width: '100%', height: '100%' }}>
          <GhostParticles />
        </Canvas>
      </div>

      <div className="hero-content relative z-10 mx-auto max-w-4xl px-6 text-center">
        <p className="hero-fade font-hand text-2xl text-ember md:text-3xl">
          for the voices we thought we'd lost
        </p>
        <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-[-0.01em] text-parchment md:text-7xl lg:text-[88px]">
          {headline.split(' ').map((word, wi) => (
            <span key={wi} className="inline-block whitespace-nowrap">
              {word.split('').map((c, ci) => (
                <span key={ci} className="hero-char inline-block">
                  {c}
                </span>
              ))}
              {wi < headline.split(' ').length - 1 && <span>&nbsp;</span>}
            </span>
          ))}
        </h1>
        <p className="hero-fade mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-parchment-dim">
          Upload a handful of handwritten letters. GhostWriter Studio reads them with Kimi K3's
          million-token eye, distills a singular writing voice, and composes a publication-quality
          novel in a single pass.
        </p>
        <div className="hero-fade mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Link
              to="/login"
              className="rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-8 py-4 font-medium text-white shadow-[0_0_36px_rgba(139,124,255,0.5)] transition-shadow hover:shadow-[0_0_48px_rgba(139,124,255,0.7)]"
            >
              Begin a Memory — Free
            </Link>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <button className="flex items-center gap-2 rounded-full border border-parchment/30 px-8 py-4 font-medium text-parchment transition-colors hover:border-spectral hover:text-spectral">
              <Play className="h-4 w-4" /> Watch a novel being written
            </button>
          </motion.div>
        </div>
        <p className="hero-fade mt-10 font-mono text-xs tracking-wider text-parchment-dim/70">
          1M-token context · Native vision ingestion · 80,000+ words in one sweep
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
        <motion.div
          className="h-2 w-2 rounded-full bg-spectral shadow-[0_0_12px_rgba(139,124,255,0.9)]"
          animate={{ y: [0, 14, 0], opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-parchment-dim/60">
          scroll
        </span>
      </div>
    </section>
  )
}

/* -------------------------------- Empathy band ------------------------------- */

function EmpathyBand() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:py-36">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div className="empathy-card relative rounded-xl border border-stroke bg-ink-900 p-6 shadow-2xl">
          <div
            className="rounded-lg p-4"
            style={{ backgroundImage: 'url(/texture-paper.png)', backgroundColor: '#F6F1E4' }}
          >
            <motion.div
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                setTilt({
                  x: ((e.clientY - r.top) / r.height - 0.5) * -6,
                  y: ((e.clientX - r.left) / r.width - 0.5) * 6,
                })
              }}
              onMouseLeave={() => setTilt({ x: 0, y: 0 })}
              animate={{ rotateX: tilt.x, rotateY: tilt.y }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              style={{ transformPerspective: 800, rotate: -2 }}
              className="relative"
            >
              <img
                src="/handwriting-sample-1.png"
                alt="Aged cursive handwriting on yellowed paper"
                className="w-full rounded-md shadow-lg"
              />
              <span className="absolute -top-3 left-6 h-6 w-20 -rotate-6 rounded-sm bg-ember/30 backdrop-blur-[1px]" />
              <span className="absolute -top-3 right-6 h-6 w-20 rotate-3 rounded-sm bg-ember/30 backdrop-blur-[1px]" />
            </motion.div>
          </div>
        </div>

        <div>
          <h2 className="font-display text-4xl italic leading-tight text-parchment md:text-5xl">
            A box of letters in the attic.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-parchment-dim">
            A person's voice lives in their handwriting — the slant of a signature, the rhythm of
            their sentences, the words they always reached for. GhostWriter Studio reads those
            traces and preserves them as a living voice profile: not a recording, but a writer that
            can begin again.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-stroke/60 pt-8">
            <div>
              <div className="font-mono text-3xl text-spectral md:text-4xl">
                <CountUp target={20} />
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-wider text-parchment-dim">
                scans to build a profile
              </div>
            </div>
            <div>
              <div className="font-mono text-3xl text-spectral md:text-4xl">
                <CountUp target={1} suffix="M" />
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-wider text-parchment-dim">
                tokens of context
              </div>
            </div>
            <div>
              <div className="font-mono text-3xl text-spectral md:text-4xl">
                <CountUp target={80} suffix="k" />
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-wider text-parchment-dim">
                words per sweep
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------- How it works ------------------------------- */

const hiwSteps = [
  {
    num: '01',
    title: 'The Archive Vault',
    body: "Drop in letters, journals, postcards. Kimi K3's native vision reads the ink itself — vectorizing letterforms, cadence, and quirks into a Voice Vector.",
    img: '/vector-vault-illustration.svg',
  },
  {
    num: '02',
    title: 'The Swarm Writes',
    body: 'A Blueprint Agent drafts your 3-act arc and chapter map. Then a swarm of writer agents composes in parallel — every chapter checked against the master outline and the Voice Vector.',
    img: '/swarm-illustration.svg',
  },
  {
    num: '03',
    title: 'The Master Editor',
    body: 'Slide the Style Weight from 1.0 to 5.0. Every nudge triggers targeted rewrites pulling harder from the original handwriting. Your book, tuned like an instrument.',
    img: '/editor-illustration.svg',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="hiw-section relative overflow-hidden bg-ink-900/40">
      <div className="mx-auto grid min-h-[100dvh] max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
        <div className="relative">
          <div className="hiw-counter pointer-events-none absolute -top-24 left-0 font-display text-[120px] font-bold leading-none text-transparent [-webkit-text-stroke:1px_#3A3450]">
            01
          </div>
          <p className="font-hand text-2xl text-ember">how it works</p>
          {hiwSteps.map((s, i) => (
            <div
              key={s.num}
              className="hiw-step mt-6"
              style={{ opacity: i === 0 ? 1 : 0, position: i === 0 ? 'relative' : 'absolute', top: i === 0 ? undefined : '6rem', left: 0, right: 0 }}
            >
              <h3 className="font-display text-4xl font-semibold text-parchment md:text-5xl">
                {s.title}
              </h3>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-parchment-dim">{s.body}</p>
            </div>
          ))}
          <div className="mt-10 flex gap-2">
            {hiwSteps.map((s) => (
              <span key={s.num} className="h-1 w-10 rounded-full bg-stroke" />
            ))}
          </div>
        </div>
        <div className="relative flex items-center justify-center">
          {hiwSteps.map((s, i) => (
            <img
              key={s.num}
              src={s.img}
              alt={s.title}
              className="hiw-step w-full max-w-xl"
              style={{ opacity: i === 0 ? 1 : 0, position: i === 0 ? 'relative' : 'absolute', inset: i === 0 ? undefined : 0, margin: 'auto' }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------- Features ---------------------------------- */

const styleVariants: Record<number, string> = {
  1: 'She walked to the window and looked at the sea. It was grey, and the boats had not come in. She decided to wait a little longer before lighting the lamp.',
  3: "She went to the window, as she always did when the hour grew uncertain, and found the sea wearing its grey coat. No boats. None expected, either — but she waited all the same, lamp unlit, the way her mother used to wait.",
  5: "To the window then — where else does one go when the hour turns doubtful? — and the sea in its grey coat, keeping its own counsel. No boats, none, and the lamp stayed cold in her hand, for she had learned waiting the way her mother taught it: standing, stubborn, half in hope and half in habit.",
}

function StyleSliderDemo() {
  const [weight, setWeight] = useState(3)
  const bucket = weight <= 2 ? 1 : weight <= 4 ? 3 : 5
  return (
    <div className="rounded-xl border border-stroke bg-ink-900 p-6">
      <div className="flex items-center justify-between font-mono text-xs text-parchment-dim">
        <span>Style Weight</span>
        <span className="text-spectral">{weight.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={0.5}
        value={weight}
        onChange={(e) => setWeight(parseFloat(e.target.value))}
        className="mt-3 w-full accent-spectral"
        aria-label="Style weight"
      />
      <div className="mt-1 flex justify-between font-mono text-[10px] text-parchment-dim/60">
        <span>1.0 neutral</span>
        <span>5.0 deeply in-voice</span>
      </div>
      <div className="relative mt-6 overflow-hidden rounded-lg p-5" style={{ backgroundImage: 'url(/texture-paper.png)', backgroundColor: '#F6F1E4' }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={bucket}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="font-display text-lg italic leading-relaxed text-[#2A2418]"
          >
            {styleVariants[bucket]}
          </motion.p>
        </AnimatePresence>
        <motion.div
          key={`shimmer-${bucket}`}
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-spectral/25 to-transparent"
        />
      </div>
    </div>
  )
}

const featureBands = [
  {
    title: 'Vision-Native Ingestion',
    copy: 'No OCR, no transcription loss. Kimi K3 sees the ink — pressure, slant, hesitation — and vectorizes the person behind the pen.',
    bullets: ['OCR-free vision parsing', 'Letterform vectorization', 'Idiolect extraction: rhythm, vocabulary, punctuation tics'],
    img: '/handwriting-sample-2.png',
    alt: 'Handwritten journal page with pencil notes',
  },
  {
    title: 'One-Sweep Novel Generation',
    copy: 'The blueprint, the chapters, the callbacks — composed in a single million-token pass with global consistency.',
    bullets: ['80,000+ words in a single pass', 'Global plot & character consistency via 1M-token context', '3-act blueprint visible before a word is written'],
    img: '/book-mockup.png',
    alt: 'Hardcover novel mockup',
  },
]

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl space-y-32 px-6 py-24 lg:py-36">
      {featureBands.map((b, i) => (
        <div
          key={b.title}
          className={`feature-band grid items-center gap-12 lg:grid-cols-2 ${i % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}
        >
          <div>
            <h3 className="band-item font-display text-4xl font-semibold text-parchment md:text-5xl">
              {b.title}
            </h3>
            <p className="band-item mt-5 text-lg leading-relaxed text-parchment-dim">{b.copy}</p>
            <ul className="mt-8 space-y-3">
              {b.bullets.map((bullet) => (
                <li key={bullet} className="band-item flex items-start gap-3 text-parchment-dim">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-spectral" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
          <div className="band-visual relative">
            <img
              src={b.img}
              alt={b.alt}
              className="w-full rounded-xl border border-stroke shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            />
            {i === 1 && (
              <>
                {['Ch. 1', 'Ch. 7', 'Ch. 14', 'Finale'].map((c, ci) => (
                  <motion.span
                    key={c}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: ci * 0.6, ease: 'easeInOut' }}
                    className="absolute rounded-full border border-spectral/50 bg-ink-900/90 px-3 py-1 font-mono text-[11px] text-spectral backdrop-blur"
                    style={{ top: `${12 + ci * 22}%`, right: ci % 2 ? '-1rem' : 'auto', left: ci % 2 ? 'auto' : '-1rem' }}
                  >
                    {c}
                  </motion.span>
                ))}
              </>
            )}
          </div>
        </div>
      ))}

      <div className="feature-band grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h3 className="band-item font-display text-4xl font-semibold text-parchment md:text-5xl">
            Style Weight Slider 1.0→5.0
          </h3>
          <p className="band-item mt-5 text-lg leading-relaxed text-parchment-dim">
            Tune the voice like an instrument. Slide left for a clean neutral draft; slide right and
            every paragraph pulls harder from the original handwriting.
          </p>
          <ul className="mt-8 space-y-3">
            {['Targeted paragraph rewrites', 'Voice intensity dial', 'Per-chapter or whole-book application'].map((b) => (
              <li key={b} className="band-item flex items-start gap-3 text-parchment-dim">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-spectral" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="band-visual">
          <StyleSliderDemo />
        </div>
      </div>
    </section>
  )
}

/* ------------------------------- Pricing teaser ------------------------------ */

const tiers = [
  {
    name: 'The Memory Tier',
    price: '$0',
    accent: 'ember' as const,
    features: ['1 project', '20 handwriting scans', 'One 15,000-word novella test'],
    cta: 'Start Free',
  },
  {
    name: 'The Legacy Tier',
    price: '$29/mo',
    accent: 'spectral' as const,
    features: ['5 projects', 'Unlimited scans', '80,000+ word novels', 'Style-slider calibration', 'EPUB/PDF export'],
    cta: 'Go Legacy',
    featured: true,
  },
  {
    name: 'The Studio Tier',
    price: '$99/mo',
    accent: 'verdant' as const,
    features: ['Unlimited projects', 'Multi-author voice blending', 'Priority parallel swarm', 'Custom domain exports', 'Dedicated vector vault'],
    cta: 'Build Your Studio',
  },
]

const accentClasses = {
  ember: 'hover:border-ember/70 hover:shadow-[0_0_30px_rgba(232,161,92,0.25)] text-ember',
  spectral: 'hover:border-spectral/80 hover:shadow-[0_0_36px_rgba(139,124,255,0.35)] text-spectral',
  verdant: 'hover:border-verdant/70 hover:shadow-[0_0_30px_rgba(92,201,138,0.25)] text-verdant',
}

function PricingTeaser() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:py-36">
      <div className="text-center">
        <p className="font-hand text-2xl text-ember">choose how much of them you keep</p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-parchment md:text-5xl">
          Three ways to remember
        </h2>
      </div>
      <div className="tiers mt-16 grid gap-8 md:grid-cols-3">
        {tiers.map((t) => (
          <motion.div
            key={t.name}
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className={`tier-card relative rounded-xl border bg-ink-900/80 p-8 backdrop-blur transition-shadow ${
              t.featured
                ? 'border-spectral/70 shadow-[0_0_40px_rgba(139,124,255,0.3)] md:-translate-y-4'
                : 'border-stroke'
            } ${accentClasses[t.accent].split(' ').filter((c) => c.startsWith('hover:')).join(' ')}`}
          >
            {t.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-4 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
                Most Chosen
              </span>
            )}
            <div className={`font-hand text-2xl ${accentClasses[t.accent].split(' ').pop()}`}>{t.name}</div>
            <div className="mt-4 font-display text-5xl font-bold text-parchment">{t.price}</div>
            <ul className="mt-8 space-y-3 text-sm text-parchment-dim">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
                  {f}
                </li>
              ))}
            </ul>
            <motion.div whileTap={{ scale: 0.97 }} className="mt-10">
              <Link
                to="/login"
                className={`block rounded-full py-3 text-center font-medium transition-colors ${
                  t.featured
                    ? 'bg-gradient-to-r from-spectral to-spectral-deep text-white shadow-[0_0_24px_rgba(139,124,255,0.45)]'
                    : 'border border-parchment/25 text-parchment hover:border-spectral hover:text-spectral'
                }`}
              >
                {t.cta}
              </Link>
            </motion.div>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link to="/pricing" className="text-sm text-spectral hover:underline">
          Compare every feature →
        </Link>
      </div>
    </section>
  )
}

/* -------------------------------- Testimonials ------------------------------- */

const testimonials = [
  {
    quote:
      'Nana died with a half-finished story in her nightstand. GhostWriter finished it in her hand — my daughter read it aloud and we all forgot, for a page or two, that she was gone.',
    name: 'Margaret Ellison',
    role: 'Granddaughter, Memory Tier',
    img: '/avatar-1.png',
  },
  {
    quote:
      'My co-author passed mid-draft. The swarm read thirty years of his letters and gave him back his chapter. It argues like him. It digresses like him.',
    name: 'Daniel Reyes',
    role: 'Novelist, Legacy Tier',
    img: '/avatar-2.png',
  },
  {
    quote:
      'We blend three historical voices per title now. The Style Weight Slider is our editorial dial — reviewers cannot tell where the archive ends and the novel begins.',
    name: 'June Park',
    role: 'Editor, Lantern Press · Studio Tier',
    img: '/avatar-3.png',
  },
]

function Testimonials() {
  return (
    <section className="overflow-hidden py-24 lg:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <p className="font-hand text-2xl text-ember">marginalia</p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-parchment md:text-5xl">
          Voices, returned
        </h2>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -600, right: 0 }}
        className="mt-14 flex cursor-grab gap-8 px-6 active:cursor-grabbing md:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]"
      >
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="relative w-[85vw] shrink-0 snap-start rounded-xl border border-stroke bg-ink-900/80 p-10 backdrop-blur md:w-[46rem]"
          >
            <span className="pointer-events-none absolute -top-10 left-4 font-display text-[160px] leading-none text-spectral opacity-20">
              "
            </span>
            <div className="flex gap-1 text-ember">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-6 font-display text-2xl italic leading-relaxed text-parchment">
              {t.quote}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <img src={t.img} alt={t.name} className="h-12 w-12 rounded-full border border-stroke object-cover" />
              <div>
                <div className="text-sm font-medium text-parchment">{t.name}</div>
                <div className="font-mono text-xs text-parchment-dim">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  )
}

/* ------------------------------------ FAQ ------------------------------------ */

const faqs = [
  {
    q: 'Is this ethical? Who owns the rights?',
    a: 'You do — fully. Voice vectors and generated manuscripts belong to the account holder. We require documented rights to the source material (family estates, co-authorship, or license) and every export carries a provenance record. Our Ethics Charter is public.',
  },
  {
    q: 'How many scans do I need?',
    a: 'Around 20 pages of handwriting builds a strong Voice Vector — letters, journals, postcards all count. The Memory Tier includes exactly that. More material sharpens cadence and vocabulary, especially across decades.',
  },
  {
    q: "What does Kimi K3's 1M context actually do?",
    a: 'It holds your entire voice corpus, the full blueprint, and the whole manuscript in a single context. That means the model never forgets chapter 3 while writing chapter 30 — plot threads, character voices, and handwriting-derived style stay globally consistent in one sweep.',
  },
  {
    q: 'Can I edit before export?',
    a: 'Yes — the Master Editor is built for granular control. Highlight any paragraph, nudge the Style Weight Slider from 1.0 to 5.0, and targeted rewrites pull harder from the original handwriting. Apply changes per-paragraph, per-chapter, or across the whole book.',
  },
  {
    q: 'What formats can I export?',
    a: 'EPUB and PDF on the Legacy Tier and above, plus print-ready interiors with manuscript-style typesetting. Studio adds custom-domain web exports and DOCX with tracked voice annotations.',
  },
]

function FAQ() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 lg:py-36">
      <div className="text-center">
        <p className="font-hand text-2xl text-ember">questions from the reading room</p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-parchment md:text-5xl">
          Before you begin
        </h2>
      </div>
      <Accordion.Root type="single" collapsible className="mt-14 space-y-4">
        {faqs.map((f, i) => (
          <Accordion.Item
            key={i}
            value={`item-${i}`}
            className="overflow-hidden rounded-xl border border-stroke bg-ink-900/80"
          >
            <Accordion.Header>
              <Accordion.Trigger className="group flex w-full items-center justify-between px-6 py-5 text-left font-display text-xl text-parchment transition-colors hover:text-spectral">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-parchment-dim transition-transform duration-300 group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <p className="px-6 pb-6 leading-relaxed text-parchment-dim">{f.a}</p>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  )
}

/* ---------------------------------- Final CTA --------------------------------- */

function FinalCTA() {
  return (
    <section className="final-cta relative flex min-h-[80dvh] items-center justify-center overflow-hidden bg-ink-900/40 px-6 py-24">
      <div className="relative mx-auto max-w-3xl text-center">
        <svg viewBox="0 0 700 90" className="mx-auto mb-8 w-full max-w-xl" fill="none">
          <path
            className="signature-path"
            d="M30 60 C 90 20, 130 75, 180 45 C 220 20, 260 70, 310 48 C 350 30, 380 68, 430 44 C 470 26, 520 66, 570 40 C 610 22, 650 50, 680 38"
            stroke="#E8A15C"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <text x="350" y="85" textAnchor="middle" fill="#B9B0A0" fontSize="20" fontFamily="Caveat, cursive">
            written in their hand
          </text>
        </svg>
        <h2 className="font-display text-5xl font-bold leading-tight text-parchment md:text-6xl">
          Every voice deserves a second chapter.
        </h2>
        <motion.div
          whileTap={{ scale: 0.97 }}
          className="mt-10 inline-block"
          animate={{ boxShadow: ['0 0 24px rgba(139,124,255,0.35)', '0 0 44px rgba(139,124,255,0.6)', '0 0 24px rgba(139,124,255,0.35)'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ borderRadius: 9999 }}
        >
          <Link
            to="/login"
            className="inline-block rounded-full bg-gradient-to-r from-spectral to-spectral-deep px-10 py-4 text-lg font-medium text-white"
          >
            Begin a Memory — Free
          </Link>
        </motion.div>
        <p className="mt-6 font-mono text-xs text-parchment-dim/70">
          No card required · 15,000-word test book
        </p>
      </div>
    </section>
  )
}
