import { useState } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAccounts, useCategories, useTransactions } from '../data/hooks'
import { parseWorkbook, type ImportedSheet } from '../lib/importXlsx'
import { fmtBRL, fmtPoints } from '../lib/format'
import { BRAND_PREFIX, brandForName } from '../lib/brands'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export default function ImportXlsx() {
  const qc = useQueryClient()
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const { data: txs = [] } = useTransactions()
  const [sheets, setSheets] = useState<ImportedSheet[] | null>(null)
  const [force, setForce] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fileName, setFileName] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const matchAccount = (sheet: string) => {
    const n = norm(sheet)
    return accounts.find((a) => norm(a.name) === n) ?? accounts.find((a) => norm(a.name).includes(n) || n.includes(norm(a.name)))
  }
  const hasData = (sheet: string) => {
    const a = matchAccount(sheet)
    return !!a && txs.some((t) => t.account_id === a.id)
  }
  const conflict = !!sheets?.some((s) => hasData(s.sheet))

  async function pick(file?: File) {
    setMsg(null); setSheets(null); setForce(false); setFileName(file?.name ?? '')
    if (!file) return
    try {
      const parsed = await parseWorkbook(file)
      if (parsed.length === 0) setMsg({ ok: false, text: 'Não encontrei registros nessa planilha. Use o mesmo modelo: Descrição, Data, Entrada, Custo, … Saída.' })
      else setSheets(parsed)
    } catch {
      setMsg({ ok: false, text: 'Não consegui ler o arquivo. Envie um .xlsx.' })
    }
  }

  async function run() {
    if (!sheets) return
    setBusy(true); setMsg(null)
    try {
      const catIds = new Map(categories.map((c) => [c.name, c.id]))
      let total = 0
      let offset = 0
      const base = Date.now()
      for (const s of sheets) {
        let acc = matchAccount(s.sheet)
        if (!acc) {
          const brand = brandForName(s.sheet)
          const { data, error } = await supabase.from('accounts').insert({ name: s.sheet, color: brand?.color ?? '#64748b', icon: brand ? BRAND_PREFIX + brand.id : 'plane' }).select().single()
          if (error) throw new Error(error.message)
          acc = data
        }
        for (const name of new Set(s.rows.map((r) => r.categoryName).filter(Boolean) as string[])) {
          if (catIds.has(name)) continue
          const { data, error } = await supabase.from('categories').insert({ name, color: '#64748b', icon: 'tag' }).select().single()
          if (error) throw new Error(error.message)
          catIds.set(name, data.id)
        }
        // created_at crescente preserva a ordem da planilha entre registros do mesmo dia.
        const payload = s.rows.map((r) => ({
          account_id: acc!.id, category_id: r.categoryName ? catIds.get(r.categoryName) ?? null : null,
          type: r.type, date: r.date, description: r.description, points: r.points, cost: r.cost,
          created_at: new Date(base + offset++).toISOString(),
        }))
        for (let i = 0; i < payload.length; i += 200) {
          const { error } = await supabase.from('transactions').insert(payload.slice(i, i + 200))
          if (error) throw new Error(error.message)
        }
        total += payload.length
      }
      await qc.invalidateQueries()
      setSheets(null); setForce(false)
      setMsg({ ok: true, text: `${total} registros importados.` })
    } catch (e) {
      setMsg({ ok: false, text: `Erro na importação: ${(e as Error).message}. Registros já enviados podem ter sido gravados; confira em Registros.` })
    }
    setBusy(false)
  }

  return (
    <section className="card space-y-3 p-4">
      <h2 className="font-semibold">Importar planilha</h2>
      <p className="text-sm text-muted">Envie seu .xlsx de controle. Cada aba vira uma conta, com todo o histórico. O milheiro é recalculado pelo app.</p>
      <label className="btn cursor-pointer focus-within:ring-2 focus-within:ring-accent/40">
        <Upload className="h-4 w-4" />Escolher arquivo
        <input type="file" accept=".xlsx" aria-label="Arquivo da planilha" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      {fileName && <p className="flex items-center gap-2 text-sm text-muted"><FileSpreadsheet className="h-4 w-4 shrink-0 text-accent" /><span className="truncate">{fileName}</span></p>}
      {sheets && (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="num w-full text-sm">
              <thead><tr className="text-left text-xs text-muted"><th className="py-1 pr-3">Aba</th><th className="pr-3">Registros</th><th className="pr-3">Saldo</th><th className="pr-3">Milheiro</th><th>Conta</th></tr></thead>
              <tbody>
                {sheets.map((s) => {
                  const ok = !s.sheetFinal || (Math.round(s.sheetFinal.points) === Math.round(s.appFinal.points) && Math.abs(s.sheetFinal.milheiro - s.appFinal.milheiro) < 0.01)
                  return (
                    <tr key={s.sheet} className="border-t border-line align-top">
                      <td className="py-1.5 pr-3 font-medium">{s.sheet}</td>
                      <td className="pr-3">{s.rows.length}</td>
                      <td className="pr-3">{fmtPoints(s.appFinal.points)}</td>
                      <td className="pr-3">{fmtBRL(s.appFinal.milheiro)}{!ok && s.sheetFinal && <div className="text-xs text-danger">planilha: {fmtPoints(s.sheetFinal.points)} pts, {fmtBRL(s.sheetFinal.milheiro)}</div>}</td>
                      <td>{matchAccount(s.sheet)?.name ?? `Nova: ${s.sheet}`}{s.inheritedDates > 0 && <div className="text-xs text-muted">{s.inheritedDates} linha(s) sem data usaram a data da linha anterior</div>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {conflict && (
            <label className="flex items-start gap-2 text-sm text-danger">
              <input type="checkbox" className="mt-1" checked={force} onChange={(e) => setForce(e.target.checked)} />
              Já existem registros em alguma dessas contas. Importar de novo vai duplicar os lançamentos. Importar mesmo assim.
            </label>
          )}
          <button className="btn btn-primary" disabled={busy || (conflict && !force)} onClick={run}>{busy ? 'Importando…' : 'Importar'}</button>
        </div>
      )}
      {msg && <p role="alert" className={`text-sm ${msg.ok ? 'text-accent' : 'text-danger'}`}>{msg.text}</p>}
    </section>
  )
}
