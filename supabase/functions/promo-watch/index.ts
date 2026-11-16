// @ts-nocheck
// Função "promo-watch" do Minhas Milhas (Supabase Edge Function, arquivo único).
//
// - GET ?vapid  → devolve a chave pública de notificação (gera o par na primeira chamada).
// - GET/POST (qualquer outro) → lê os feeds de promoções, casa com os destinos favoritos e envia
//   notificações. Agende esta chamada a cada 2 horas. Desative "Verify JWT" nesta função.

const FEEDS = [
  { source: 'Melhores Destinos', url: 'https://www.melhoresdestinos.com.br/feed' },
  { source: 'Passageiro de Primeira', url: 'https://passageirodeprimeira.com/feed/' },
]
const MAX_PUSH_PER_USER = 5
const MIN_MINUTES_BETWEEN_RUNS = 10

// ---- casamento título × destino (cópia de src/lib/promoMatch.ts) ----
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

// ---- RSS ----
const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '&apos;': "'", '&nbsp;': ' ' }
const decode = (s) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e] ?? e)
    .trim()
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? decode(m[1]) : ''
}
export function parseRss(xml, source) {
  return [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map((m) => {
    const it = m[0]
    const link = tag(it, 'link')
    const date = new Date(tag(it, 'pubDate'))
    return {
      guid: tag(it, 'guid') || link,
      title: tag(it, 'title'),
      link,
      source,
      published_at: isNaN(+date) ? new Date().toISOString() : date.toISOString(),
    }
  }).filter((i) => i.guid && i.title && i.link)
}

// ---- servidor ----
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

async function getVapid(db, webpush) {
  const { data } = await db.from('app_secrets').select('name,value').in('name', ['vapid_public', 'vapid_private'])
  const map = Object.fromEntries((data ?? []).map((r) => [r.name, r.value]))
  if (map.vapid_public && map.vapid_private) return { publicKey: map.vapid_public, privateKey: map.vapid_private }
  const keys = webpush.generateVAPIDKeys()
  await db.from('app_secrets').upsert([
    { name: 'vapid_public', value: keys.publicKey },
    { name: 'vapid_private', value: keys.privateKey },
  ])
  return keys
}

async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const url = new URL(req.url)
  const { createClient } = await import('npm:@supabase/supabase-js@2')
  const db = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
  const { default: webpush } = await import('npm:web-push@3.6.7')
  const vapid = await getVapid(db, webpush)
  if (url.searchParams.has('vapid')) return json({ publicKey: vapid.publicKey })

  // Limita a frequência (a chamada é pública).
  const { data: last } = await db.from('app_secrets').select('value').eq('name', 'last_run').maybeSingle()
  if (last && Date.now() - Number(last.value) < MIN_MINUTES_BETWEEN_RUNS * 60_000) return json({ skipped: 'executado há pouco' })
  await db.from('app_secrets').upsert({ name: 'last_run', value: String(Date.now()) })

  // 1) Coleta os feeds.
  let collected = 0
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MinhasMilhas/1.0)' } })
      if (!res.ok) continue
      const items = parseRss(await res.text(), feed.source).slice(0, 40)
      if (items.length) {
        await db.from('promo_items').upsert(items, { onConflict: 'guid', ignoreDuplicates: true })
        collected += items.length
      }
    } catch (e) {
      console.error('feed', feed.url, e)
    }
  }

  // 2) Cruza promoções recentes com favoritos que pedem aviso.
  const since = new Date(Date.now() - 3 * 86_400_000).toISOString()
  const { data: promos } = await db.from('promo_items').select('*').gte('published_at', since).order('published_at', { ascending: false })
  const { data: favs } = await db.from('favorite_destinations').select('user_id,iata,city').eq('notify', true)
  const { data: subs } = await db.from('push_subscriptions').select('*')
  const { data: done } = await db.from('promo_notifications').select('user_id,guid')
  const sentSet = new Set((done ?? []).map((d) => `${d.user_id}|${d.guid}`))

  webpush.setVapidDetails('mailto:avisos@minhasmilhas.app', vapid.publicKey, vapid.privateKey)
  let sent = 0
  const byUser = new Map()
  for (const f of favs ?? []) byUser.set(f.user_id, [...(byUser.get(f.user_id) ?? []), f])

  for (const [userId, userFavs] of byUser) {
    const userSubs = (subs ?? []).filter((s) => s.user_id === userId)
    if (!userSubs.length) continue
    let count = 0
    for (const p of promos ?? []) {
      if (count >= MAX_PUSH_PER_USER) break
      if (sentSet.has(`${userId}|${p.guid}`)) continue
      const hit = userFavs.find((f) => matchesDestination(p.title, f))
      if (!hit) continue
      const payload = JSON.stringify({ title: `Promoção para ${hit.city}`, body: p.title, url: p.link })
      for (const s of userSubs) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        } catch (e) {
          if (e.statusCode === 404 || e.statusCode === 410) await db.from('push_subscriptions').delete().eq('id', s.id)
          else console.error('push', e.statusCode, e.body)
        }
      }
      await db.from('promo_notifications').upsert({ user_id: userId, guid: p.guid })
      count++; sent++
    }
  }
  return json({ collected, sent })
}

if (typeof Deno !== 'undefined' && Deno.serve) {
  Deno.serve((req) => handler(req).catch((e) => { console.error(e); return json({ error: String(e) }, 500) }))
}
