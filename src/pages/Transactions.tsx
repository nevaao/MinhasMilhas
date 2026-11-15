import { useState } from 'react'
import { useAccounts, useCategories, useLedgers, useTransactions } from '../data/hooks'
import { fmtMonth } from '../lib/format'
import { TYPE_LABEL, type TxType } from '../lib/types'
import Select from '../components/Select'
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
      <div className="no-scrollbar -mx-4 -mt-2 flex items-center gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        <Select variant="chip" ariaLabel="Filtrar por conta" placeholder="Conta" value={acc} onChange={setAcc} options={[{ value: '', label: 'Todas as contas' }, ...accounts.map((a) => ({ value: a.id, label: a.name, color: a.color }))]} />
        <Select variant="chip" ariaLabel="Filtrar por categoria" placeholder="Categoria" value={cat} onChange={setCat} options={[{ value: '', label: 'Todas as categorias' }, ...categories.map((c) => ({ value: c.id, label: c.name, color: c.color }))]} />
        <Select variant="chip" ariaLabel="Filtrar por tipo" placeholder="Tipo" value={type} onChange={setType} options={[{ value: '', label: 'Todos os tipos' }, ...(Object.keys(TYPE_LABEL) as TxType[]).map((k) => ({ value: k, label: TYPE_LABEL[k] }))]} />
        {(acc || cat || type) && <button className="shrink-0 px-1 text-xs font-medium text-muted underline" onClick={() => { setAcc(''); setCat(''); setType('') }}>Limpar</button>}
      </div>
      {[...groups].map(([month, items]) => (
        <section key={month}>
          <h2 className="mb-1.5 text-sm font-semibold text-muted first-letter:uppercase">{fmtMonth(month + '-01')}</h2>
          <div className="card divide-y divide-line/60 overflow-hidden">{items.map((t, i) => <TxRow key={t.id} index={i} tx={t} accounts={accounts} categories={categories} costOut={costOut[t.id]} />)}</div>
        </section>
      ))}
      {isLoading && <ListSkeleton />}
      {!isLoading && list.length === 0 && <p className="py-10 text-center text-sm text-muted">Nenhum registro encontrado.</p>}
    </div>
  )
}
