import { NavLink, Outlet, Link } from 'react-router-dom'
import { LayoutDashboard, List, Wallet, Tag, Settings, Plus } from 'lucide-react'

const nav = [
  { to: '/', label: 'Resumo', icon: LayoutDashboard },
  { to: '/registros', label: 'Registros', icon: List },
  { to: '/contas', label: 'Contas', icon: Wallet },
  { to: '/categorias', label: 'Categorias', icon: Tag },
  { to: '/config', label: 'Ajustes', icon: Settings },
]

export default function Layout() {
  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-1 border-r border-line p-4 md:flex">
        <div className="mb-4 px-2 font-display text-lg font-bold">MinhasMilhas</div>
        {nav.map(({ to, label, icon: I }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-accent/10 font-medium text-accent' : 'text-muted hover:bg-line/40'}`}>
            <I className="h-4 w-4" />{label}
          </NavLink>
        ))}
        <Link to="/novo" className="btn btn-primary mt-4"><Plus className="h-4 w-4" />Novo registro</Link>
      </aside>
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10">
        <div className="mx-auto max-w-4xl"><Outlet /></div>
      </main>
      <Link to="/novo" aria-label="Novo registro" className="fixed right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg md:hidden"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}><Plus /></Link>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-surface md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {nav.map(({ to, label, icon: I }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${isActive ? 'text-accent' : 'text-muted'}`}>
            <I className="h-5 w-5" />{label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
