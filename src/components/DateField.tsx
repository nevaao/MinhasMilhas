import { ChevronDown } from 'lucide-react'

/** Campo de data no mesmo padrão das listas suspensas do app (seta à direita com a mesma margem). */
export default function DateField({ id, value, onChange, min, disabled, required }: {
  id?: string; value: string; onChange: (v: string) => void; min?: string; disabled?: boolean; required?: boolean
}) {
  return (
    <div className="relative">
      <input id={id} type="date" className="input date-field pr-10 disabled:opacity-40" value={value} min={min} disabled={disabled} required={required}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()} />
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  )
}
