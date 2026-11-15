import { useEffect, useState, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Link, useLocation, type LinkProps } from 'react-router-dom'

/** Entrada escalonada para itens de lista (limitada para listas longas). */
export const enter = (i = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: 'easeOut' as const, delay: Math.min(i, 5) * 0.03 },
})

export function FadeUp({ i = 0, ...props }: { i?: number } & HTMLMotionProps<'div'>) {
  return <motion.div {...enter(i)} {...props} />
}

/** Link que abre a tela como folha por cima da tela atual. */
export function OverlayLink(props: LinkProps) {
  const location = useLocation()
  return <Link {...props} state={{ background: location }} />
}

export const tap = { whileTap: { scale: 0.97 } }

/** Monta o conteúdo pesado (ex.: gráfico) logo depois do primeiro quadro, para a troca de tela não travar. */
export function Defer({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 60)
    return () => clearTimeout(id)
  }, [])
  return <>{ready ? children : fallback}</>
}
