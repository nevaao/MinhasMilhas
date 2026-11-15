import { motion, type HTMLMotionProps } from 'framer-motion'
import { Link, useLocation, type LinkProps } from 'react-router-dom'

/** Entrada escalonada para itens de lista (limitada para listas longas). */
export const enter = (i = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring' as const, stiffness: 380, damping: 30, delay: Math.min(i, 10) * 0.04 },
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
