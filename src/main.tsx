import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { ThemeProvider } from './lib/theme'
import { AuthProvider } from './auth/AuthProvider'
import App from './App'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <BrowserRouter><App /></BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
