import { motion } from 'framer-motion'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { useTheme, type ThemePref } from '../lib/theme'
import { useAccounts, useCategories, useTransactions } from '../data/hooks'
import ImportXlsx from '../components/ImportXlsx'
import PageHeader from '../components/PageHeader'
import { FadeUp } from '../components/motion'

export default function Settings() {
  const { session } = useAuth()
  const { pref, setPref } = useTheme()
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const { data: transactions = [] } = useTransactions()

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), accounts, categories, transactions }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `minhasmilhas-${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(a.href)
  }
  const themes: [ThemePref, string][] = [['system', 'Sistema'], ['light', 'Claro'], ['dark', 'Escuro']]

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader title="Ajustes" subtitle="Tema, dados e conta." />
      <FadeUp i={1} className="card space-y-3 p-4">
        <h2 className="font-semibold">Tema</h2>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-line/50 p-1">
          {themes.map(([k, l]) => (
            <button key={k} onClick={() => setPref(k)} className={`relative rounded-xl py-2.5 text-sm font-semibold ${pref === k ? 'text-fg' : 'text-muted'}`}>
              {pref === k && <motion.span layoutId="theme-pill" className="absolute inset-0 rounded-xl bg-surface shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
              <span className="relative">{l}</span>
            </button>
          ))}
        </div>
      </FadeUp>
      <FadeUp i={2}><ImportXlsx /></FadeUp>
      <FadeUp i={3} className="card space-y-3 p-4">
        <h2 className="font-semibold">Seus dados</h2>
        <p className="text-sm text-muted">Baixe uma cópia de contas, categorias e registros.</p>
        <button className="btn" onClick={exportJson}>Exportar JSON</button>
      </FadeUp>
      <FadeUp i={4} className="card space-y-3 p-4">
        <h2 className="font-semibold">Conta</h2>
        <p className="break-all text-sm text-muted">{session?.user.email}</p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sair</button>
      </FadeUp>
    </div>
  )
}
