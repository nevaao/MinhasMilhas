import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'

/** Título grande que, ao rolar, vira um título compacto numa barra translúcida fixa. */
export default function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 44)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  return (
    <>
      <div className={`sticky top-0 z-20 -mx-4 bg-bg/80 px-4 backdrop-blur-xl transition-[border-color] md:-mx-8 md:px-8 border-b ${scrolled ? 'border-line' : 'border-transparent'}`} style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex h-14 items-center justify-between gap-3 md:h-[68px]">
          <motion.span animate={{ opacity: scrolled ? 1 : 0, y: scrolled ? 0 : 6 }} className="font-display text-base font-bold">{title}</motion.span>
          <div className="ml-auto">{action}</div>
        </div>
      </div>
      <motion.div className="mb-5 mt-1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[1.9rem] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </motion.div>
    </>
  )
}
