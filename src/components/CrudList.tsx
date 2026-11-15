import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Badge, ColorIconPicker } from './Icon'
import PageHeader from './PageHeader'
import Sheet from './Sheet'
import { useToast } from './Toast'
import { enter } from './motion'

interface Item { id: string; name: string; color: string; icon: string; archived?: boolean }

export default function CrudList<T extends Item>(props: {
  title: string; subtitle: string; items: T[]; noun: string; defaultIcon: string
  onSave: (v: { id?: string; name: string; color: string; icon: string; archived?: boolean }) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
  archivable?: boolean
  logos?: boolean
}) {
  const [edit, setEdit] = useState<Partial<Item> | null>(null)
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const toast = useToast()

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!edit?.name?.trim()) return
    try {
      await props.onSave({ ...(edit.id ? { id: edit.id } : {}), name: edit.name.trim(), color: edit.color!, icon: edit.icon!, ...(props.archivable ? { archived: !!edit.archived } : {}) })
      toast('Salvo')
      setEdit(null); setError('')
    } catch (err) { setError((err as Error).message) }
  }

  return (
    <div>
      <PageHeader title={props.title} subtitle={props.subtitle}
        action={<motion.button whileTap={{ scale: 0.94 }} className="btn btn-primary !min-h-[38px] !px-3.5 !py-1.5" onClick={() => setEdit({ name: '', color: '#0b7a75', icon: props.defaultIcon })}><Plus className="h-4 w-4" />Adicionar</motion.button>} />

      <div className="card divide-y divide-line/60 overflow-hidden">
        <AnimatePresence initial={false}>
          {props.items.map((it, i) => (
            <motion.div key={it.id} layout="position" {...enter(i)} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-3 px-3.5 py-3">
                <Badge color={it.color} icon={it.icon} size={42} />
                <div className={`min-w-0 flex-1 truncate text-[15px] font-medium ${it.archived ? 'text-muted line-through' : ''}`}>{it.name}</div>
                <button className="btn !min-h-[36px] !px-3 !py-1" onClick={() => { setEdit(it); setError('') }}>Editar</button>
                {confirm === it.id
                  ? <motion.button initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="btn btn-danger !min-h-[36px] !px-3 !py-1" onClick={async () => { await props.onDelete(it.id); setConfirm(''); toast('Excluído') }}>Confirmar</motion.button>
                  : <button className="btn btn-danger !min-h-[36px] !px-3 !py-1" onClick={() => setConfirm(it.id)}>Excluir</button>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {props.items.length === 0 && <p className="p-6 text-center text-sm text-muted">Nenhum item ainda.</p>}
      </div>
      {confirm && props.noun === 'conta' && <p className="mt-2 text-xs text-muted">Excluir uma conta apaga também todos os registros dela.</p>}

      <AnimatePresence>
        {edit && (
          <Sheet title={edit.id ? `Editar ${props.noun}` : `Nova ${props.noun}`} onClose={() => setEdit(null)}
            footer={<button type="submit" form="crud" className="btn btn-primary w-full">Salvar</button>}>
            <form id="crud" onSubmit={submit} className="space-y-4">
              <div><label className="label" htmlFor="nm">Nome</label><input id="nm" className="input" autoFocus required value={edit.name ?? ''} onChange={(e) => setEdit((cur) => ({ ...cur, name: e.target.value }))} /></div>
              <ColorIconPicker logos={props.logos} color={edit.color!} icon={edit.icon!} onColor={(color) => setEdit((cur) => ({ ...cur, color }))} onIcon={(icon) => setEdit((cur) => ({ ...cur, icon }))} />
              {props.archivable && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={!!edit.archived} onChange={(e) => setEdit((cur) => ({ ...cur, archived: e.target.checked }))} />Arquivada (some do resumo e dos formulários)</label>}
              {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            </form>
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  )
}
