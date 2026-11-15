import {
  CreditCard, ShoppingCart, Repeat, ArrowLeftRight, Gift, Plane, Tag, Wallet, Store, Utensils,
  Fuel, Hotel, Star, Ticket, Banknote, Car, Gamepad2, Heart, House, Smartphone, type LucideIcon,
  Coffee, ShoppingBag, Pizza, Bus, Train, Bike, Briefcase, Book, Music, Film, Dumbbell, HeartPulse, GraduationCap, Baby, PawPrint, Shirt, Wifi, Zap, Droplet, Umbrella, Sun, TreePine, MapPin, Globe, Luggage, Building2, Landmark, PiggyBank, Coins, Receipt, Percent, Trophy, Rocket, Sparkles, Crown, Bed, Wine, Beer, Ship, Tv, Laptop, Headphones, Camera, Pill, Wrench, Scissors, Cake, Popcorn, Fish, Apple, Leaf, Flame, Moon, Cloud, Truck, Anchor, Tent, Mountain, Palmtree, TrendingUp, Handshake, ShoppingBasket, CircleDollarSign,
} from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  'credit-card': CreditCard, 'shopping-cart': ShoppingCart, repeat: Repeat, 'arrow-left-right': ArrowLeftRight,
  gift: Gift, plane: Plane, tag: Tag, wallet: Wallet, store: Store, utensils: Utensils, fuel: Fuel,
  hotel: Hotel, star: Star, ticket: Ticket, banknote: Banknote, car: Car, gamepad: Gamepad2,
  heart: Heart, home: House, smartphone: Smartphone,
  'coffee': Coffee, 'shopping-bag': ShoppingBag, 'pizza': Pizza, 'bus': Bus, 'train': Train, 'bike': Bike, 'briefcase': Briefcase, 'book': Book, 'music': Music, 'film': Film, 'dumbbell': Dumbbell, 'heart-pulse': HeartPulse, 'graduation-cap': GraduationCap, 'baby': Baby, 'paw-print': PawPrint, 'shirt': Shirt, 'wifi': Wifi, 'zap': Zap, 'droplet': Droplet, 'umbrella': Umbrella, 'sun': Sun, 'tree-pine': TreePine, 'map-pin': MapPin, 'globe': Globe, 'luggage': Luggage, 'building': Building2, 'landmark': Landmark, 'piggy-bank': PiggyBank, 'coins': Coins, 'receipt': Receipt, 'percent': Percent, 'trophy': Trophy, 'rocket': Rocket, 'sparkles': Sparkles, 'crown': Crown, 'bed': Bed, 'wine': Wine, 'beer': Beer, 'ship': Ship, 'tv': Tv, 'laptop': Laptop, 'headphones': Headphones, 'camera': Camera, 'pill': Pill, 'wrench': Wrench, 'scissors': Scissors, 'cake': Cake, 'popcorn': Popcorn, 'fish': Fish, 'apple': Apple, 'leaf': Leaf, 'flame': Flame, 'moon': Moon, 'cloud': Cloud, 'truck': Truck, 'anchor': Anchor, 'tent': Tent, 'mountain': Mountain, 'palmtree': Palmtree, 'trending-up': TrendingUp, 'handshake': Handshake, 'shopping-basket': ShoppingBasket, 'dollar': CircleDollarSign,
}
export const COLORS = ['#0b7a75', '#2563eb', '#8b5cf6', '#e11d74', '#dc2626', '#f97316', '#eab308', '#16a34a', '#64748b', '#0891b2']

import { BRAND_PREFIX, BRANDS, IMG_PREFIX, brandById, fileToLogo } from '../lib/brands'
import { useRef, useState } from 'react'

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Tag
  return <C className={className} aria-hidden />
}

export function Badge({ color, icon, size = 32 }: { color: string; icon: string; size?: number }) {
  if (icon.startsWith(IMG_PREFIX)) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line/60 bg-white" style={{ width: size, height: size }}>
        <img src={icon.slice(IMG_PREFIX.length)} alt="" className="h-full w-full object-contain p-[12%]" />
      </span>
    )
  }
  if (icon.startsWith(BRAND_PREFIX)) {
    const b = brandById(icon.slice(BRAND_PREFIX.length))
    if (b) {
      return (
        <span className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line/60 bg-white" style={{ width: size, height: size }}>
          <img src={b.logo} alt="" className="h-full w-full object-cover" />
        </span>
      )
    }
  }
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-xl" style={{ width: size, height: size, background: color + '26', color }}>
      <Icon name={icon} className="h-[55%] w-[55%]" />
    </span>
  )
}

export function ColorIconPicker(props: { color: string; icon: string; onColor: (c: string) => void; onIcon: (i: string) => void; logos?: boolean }) {
  const isLogo = props.icon.startsWith(BRAND_PREFIX) || props.icon.startsWith(IMG_PREFIX)
  const [tab, setTab] = useState<'icon' | 'logo'>(props.logos && isLogo ? 'logo' : 'icon')
  const [err, setErr] = useState('')
  const file = useRef<HTMLInputElement>(null)

  async function upload(f?: File) {
    if (!f) return
    try { props.onIcon(await fileToLogo(f)); setErr('') } catch (e) { setErr((e as Error).message) }
    if (file.current) file.current.value = ''
  }

  return (
    <div className="space-y-3">
      {props.logos && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-line/50 p-1">
          {([['icon', 'Ícone'], ['logo', 'Logo da plataforma']] as const).map(([k, l]) => (
            <button type="button" key={k} onClick={() => setTab(k)} className={`rounded-xl py-2 text-sm font-semibold ${tab === k ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}>{l}</button>
          ))}
        </div>
      )}
      {tab === 'logo' && props.logos ? (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 rounded-xl border border-line/60 p-2">
            {BRANDS.map((b) => {
              const on = props.icon === BRAND_PREFIX + b.id
              return (
                <button type="button" key={b.id} onClick={() => { props.onIcon(BRAND_PREFIX + b.id); props.onColor(b.color) }} aria-label={b.name} aria-pressed={on}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center ${on ? 'border-accent bg-accent/10' : 'border-transparent hover:bg-line/40'}`}>
                  <Badge color={b.color} icon={BRAND_PREFIX + b.id} size={44} />
                  <span className="line-clamp-2 text-[11px] leading-tight text-muted">{b.name}</span>
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="btn cursor-pointer focus-within:ring-2 focus-within:ring-accent/40">
              Enviar meu logo
              <input ref={file} type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
            </label>
            {props.icon.startsWith(IMG_PREFIX) && <Badge color={props.color} icon={props.icon} size={40} />}
          </div>
          <p className="text-xs text-muted">Escolha uma plataforma ou envie seu próprio logo (PNG, JPG, SVG ou WebP).</p>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        </div>
      ) : (
        <div className="grid max-h-56 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-line/60 p-2 sm:grid-cols-8">
          {Object.keys(ICONS).map((i) => (
            <button type="button" key={i} aria-label={`Ícone ${i}`} onClick={() => props.onIcon(i)}
              className={`flex h-10 w-full items-center justify-center rounded-lg border ${props.icon === i ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted'}`}>
              <Icon name={i} className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {COLORS.map((c) => (
          <button type="button" key={c} aria-label={`Cor ${c}`} onClick={() => props.onColor(c)}
            className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-surface ${props.color === c ? 'ring-2 ring-fg' : ''}`} style={{ background: c }} />
        ))}
      </div>
    </div>
  )
}
