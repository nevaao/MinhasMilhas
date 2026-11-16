/** Casamento entre o título de uma promoção e um destino favorito (mesma lógica da função promo-watch). */
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const ALIASES: Record<string, string[]> = {
  GIG: ['rio de janeiro', 'rio'], SDU: ['rio de janeiro', 'rio'],
  GRU: ['sao paulo'], CGH: ['sao paulo'], VCP: ['campinas'],
  JFK: ['nova york', 'new york'], EWR: ['nova york', 'new york'], LGA: ['nova york', 'new york'],
  PTY: ['panama'], MEX: ['mexico'], MIA: ['miami'], MCO: ['orlando'],
  EZE: ['buenos aires'], AEP: ['buenos aires'], LHR: ['londres'], LGW: ['londres'],
}
// Nomes que também são palavras comuns: só valem com contexto de destino.
const AMBIGUOUS = new Set(['natal', 'palmas', 'bonito', 'porto', 'lima', 'nice'])
// Evita confundir cidades com nomes parecidos.
const NOT_FOLLOWED_BY: Record<string, string> = {
  porto: '(?! alegre| seguro| velho| de galinhas| de pedras)',
  rio: '(?! branco| grande| preto)',
}
// Códigos IATA que também são palavras comuns em títulos.
const COMMON_IATA = new Set(['FOR', 'THE', 'SEA', 'MAD', 'LAS', 'NAT'])

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function matchesDestination(title: string, dest: { iata: string; city: string }): boolean {
  if (!COMMON_IATA.has(dest.iata) && new RegExp(`(^|[^A-Za-z])${dest.iata}([^A-Za-z]|$)`).test(title)) return true
  const t = norm(title)
  const names = [norm(dest.city), ...(ALIASES[dest.iata] ?? [])]
  for (const name of names) {
    const base = esc(name)
    const tail = NOT_FOLLOWED_BY[name] ?? ''
    if (AMBIGUOUS.has(name)) {
      const ctx = new RegExp(`\\b(para|em|rumo a|voos? a|voe a|voar a|ida a|viaje a)\\s+${base}\\b${tail}|\\b${base}\\s*(/|\\()\\s*[a-z]{2,3}\\b`)
      if (ctx.test(t)) return true
    } else if (new RegExp(`\\b${base}\\b${tail}`).test(t)) return true
  }
  return false
}
