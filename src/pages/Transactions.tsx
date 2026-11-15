import { useState } from 'react'
import { useAccounts, useCategories, useLedgers, useTransactions } from '../data/hooks'
import { fmtMonth } from '../lib/format'
import { TYPE_LABEL, type TxType } from '../lib/types'
import TxRow from '../components/TxRow'
import PageHeader from '../components/PageHeader'
import { ListSkeleton } from '../components/Skeleton'

export default function Transactions() {
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const { data: txs = [], isLoading } = useTransactions()
  const { costOut } = useLedgers()
  const [acc, setAcc] = useState('')
  const [cat, setCat] = useState('')
  const [type, setType] = useState('')

  const list = txs
    .filter((t) => (!acc || t.account_id === acc) && (!cat || t.category_id === cat) && (!type || t.type === type))
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
  const groups = new Map<string, typeof list>()
  for (const t of list) { const k = t.date.slice(0, 7); groups.set(k, [...(groups.get(k) ?? []), t]) }

  return (
    <div className="space-y-4">
      <PageHeader title="Registros" subtitle="Todo o histórico de entradas, saídas e transferências." />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select aria-label="Conta" className="input" value={acc} onChange={(e) => setAcc(e.target.value)}><option value="">Todas as contas</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <select aria-label="Categoria" className="input" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Todas as categorias</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select aria-label="Tipo" className="input" value={type} onChange={(e) => setType(e.target.value)}><option value="">Todos os tipos</option>{(Object.keys(TYPE_LABEL) as TxType[]).map((k) => <option key={k} value={k}>{TYPE_LABEL[k]}</option>)}</select>
      </div>
      {[...groups].map(([month, items]) => (
        <section key={month}>
          <h2 className="mb-1.5 text-sm font-semibold capitalize text-muted">{fmtMonth(month + '-01')}</h2>
          <div className="card divide-y divide-line/60 overflow-hidden">{items.map((t, i) => <TxRow key={t.id} index={i} tx={t} accounts={accounts} categories={categories} costOut={costOut[t.id]} />)}</div>
        </section>
      ))}
      {isLoading && <ListSkeleton />}
      {!isLoading && list.length === 0 && <p className="py-10 text-center text-sm text-muted">Nenhum registro encontrado.</p>}
    </div>
  )
}
