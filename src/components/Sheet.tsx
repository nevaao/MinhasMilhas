import { useEffect, type ReactNode } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { X } from 'lucide-react'

/** Folha inferior no celular (arrasta para fechar), painel centralizado no computador. */
export default function Sheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const controls = useDragControls()
  const desktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-bg shadow-2xl md:max-w-lg md:rounded-[28px]"
        initial={desktop ? { opacity: 0, y: 24, scale: 0.97 } : { y: '100%' }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={desktop ? { opacity: 0, y: 24, scale: 0.97 } : { y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 340 }}
        drag="y" dragControls={controls} dragListener={false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose() }}
      >
        <div className="touch-none px-5 pb-2 pt-3" onPointerDown={(e) => controls.start(e)}>
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line md:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{title}</h2>
            <button type="button" aria-label="Fechar" onClick={onClose} onPointerDown={(e) => e.stopPropagation()} className="flex h-9 w-9 items-center justify-center rounded-full bg-line/60 text-muted"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 pb-4 pt-2">{children}</div>
        {footer && <div className="border-t border-line/60 bg-surface/80 px-5 pt-3 backdrop-blur" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>{footer}</div>}
      </motion.div>
    </div>
  )
}
