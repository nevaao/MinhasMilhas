import { useState, type FormEvent } from 'react'
import { Badge, ColorIconPicker } from './Icon'

interface Item { id: string; name: string; color: string; icon: string; archived?: boolean }

export default function CrudList<T extends Item>(props: {
  title: string; subtitle: string; items: T[]; noun: string; defaultIcon: string
  onSave: (v: { id?: string; name: string; color: string; icon: string; archived?: boolean }) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
  archivable?: boolean
}) {
  const [edit, setEdit] = useState<Partial<Item> | null>(null)
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!edit?.name?.trim()) return
    try {
      await props.onSave({ ...(edit.id ? { id: edit.id } : {}), name: edit.name.trim(), color: edit.color!, icon: edit.icon!, ...(props.archivable ? { archived: !!edit.archived } : {}) })
      setEdit(null); setError('')
    } catch (err) { setError((err as Error).message) }
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold">{props.title}</h1><p className="text-sm text-muted">{props.subtitle}</p></div>
        <button className="btn btn-primary" onClick={() => setEdit({ name: '', color: '#0b7a75', icon: props.defaultIcon })}>Adicionar</button>
      </header>

      {edit && (
        <form onSubmit={submit} className="card space-y-3 p-4">
          <div><label className="label" htmlFor="nm">Nome</label><input id="nm" className="input" autoFocus required value={edit.name ?? ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
          <ColorIconPicker color={edit.color!} icon={edit.icon!} onColor={(color) => setEdit({ ...edit, color })} onIcon={(icon) => setEdit({ ...edit, icon })} />
          {props.archivable && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!edit.archived} onChange={(e) => setEdit({ ...edit, archived: e.target.checked })} />Arquivada (some do resumo e dos formulários)</label>}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2"><button className="btn btn-primary">Salvar</button><button type="button" className="btn" onClick={() => setEdit(null)}>Cancelar</button></div>
        </form>
      )}

      <div className="card divide-y divide-line overflow-hidden">
        {props.items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 px-3 py-2.5">
            <Badge color={it.color} icon={it.icon} />
            <div className={`min-w-0 flex-1 truncate text-sm font-medium ${it.archived ? 'text-muted line-through' : ''}`}>{it.name}</div>
            <button className="btn !px-3 !py-1" onClick={() => setEdit(it)}>Editar</button>
            {confirm === it.id
              ? <button className="btn btn-danger !px-3 !py-1" onClick={async () => { await props.onDelete(it.id); setConfirm('') }}>Confirmar</button>
              : <button className="btn btn-danger !px-3 !py-1" onClick={() => setConfirm(it.id)}>Excluir</button>}
          </div>
        ))}
        {props.items.length === 0 && <p className="p-6 text-center text-sm text-muted">Nenhum item ainda.</p>}
      </div>
      {confirm && props.noun === 'conta' && <p className="text-xs text-muted">Excluir uma conta apaga também todos os registros dela.</p>}
    </div>
  )
}
