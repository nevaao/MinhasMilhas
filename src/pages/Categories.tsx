import CrudList from '../components/CrudList'
import { useCategories, useDeleteCategory, useSaveCategory } from '../data/hooks'

export default function Categories() {
  const { data = [] } = useCategories()
  const save = useSaveCategory(); const del = useDeleteCategory()
  return <CrudList title="Categorias" subtitle="Classifique seus registros com cores e ícones." items={data} noun="categoria" defaultIcon="tag"
    onSave={(v) => save.mutateAsync(v)} onDelete={(id) => del.mutateAsync(id)} />
}
