import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Filter, RefreshCw } from 'lucide-react'
import { materiasAPI, questoesAPI } from '../api'
import PageHeader from '../components/Layout/PageHeader'
import { shortName } from '../components/Charts/chartTheme'

export default function CadernoErros() {
  const [erros, setErros] = useState([])
  const [materias, setMaterias] = useState([])
  const [filtroMateria, setFiltroMateria] = useState('')
  const [loading, setLoading] = useState(true)

  const recarregar = async () => {
    const [e, m] = await Promise.all([
      questoesAPI.cadernoErros({ limit: 200, materia_id: filtroMateria || undefined }),
      materiasAPI.list(true),
    ])
    setErros(e.data)
    setMaterias(m.data)
  }

  useEffect(() => {
    recarregar().finally(() => setLoading(false))
  }, [filtroMateria])

  const grupos = useMemo(() => {
    const map = new Map()
    for (const q of erros) {
      const key = `${q.materia_nome}|||${q.topico_nome}`
      if (!map.has(key)) map.set(key, { materia: q.materia_nome, topico: q.topico_nome, itens: [] })
      map.get(key).itens.push(q)
    }
    return [...map.values()]
  }, [erros])

  if (loading) return <div className="py-20 text-center text-gray-400">Carregando caderno de erros…</div>

  return (
    <div className="space-y-5">
      <PageHeader icon={AlertTriangle} title="Caderno de erros" subtitle="Toda questão errada vira revisão automaticamente. Revise aqui os pontos críticos.">
        <button onClick={recarregar} className="btn-pop flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <RefreshCw size={16} /> Atualizar
        </button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Filter size={15} className="text-gray-400" />
        <select value={filtroMateria} onChange={(e) => setFiltroMateria(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-primary-400 focus:outline-none">
          <option value="">Todas as matérias</option>
          {materias.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
        <span className="text-sm text-gray-400">{erros.length} erro(s)</span>
      </div>

      {grupos.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-8 text-center text-sm text-emerald-700">
          Nenhum erro registrado ainda. 🎉 Os erros de simulados e sessões aparecem aqui automaticamente.
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {grupos.map((g) => (
            <div key={`${g.materia}-${g.topico}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">{shortName(g.topico, 48)}</p>
                  <p className="text-xs text-gray-400">{g.materia}</p>
                </div>
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600">{g.itens.length}</span>
              </div>
              <ul className="divide-y divide-gray-50">
                {g.itens.map((q) => (
                  <li key={q.id} className="row-hover flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm hover:bg-gray-50">
                    <span className="font-medium text-gray-700">Q{q.numero ?? '—'}</span>
                    {q.prova_origem && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">{shortName(q.prova_origem, 24)}</span>}
                    <span className="flex items-center gap-1.5">
                      <span className="text-gray-400">Sua resposta:</span>
                      <span className="font-bold text-rose-600">{q.resposta || '—'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-gray-400">Gabarito:</span>
                      <span className="font-bold text-emerald-600">{q.gabarito || '—'}</span>
                    </span>
                    {q.observacao && <span className="text-xs italic text-gray-400">{q.observacao}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline">
        <ArrowLeft size={15} /> Ir para a fila de revisão
      </Link>
    </div>
  )
}
