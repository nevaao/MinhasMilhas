import { Link } from 'react-router-dom'
import type { Account, Category, Tx } from '../lib/types'
import { isOut } from '../lib/ledger'
import { fmtBRL, fmtDate, fmtPoints } from '../lib/format'
import { Badge } from './Icon'

export default function TxRow({ tx, accounts, categories, costOut }: { tx: Tx; accounts: Account[]; categories: Category[]; costOut?: number }) {
  const acc = accounts.find((a) => a.id === tx.account_id)
  const cat = categories.find((c) => c.id === tx.category_id)
  const out = isOut(tx)
  const money = out ? costOut ?? 0 : tx.cost
  return (
    <Link to={`/registros/${tx.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-line/30">
      <Badge color={cat?.color ?? '#64748b'} icon={cat?.icon ?? 'tag'} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{tx.description || cat?.name || 'Sem descrição'}</div>
        <div className="truncate text-xs text-muted">{acc?.name} · {fmtDate(tx.date)}</div>
      </div>
      <div className="num shrink-0 text-right">
        <div className={`text-sm font-medium ${out ? 'text-danger' : 'text-accent'}`}>{out ? '−' : '+'}{fmtPoints(tx.points)}</div>
        <div className="text-xs text-muted">{money > 0 ? fmtBRL(money) : '—'}</div>
      </div>
    </Link>
  )
}
