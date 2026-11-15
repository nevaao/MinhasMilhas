import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'
const Ctx = createContext<{ pref: ThemePref; setPref: (p: ThemePref) => void }>({ pref: 'system', setPref: () => {} })

const read = (): ThemePref => {
  try {
    return (localStorage.getItem('theme') as ThemePref) || 'system'
  } catch {
    return 'system'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPref] = useState<ThemePref>(read)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', pref === 'dark' || (pref === 'system' && mq.matches))
    apply()
    mq.addEventListener('change', apply)
    try { localStorage.setItem('theme', pref) } catch { /* ignore */ }
    return () => mq.removeEventListener('change', apply)
  }, [pref])
  return <Ctx.Provider value={{ pref, setPref }}>{children}</Ctx.Provider>
}
export const useTheme = () => useContext(Ctx)
