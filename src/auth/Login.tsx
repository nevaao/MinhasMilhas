import { useState, type FormEvent } from 'react'
import { supabase, oauthProviders } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg({ ok: false, text: error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message })
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      if (error) setMsg({ ok: false, text: error.message })
      else if (!data.session) setMsg({ ok: true, text: 'Enviamos um e-mail de confirmação. Abra o link e depois entre.' })
    }
    setBusy(false)
  }
  const oauth = (provider: 'google' | 'azure') =>
    supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin, scopes: provider === 'azure' ? 'email' : undefined } })

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="card w-full max-w-sm space-y-5 p-6">
        <div>
          <h1 className="text-2xl font-bold">MinhasMilhas</h1>
          <p className="text-sm text-muted">Seus pontos, suas milhas e o valor do milheiro.</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label" htmlFor="email">E-mail</label>
            <input id="email" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="label" htmlFor="password">Senha</label>
            <input id="password" className="input" type="password" required minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {msg && <p role="alert" className={`text-sm ${msg.ok ? 'text-accent' : 'text-danger'}`}>{msg.text}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>{mode === 'in' ? 'Entrar' : 'Criar conta'}</button>
        </form>
        {oauthProviders.length > 0 && (
          <div className="space-y-2">
            {oauthProviders.includes('google') && <button className="btn w-full" onClick={() => oauth('google')}>Continuar com Google</button>}
            {oauthProviders.includes('azure') && <button className="btn w-full" onClick={() => oauth('azure')}>Continuar com Microsoft</button>}
          </div>
        )}
        <button className="w-full text-center text-sm text-muted hover:text-fg" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(null) }}>
          {mode === 'in' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
