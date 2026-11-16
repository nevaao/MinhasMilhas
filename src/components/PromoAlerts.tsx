import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { currentSubscription, disablePush, enablePush, isIos, isStandalone, pushSupported, testNotification } from '../lib/push'
import { useToast } from './Toast'

/** Ativa, testa e desativa as notificações de promoção neste aparelho. */
export default function PromoAlerts() {
  const toast = useToast()
  const [pushOn, setPushOn] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => { currentSubscription().then((s) => setPushOn(!!s)).catch(() => {}) }, [])
  const iosHint = isIos() && !isStandalone()

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true)
    try { await fn(); toast(ok) } catch (e) { toast((e as Error).message, 'error') }
    setBusy(false)
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Avisos de promoção</h2>
      <p className="text-sm text-muted">Você recebe uma notificação neste aparelho quando uma promoção citar um destino favorito com o sino ligado (aba Viagens). As promoções vêm de blogs especializados e são verificadas a cada 2 horas.</p>
      {!pushSupported() ? <p className="text-sm text-danger">Este navegador não suporta notificações.</p>
        : iosHint ? <p className="text-sm text-muted">No iPhone, adicione o app à Tela de Início (Compartilhar → Adicionar à Tela de Início) e abra por lá para ativar os avisos (iOS 16.4 ou mais novo).</p>
        : pushOn ? (
          <div className="flex flex-wrap gap-2">
            <button className="btn" disabled={busy} onClick={() => run(testNotification, 'Aviso de teste enviado')}>Testar aviso</button>
            <button className="btn btn-danger" disabled={busy} onClick={() => run(async () => { await disablePush(); setPushOn(false) }, 'Avisos desativados')}>Desativar neste aparelho</button>
          </div>
        ) : <button className="btn btn-primary" disabled={busy} onClick={() => run(async () => { await enablePush(); setPushOn(true) }, 'Avisos ativados')}><Bell className="h-4 w-4" />Ativar avisos neste aparelho</button>}
    </div>
  )
}
