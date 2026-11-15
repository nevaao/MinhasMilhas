import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAccounts, useCategories, useLedgers, useTransactions } from '../data/hooks'
import { fmtDate, fmtPoints, today } from '../lib/format'
import { isOut } from '../lib/ledger'
import { TYPE_LABEL, type TxType } from '../lib/types'
import TxRow from '../components/TxRow'
import PageHeader from '../components/PageHeader'
import { ListSkeleton } from '../components/Skeleton'

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const weekday = (iso: string) => WEEKDAYS[new Date(iso + 'T12:00:00').getDay()]

export default function Transactions() {
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const { data: txs = [], isLoading } = useTransactions()
  const { costOut } = useLedgers()
  const [acc, setAcc] = useState('')
  const [cat, setCat] = useState('')
  const [type, setType] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [dir, setDir] = useState(1)

  const filtered = useMemo(
    () => txs.filter((t) => (!acc || t.account_id === acc) && (!cat || t.category_id === cat) && (!type || t.type === type)),
    [txs, acc, cat, type],
  )
  // Dias que possuem registros (com os filtros atuais), do mais antigo ao mais recente.
  const days = useMemo(() => [...new Set(filtered.map((t) => t.date))].sort(), [filtered])
  const day = picked ?? days[days.length - 1] ?? today()
  const prev = [...days].reverse().find((d) => d < day)
  const next = days.find((d) => d > day)

  const list = filtered
    .filter((t) => t.date === day)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  const inPts = list.filter((t) => !isOut(t)).reduce((s, t) => s + t.points, 0)
  const outPts = list.filter(isOut).reduce((s, t) => s + t.points, 0)

  const go = (d: string | undefined, direction: number) => { if (d) { setDir(direction); setPicked(d) } }

  return (
    <div className="space-y-4">
      <PageHeader title="Registros" subtitle="Entradas, saídas e transferências por dia." />

      <div className="card flex items-center gap-1 p-1.5">
        <motion.button whileTap={{ scale: 0.9 }} aria-label="Dia anterior com registros" disabled={!prev} onClick={() => go(prev, -1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted disabled:opacity-30"><ChevronLeft /></motion.button>
        <label className="relative flex min-w-0 flex-1 cursor-pointer flex-col items-center py-1 text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={day} initial={{ opacity: 0, x: dir * 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -16 }} transition={{ duration: 0.14 }} className="flex flex-col items-center">
              <span className="num flex items-center gap-1.5 font-display text-lg font-bold"><CalendarDays className="h-4 w-4 text-accent" />{fmtDate(day)}</span>
              <span className="text-xs capitalize text-muted">{day === today() ? 'hoje · ' : ''}{weekday(day)}</span>
            </motion.span>
          </AnimatePresence>
          <input type="date" aria-label="Escolher data" value={day} onChange={(e) => { if (e.target.value) go(e.target.value, e.target.value > day ? 1 : -1) }} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
        <motion.button whileTap={{ scale: 0.9 }} aria-label="Próximo dia com registros" disabled={!next} onClick={() => go(next, 1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted disabled:opacity-30"><ChevronRight /></motion.button>
      </div>
      {day !== today() && <button className="-mt-1 text-sm font-medium text-accent" onClick={() => go(today(), 1)}>Ir para hoje</button>}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select aria-label="Conta" className="input" value={acc} onChange={(e) => setAcc(e.target.value)}><option value="">Todas as contas</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <select aria-label="Categoria" className="input" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Todas as categorias</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select aria-label="Tipo" className="input" value={type} onChange={(e) => setType(e.target.value)}><option value="">Todos os tipos</option>{(Object.keys(TYPE_LABEL) as TxType[]).map((k) => <option key={k} value={k}>{TYPE_LABEL[k]}</option>)}</select>
      </div>

      {isLoading ? <ListSkeleton /> : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={day + acc + cat + type} initial={{ opacity: 0, x: dir * 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="space-y-3">
            {list.length > 0 && (
              <div className="num flex justify-between px-1 text-sm text-muted">
                <span>{list.length} {list.length === 1 ? 'registro' : 'registros'}</span>
                <span>{inPts > 0 && <span className="text-accent">+{fmtPoints(inPts)}</span>}{inPts > 0 && outPts > 0 && ' · '}{outPts > 0 && <span className="text-danger">−{fmtPoints(outPts)}</span>}</span>
              </div>
            )}
            {list.length > 0 ? (
              <div className="card divide-y divide-line/60 overflow-hidden">{list.map((t, i) => <TxRow key={t.id} index={i} tx={t} accounts={accounts} categories={categories} costOut={costOut[t.id]} />)}</div>
            ) : (
              <div className="card p-8 text-center text-sm text-muted">
                Nenhum registro em {fmtDate(day)}.
                {(prev || next) && <div className="mt-3 flex justify-center gap-3">
                  {prev && <button className="btn !min-h-[38px]" onClick={() => go(prev, -1)}>Dia anterior: {fmtDate(prev)}</button>}
                  {next && <button className="btn !min-h-[38px]" onClick={() => go(next, 1)}>Próximo: {fmtDate(next)}</button>}
                </div>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
