const int = new Intl.NumberFormat('pt-BR')
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const fmtPoints = (n: number) => int.format(Math.round(n))
export const fmtBRL = (n: number) => brl.format(n)
export const fmtDate = (iso: string) => iso.split('-').reverse().join('/')
export const fmtMonth = (iso: string) => {
  const [y, m] = iso.split('-')
  const names = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${names[+m - 1]} de ${y}`
}
export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const parseNum = (s: string) => {
  const v = Number(String(s).replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(v) ? v : 0
}
