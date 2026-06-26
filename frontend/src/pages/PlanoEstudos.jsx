import { useState, useEffect } from 'react'
import { planoAPI, materiasAPI, topicosAPI } from '../api'
import { Plus, Trash2, CheckCircle2, Clock } from 'lucide-react'

export default function PlanoEstudos() {
  const [planos, setPlanos] = useState([])
  const [materias, setMaterias] = useState([])
  const [topicos, setTopicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [apenasPendentes, setApenasPendentes] = useState(false)
  const [form, setForm] = useState({
    materia_id: '', topico_id: '', data: '', tempo_planejado_minutos: 60, observacoes: ''
  })

  const load = () => {
    Promise.all([
      planoAPI.list(apenasPendentes),
      materiasAPI.list()
    ]).then(([planosRes, materiasRes]) => {
      setPlanos(planosRes.data)
      setMaterias(materiasRes.data)
    }).finally(() => setLoading(false))
  }
  useEffect(load, [apenasPendentes])

  const openCreate = () => {
    setForm({
      materia_id: materias[0]?.id || '', topico_id: '',
      data: new Date().toISOString().slice(0, 10), tempo_planejado_minutos: 60, observacoes: ''
    })
    setShowModal(true)
    if (materias[0]?.id) {
      topicosAPI.list(materias[0].id).then(res => setTopicos(res.data))
    }
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
    await planoAPI.create(form)
    setShowModal(false)
    load()
  }

  const toggleConcluido = async (plano) => {
    await planoAPI.update(plano.id, { concluido: !plano.concluido })
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir este plano de estudo?')) return
    await planoAPI.delete(id)
    load()
  }

  const formatDate = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent" /></div>
  }

  const pendentes = planos.filter(p => !p.concluido)
  const concluidos = planos.filter(p => p.concluido)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Plano de Estudos</h2>
          <p className="text-sm text-gray-500 mt-1">
            {pendentes.length} pendentes · {concluidos.length} concluídos
          </p>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={apenasPendentes}
              onChange={e => setApenasPendentes(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Apenas pendentes
          </label>
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={17} /> Nova Tarefa
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {planos.map((p) => (
          <div
            key={p.id}
            className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${
              p.concluido ? 'border-accent-200 bg-accent-50/30' : 'border-gray-200'
            }`}
          >
            <button
              onClick={() => toggleConcluido(p)}
              className="shrink-0"
              title={p.concluido ? 'Marcar como pendente' : 'Marcar como concluído'}
            >
              {p.concluido ? (
                <CheckCircle2 size={24} className="text-accent-500" />
              ) : (
                <Clock size={24} className="text-gray-300 hover:text-accent-500 transition-colors" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className={`font-medium ${p.concluido ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {p.topico_nome}
              </div>
              <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                <span>{p.materia_nome}</span>
                <span>· {formatDate(p.data)}</span>
                <span>· {p.tempo_planejado_minutos} min</span>
              </div>
              {p.observacoes && (
                <p className="text-xs text-gray-400 mt-1 truncate">{p.observacoes}</p>
              )}
            </div>

            <button
              onClick={() => handleDelete(p.id)}
              className="text-gray-300 hover:text-red-500 shrink-0 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {planos.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Nenhum plano de estudo</p>
            <p className="text-sm mt-1">Crie sua primeira tarefa de estudo</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nova Tarefa de Estudo</h3>
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
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={form.data}
                    onChange={e => setForm({ ...form, data: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Tempo (min)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.tempo_planejado_minutos}
                    onChange={e => setForm({ ...form, tempo_planejado_minutos: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Observações (opcional)</label>
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm({ ...form, observacoes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary-700 hover:bg-primary-800 text-white rounded-lg font-medium transition-colors">
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
