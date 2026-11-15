import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sheet from '../components/Sheet'
import { useToast } from '../components/Toast'
import { useAccounts, useCategories, useCreateTransfer, useDeleteTx, useSaveTx, useTransactions } from '../data/hooks'
import { computeLedger } from '../lib/ledger'
import { fmtBRL, fmtPoints, parseNum, today } from '../lib/format'
import type { Tx, TxType } from '../lib/types'

type Mode = 'entrada' | 'saida' | 'transferencia'

export default function TxForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const loc = useLocation()
  const toast = useToast()
  const [search] = useSearchParams()
  const close = () => ((loc.state as { background?: unknown } | null)?.background ? nav(-1) : nav('/', { replace: true }))
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const { data: txs = [] } = useTransactions()
  const save = useSaveTx()
  const transfer = useCreateTransfer()
  const del = useDeleteTx()

  const editing = id ? txs.find((t) => t.id === id) : undefined
  const active = accounts.filter((a) => !a.archived)

  const tipo = search.get('tipo')
  const [mode, setMode] = useState<Mode>(tipo === 'saida' || tipo === 'transferencia' ? tipo : 'entrada')
  const [account, setAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [date, setDate] = useState(today())
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [points, setPoints] = useState('')
  const [pointsIn, setPointsIn] = useState('')
  const [bonus, setBonus] = useState('')
  const [cost, setCost] = useState('')
  const [bonusType, setBonusType] = useState(false)
  const [error, setError] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    if (!editing) return
    setMode(editing.type === 'saida' ? 'saida' : 'entrada')
    setAccount(editing.account_id); setDate(editing.date); setDescription(editing.description)
    setCategory(editing.category_id ?? ''); setPoints(String(editing.points))
    setCost(editing.cost ? String(editing.cost).replace('.', ',') : ''); setBonusType(editing.type === 'bonus')
  }, [editing])
  useEffect(() => { if (!account && active[0]) setAccount(active[0].id) }, [active, account])
  useEffect(() => { if (!toAccount && active[1]) setToAccount(active[1].id) }, [active, toAccount])

  const isTransferEdit = !!editing?.transfer_group_id
  const pts = Math.round(parseNum(points))
  const costNum = parseNum(cost)

  const ledgerFor = (accId: string, extra?: Tx) => {
    const base = txs.filter((t) => t.account_id === accId && t.id !== editing?.id)
    return computeLedger(extra ? [...base, extra] : base)
  }
  const hypo = (accId: string, type: TxType, p: number, c: number): Tx => ({
    id: 'zzzz', account_id: accId, category_id: null, type, date, description: '', points: p, cost: c,
    transfer_group_id: null, created_at: '9999-12-31T00:00:00Z',
  })

  const preview = useMemo(() => {
    if (!account || pts <= 0) return null
    if (mode === 'entrada') {
      const r = ledgerFor(account, hypo(account, bonusType ? 'bonus' : 'entrada', pts, costNum)).at(-1)!
      return { lines: [['Milheiro da operação', fmtBRL(r.milheiroOp)], ['Novo saldo', `${fmtPoints(r.pointsAfter)} pts`], ['Novo milheiro acumulado', fmtBRL(r.milheiroAfter)]] }
    }
    if (mode === 'saida') {
      const before = ledgerFor(account).at(-1)?.pointsAfter ?? 0
      const r = ledgerFor(account, hypo(account, 'saida', pts, 0)).at(-1)!
      return { warn: pts > before ? `Saldo insuficiente na data: ${fmtPoints(before)} pts.` : '', lines: [['Custo da saída', fmtBRL(r.costOut)], ['Novo saldo', `${fmtPoints(r.pointsAfter)} pts`], ['Novo milheiro acumulado', fmtBRL(r.milheiroAfter)]] }
    }
    if (!toAccount || toAccount === account) return null
    const before = ledgerFor(account).at(-1)?.pointsAfter ?? 0
    const out = ledgerFor(account, hypo(account, 'transf_saida', pts, 0)).at(-1)!
    const pIn = Math.round(parseNum(pointsIn)) || pts
    const b = Math.round(parseNum(bonus))
    const costIn = out.costOut + costNum
    const dest = ledgerFor(toAccount, hypo(toAccount, 'transf_entrada', pIn, costIn))
    const dest2 = b > 0 ? computeLedger([...dest.map((r) => r.tx), hypo(toAccount, 'bonus', b, 0)]).at(-1)! : dest.at(-1)!
    return {
      warn: pts > before ? `Saldo insuficiente na origem: ${fmtPoints(before)} pts.` : '',
      lines: [['Custo herdado da origem', fmtBRL(out.costOut)], ['Custo total no destino', fmtBRL(costIn)], ['Novo saldo no destino', `${fmtPoints(dest2.pointsAfter)} pts`], ['Novo milheiro no destino', fmtBRL(dest2.milheiroAfter)]],
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, account, toAccount, date, pts, pointsIn, bonus, costNum, bonusType, txs, editing])

  async function submit(e: FormEvent) {
    e.preventDefault(); setError('')
    if (pts <= 0) return setError('Informe a quantidade de pontos.')
    try {
      if (mode === 'transferencia') {
        if (!toAccount || toAccount === account) return setError('Escolha contas de origem e destino diferentes.')
        const out = ledgerFor(account, hypo(account, 'transf_saida', pts, 0)).at(-1)!
        await transfer.mutateAsync({
          p_from: account, p_to: toAccount, p_date: date, p_description: description || 'Transferência de pontos', p_category: category || null,
          p_points_out: pts, p_cost_out: +out.costOut.toFixed(2), p_points_in: Math.round(parseNum(pointsIn)) || pts,
          p_cost_in: +(out.costOut + costNum).toFixed(2), p_bonus: Math.round(parseNum(bonus)),
        })
      } else {
        const type: TxType = mode === 'saida' ? 'saida' : bonusType ? 'bonus' : 'entrada'
        await save.mutateAsync({
          ...(editing ? { id: editing.id } : {}), account_id: account, category_id: category || null, type, date, description,
          points: pts, cost: mode === 'saida' ? 0 : +costNum.toFixed(2),
        })
      }
      toast(editing ? 'Registro atualizado' : mode === 'transferencia' ? 'Transferência registrada' : 'Registro salvo')
      close()
    } catch (err) { setError((err as Error).message) }
  }

  const modes: [Mode, string][] = [['entrada', 'Entrada'], ['saida', 'Saída'], ['transferencia', 'Transferência']]
  const busy = save.isPending || transfer.isPending

  const title = editing ? 'Editar registro' : 'Novo registro'
  if (id && !editing) return <Sheet title={title} onClose={close}><p className="py-8 text-center text-muted">Carregando registro…</p></Sheet>

  const footer = (
    <div className="flex flex-wrap gap-2">
      <motion.button whileTap={{ scale: 0.97 }} type="submit" form="txform" className="btn btn-primary flex-1" disabled={busy || isTransferEdit}>{busy ? 'Salvando…' : 'Salvar'}</motion.button>
      {editing && (confirmDel
        ? <motion.button initial={{ scale: 0.9 }} animate={{ scale: 1 }} type="button" className="btn btn-danger" onClick={async () => { await del.mutateAsync(editing); toast('Registro excluído'); close() }}>Confirmar</motion.button>
        : <button type="button" className="btn btn-danger" onClick={() => setConfirmDel(true)}>Excluir</button>)}
    </div>
  )

  return (
    <Sheet title={title} onClose={close} footer={footer}>
      <form id="txform" onSubmit={submit} className="space-y-4">
        {!editing && (
          <div role="tablist" className="grid grid-cols-3 gap-1 rounded-2xl bg-line/50 p-1">
            {modes.map(([m, l]) => (
              <button type="button" role="tab" aria-selected={mode === m} key={m} onClick={() => setMode(m)}
                className={`relative rounded-xl py-2.5 text-sm font-semibold transition-colors ${mode === m ? 'text-fg' : 'text-muted'}`}>
                {mode === m && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-xl bg-surface shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                <span className="relative">{l}</span>
              </button>
            ))}
          </div>
        )}
        {isTransferEdit && <p className="card p-3 text-sm text-muted">Este registro faz parte de uma transferência. Para corrigir, exclua e crie novamente (a exclusão remove os dois lados).</p>}
        <fieldset disabled={isTransferEdit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="acc">{mode === 'transferencia' ? 'Origem' : 'Conta'}</label>
              <select id="acc" className="input" value={account} onChange={(e) => setAccount(e.target.value)}>{active.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            {mode === 'transferencia'
              ? <div><label className="label" htmlFor="to">Destino</label>
                  <select id="to" className="input" value={toAccount} onChange={(e) => setToAccount(e.target.value)}>{active.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              : <div><label className="label" htmlFor="date">Data</label><input id="date" type="date" className="input" required value={date} onChange={(e) => setDate(e.target.value)} /></div>}
          </div>
          {mode === 'transferencia' && <div><label className="label" htmlFor="date">Data</label><input id="date" type="date" className="input" required value={date} onChange={(e) => setDate(e.target.value)} /></div>}
          <div><label className="label" htmlFor="desc">Descrição</label><input id="desc" className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Clube Smiles, passagem para Bonito" /></div>
          <div><label className="label" htmlFor="cat">Categoria</label>
            <select id="cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Sem categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="pts">{mode === 'saida' ? 'Pontos utilizados' : mode === 'transferencia' ? 'Pontos enviados' : 'Pontos'}</label>
              <input id="pts" inputMode="numeric" className="input" required value={points} onChange={(e) => setPoints(e.target.value)} /></div>
            {mode === 'transferencia' && <div><label className="label" htmlFor="pin">Pontos recebidos (se diferente)</label><input id="pin" inputMode="numeric" className="input" value={pointsIn} onChange={(e) => setPointsIn(e.target.value)} placeholder={points || 'igual ao enviado'} /></div>}
            {mode === 'transferencia' && <div><label className="label" htmlFor="bon">Pontos de bônus</label><input id="bon" inputMode="numeric" className="input" value={bonus} onChange={(e) => setBonus(e.target.value)} placeholder="0" /></div>}
            {mode !== 'saida' && <div><label className="label" htmlFor="cost">{mode === 'transferencia' ? 'Custo extra (R$)' : 'Custo (R$)'}</label><input id="cost" inputMode="decimal" className="input" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0,00" /></div>}
          </div>
          {mode === 'entrada' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--accent))]" checked={bonusType} onChange={(e) => setBonusType(e.target.checked)} />Este registro é um bônus</label>}
        </fieldset>

        {preview && (
          <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card space-y-1.5 p-4 text-sm">
            {preview.lines.map(([l, v]) => <div key={l} className="flex justify-between gap-3"><span className="text-muted">{l}</span><span className="num font-semibold">{v}</span></div>)}
            {'warn' in preview && preview.warn && <p className="pt-1 text-danger">{preview.warn}</p>}
          </motion.div>
        )}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </form>
    </Sheet>
  )
}
