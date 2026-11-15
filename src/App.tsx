import { useEffect, useState } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './auth/AuthProvider'
import Login from './auth/Login'
import Layout from './components/Layout'
import { seedIfNeeded } from './data/hooks'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import TxForm from './pages/TxForm'
import Accounts from './pages/Accounts'
import Categories from './pages/Categories'
import Settings from './pages/Settings'

export default function App() {
  const { session, loading } = useAuth()
  const qc = useQueryClient()
  const [ready, setReady] = useState(false)
  const uid = session?.user.id

  useEffect(() => {
    if (!uid) { setReady(false); return }
    seedIfNeeded(uid).catch(console.error).finally(() => { qc.invalidateQueries(); setReady(true) })
  }, [uid, qc])

  if (loading) return <p className="p-6 text-muted">Carregando…</p>
  if (!session) return <Login />
  if (!ready) return <p className="p-6 text-muted">Preparando sua conta…</p>
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="registros" element={<Transactions />} />
        <Route path="novo" element={<TxForm />} />
        <Route path="registros/:id" element={<TxForm />} />
        <Route path="contas" element={<Accounts />} />
        <Route path="categorias" element={<Categories />} />
        <Route path="config" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
