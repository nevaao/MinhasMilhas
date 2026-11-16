import { describe, expect, it } from 'vitest'
import { matchesDestination as m } from './promoMatch'

const ssa = { iata: 'SSA', city: 'Salvador' }
describe('matchesDestination', () => {
  it('casa pelo nome da cidade, ignorando acentos e maiúsculas', () => {
    expect(m('Passagens para SALVADOR a partir de R$ 800', ssa)).toBe(true)
    expect(m('Voos para São Paulo em promoção', { iata: 'GRU', city: 'São Paulo' })).toBe(true)
    expect(m('Voos para Brasília', { iata: 'BSB', city: 'Brasília' })).toBe(true)
  })
  it('casa pelo código IATA em maiúsculas', () => {
    expect(m('GRU → LIS por 40 mil milhas', { iata: 'LIS', city: 'Lisboa' })).toBe(true)
  })
  it('usa apelidos comuns', () => {
    expect(m('Voos para o Rio por R$ 300', { iata: 'GIG', city: 'Rio de Janeiro' })).toBe(true)
    expect(m('Promoção para Nova York', { iata: 'JFK', city: 'Nova York' })).toBe(true)
  })
  it('não confunde palavras comuns nem cidades parecidas', () => {
    expect(m('Promoção de Natal com passagens a R$ 200', { iata: 'NAT', city: 'Natal' })).toBe(false)
    expect(m('Voos para Natal/RN por 12 mil milhas', { iata: 'NAT', city: 'Natal' })).toBe(true)
    expect(m('Voos para Porto Alegre', { iata: 'OPO', city: 'Porto' })).toBe(false)
    expect(m('Voos para Porto, em Portugal', { iata: 'OPO', city: 'Porto' })).toBe(true)
    expect(m('Voos para Rio Branco', { iata: 'GIG', city: 'Rio de Janeiro' })).toBe(false)
    expect(m('Que lugar bonito para viajar', { iata: 'BYO', city: 'Bonito' })).toBe(false)
  })
})
