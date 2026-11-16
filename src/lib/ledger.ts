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

export interface ExitSimulation {
  /** Custo da saída (equivale à coluna "Custo da saída/passagem" da planilha). */
  cost: number
  pointsAfter: number
  totalCostAfter: number
  milheiroAfter: number
  insufficient: boolean
}

/** Simula uma saída de `points` sobre o estado atual da conta, sem gravar nada. */
export function simulateExit(state: AccountState, points: number): ExitSimulation {
  const cost = (points * state.milheiro) / 1000
  const insufficient = points > state.points
  const pointsAfter = Math.max(state.points - points, 0)
  const totalCostAfter = pointsAfter > 0 ? Math.max(state.totalCost - cost, 0) : 0
  return { cost, pointsAfter, totalCostAfter, milheiroAfter: milheiro(totalCostAfter, pointsAfter), insufficient }
}
