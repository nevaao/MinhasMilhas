import { useEffect, useState } from 'react'
import { CalendarDays, Search, X } from 'lucide-react'
import { useAccounts, useCategories, useLedgers, useTransactions } from '../data/hooks'
import { fmtDate, fmtMonth, normText } from '../lib/format'
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
  const [date, setDate] = useState('')
  const [q, setQ] = useState('')

  const [limit, setLimit] = useState(30)
  useEffect(() => setLimit(30), [acc, cat, type, date, q])
  const query = normText(q)
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? ''
  const list = txs
    .filter((t) => (!acc || t.account_id === acc) && (!cat || t.category_id === cat) && (!type || t.type === type) && (!date || t.date === date))
    .filter((t) => !query || normText(t.description || catName(t.category_id)).includes(query))
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
  const visible = list.slice(0, limit)
  const groups = new Map<string, typeof list>()
  for (const t of visible) { const k = t.date.slice(0, 7); groups.set(k, [...(groups.get(k) ?? []), t]) }

  return (
    <div className="space-y-4">
      <PageHeader title="Registros" subtitle="Todo o histórico de entradas, saídas e transferências." />
      <div className="relative -mt-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input type="search" aria-label="Pesquisar pela descrição" placeholder="Pesquisar pela descrição" value={q} onChange={(e) => setQ(e.target.value)} className="input !rounded-full !py-2.5 pl-10 pr-10 !text-sm [&::-webkit-search-cancel-button]:hidden" />
        {q && <button aria-label="Limpar pesquisa" onClick={() => setQ('')} className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-line/50"><X className="h-4 w-4" /></button>}
      </div>
      <div className="no-scrollbar -mx-4 -mt-2 flex items-center gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        <Select variant="chip" ariaLabel="Filtrar por conta" placeholder="Conta" value={acc} onChange={setAcc} options={[{ value: '', label: 'Todas as contas' }, ...accounts.map((a) => ({ value: a.id, label: a.name, color: a.color }))]} />
        <Select variant="chip" ariaLabel="Filtrar por categoria" placeholder="Categoria" value={cat} onChange={setCat} options={[{ value: '', label: 'Todas as categorias' }, ...categories.map((c) => ({ value: c.id, label: c.name, color: c.color }))]} />
        <Select variant="chip" ariaLabel="Filtrar por tipo" placeholder="Tipo" value={type} onChange={setType} options={[{ value: '', label: 'Todos os tipos' }, ...(Object.keys(TYPE_LABEL) as TxType[]).map((k) => ({ value: k, label: TYPE_LABEL[k] }))]} />
        <label className={`relative inline-flex min-h-[34px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${date ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line bg-surface text-muted'}`}>
          <CalendarDays className="h-3.5 w-3.5" />{date ? fmtDate(date) : 'Data'}
          <input type="date" aria-label="Filtrar por data" value={date} onChange={(e) => setDate(e.target.value)} onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
        {(acc || cat || type || date || q) && <button className="shrink-0 px-1 text-xs font-medium text-muted underline" onClick={() => { setAcc(''); setCat(''); setType(''); setDate(''); setQ('') }}>Limpar</button>}
      </div>
      {[...groups].map(([month, items]) => (
        <section key={month}>
          <h2 className="mb-1.5 text-sm font-semibold text-muted first-letter:uppercase">{fmtMonth(month + '-01')}</h2>
          <div className="card divide-y divide-line/60 overflow-hidden">{items.map((t, i) => <TxRow key={t.id} index={i} tx={t} accounts={accounts} categories={categories} costOut={costOut[t.id]} />)}</div>
        </section>
      ))}
      {list.length > limit && <button className="btn w-full" onClick={() => setLimit((n) => n + 30)}>Mostrar mais ({list.length - limit} restantes)</button>}
      {isLoading && <ListSkeleton />}
      {!isLoading && list.length === 0 && <p className="py-10 text-center text-sm text-muted">Nenhum registro encontrado.</p>}
    </div>
  )
}
