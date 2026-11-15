export type TxType = 'entrada' | 'bonus' | 'saida' | 'transf_entrada' | 'transf_saida'

export interface Account {
  id: string
  name: string
  color: string
  icon: string
  archived: boolean
}
export interface Category {
  id: string
  name: string
  color: string
  icon: string
}
export interface Tx {
  id: string
  account_id: string
  category_id: string | null
  type: TxType
  date: string // YYYY-MM-DD
  description: string
  points: number
  cost: number
  transfer_group_id: string | null
  created_at: string
}

export const TYPE_LABEL: Record<TxType, string> = {
  entrada: 'Entrada',
  bonus: 'Bônus',
  saida: 'Saída',
  transf_entrada: 'Transferência recebida',
  transf_saida: 'Transferência enviada',
}
