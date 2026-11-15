import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

type Kind = 'ok' | 'error'
const Ctx = createContext<(text: string, kind?: Kind) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; text: string; kind: Kind }[]>([])
  const push = useCallback((text: string, kind: Kind = 'ok') => {
    const id = Date.now() + Math.random()
    setItems((l) => [...l, { id, text, kind }])
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 2800)
  }, [])
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }} aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: -24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-fg px-4 py-2.5 text-sm font-medium text-bg shadow-lg">
              {t.kind === 'ok' ? <Check className="h-4 w-4 text-accent" /> : <X className="h-4 w-4 text-danger" />}{t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}
export const useToast = () => useContext(Ctx)
