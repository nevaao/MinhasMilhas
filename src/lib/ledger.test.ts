import { describe, expect, it } from 'vitest'
import { computeLedger, accountState } from './ledger'
import type { Tx, TxType } from './types'

let n = 0
const tx = (type: TxType, date: string, points: number, cost = 0): Tx => ({
  id: String(++n).padStart(4, '0'),
  account_id: 'a',
  category_id: null,
  type,
  date,
  description: '',
  points,
  cost,
  transfer_group_id: null,
  created_at: `2025-01-01T00:00:${String(n).padStart(2, '0')}Z`,
})

describe('computeLedger (valores da planilha)', () => {
  it('Smiles: reproduz as primeiras linhas', () => {
    const rows = computeLedger([
      tx('entrada', '2025-04-15', 1000, 39.9),
      tx('bonus', '2025-04-15', 13000),
      tx('bonus', '2025-04-16', 1160),
      tx('entrada', '2025-05-15', 1000, 39.9),
      tx('saida', '2025-05-23', 12000),
    ])
    expect(rows[0].milheiroAfter).toBeCloseTo(39.9, 4)
    expect(rows[1].milheiroAfter).toBeCloseTo(2.85, 4)
    expect(rows[2].milheiroAfter).toBeCloseTo(2.631926121, 6)
    expect(rows[3].milheiroAfter).toBeCloseTo(4.938118812, 6)
    const out = rows[4]
    expect(out.pointsAfter).toBe(4160)
    expect(out.costOut).toBeCloseTo(59.25742574, 6)
    expect(out.totalCostAfter).toBeCloseTo(20.54257426, 6)
    expect(out.milheiroAfter).toBeCloseTo(4.938118812, 6)
  })

  it('LATAM: entrada, passagem e acumulação por voo', () => {
    const rows = computeLedger([
      tx('entrada', '2025-11-28', 15000, 86.29),
      tx('saida', '2025-11-28', 14014),
      tx('entrada', '2025-11-28', 1704),
    ])
    expect(rows[1].pointsAfter).toBe(986)
    expect(rows[1].totalCostAfter).toBeCloseTo(5.672129333, 6)
    expect(rows[2].milheiroAfter).toBeCloseTo(2.108598265, 6)
  })

  it('zera o custo quando o saldo chega a zero', () => {
    const s = accountState(computeLedger([tx('entrada', '2025-01-01', 1000, 30), tx('saida', '2025-01-02', 1000)]))
    expect(s).toEqual({ points: 0, totalCost: 0, milheiro: 0 })
  })
})
