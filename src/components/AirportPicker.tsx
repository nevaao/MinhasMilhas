import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { AIRPORTS, airportByIata, airportLabel } from '../lib/airports'
import { normText } from '../lib/format'

/** Campo com busca de aeroportos por cidade, código ou nome. */
export default function AirportPicker({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (iata: string) => void }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const a = airportByIata(value)
    setText(a ? airportLabel(a) : '')
  }, [value])

  useEffect(() => {
    const close = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const list = useMemo(() => {
    const q = normText(text)
    if (!q || airportByIata(value) && airportLabel(airportByIata(value)!) === text) return AIRPORTS.slice(0, 8)
    return AIRPORTS.filter((a) => normText(`${a.city} ${a.iata} ${a.name} ${a.region}`).includes(q)).slice(0, 8)
  }, [text, value])

  return (
    <div ref={box} className="relative">
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} className="input" autoComplete="off" placeholder="Cidade ou código" value={text} role="combobox" aria-expanded={open} aria-autocomplete="list"
        onFocus={(e) => { e.currentTarget.select(); setOpen(true) }}
        onChange={(e) => { setText(e.target.value); setOpen(true); if (value) onChange('') }}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); if (e.key === 'Enter' && open && list[0]) { e.preventDefault(); onChange(list[0].iata); setOpen(false) } }} />
      {open && (
        <ul role="listbox" className="absolute left-0 right-0 z-30 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-line/70 bg-surface p-1.5 shadow-2xl">
          {list.map((a) => (
            <li key={a.iata} role="option" aria-selected={a.iata === value} onClick={() => { onChange(a.iata); setOpen(false) }}
              className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-3 hover:bg-line/50">
              <MapPin className="h-4 w-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{a.city} <span className="text-muted">· {a.region}</span></span><span className="block truncate text-xs text-muted">{a.name}</span></span>
              <span className="num text-xs font-semibold text-accent">{a.iata}</span>
            </li>
          ))}
          {list.length === 0 && <li className="px-3 py-3 text-sm text-muted">Nenhum aeroporto encontrado.</li>}
        </ul>
      )}
    </div>
  )
}
