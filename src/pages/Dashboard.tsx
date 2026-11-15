import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAccounts, useCategories, useLedgers, useTransactions } from '../data/hooks'
import { evolution, filterEvolution, type PeriodKey } from '../lib/ledger'
import { fmtBRL, fmtDate, fmtPoints, today } from '../lib/format'
import { Badge } from '../components/Icon'
import TxRow from '../components/TxRow'
import PageHeader from '../components/PageHeader'
import Select from '../components/Select'
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
  const { rows, states, costOut } = useLedgers()
  const [sel, setSel] = useState('all')
  const [period, setPeriod] = useState<PeriodKey>('year')
  const [yearPick, setYearPick] = useState('')

  const active = accounts.filter((a) => !a.archived)
  const totals = useMemo(() => {
    let p = 0, c = 0
    for (const a of active) { p += states[a.id]?.points ?? 0; c += states[a.id]?.totalCost ?? 0 }
    return { p, c, m: p > 0 ? (c / p) * 1000 : 0 }
  }, [active, states])

  const years = useMemo(() => [...new Set(txs.map((t) => t.date.slice(0, 4)))].sort().reverse(), [txs])
  const year = yearPick || years[0] || today().slice(0, 4)

  const chart = useMemo(() => {
    const subset = sel === 'all' ? Object.fromEntries(Object.entries(rows).filter(([id]) => active.some((a) => a.id === id))) : { [sel]: rows[sel] ?? [] }
    const pts = filterEvolution(evolution(subset), period, year, today())
    const span = pts.length > 1 ? (+new Date(pts[pts.length - 1].date) - +new Date(pts[0].date)) / 864e5 : 0
    return pts.map((d) => ({ ...d, label: span > 370 ? `${d.date.slice(5, 7)}/${d.date.slice(2, 4)}` : fmtDate(d.date).slice(0, 5), milheiro: +d.milheiro.toFixed(2) }))
  }, [rows, sel, active, period, year])

  const recent = [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)).slice(0, 8)
  const loading = la || lt

  return (
    <div>
      <PageHeader title="Resumo" subtitle="Seus pontos e o custo médio por milheiro." />

      <motion.section className="hero relative overflow-hidden rounded-3xl p-5 shadow-float" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
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

      <FadeUp i={3} className="card mt-6 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Pontos × milheiro</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select variant="chip" ariaLabel="Período do gráfico" value={period} onChange={(v) => setPeriod(v as PeriodKey)} options={[
              { value: 'week', label: 'Última semana' }, { value: 'month', label: 'Último mês' }, { value: 'quarter', label: 'Último trimestre' },
              { value: 'year', label: 'Último ano' }, { value: 'calendar', label: 'Ano específico' }, { value: 'all', label: 'Todo o período' }]} />
            {period === 'calendar' && <Select variant="chip" ariaLabel="Ano do gráfico" value={year} onChange={setYearPick} options={(years.length ? years : [year]).map((y) => ({ value: y, label: y }))} />}
            <Select variant="chip" ariaLabel="Conta do gráfico" value={sel} onChange={setSel} options={[{ value: 'all', label: 'Todas as contas' }, ...active.map((a) => ({ value: a.id, label: a.name, color: a.color }))]} />
          </div>
        </div>
        {chart.length < 2 ? <p className="py-10 text-center text-sm text-muted">Sem dados para este período.</p> : (
          <div className="h-64">
            <ResponsiveContainer>
              <ComposedChart data={chart} margin={{ left: 0, right: 0, top: 8 }}>
                <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} stroke="rgb(var(--line))" minTickGap={24} />
                <YAxis yAxisId="p" tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} stroke="rgb(var(--line))" width={46} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <YAxis yAxisId="m" orientation="right" tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} stroke="rgb(var(--line))" width={40} />
                <Tooltip labelFormatter={(_, p) => (p?.[0]?.payload?.date ? fmtDate(p[0].payload.date) : '')} contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12, fontSize: 12 }}
                  formatter={(v, n) => (n === 'Pontos' ? [fmtPoints(Number(v)), 'Pontos'] : [fmtBRL(Number(v)), 'Milheiro'])} />
                <Bar yAxisId="p" dataKey="pontos" name="Pontos" fill="rgb(var(--muted) / 0.35)" radius={[4, 4, 0, 0]} animationDuration={900} />
                <Line yAxisId="m" dataKey="milheiro" name="Milheiro" stroke="rgb(var(--accent))" strokeWidth={3} dot={false} type="monotone" animationDuration={1200} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </FadeUp>

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
