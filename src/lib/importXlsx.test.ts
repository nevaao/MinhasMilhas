import { describe, expect, it } from 'vitest'
import { parseSheetRows } from './importXlsx'

const d = (s: string) => new Date(s + 'T00:00:00.000Z')
const head = ['Descrição', 'Data', 'Entrada', 'Custo', 'Custo total', 'Milheiro da operação', 'Milheiro acumulado', 'Saída', 'Custo da saída', 'Pontos']

describe('parseSheetRows', () => {
  it('converte linhas, detecta bônus e usa a data anterior quando falta', () => {
    const r = parseSheetRows('Smiles', [
      head,
      ['Clube Smiles', d('2025-04-15'), 1000, 39.9, 39.9, 39.9, 39.9, null, 0, 1000],
      ['Clube Smiles (Bônus)', d('2025-04-15'), 13000, null, 39.9, 0, 2.85, null, 0, 14000],
      ['Pontos expirados?', null, null, null, 30, 0, 2.1, 114, 0.2, 13886],
    ])
    expect(r.rows.map((x) => x.type)).toEqual(['entrada', 'bonus', 'saida'])
    expect(r.rows[2].date).toBe('2025-04-15')
    expect(r.inheritedDates).toBe(1)
    expect(r.rows[1].categoryName).toBe('Bônus')
    expect(r.appFinal.points).toBe(13886)
  })
})
