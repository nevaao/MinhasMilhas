import { supabase } from './supabase'

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

const b64ToBytes = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export async function currentSubscription() {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

async function vapidKey(): Promise<string> {
  let res: Response
  try {
    res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/promo-watch?vapid`)
  } catch {
    throw new Error('Não consegui falar com o servidor de avisos.')
  }
  if (!res.ok) throw new Error('O servidor de avisos ainda não foi configurado (função promo-watch).')
  return (await res.json()).publicKey as string
}

export async function enablePush() {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Permissão de notificações negada. Libere nas configurações do navegador.')
  const key = await vapidKey()
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) }))
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    { endpoint: sub.endpoint, p256dh: json.keys!.p256dh, auth: json.keys!.auth }, { onConflict: 'endpoint' })
  if (error) throw new Error(error.message)
}

export async function disablePush() {
  const sub = await currentSubscription()
  if (!sub) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

export async function testNotification() {
  const reg = await navigator.serviceWorker.ready
  await reg.showNotification('Avisos ativados', { body: 'Você será avisado das promoções para seus destinos favoritos.', icon: '/icon-192.png', badge: '/icon-192.png' })
}
