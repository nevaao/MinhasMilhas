import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, List, Wallet, Settings, Tag, Plus, Calculator } from 'lucide-react'
import { OverlayLink } from './motion'

const nav = {
  resumo: { to: '/', label: 'Resumo', icon: LayoutDashboard },
  registros: { to: '/registros', label: 'Registros', icon: List },
  simulacao: { to: '/simulacao', label: 'Simulação', icon: Calculator },
  contas: { to: '/contas', label: 'Contas', icon: Wallet },
  categorias: { to: '/categorias', label: 'Categorias', icon: Tag },
  ajustes: { to: '/config', label: 'Ajustes', icon: Settings },
}
const side = [nav.resumo, nav.registros, nav.simulacao, nav.contas, nav.categorias, nav.ajustes]

function Tab({ to, label, icon: I, id, also = [] }: { to: string; label: string; icon: typeof List; id: string; also?: string[] }) {
  const { pathname } = useLocation()
  return (
    <NavLink to={to} end={to === '/'} className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium">
      {({ isActive: a }) => {
        const isActive = a || also.includes(pathname)
        return (
          <motion.span whileTap={{ scale: 0.88 }} className={`relative flex flex-col items-center gap-0.5 ${isActive ? 'text-accent' : 'text-muted'}`}>
            <span className="relative flex h-8 w-14 items-center justify-center">
              {isActive && <motion.span layoutId={id} className="absolute inset-0 rounded-full bg-accent/15" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
              <I className="relative h-5 w-5" />
            </span>
            {label}
          </motion.span>
        )
      }}
    </NavLink>
  )
}

export default function Layout({ pathKey }: { pathKey: string }) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r border-line/60 p-4 md:flex">
        <div className="mb-5 flex items-center gap-2 px-2 font-display text-lg font-bold"><img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />Minhas Milhas</div>
        {side.map(({ to, label, icon: I }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${isActive ? 'bg-accent/10 font-semibold text-accent' : 'text-muted hover:bg-line/40'}`}>
            <I className="h-4 w-4" />{label}
          </NavLink>
        ))}
        <motion.div whileTap={{ scale: 0.97 }} className="mt-4"><OverlayLink to="/novo" className="btn btn-primary w-full"><Plus className="h-4 w-4" />Novo registro</OverlayLink></motion.div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-32 md:px-8 md:pb-10">
        <motion.div key={pathKey} className="mx-auto max-w-4xl" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.24, ease: 'easeOut' }}>
          <Outlet />
        </motion.div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line/60 bg-surface/85 backdrop-blur-xl md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="relative mx-auto flex max-w-md items-end">
          <Tab {...nav.resumo} id="tab" />
          <Tab {...nav.registros} id="tab" />
          <div className="relative flex w-20 self-stretch justify-center">
            <motion.div whileTap={{ scale: 0.9 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.2 }} className="absolute -top-6">
              <OverlayLink to="/novo" aria-label="Novo registro" className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-float ring-4 ring-bg"><Plus className="h-7 w-7" /></OverlayLink>
            </motion.div>
          </div>
          <Tab {...nav.simulacao} id="tab" />
          <Tab {...nav.ajustes} id="tab" also={['/contas', '/categorias']} />
        </div>
      </nav>
    </div>
  )
}
