import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { assuntosAPI, materiasAPI, revisoesAPI, sessoesAPI, topicosAPI } from '../../api'

const PAGES = [
  { label: 'Início', sub: 'Página', to: '/' },
  { label: 'Conteúdo', sub: 'Estudo', to: '/conteudo' },
  { label: 'Simulados', sub: 'Estudo', to: '/simulados' },
  { label: 'Caderno de Erros', sub: 'Estudo', to: '/caderno' },
  { label: 'Evolução', sub: 'Acompanhamento', to: '/evolucao' },
  { label: 'Prontidão', sub: 'Acompanhamento', to: '/prontidao' },
  { label: 'Conquistas', sub: 'Acompanhamento', to: '/conquistas' },
]

// Paleta de busca global (Ctrl/Cmd+K). Indexa páginas + matérias/assuntos/tópicos
// + sessões e revisões recentes, navegando ao selecionar.
export default function SearchPalette() {
  const [aberto, setAberto] = useState(false)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const [itens, setItens] = useState(PAGES)
  const cache = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setAberto(true)
      } else if (e.key === 'Escape') {
        setAberto(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!aberto || cache.current) return
    cache.current = 'loading'
    ;(async () => {
      try {
        const [m, a, t, s, r] = await Promise.all([
          materiasAPI.list(true),
          assuntosAPI.list(),
          topicosAPI.list(),
          sessoesAPI.list({ limit: 12 }),
          revisoesAPI.list({ limit: 12 }),
        ])
        cache.current = [
          ...PAGES,
          ...m.data.map((x) => ({ label: x.nome, sub: 'Matéria', to: '/conteudo' })),
          ...a.data.map((x) => ({ label: x.nome, sub: 'Assunto', to: '/conteudo' })),
          ...t.data.map((x) => ({ label: x.nome, sub: `Tópico · ${x.materia_nome || ''}`, to: '/conteudo' })),
          ...s.data.map((x) => ({ label: x.topico_nome, sub: `Sessão · ${x.materia_nome}`, to: '/' })),
          ...r.data.map((x) => ({ label: x.topico_nome, sub: 'Revisão pendente', to: '/' })),
        ]
        setItens(cache.current)
      } catch {
        cache.current = null
      }
    })()
  }, [aberto])

  const filtrados = useMemo(() => {
    const query = q.trim().toLowerCase()
    const base = query ? itens.filter((i) => `${i.label} ${i.sub}`.toLowerCase().includes(query)) : itens
    return base.slice(0, 10)
  }, [q, itens])

  useEffect(() => { setSel(0) }, [q])

  const escolher = (item) => {
    setAberto(false)
    setQ('')
    if (item?.to) navigate(item.to)
  }

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 p-4 pt-[12vh]" onClick={() => setAberto(false)}>
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-gray-200 px-4">
          <Search size={16} className="text-gray-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, filtrados.length - 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
              else if (e.key === 'Enter' && filtrados[sel]) { escolher(filtrados[sel]) }
            }}
            placeholder="Buscar matérias, tópicos, páginas…"
            className="w-full py-3 text-sm outline-none placeholder:text-gray-400"
          />
          <kbd className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-400">ESC</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto py-1">
          {filtrados.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-400">Nada encontrado.</li>}
          {filtrados.map((it, i) => (
            <li key={`${it.label}-${i}`}>
              <button
                onMouseEnter={() => setSel(i)}
                onClick={() => escolher(it)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm ${i === sel ? 'bg-primary-50 text-primary-800' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <span className="truncate font-medium">{it.label}</span>
                <span className="shrink-0 text-xs text-gray-400">{it.sub}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400">
          <span>↑↓ navegar · Enter abrir</span>
          <span>Ctrl + K</span>
        </div>
      </div>
    </div>
  )
}
