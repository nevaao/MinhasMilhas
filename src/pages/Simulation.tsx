import { useState } from 'react'
import { motion } from 'framer-motion'
import { Info, TriangleAlert } from 'lucide-react'
import { useAccounts, useLedgers } from '../data/hooks'
import { simulateExit } from '../lib/ledger'
import { fmtBRL, fmtPoints, parseNum } from '../lib/format'
import PageHeader from '../components/PageHeader'
import Select from '../components/Select'
import AnimatedNumber from '../components/AnimatedNumber'
import { Badge } from '../components/Icon'

export default function Simulation() {
  const { data: accounts = [] } = useAccounts()
  const { states } = useLedgers()
  const active = accounts.filter((a) => !a.archived)
  const [accId, setAccId] = useState('')
  const [miles, setMiles] = useState('')

  const account = active.find((a) => a.id === accId) ?? active[0]
  const state = (account && states[account.id]) || { points: 0, totalCost: 0, milheiro: 0 }
  const points = Math.round(parseNum(miles))
  const sim = account && points > 0 ? simulateExit(state, points) : null

  const rows: [string, string][] = sim
    ? [
        ['Milheiro acumulado da conta', fmtBRL(state.milheiro)],
        ['Saldo atual', `${fmtPoints(state.points)} pts`],
        ['Saldo depois da saída', `${fmtPoints(sim.pointsAfter)} pts`],
        ['Custo total restante na conta', fmtBRL(sim.totalCostAfter)],
      ]
    : []

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader back="/viagens" title="Simulação" subtitle="Veja quanto custa uma emissão sem registrar nada." />

      <div className="card space-y-4 p-4">
        <div>
          <label className="label" htmlFor="sim-acc">Conta</label>
          <Select id="sim-acc" value={account?.id ?? ''} onChange={setAccId} placeholder="Cadastre uma conta"
            options={active.map((a) => ({ value: a.id, label: `${a.name} · ${fmtPoints(states[a.id]?.points ?? 0)} pts`, color: a.color }))} />
        </div>
        <div>
          <label className="label" htmlFor="sim-miles">Milhas a utilizar</label>
          <input id="sim-miles" inputMode="numeric" className="input" placeholder="Ex.: 40.000" value={miles} onChange={(e) => setMiles(e.target.value)} />
        </div>
      </div>

      {sim && account ? (
        <motion.div key={account.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
          <div className="hero rounded-3xl p-5 shadow-float">
            <div className="flex items-center gap-2 text-sm text-white/80"><Badge color={account.color} icon={account.icon} size={28} />{account.name}</div>
            <div className="mt-3 text-sm text-white/75">Custo da saída / custo da passagem</div>
            <AnimatedNumber value={sim.cost} format={fmtBRL} className="num block font-display text-4xl font-bold" />
            <div className="num mt-1 text-sm text-white/75">{fmtPoints(points)} milhas × {fmtBRL(state.milheiro)} por milheiro</div>
          </div>
          {sim.insufficient && (
            <p role="alert" className="card flex items-start gap-2 p-3 text-sm text-danger"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />Saldo insuficiente: a conta tem {fmtPoints(state.points)} pts.</p>
          )}
          <div className="card space-y-2 p-4 text-sm">
            {rows.map(([l, v]) => <div key={l} className="flex justify-between gap-3"><span className="text-muted">{l}</span><span className="num font-semibold">{v}</span></div>)}
          </div>
        </motion.div>
      ) : (
        <p className="mt-6 flex items-start gap-2 px-1 text-sm text-muted"><Info className="mt-0.5 h-4 w-4 shrink-0" />Escolha a conta e informe as milhas para ver o custo. Nada é salvo.</p>
      )}
      {sim && <p className="mt-3 px-1 text-xs text-muted">Simulação: nenhum registro é criado. O custo usa o milheiro acumulado atual da conta, igual à coluna de custo da saída da planilha.</p>}
    </div>
  )
}
