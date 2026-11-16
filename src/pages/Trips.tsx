import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftRight, Bell, BellOff, Calculator, ExternalLink, Minus, Plus, Star, Trash2 } from 'lucide-react'
import { useAddFavorite, useDeleteFavorite, useFavorites, usePromoItems, useToggleNotify } from '../data/hooks'
import { airportByIata } from '../lib/airports'
import { PROGRAMS, type TripSearch } from '../lib/tripLinks'
import { matchesDestination } from '../lib/promoMatch'
import { fmtDate, today } from '../lib/format'
import { currentSubscription, disablePush, enablePush, isIos, isStandalone, pushSupported, testNotification } from '../lib/push'
import PageHeader from '../components/PageHeader'
import AirportPicker from '../components/AirportPicker'
import { FadeUp } from '../components/motion'
import { useToast } from '../components/Toast'

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}
type Form = { origin: string; destination: string; depart: string; ret: string; oneWay: boolean; adults: number; children: number; infants: number }
const KEY = 'trip-search'
const initial = (): Form => {
  const base: Form = { origin: 'GRU', destination: '', depart: addDays(today(), 30), ret: addDays(today(), 37), oneWay: false, adults: 1, children: 0, infants: 0 }
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null') as Form | null
    if (saved && saved.depart >= today()) return { ...base, ...saved }
    if (saved) return { ...base, origin: saved.origin, destination: saved.destination }
  } catch { /* ignora */ }
  return base
}

function Stepper({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2">
      <span className="text-sm">{label}</span>
      <span className="flex items-center gap-2">
        <button type="button" aria-label={`Menos ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-line/50 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
        <span className="num w-4 text-center text-sm font-semibold">{value}</span>
        <button type="button" aria-label={`Mais ${label}`} disabled={value >= 9} onClick={() => onChange(value + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-line/50 disabled:opacity-30"><Plus className="h-4 w-4" /></button>
      </span>
    </div>
  )
}

export default function Trips() {
  const toast = useToast()
  const [f, setF] = useState<Form>(initial)
  const set = (patch: Partial<Form>) => setF((cur) => ({ ...cur, ...patch }))
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(f)) } catch { /* ignora */ } }, [f])

  const { data: favs = [] } = useFavorites()
  const { data: promos = [] } = usePromoItems()
  const addFav = useAddFavorite(); const delFav = useDeleteFavorite(); const toggle = useToggleNotify()

  const dest = airportByIata(f.destination)
  const fav = favs.find((x) => x.iata === f.destination)
  const valid = !!f.origin && !!f.destination && f.origin !== f.destination && !!f.depart && (f.oneWay || (!!f.ret && f.ret >= f.depart))
  const search: TripSearch = { origin: f.origin, destination: f.destination, depart: f.depart, ret: f.oneWay ? undefined : f.ret, adults: f.adults, children: f.children, infants: Math.min(f.infants, f.adults) }
  const hint = !f.origin || !f.destination ? 'Escolha origem e destino.' : f.origin === f.destination ? 'Origem e destino devem ser diferentes.' : !f.oneWay && f.ret < f.depart ? 'A volta deve ser depois da ida.' : ''

  const matched = useMemo(() => {
    const active = favs.filter((x) => x.notify)
    return promos.filter((p) => active.some((x) => matchesDestination(p.title, x))).slice(0, 10)
  }, [favs, promos])

  // avisos
  const [pushOn, setPushOn] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => { currentSubscription().then((s) => setPushOn(!!s)).catch(() => {}) }, [])
  const iosHint = isIos() && !isStandalone()

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true)
    try { await fn(); toast(ok) } catch (e) { toast((e as Error).message, 'error') }
    setBusy(false)
  }
  const swap = () => set({ origin: f.destination, destination: f.origin })
  const toggleFav = () => {
    if (!dest) return
    if (fav) run(() => delFav.mutateAsync(fav.id), 'Removido dos favoritos')
    else run(() => addFav.mutateAsync({ iata: dest.iata, city: dest.city, country: dest.region }), `${dest.city} nos favoritos`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Viagens" subtitle="Busque nos três programas de uma vez e acompanhe promoções." />

      <FadeUp i={0} className="card space-y-4 p-4">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-line/50 p-1">
          {[[false, 'Ida e volta'], [true, 'Somente ida']].map(([v, l]) => (
            <button type="button" key={String(l)} onClick={() => set({ oneWay: v as boolean })} className={`rounded-xl py-2.5 text-sm font-semibold ${f.oneWay === v ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}>{l as string}</button>
          ))}
        </div>

        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <AirportPicker id="trip-origin" label="Origem" value={f.origin} onChange={(v) => set({ origin: v })} />
          <button type="button" aria-label="Inverter origem e destino" onClick={swap} className="mx-auto hidden h-11 w-11 items-center justify-center rounded-full bg-line/50 text-muted sm:flex"><ArrowLeftRight className="h-4 w-4" /></button>
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1"><AirportPicker id="trip-dest" label="Destino" value={f.destination} onChange={(v) => set({ destination: v })} /></div>
            <button type="button" aria-label={fav ? 'Remover dos favoritos' : 'Favoritar destino'} aria-pressed={!!fav} disabled={!dest} onClick={toggleFav}
              className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-line ${fav ? 'bg-accent/10 text-accent' : 'bg-surface text-muted'} disabled:opacity-40`}>
              <Star className={`h-5 w-5 ${fav ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="trip-depart">Ida</label><input id="trip-depart" type="date" className="input" min={today()} value={f.depart} onChange={(e) => set({ depart: e.target.value })} /></div>
          <div><label className="label" htmlFor="trip-ret">Volta</label><input id="trip-ret" type="date" className="input disabled:opacity-40" min={f.depart || today()} disabled={f.oneWay} value={f.oneWay ? '' : f.ret} onChange={(e) => set({ ret: e.target.value })} /></div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Stepper label="Adultos" value={f.adults} min={1} onChange={(n) => set({ adults: n, infants: Math.min(f.infants, n) })} />
          <Stepper label="Crianças" value={f.children} min={0} onChange={(n) => set({ children: n })} />
          <Stepper label="Bebês" value={f.infants} min={0} onChange={(n) => set({ infants: Math.min(n, f.adults) })} />
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {PROGRAMS.map((p) => valid ? (
            <motion.a key={p.id} whileTap={{ scale: 0.97 }} href={p.url(search)} target="_blank" rel="noopener noreferrer" className="btn !justify-start gap-2.5 !px-3">
              <img src={p.logo} alt="" className="h-7 w-7 rounded-lg object-cover" /><span className="flex-1 text-left">{p.name}</span><ExternalLink className="h-4 w-4 text-muted" />
            </motion.a>
          ) : (
            <button key={p.id} type="button" disabled className="btn !justify-start gap-2.5 !px-3"><img src={p.logo} alt="" className="h-7 w-7 rounded-lg object-cover" /><span className="flex-1 text-left">{p.name}</span></button>
          ))}
        </div>
        <p className="text-xs text-muted">{hint || 'Cada botão abre a busca com milhas já preenchida no site do programa. Preços e disponibilidade aparecem lá.'}</p>
        <Link to="/simulacao" className="inline-flex items-center gap-2 text-sm font-medium text-accent"><Calculator className="h-4 w-4" />Simular custo em milhas</Link>
      </FadeUp>

      <FadeUp i={1} className="card p-4">
        <h2 className="mb-3 font-semibold">Destinos favoritos</h2>
        {favs.length === 0 ? <p className="text-sm text-muted">Toque na estrela ao lado do destino para favoritar.</p> : (
          <ul className="divide-y divide-line/60">
            {favs.map((x) => (
              <li key={x.id} className="flex items-center gap-2 py-2.5">
                <button type="button" onClick={() => { set({ destination: x.iata }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Buscar ${x.city}`}>
                  <span className="num flex h-10 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-sm font-bold text-accent">{x.iata}</span>
                  <span className="min-w-0"><span className="block truncate text-[15px] font-medium">{x.city}</span><span className="block truncate text-xs text-muted">{x.country}</span></span>
                </button>
                <button type="button" aria-label={x.notify ? 'Desligar aviso' : 'Ligar aviso'} aria-pressed={x.notify} onClick={() => toggle.mutate({ id: x.id, notify: !x.notify })} className={`flex h-10 w-10 items-center justify-center rounded-full ${x.notify ? 'bg-accent/15 text-accent' : 'bg-line/50 text-muted'}`}>{x.notify ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}</button>
                <button type="button" aria-label={`Remover ${x.city}`} onClick={() => delFav.mutate(x.id)} className="flex h-10 w-10 items-center justify-center rounded-full text-danger active:bg-line/50"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </FadeUp>

      <FadeUp i={2} className="card space-y-3 p-4">
        <h2 className="font-semibold">Avisos de promoção</h2>
        <p className="text-sm text-muted">Você recebe uma notificação neste aparelho quando uma promoção citar um destino favorito com o sino ligado. As promoções vêm de blogs especializados e são verificadas a cada 2 horas.</p>
        {!pushSupported() ? <p className="text-sm text-danger">Este navegador não suporta notificações.</p>
          : iosHint ? <p className="text-sm text-muted">No iPhone, adicione o app à Tela de Início (Compartilhar → Adicionar à Tela de Início) e abra por lá para ativar os avisos (iOS 16.4 ou mais novo).</p>
          : pushOn ? (
            <div className="flex flex-wrap gap-2">
              <button className="btn" disabled={busy} onClick={() => run(testNotification, 'Aviso de teste enviado')}>Testar aviso</button>
              <button className="btn btn-danger" disabled={busy} onClick={() => run(async () => { await disablePush(); setPushOn(false) }, 'Avisos desativados')}>Desativar neste aparelho</button>
            </div>
          ) : <button className="btn btn-primary" disabled={busy} onClick={() => run(async () => { await enablePush(); setPushOn(true) }, 'Avisos ativados')}><Bell className="h-4 w-4" />Ativar avisos neste aparelho</button>}
      </FadeUp>

      <FadeUp i={3} className="card p-4">
        <h2 className="mb-3 font-semibold">Promoções para seus favoritos</h2>
        {favs.length === 0 ? <p className="text-sm text-muted">Favorite destinos para ver as promoções aqui.</p>
          : matched.length === 0 ? <p className="text-sm text-muted">Nenhuma promoção recente para seus favoritos.</p>
          : (
            <ul className="divide-y divide-line/60">
              {matched.map((p) => (
                <li key={p.guid}>
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 py-2.5 active:bg-line/30">
                    <span className="min-w-0 flex-1"><span className="block text-[15px] font-medium leading-snug">{p.title}</span><span className="text-xs text-muted">{p.source} · {fmtDate(p.published_at.slice(0, 10))}</span></span>
                    <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted" />
                  </a>
                </li>
              ))}
            </ul>
          )}
      </FadeUp>
    </div>
  )
}
