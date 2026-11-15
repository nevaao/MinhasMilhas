import type { TxType } from './types'
import { computeLedger } from './ledger'
import type { Tx } from './types'

export interface ImportedRow {
  date: string
  description: string
  type: TxType
  points: number
  cost: number
  categoryName: string | null
}
export interface ImportedSheet {
  sheet: string
  rows: ImportedRow[]
  /** Linhas sem data na planilha, que receberam a data da linha anterior. */
  inheritedDates: number
  /** Saldo e milheiro finais conforme a própria planilha (últimas linhas preenchidas). */
  sheetFinal: { points: number; milheiro: number } | null
  /** Saldo e milheiro finais recalculados pelo app. */
  appFinal: { points: number; milheiro: number }
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function toIso(v: unknown): string | null {
  if (v instanceof Date && !isNaN(+v)) {
    // Células de data do Excel vêm à meia-noite UTC.
    return v.toISOString().slice(0, 10)
  }
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
  return null
}

export function guessCategory(desc: string, type: TxType): string | null {
  const d = desc.toLowerCase()
  if (type === 'bonus' || /b[ôo]nus/.test(d)) return 'Bônus'
  if (/passage|voo para|ida para|volta/.test(d) && type === 'saida') return 'Passagem'
  if (/passage/.test(d)) return 'Passagem'
  if (/fatura|cart[aã]o/.test(d)) return 'Cartão de crédito'
  if (/transfer/.test(d)) return 'Transferência'
  if (/clube/.test(d)) return 'Clube'
  if (/amazon|compra|uber|miss[aã]o/.test(d)) return 'Compras'
  return null
}

/** Converte as linhas de uma aba (colunas: Descrição, Data, Entrada, Custo, …, Saída, …, Pontos). */
export function parseSheetRows(sheet: string, data: unknown[][]): ImportedSheet {
  const rows: ImportedRow[] = []
  let sheetFinal: ImportedSheet['sheetFinal'] = null
  let inheritedDates = 0
  let lastDate: string | null = null
  for (const r of data.slice(1)) {
    const entrada = num(r[2])
    const saida = num(r[7])
    if (entrada <= 0 && saida <= 0) continue
    let date = toIso(r[1])
    if (!date) {
      if (!lastDate) continue
      date = lastDate
      inheritedDates++
    }
    lastDate = date
    const description = String(r[0] ?? '').trim() === '?' ? '' : String(r[0] ?? '').trim()
    const type: TxType = saida > 0 ? 'saida' : /b[ôo]nus/i.test(description) && !num(r[3]) ? 'bonus' : 'entrada'
    rows.push({
      date, description, type,
      points: Math.round(saida > 0 ? saida : entrada),
      cost: saida > 0 ? 0 : Math.round(num(r[3]) * 100) / 100,
      categoryName: guessCategory(description, type),
    })
    if (typeof r[9] === 'number' && typeof r[6] === 'number') sheetFinal = { points: r[9], milheiro: r[6] }
  }
  const fake: Tx[] = rows.map((x, i) => ({
    id: String(i).padStart(6, '0'), account_id: 'x', category_id: null, type: x.type, date: x.date,
    description: x.description, points: x.points, cost: x.cost, transfer_group_id: null,
    created_at: new Date(1e12 + i).toISOString(),
  }))
  const last = computeLedger(fake).at(-1)
  return { sheet, rows, inheritedDates, sheetFinal, appFinal: { points: last?.pointsAfter ?? 0, milheiro: last?.milheiroAfter ?? 0 } }
}

export async function parseWorkbook(file: File): Promise<ImportedSheet[]> {
  const { default: readExcelFile } = await import('read-excel-file/browser')
  const sheets = await readExcelFile(file)
  return sheets.map((s) => parseSheetRows(s.sheet, s.data as unknown[][])).filter((s) => s.rows.length > 0)
}
