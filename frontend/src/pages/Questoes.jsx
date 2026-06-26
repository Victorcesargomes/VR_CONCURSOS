import { useState, useEffect } from 'react'
import { questoesAPI, materiasAPI, topicosAPI } from '../api'
import { Plus, Pencil, Trash2, Filter, X } from 'lucide-react'

const resultadoLabel = { acertei: 'Acertei', errei: 'Errei' }
const resultadoColor = { acertei: 'bg-accent-50 text-accent-700', errei: 'bg-red-50 text-red-700' }
const nivelLabel = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' }

export default function Questoes() {
  const [questoes, setQuestoes] = useState([])
  const [materias, setMaterias] = useState([])
  const [topicos, setTopicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filtros, setFiltros] = useState({ materia_id: '', topico_id: '', resultado: '' })
  const [form, setForm] = useState({
    materia_id: '', topico_id: '', banca: '', ano: new Date().getFullYear(),
    prova_cargo: '', resultado: 'acertei', nivel: 'medio', comentario: '', data_resolucao: ''
  })

  useEffect(() => {
    materiasAPI.list().then(res => setMaterias(res.data))
  }, [])

  useEffect(() => {
    if (filtros.materia_id) {
      topicosAPI.list(filtros.materia_id).then(res => setTopicos(res.data))
    } else {
      setTopicos([])
    }
  }, [filtros.materia_id])

  const load = () => {
    const params = {}
    if (filtros.materia_id) params.materia_id = filtros.materia_id
    if (filtros.topico_id) params.topico_id = filtros.topico_id
    if (filtros.resultado) params.resultado = filtros.resultado
    questoesAPI.list({ ...params, limit: 200 }).then(res => setQuestoes(res.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const applyFilters = () => { setLoading(true); load() }
  const clearFilters = () => {
    setFiltros({ materia_id: '', topico_id: '', resultado: '' })
    setLoading(true)
    questoesAPI.list({ limit: 200 }).then(res => setQuestoes(res.data)).finally(() => setLoading(false))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({
      materia_id: '', topico_id: '', banca: '', ano: new Date().getFullYear(),
      prova_cargo: '', resultado: 'acertei', nivel: 'medio', comentario: '', data_resolucao: ''
    })
    setShowModal(true)
  }

  const openEdit = (q) => {
    setEditing(q)
    const dt = q.data_resolucao ? q.data_resolucao.slice(0, 10) : ''
    setForm({
      materia_id: q.materia_id, topico_id: q.topico_id, banca: q.banca, ano: q.ano,
      prova_cargo: q.prova_cargo, resultado: q.resultado, nivel: q.nivel,
      comentario: q.comentario || '', data_resolucao: dt
    })
    if (q.materia_id) {
      topicosAPI.list(q.materia_id).then(res => setTopicos(res.data))
    }
    setShowModal(true)
  }

  const handleMateriaChange = (mid) => {
    setForm({ ...form, materia_id: mid, topico_id: '' })
    if (mid) {
      topicosAPI.list(mid).then(res => setTopicos(res.data))
    } else {
      setTopicos([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (!payload.data_resolucao) delete payload.data_resolucao
    if (editing) {
      await questoesAPI.update(editing.id, payload)
    } else {
      await questoesAPI.create(payload)
    }
    setShowModal(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta questão?')) return
    await questoesAPI.delete(id)
    load()
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Questões</h2>
          <p className="text-sm text-gray-500 mt-1">{questoes.length} questões registradas</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus size={17} /> Registrar Questão
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
        <Filter size={14} className="text-gray-400" />
        <select
          value={filtros.materia_id}
          onChange={e => setFiltros({ ...filtros, materia_id: e.target.value, topico_id: '' })}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none text-gray-700"
        >
          <option value="">Todas matérias</option>
          {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
        <select
          value={filtros.topico_id}
          onChange={e => setFiltros({ ...filtros, topico_id: e.target.value })}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none text-gray-700"
        >
          <option value="">Todos tópicos</option>
          {topicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <select
          value={filtros.resultado}
          onChange={e => setFiltros({ ...filtros, resultado: e.target.value })}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none text-gray-700"
        >
          <option value="">Todos resultados</option>
          <option value="acertei">Acertei</option>
          <option value="errei">Errei</option>
        </select>
        <button onClick={applyFilters} className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded hover:bg-primary-700 transition-colors">Filtrar</button>
        <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 p-1"><X size={16} /></button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider bg-gray-50 border-b">
                <th className="px-4 py-3">Matéria</th>
                <th className="px-4 py-3">Tópico</th>
                <th className="px-4 py-3">Banca</th>
                <th className="px-4 py-3">Ano</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-4 py-3">Nível</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {questoes.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{q.materia_nome}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px] truncate">{q.topico_nome}</td>
                  <td className="px-4 py-3 text-gray-600">{q.banca}</td>
                  <td className="px-4 py-3 text-gray-600">{q.ano}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${resultadoColor[q.resultado]}`}>
                      {resultadoLabel[q.resultado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{nivelLabel[q.nivel] || q.nivel}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(q)} className="text-gray-400 hover:text-primary-600 p-1"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(q.id)} className="text-gray-400 hover:text-red-600 p-1 ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {questoes.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">Nenhuma questão encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 mx-4 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Editar Questão' : 'Registrar Questão'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Matéria</label>
                <select
                  required
                  value={form.materia_id}
                  onChange={e => handleMateriaChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">Selecione...</option>
                  {materias.filter(m => m.ativo).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Tópico</label>
                <select
                  required
                  value={form.topico_id}
                  onChange={e => setForm({ ...form, topico_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">Selecione...</option>
                  {topicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Banca</label>
                  <input required value={form.banca} onChange={e => setForm({ ...form, banca: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Ano</label>
                  <input type="number" required value={form.ano} onChange={e => setForm({ ...form, ano: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Prova / Cargo</label>
                <input required value={form.prova_cargo} onChange={e => setForm({ ...form, prova_cargo: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Resultado</label>
                  <select required value={form.resultado} onChange={e => setForm({ ...form, resultado: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="acertei">Acertei</option>
                    <option value="errei">Errei</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Nível</label>
                  <select value={form.nivel} onChange={e => setForm({ ...form, nivel: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="facil">Fácil</option>
                    <option value="medio">Médio</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Data da Resolução</label>
                <input type="date" value={form.data_resolucao} onChange={e => setForm({ ...form, data_resolucao: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Comentário (opcional)</label>
                <textarea value={form.comentario} onChange={e => setForm({ ...form, comentario: e.target.value })} rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary-700 hover:bg-primary-800 text-white rounded-lg font-medium transition-colors">
                  {editing ? 'Salvar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
