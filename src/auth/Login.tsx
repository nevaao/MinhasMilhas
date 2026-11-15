import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
    <div className="flex min-h-screen flex-col justify-center px-5 py-10" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 40px)' }}>
      <div className="mx-auto w-full max-w-sm">
        <motion.div className="mb-8 flex flex-col items-center text-center" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
          <motion.img src="/icon.svg" alt="" className="mb-4 h-20 w-20 rounded-[22px] shadow-float" initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} />
          <h1 className="text-3xl font-bold">Minhas Milhas</h1>
          <p className="mt-1 text-sm text-muted">Seus pontos, suas milhas e o valor do milheiro.</p>
        </motion.div>
        <motion.div className="card space-y-5 p-6" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, type: 'spring', stiffness: 260, damping: 26 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h2 key={mode} className="text-lg font-semibold" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.15 }}>
              {mode === 'in' ? 'Bem-vindo de volta' : 'Criar sua conta'}
            </motion.h2>
          </AnimatePresence>
          <form onSubmit={submit} className="space-y-3.5">
            <div><label className="label" htmlFor="email">E-mail</label>
              <input id="email" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><label className="label" htmlFor="password">Senha</label>
              <input id="password" className="input" type="password" required minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <AnimatePresence>
              {msg && <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`text-sm ${msg.ok ? 'text-accent' : 'text-danger'}`}>{msg.text}</motion.p>}
            </AnimatePresence>
            <motion.button whileTap={{ scale: 0.97 }} className="btn btn-primary w-full" disabled={busy}>{busy ? 'Aguarde…' : mode === 'in' ? 'Entrar' : 'Criar conta'}</motion.button>
          </form>
          {oauthProviders.length > 0 && (
            <div className="space-y-2">
              {oauthProviders.includes('google') && <button className="btn w-full" onClick={() => oauth('google')}>Continuar com Google</button>}
              {oauthProviders.includes('azure') && <button className="btn w-full" onClick={() => oauth('azure')}>Continuar com Microsoft</button>}
            </div>
          )}
        </motion.div>
        <button className="mt-5 w-full text-center text-sm text-muted hover:text-fg" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(null) }}>
          {mode === 'in' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
