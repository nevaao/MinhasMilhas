import { useEffect, useRef, useState } from 'react'
import { Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
import Simulation from './pages/Simulation'

const Splash = ({ text }: { text: string }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-muted">
    <motion.img src="/icon.svg" alt="" className="h-16 w-16 rounded-2xl shadow-float" animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} />
    <p className="text-sm">{text}</p>
  </div>
)

export default function App() {
  const { session, loading } = useAuth()
  const qc = useQueryClient()
  const [ready, setReady] = useState(false)
  const uid = session?.user.id
  const location = useLocation()
  const overlay = /^\/(novo|registros\/[^/]+)$/.test(location.pathname)
  const bg = (location.state as { background?: typeof location } | null)?.background
  const base = overlay ? bg ?? { ...location, pathname: '/', state: null } : location
  const frozen = useRef(location)
  if (overlay) frozen.current = location

  useEffect(() => {
    if (!uid) { setReady(false); return }
    seedIfNeeded(uid).catch(console.error).finally(() => { qc.invalidateQueries(); setReady(true) })
  }, [uid, qc])

  if (loading) return <Splash text="Carregando…" />
  if (!session) return <Login />
  if (!ready) return <Splash text="Preparando sua conta…" />
  return (
    <>
      <Routes location={base}>
        <Route element={<Layout pathKey={base.pathname} />}>
          <Route index element={<Dashboard />} />
          <Route path="registros" element={<Transactions />} />
          <Route path="simulacao" element={<Simulation />} />
          <Route path="contas" element={<Accounts />} />
          <Route path="categorias" element={<Categories />} />
          <Route path="config" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <AnimatePresence>
        {overlay && (
          <Routes location={frozen.current} key="overlay">
            <Route path="novo" element={<TxForm />} />
            <Route path="registros/:id" element={<TxForm />} />
          </Routes>
        )}
      </AnimatePresence>
    </>
  )
}
