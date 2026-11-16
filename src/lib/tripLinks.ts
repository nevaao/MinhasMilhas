export interface TripSearch {
  origin: string // IATA
  destination: string // IATA
  depart: string // YYYY-MM-DD
  ret?: string // YYYY-MM-DD, vazio = somente ida
  adults: number
  children: number
  infants: number
}

/**
 * Endereços de busca com milhas de cada programa. Os formatos de URL vêm dos próprios sites e podem
 * mudar; se um deles deixar de preencher a busca, ajuste somente a função correspondente aqui.
 */
const brDate = (iso: string) => iso.split('-').reverse().join('/')
const usDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${m}/${d}/${y}` }
const ms = (iso: string) => new Date(`${iso}T00:00:00-03:00`).getTime()

export function smilesUrl(s: TripSearch): string {
  const p = new URLSearchParams({
    adults: String(s.adults), children: String(s.children), infants: String(s.infants), cabin: 'ALL',
    departureDate: String(ms(s.depart)), ...(s.ret ? { returnDate: String(ms(s.ret)) } : {}),
    isElegible: 'false', isFlexibleDateChecked: 'false', searchType: 'g3', segments: '1',
    tripType: s.ret ? '1' : '2', originAirport: s.origin, destinationAirport: s.destination,
    originAirportIsAny: 'false', destinAirportIsAny: 'false', 'novo-resultado-voos': 'true',
  })
  return `https://www.smiles.com.br/mfe/emissao-passagem?${p}`
}

export function latamUrl(s: TripSearch): string {
  const at = (iso: string) => `${iso}T15:00:00.000Z`
  const p = new URLSearchParams({
    origin: s.origin, destination: s.destination, outbound: at(s.depart), ...(s.ret ? { inbound: at(s.ret) } : {}),
    adt: String(s.adults), chd: String(s.children), inf: String(s.infants),
    trip: s.ret ? 'RT' : 'OW', cabin: 'Economy', redemption: 'true', sort: 'RECOMMENDED',
  })
  return `https://www.latamairlines.com/br/pt/oferta-voos?${p}`
}

export function azulUrl(s: TripSearch): string {
  const p = new URLSearchParams()
  p.set('c[0].ds', s.origin); p.set('c[0].std', usDate(s.depart)); p.set('c[0].as', s.destination)
  if (s.ret) { p.set('c[1].ds', s.destination); p.set('c[1].std', usDate(s.ret)); p.set('c[1].as', s.origin) }
  let i = 0
  const pax = (t: string, n: number) => { if (n > 0) { p.set(`p[${i}].t`, t); p.set(`p[${i}].c`, String(n)); p.set(`p[${i}].cp`, 'false'); i++ } }
  pax('ADT', s.adults); pax('CHD', s.children); pax('INF', s.infants)
  p.set('f.dl', '3'); p.set('f.dr', '3'); p.set('cc', 'PTS')
  return `https://www.voeazul.com.br/br/pt/home/selecao-voo?${p}`
}

export const PROGRAMS = [
  { id: 'smiles', name: 'Smiles', logo: '/logos/smiles.jpg', url: smilesUrl },
  { id: 'latam', name: 'LATAM Pass', logo: '/logos/latam.jpg', url: latamUrl },
  { id: 'azul', name: 'Azul Fidelidade', logo: '/logos/azul.jpg', url: azulUrl },
] as const

export { brDate }
