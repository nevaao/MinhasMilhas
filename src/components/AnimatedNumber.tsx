import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'

export default function AnimatedNumber({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(0)
  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.9, ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { if (ref.current) ref.current.textContent = format(v) },
    })
    prev.current = value
    return () => controls.stop()
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref} className={className}>{format(value)}</span>
}
