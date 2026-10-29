import { useEffect, useRef, useState } from 'react'

/** Animated count-up number (IBM Plex Mono friendly). */
export default function CountUp({
  value,
  duration = 1.2,
  className,
}: {
  value: number
  duration?: number
  className?: string
}) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    let raf = 0
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const t = Math.min(1, (ts - startRef.current) / (duration * 1000))
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(eased * value))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <span className={className}>{display.toLocaleString('en-US')}</span>
}
