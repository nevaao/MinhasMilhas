import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { useTheme, type ThemePref } from '../lib/theme'
import ImportXlsx from '../components/ImportXlsx'
import { useAccounts, useCategories, useTransactions } from '../data/hooks'

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
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Tema</h2>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-line/40 p-1">
          {themes.map(([k, l]) => <button key={k} onClick={() => setPref(k)} className={`rounded-lg py-2 text-sm font-medium ${pref === k ? 'bg-surface shadow-sm' : 'text-muted'}`}>{l}</button>)}
        </div>
      </section>
      <ImportXlsx />
      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Seus dados</h2>
        <p className="text-sm text-muted">Baixe uma cópia de contas, categorias e registros.</p>
        <button className="btn" onClick={exportJson}>Exportar JSON</button>
      </section>
      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Conta</h2>
        <p className="break-all text-sm text-muted">{session?.user.email}</p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sair</button>
      </section>
    </div>
  )
}
