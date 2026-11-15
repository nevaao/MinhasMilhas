import CrudList from '../components/CrudList'
import { useAccounts, useDeleteAccount, useSaveAccount } from '../data/hooks'

export default function Accounts() {
  const { data = [] } = useAccounts()
  const save = useSaveAccount(); const del = useDeleteAccount()
  return <CrudList back="/config" title="Contas" subtitle="Programas de pontos e milhas, como Livelo, Smiles e LATAM Pass." items={data} noun="conta" defaultIcon="plane" archivable logos
    onSave={(v) => save.mutateAsync(v)} onDelete={(id) => del.mutateAsync(id)} />
}
