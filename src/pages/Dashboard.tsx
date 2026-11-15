import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAccounts, useCategories, useLedgers, useTransactions } from '../data/hooks'
import { evolution } from '../lib/ledger'
import { fmtBRL, fmtDate, fmtPoints } from '../lib/format'
import { Badge } from '../components/Icon'
import TxRow from '../components/TxRow'

export default function Dashboard() {
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const { data: txs = [] } = useTransactions()
  const { rows, states, costOut } = useLedgers()
  const [sel, setSel] = useState('all')

  const active = accounts.filter((a) => !a.archived)
  const totals = useMemo(() => {
    let p = 0, c = 0
    for (const a of active) { p += states[a.id]?.points ?? 0; c += states[a.id]?.totalCost ?? 0 }
    return { p, c, m: p > 0 ? (c / p) * 1000 : 0 }
  }, [active, states])

  const chart = useMemo(() => {
    const subset = sel === 'all' ? Object.fromEntries(Object.entries(rows).filter(([id]) => active.some((a) => a.id === id))) : { [sel]: rows[sel] ?? [] }
    return evolution(subset).map((d) => ({ ...d, label: fmtDate(d.date).slice(0, 5) + '/' + d.date.slice(2, 4), milheiro: +d.milheiro.toFixed(2) }))
  }, [rows, sel, active])

  const recent = [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)).slice(0, 8)

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Resumo</h1><p className="text-sm text-muted">Seus pontos e o custo médio por milheiro.</p></div>
        <Link to="/novo" className="btn btn-primary hidden md:inline-flex">Novo registro</Link>
      </header>

      <section className="card grid grid-cols-3 divide-x divide-line">
        {[['Pontos', fmtPoints(totals.p)], ['Investido', fmtBRL(totals.c)], ['Milheiro médio', fmtBRL(totals.m)]].map(([l, v]) => (
          <div key={l} className="min-w-0 p-3 md:p-4"><div className="text-xs text-muted">{l}</div><div className="num truncate text-base font-semibold md:text-xl">{v}</div></div>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((a) => {
          const s = states[a.id] ?? { points: 0, totalCost: 0, milheiro: 0 }
          return (
            <div key={a.id} className="card flex items-center gap-3 p-4">
              <Badge color={a.color} icon={a.icon} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{a.name}</div>
                <div className="num text-lg font-semibold">{fmtPoints(s.points)} <span className="text-xs font-normal text-muted">pts</span></div>
              </div>
              <div className="num text-right"><div className="text-xs text-muted">milheiro</div><div className="text-sm font-medium">{fmtBRL(s.milheiro)}</div></div>
            </div>
          )
        })}
        {active.length === 0 && <p className="text-sm text-muted">Cadastre uma conta em Contas para começar.</p>}
      </section>

      <section className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Pontos × milheiro</h2>
          <select aria-label="Conta do gráfico" className="input !w-auto" value={sel} onChange={(e) => setSel(e.target.value)}>
            <option value="all">Todas as contas</option>
            {active.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        {chart.length < 2 ? <p className="py-10 text-center text-sm text-muted">O gráfico aparece quando houver registros em pelo menos duas datas.</p> : (
          <div className="h-64">
            <ResponsiveContainer>
              <ComposedChart data={chart} margin={{ left: 0, right: 0, top: 8 }}>
                <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} stroke="rgb(var(--line))" minTickGap={24} />
                <YAxis yAxisId="p" tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} stroke="rgb(var(--line))" width={46} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <YAxis yAxisId="m" orientation="right" tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} stroke="rgb(var(--line))" width={40} />
                <Tooltip contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n) => (n === 'Pontos' ? [fmtPoints(Number(v)), 'Pontos'] : [fmtBRL(Number(v)), 'Milheiro'])} />
                <Bar yAxisId="p" dataKey="pontos" name="Pontos" fill="rgb(var(--muted) / 0.35)" radius={[3, 3, 0, 0]} />
                <Line yAxisId="m" dataKey="milheiro" name="Milheiro" stroke="rgb(var(--accent))" strokeWidth={2.5} dot={false} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Últimos registros</h2><Link to="/registros" className="text-sm text-accent">Ver todos</Link></div>
        <div className="card divide-y divide-line overflow-hidden">
          {recent.map((t) => <TxRow key={t.id} tx={t} accounts={accounts} categories={categories} costOut={costOut[t.id]} />)}
          {recent.length === 0 && <p className="p-6 text-center text-sm text-muted">Nenhum registro ainda. Toque em “Novo registro”.</p>}
        </div>
      </section>
    </div>
  )
}
