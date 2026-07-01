import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { iconFor } from '../conquistaIconMap'

// Toast global de conquistas. Qualquer parte do app dispara:
//   window.dispatchEvent(new CustomEvent('vr-conquistas', { detail: [...conquistas] }))
// e este componente (montado no Layout) mostra os cards.
export default function ConquistaToast() {
  const [itens, setItens] = useState([])

  useEffect(() => {
    const handler = (e) => {
      const novos = e.detail || []
      if (!novos.length) return
      const comId = novos.map((c) => ({ ...c, _id: `${c.slug}-${Math.random().toString(36).slice(2)}` }))
      setItens((prev) => [...prev, ...comId])
      comId.forEach((t) => {
        setTimeout(() => setItens((prev) => prev.filter((x) => x._id !== t._id)), 5500)
      })
    }
    window.addEventListener('vr-conquistas', handler)
    return () => window.removeEventListener('vr-conquistas', handler)
  }, [])

  const fechar = (id) => setItens((prev) => prev.filter((x) => x._id !== id))

  if (!itens.length) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
      {itens.map((c) => {
        const Icon = iconFor(c.icone)
        return (
          <div key={c._id} className="hover-lift pointer-events-auto flex items-center gap-3 rounded-xl border border-amber-200 bg-white p-3 shadow-lg">
            <div className="icon-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-white">
              <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Conquista desbloqueada!</p>
              <p className="truncate text-sm font-bold text-gray-900">{c.nome}</p>
              <p className="truncate text-xs text-gray-500">{c.descricao}</p>
            </div>
            <button onClick={() => fechar(c._id)} className="text-gray-300 hover:text-gray-500"><X size={16} /></button>
          </div>
        )
      })}
    </div>
  )
}
