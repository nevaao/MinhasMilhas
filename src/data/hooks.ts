import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Account, Category, Tx } from '../lib/types'
import { accountState, computeLedger, type LedgerRow } from '../lib/ledger'

const must = <T,>(r: { data: T; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message)
  return r.data
}

const DEFAULT_ACCOUNTS = [
  { name: 'Livelo', color: '#FF0A8C', icon: 'brand:livelo' },
  { name: 'Smiles', color: '#E8661C', icon: 'brand:smiles' },
  { name: 'LATAM Pass', color: '#5A0F55', icon: 'brand:latam' },
]
const DEFAULT_CATEGORIES = [
  { name: 'Cartão de crédito', color: '#2563eb', icon: 'credit-card' },
  { name: 'Compras', color: '#f97316', icon: 'shopping-cart' },
  { name: 'Clube', color: '#8b5cf6', icon: 'repeat' },
  { name: 'Transferência', color: '#0b7a75', icon: 'arrow-left-right' },
  { name: 'Bônus', color: '#eab308', icon: 'gift' },
  { name: 'Passagem', color: '#dc2626', icon: 'plane' },
  { name: 'Outros', color: '#64748b', icon: 'tag' },
]

/** Cria contas e categorias iniciais na primeira entrada do usuário. */
export async function seedIfNeeded(userId: string) {
  const { data } = await supabase.from('profiles').select('seeded').eq('id', userId).maybeSingle()
  if (data?.seeded) return
  must(await supabase.from('profiles').upsert({ id: userId, seeded: true }))
  must(await supabase.from('accounts').insert(DEFAULT_ACCOUNTS))
  must(await supabase.from('categories').insert(DEFAULT_CATEGORIES))
}

export const useAccounts = () =>
  useQuery({ queryKey: ['accounts'], queryFn: async () => must(await supabase.from('accounts').select('*').order('created_at')) as Account[] })
export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: async () => must(await supabase.from('categories').select('*').order('created_at')) as Category[] })
export const useTransactions = () =>
  useQuery({
    queryKey: ['transactions'],
    queryFn: async () => must(await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(5000)) as Tx[],
  })

/** Ledger de todas as contas, calculado a partir das transações. */
export function useLedgers() {
  const { data: txs = [] } = useTransactions()
  return useMemo(() => {
    const byAccount: Record<string, Tx[]> = {}
    for (const t of txs) (byAccount[t.account_id] ??= []).push(t)
    const rows: Record<string, LedgerRow[]> = {}
    const states: Record<string, ReturnType<typeof accountState>> = {}
    for (const [id, list] of Object.entries(byAccount)) {
      rows[id] = computeLedger(list)
      states[id] = accountState(rows[id])
    }
    const costOut: Record<string, number> = {}
    for (const r of Object.values(rows).flat()) costOut[r.tx.id] = r.costOut
    return { rows, states, costOut }
  }, [txs])
}

function useInvalidating<V>(fn: (v: V) => Promise<unknown>, keys: string[]) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] }))) })
}

type Draft<T> = Partial<T> & Record<string, unknown>
export const useSaveAccount = () =>
  useInvalidating(async (a: Draft<Account>) => must(await (a.id ? supabase.from('accounts').update(a).eq('id', a.id) : supabase.from('accounts').insert(a))), ['accounts'])
export const useDeleteAccount = () =>
  useInvalidating(async (id: string) => must(await supabase.from('accounts').delete().eq('id', id)), ['accounts', 'transactions'])
export const useSaveCategory = () =>
  useInvalidating(async (c: Draft<Category>) => must(await (c.id ? supabase.from('categories').update(c).eq('id', c.id) : supabase.from('categories').insert(c))), ['categories'])
export const useDeleteCategory = () =>
  useInvalidating(async (id: string) => must(await supabase.from('categories').delete().eq('id', id)), ['categories', 'transactions'])
export const useSaveTx = () =>
  useInvalidating(async (t: Draft<Tx>) => must(await (t.id ? supabase.from('transactions').update(t).eq('id', t.id) : supabase.from('transactions').insert(t))), ['transactions'])
/** Exclui o registro; se for transferência, exclui o grupo inteiro. */
export const useDeleteTx = () =>
  useInvalidating(async (t: Tx) =>
    must(await (t.transfer_group_id ? supabase.from('transactions').delete().eq('transfer_group_id', t.transfer_group_id) : supabase.from('transactions').delete().eq('id', t.id))),
  ['transactions'])
export const useCreateTransfer = () =>
  useInvalidating(async (p: Record<string, unknown>) => must(await supabase.rpc('create_transfer', p)), ['transactions'])

// ---- Viagens ----
export interface Favorite { id: string; iata: string; city: string; country: string; notify: boolean }
export interface PromoItem { guid: string; title: string; link: string; source: string; published_at: string }

export const useFavorites = () =>
  useQuery({ queryKey: ['favorites'], queryFn: async () => must(await supabase.from('favorite_destinations').select('*').order('created_at')) as Favorite[] })
export const usePromoItems = () =>
  useQuery({ queryKey: ['promos'], queryFn: async () => must(await supabase.from('promo_items').select('*').order('published_at', { ascending: false }).limit(80)) as PromoItem[] })
export const useAddFavorite = () =>
  useInvalidating(async (f: { iata: string; city: string; country: string }) =>
    must(await supabase.from('favorite_destinations').upsert({ ...f, notify: true }, { onConflict: 'user_id,iata' })), ['favorites'])
export const useToggleNotify = () =>
  useInvalidating(async (f: { id: string; notify: boolean }) => must(await supabase.from('favorite_destinations').update({ notify: f.notify }).eq('id', f.id)), ['favorites'])
export const useDeleteFavorite = () =>
  useInvalidating(async (id: string) => must(await supabase.from('favorite_destinations').delete().eq('id', id)), ['favorites'])
