import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

export interface Option { value: string; label: string; color?: string }

/** Lista suspensa no padrão visual do app (substitui o <select> nativo). */
export default function Select({ value, onChange, options, id, ariaLabel, placeholder = 'Selecionar', variant = 'field', className = '' }: {
  value: string; onChange: (v: string) => void; options: Option[]; id?: string; ariaLabel?: string
  placeholder?: string; variant?: 'field' | 'chip'; className?: string
}) {
  const btn = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxH: number }>({ left: 0, width: 0, maxH: 260 })
  const selected = options.find((o) => o.value === value)

  useLayoutEffect(() => {
    if (!open || !btn.current) return
    const r = btn.current.getBoundingClientRect()
    const below = window.innerHeight - r.bottom - 12
    const above = r.top - 12
    const width = variant === 'chip' ? Math.max(r.width, 200) : r.width
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8)
    if (below >= 200 || below >= above) setPos({ left, width, top: r.bottom + 6, maxH: Math.min(300, below) })
    else setPos({ left, width, bottom: window.innerHeight - r.top + 6, maxH: Math.min(300, above) })
  }, [open, variant])

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => { if (!(e.target as HTMLElement).closest?.('[data-select-list]') && e.target !== btn.current) setOpen(false) }
    const dismiss = () => setOpen(false)
    document.addEventListener('pointerdown', close)
    window.addEventListener('resize', dismiss)
    return () => { document.removeEventListener('pointerdown', close); window.removeEventListener('resize', dismiss) }
  }, [open])

  const openList = () => { setActive(Math.max(0, options.findIndex((o) => o.value === value))); setOpen(true) }
  const pick = (v: string) => { onChange(v); setOpen(false); btn.current?.focus() }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) { e.preventDefault(); setOpen(false) }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return openList()
      setActive((a) => Math.min(options.length - 1, Math.max(0, a + (e.key === 'ArrowDown' ? 1 : -1))))
    } else if ((e.key === 'Enter' || e.key === ' ') && open) { e.preventDefault(); pick(options[active].value) }
  }

  const isChip = variant === 'chip'
  const filled = isChip && !!value
  return (
    <>
      <button ref={btn} id={id} type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openList())} onKeyDown={onKey}
        className={isChip
          ? `inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors ${filled ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line bg-surface text-muted'} ${className}`
          : `input flex items-center justify-between gap-2 text-left ${className}`}>
        <span className="flex min-w-0 items-center gap-2">
          {!isChip && selected?.color && <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: selected.color }} />}
          <span className={`truncate ${!isChip && !selected ? 'text-muted' : ''}`}>{selected && !(isChip && !value) ? selected.label : placeholder}</span>
        </span>
        <ChevronDown className={`${isChip ? 'h-3.5 w-3.5' : 'h-4 w-4 text-muted'} shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.ul data-select-list role="listbox" initial={{ opacity: 0, y: pos.top !== undefined ? -6 : 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.14 }}
              className="fixed z-[70] overflow-y-auto rounded-2xl border border-line/70 bg-surface p-1.5 shadow-2xl"
              style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH }}>
              {options.map((o, i) => (
                <li key={o.value} role="option" aria-selected={o.value === value} onMouseEnter={() => setActive(i)} onClick={() => pick(o.value)}
                  className={`flex min-h-[42px] cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm ${i === active ? 'bg-line/50' : ''} ${o.value === value ? 'font-semibold text-accent' : ''}`}>
                  {o.color && <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: o.color }} />}
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.value === value && <Check className="h-4 w-4" />}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>, document.body)}
    </>
  )
}
