import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react'
import { useAccounts, useCategories, useLedgers, useTransactions } from '../data/hooks'
import { fmtBRL, fmtPoints } from '../lib/format'
import { Badge } from '../components/Icon'
import TxRow from '../components/TxRow'
import PageHeader from '../components/PageHeader'
import AnimatedNumber from '../components/AnimatedNumber'
import { FadeUp, OverlayLink } from '../components/motion'
import { ListSkeleton, Skeleton } from '../components/Skeleton'

const quick = [
  { tipo: 'entrada', label: 'Entrada', icon: ArrowDownLeft, color: '#16a34a' },
  { tipo: 'saida', label: 'Saída', icon: ArrowUpRight, color: '#dc2626' },
  { tipo: 'transferencia', label: 'Transferir', icon: ArrowLeftRight, color: '#2563eb' },
]

export default function Dashboard() {
  const { data: accounts = [], isLoading: la } = useAccounts()
  const { data: categories = [] } = useCategories()
  const { data: txs = [], isLoading: lt } = useTransactions()
  const { states, costOut } = useLedgers()

  const active = accounts.filter((a) => !a.archived)
  const totals = useMemo(() => {
    let p = 0, c = 0
    for (const a of active) { p += states[a.id]?.points ?? 0; c += states[a.id]?.totalCost ?? 0 }
    return { p, c, m: p > 0 ? (c / p) * 1000 : 0 }
  }, [active, states])

  const recent = [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)).slice(0, 8)
  const loading = la || lt

  return (
    <div>
      <PageHeader title="Resumo" subtitle="Seus pontos e o custo médio por milheiro." />

      <motion.section className="hero relative overflow-hidden rounded-3xl p-5 shadow-float" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 right-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative">
          <div className="text-sm text-white/75">Total de pontos</div>
          {loading ? <Skeleton className="mt-2 h-10 w-48 !bg-white/25" /> : <AnimatedNumber value={totals.p} format={fmtPoints} className="num block font-display text-4xl font-bold" />}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-3">
            <div><div className="text-xs text-white/70">Investido</div><AnimatedNumber value={totals.c} format={fmtBRL} className="num block text-base font-semibold" /></div>
            <div><div className="text-xs text-white/70">Milheiro médio</div><AnimatedNumber value={totals.m} format={fmtBRL} className="num block text-base font-semibold" /></div>
          </div>
        </div>
      </motion.section>

      <section className="mt-5 grid grid-cols-3 gap-3">
        {quick.map(({ tipo, label, icon: I, color }, i) => (
          <FadeUp key={tipo} i={i + 1} whileTap={{ scale: 0.94 }}>
            <OverlayLink to={`/novo?tipo=${tipo}`} className="card flex flex-col items-center gap-2 py-3.5 text-sm font-medium">
              <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: color + '22', color }}><I className="h-5 w-5" /></span>{label}
            </OverlayLink>
          </FadeUp>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Suas contas</h2>
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {loading && [0, 1].map((i) => <Skeleton key={i} className="h-28 min-w-[72%] md:min-w-0" />)}
          {active.map((a, i) => {
            const s = states[a.id] ?? { points: 0, totalCost: 0, milheiro: 0 }
            return (
              <FadeUp key={a.id} i={i} whileTap={{ scale: 0.97 }} className="min-w-[72%] snap-start rounded-2xl border border-line/60 p-4 shadow-card sm:min-w-[44%] md:min-w-0" style={{ background: `linear-gradient(135deg, ${a.color}26, rgb(var(--surface)) 70%)` }}>
                <div className="flex items-center gap-2.5"><Badge color={a.color} icon={a.icon} size={36} /><span className="truncate text-sm font-semibold">{a.name}</span></div>
                <div className="num mt-3 font-display text-2xl font-bold">{fmtPoints(s.points)} <span className="text-xs font-normal text-muted">pts</span></div>
                <div className="num mt-0.5 text-xs text-muted">milheiro {fmtBRL(s.milheiro)}</div>
              </FadeUp>
            )
          })}
          {!loading && active.length === 0 && <p className="text-sm text-muted">Cadastre uma conta em Contas para começar.</p>}
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-semibold">Últimos registros</h2><Link to="/registros" className="text-sm font-medium text-accent">Ver todos</Link></div>
        {loading ? <ListSkeleton rows={4} /> : (
          <div className="card divide-y divide-line/60 overflow-hidden">
            {recent.map((t, i) => <TxRow key={t.id} index={i} tx={t} accounts={accounts} categories={categories} costOut={costOut[t.id]} />)}
            {recent.length === 0 && <p className="p-6 text-center text-sm text-muted">Nenhum registro ainda. Toque no botão +.</p>}
          </div>
        )}
      </section>
    </div>
  )
}
