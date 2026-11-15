import {
  CreditCard, ShoppingCart, Repeat, ArrowLeftRight, Gift, Plane, Tag, Wallet, Store, Utensils,
  Fuel, Hotel, Star, Ticket, Banknote, Car, Gamepad2, Heart, House, Smartphone, type LucideIcon,
} from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  'credit-card': CreditCard, 'shopping-cart': ShoppingCart, repeat: Repeat, 'arrow-left-right': ArrowLeftRight,
  gift: Gift, plane: Plane, tag: Tag, wallet: Wallet, store: Store, utensils: Utensils, fuel: Fuel,
  hotel: Hotel, star: Star, ticket: Ticket, banknote: Banknote, car: Car, gamepad: Gamepad2,
  heart: Heart, home: House, smartphone: Smartphone,
}
export const COLORS = ['#0b7a75', '#2563eb', '#8b5cf6', '#e11d74', '#dc2626', '#f97316', '#eab308', '#16a34a', '#64748b', '#0891b2']

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Tag
  return <C className={className} aria-hidden />
}

export function Badge({ color, icon, size = 32 }: { color: string; icon: string; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-lg" style={{ width: size, height: size, background: color + '26', color }}>
      <Icon name={icon} className="h-[55%] w-[55%]" />
    </span>
  )
}

export function ColorIconPicker(props: { color: string; icon: string; onColor: (c: string) => void; onIcon: (i: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {COLORS.map((c) => (
          <button type="button" key={c} aria-label={`Cor ${c}`} onClick={() => props.onColor(c)}
            className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-surface ${props.color === c ? 'ring-2 ring-fg' : ''}`} style={{ background: c }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.keys(ICONS).map((i) => (
          <button type="button" key={i} aria-label={`Ícone ${i}`} onClick={() => props.onIcon(i)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border ${props.icon === i ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted'}`}>
            <Icon name={i} className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  )
}
