import { motion } from 'framer-motion'

/**
 * Full-screen ink-spread transition overlay: a spectral ink blot expands
 * from the CTA across the viewport before navigation.
 */
export default function InkTransition({ origin }: { origin: { x: number; y: number } }) {
  return (
    <motion.div
      className="fixed inset-0 z-[90] bg-ink-950"
      style={{
        clipPath: `circle(0% at ${origin.x}px ${origin.y}px)`,
        background:
          'radial-gradient(circle at 50% 45%, #1E1A29 0%, #0B0A10 65%)',
      }}
      animate={{
        clipPath: [
          `circle(0% at ${origin.x}px ${origin.y}px)`,
          `circle(150% at ${origin.x}px ${origin.y}px)`,
        ],
      }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <span className="font-hand text-3xl text-spectral">summoning the blueprint…</span>
      </motion.div>
    </motion.div>
  )
}
