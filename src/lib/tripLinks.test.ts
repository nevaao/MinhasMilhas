import { describe, expect, it } from 'vitest'
import { azulUrl, latamUrl, smilesUrl, type TripSearch } from './tripLinks'

const rt: TripSearch = { origin: 'GRU', destination: 'SSA', depart: '2026-12-10', ret: '2026-12-17', adults: 2, children: 1, infants: 0 }
const ow: TripSearch = { ...rt, ret: undefined, children: 0 }

describe('tripLinks', () => {
  it('Smiles: ida e volta e somente ida', () => {
    const a = new URL(smilesUrl(rt)).searchParams
    expect(a.get('originAirport')).toBe('GRU'); expect(a.get('destinationAirport')).toBe('SSA')
    expect(a.get('adults')).toBe('2'); expect(a.get('children')).toBe('1'); expect(a.get('tripType')).toBe('1')
    expect(a.get('departureDate')).toBe(String(Date.UTC(2026, 11, 10, 3)))
    expect(a.get('returnDate')).toBe(String(Date.UTC(2026, 11, 17, 3)))
    const b = new URL(smilesUrl(ow)).searchParams
    expect(b.get('tripType')).toBe('2'); expect(b.has('returnDate')).toBe(false)
  })
  it('LATAM: resgate com pontos', () => {
    const a = new URL(latamUrl(rt)).searchParams
    expect(a.get('origin')).toBe('GRU'); expect(a.get('destination')).toBe('SSA')
    expect(a.get('trip')).toBe('RT'); expect(a.get('redemption')).toBe('true'); expect(a.get('adt')).toBe('2')
    expect(a.get('outbound')).toBe('2026-12-10T15:00:00.000Z'); expect(a.get('inbound')).toBe('2026-12-17T15:00:00.000Z')
    const b = new URL(latamUrl(ow)).searchParams
    expect(b.get('trip')).toBe('OW'); expect(b.has('inbound')).toBe(false)
  })
  it('Azul: trechos, passageiros e pontos', () => {
    const a = new URL(azulUrl(rt)).searchParams
    expect(a.get('c[0].ds')).toBe('GRU'); expect(a.get('c[0].as')).toBe('SSA'); expect(a.get('c[0].std')).toBe('12/10/2026')
    expect(a.get('c[1].ds')).toBe('SSA'); expect(a.get('c[1].std')).toBe('12/17/2026')
    expect(a.get('p[0].t')).toBe('ADT'); expect(a.get('p[0].c')).toBe('2'); expect(a.get('p[1].t')).toBe('CHD')
    expect(a.get('cc')).toBe('PTS')
    expect(new URL(azulUrl(ow)).searchParams.has('c[1].ds')).toBe(false)
  })
})
