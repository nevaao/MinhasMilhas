import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
)
export const oauthProviders = ((import.meta.env.VITE_OAUTH_PROVIDERS as string) || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean) as ('google' | 'azure')[]
