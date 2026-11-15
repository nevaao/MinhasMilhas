import type { Tx } from './types'

export const isOut = (t: Pick<Tx, 'type'>) => t.type === 'saida' || t.type === 'transf_saida'

export interface LedgerRow<T extends Tx = Tx> {
  tx: T
  /** Custo da saída (pontos × milheiro acumulado anterior ÷ 1000). 0 para entradas. */
  costOut: number
  pointsAfter: number
  totalCostAfter: number
  /** Milheiro acumulado após a operação (R$ por 1.000 pontos). */
  milheiroAfter: number
  /** Milheiro da operação: custo ÷ pontos × 1000 (só para entradas). */
  milheiroOp: number
}

export function sortTxs<T extends Tx>(txs: T[]): T[] {
  return [...txs].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.created_at.localeCompare(b.created_at) ||
      a.id.localeCompare(b.id),
  )
}

export const milheiro = (totalCost: number, points: number) =>
  points > 0 ? (totalCost / points) * 1000 : 0

/** Custo médio ponderado, igual às fórmulas da planilha. Recebe as transações de UMA conta. */
export function computeLedger<T extends Tx>(txs: T[]): LedgerRow<T>[] {
  let points = 0
  let totalCost = 0
  return sortTxs(txs).map((tx) => {
    let costOut = 0
    let milheiroOp = 0
    if (isOut(tx)) {
      costOut = (tx.points * milheiro(totalCost, points)) / 1000
      points -= tx.points
      totalCost -= costOut
      if (points <= 0) {
        points = Math.max(points, 0)
        totalCost = 0
      }
    } else {
      points += tx.points
      totalCost += tx.cost
      milheiroOp = milheiro(tx.cost, tx.points)
    }
    return {
      tx,
      costOut,
      pointsAfter: points,
      totalCostAfter: totalCost,
      milheiroAfter: milheiro(totalCost, points),
      milheiroOp,
    }
  })
}

export interface AccountState {
  points: number
  totalCost: number
  milheiro: number
}

export function accountState(rows: LedgerRow[]): AccountState {
  const last = rows[rows.length - 1]
  return last
    ? { points: last.pointsAfter, totalCost: last.totalCostAfter, milheiro: last.milheiroAfter }
    : { points: 0, totalCost: 0, milheiro: 0 }
}

export interface ChartPoint {
  date: string
  pontos: number
  milheiro: number
}

/** Evolução de pontos × milheiro para um conjunto de contas (um ponto por dia). */
export function evolution(rowsByAccount: Record<string, LedgerRow[]>): ChartPoint[] {
  const events = Object.entries(rowsByAccount).flatMap(([acc, rows]) =>
    rows.map((r, i) => ({ acc, r, i })),
  )
  events.sort(
    (a, b) =>
      a.r.tx.date.localeCompare(b.r.tx.date) ||
      a.r.tx.created_at.localeCompare(b.r.tx.created_at) ||
      a.i - b.i,
  )
  const state: Record<string, { p: number; c: number }> = {}
  const byDate = new Map<string, ChartPoint>()
  for (const { acc, r } of events) {
    state[acc] = { p: r.pointsAfter, c: r.totalCostAfter }
    let p = 0
    let c = 0
    for (const s of Object.values(state)) {
      p += s.p
      c += s.c
    }
    byDate.set(r.tx.date, { date: r.tx.date, pontos: p, milheiro: milheiro(c, p) })
  }
  return [...byDate.values()]
}
