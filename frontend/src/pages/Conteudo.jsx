import { useState, useEffect } from 'react'
import { materiasAPI, assuntosAPI, topicosAPI, desempenhoAPI, sessoesAPI } from '../api'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, ClipboardEdit } from 'lucide-react'
import PageHeader from '../components/Layout/PageHeader'

const prioridadeLabel = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }
const prioridadeColor = { baixa: 'bg-slate-100 text-slate-600', media: 'bg-amber-100 text-amber-700', alta: 'bg-red-100 text-red-700' }
const todayIso = () => new Date().toISOString().slice(0, 10)
const tipoLabel = { estudo: 'Estudo', revisao: 'Revisão', simulado: 'Simulado', resumo: 'Resumo' }

export default function Conteudo() {
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [desempenho, setDesempenho] = useState({})

  // Modals
  const [showMatModal, setShowMatModal] = useState(false)
  const [showAssModal, setShowAssModal] = useState(false)
  const [showTopModal, setShowTopModal] = useState(false)
  const [editingMat, setEditingMat] = useState(null)
  const [matForm, setMatForm] = useState({ nome: '', descricao: '', ativo: true })
  const [assForm, setAssForm] = useState({ materia_id: '', nome: '' })
  const [editingAss, setEditingAss] = useState(null)
  const [topForm, setTopForm] = useState({ assunto_id: '', nome: '', prioridade: 'media', peso: 1 })
  const [editingTop, setEditingTop] = useState(null)
  const [assuntosParaTopico, setAssuntosParaTopico] = useState([])
  const [showSessaoModal, setShowSessaoModal] = useState(false)
  const [sessaoContexto, setSessaoContexto] = useState(null)
  const [sessaoForm, setSessaoForm] = useState({
    topico_id: '',
    data: todayIso(),
    tipo: 'estudo',
    acertos: 0,
    erros: 0,
    resumo_feito: false,
    observacoes: '',
  })

  const load = () => {
    materiasAPI.list().then(r => {
      const mats = r.data
      Promise.all(mats.map(m => assuntosAPI.list(m.id).then(aR => ({ ...m, _assuntos: aR.data }))))
        .then(matsWithAssuntos => {
          const promises = matsWithAssuntos.flatMap(m =>
            m._assuntos.map(a =>
              topicosAPI.list({ assunto_id: a.id }).then(tR => ({ ...a, _topicos: tR.data }))
            )
          )
          return Promise.all(promises).then(assuntosWithTopicos => {
            const assuntoMap = {}
            assuntosWithTopicos.forEach(a => { assuntoMap[a.id] = a._topicos })
            setMaterias(matsWithAssuntos.map(m => ({
              ...m, assuntos: m._assuntos.map(a => ({ ...a, topicos: assuntoMap[a.id] || [] })),
            })))
          })
        })
        .finally(() => setLoading(false))
    })
    // Load all topic performance
    desempenhoAPI.topicos({}).then(r => {
      const map = {}
      r.data.forEach(t => { map[t.topico_id] = t })
      setDesempenho(map)
    })
  }
  useEffect(load, [])

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  // CRUD Materia
  const openMatCreate = () => { setEditingMat(null); setMatForm({ nome: '', descricao: '', ativo: true }); setShowMatModal(true) }
  const openMatEdit = (m) => { setEditingMat(m); setMatForm({ nome: m.nome, descricao: m.descricao || '', ativo: m.ativo }); setShowMatModal(true) }
  const saveMat = async (e) => { e.preventDefault(); editingMat ? await materiasAPI.update(editingMat.id, matForm) : await materiasAPI.create(matForm); setShowMatModal(false); load() }
  const deleteMat = async (id) => { if (!confirm('Excluir matéria e todo conteúdo?')) return; await materiasAPI.delete(id); load() }

  // CRUD Assunto
  const openAssCreate = (materiaId) => { setEditingAss(null); setAssForm({ materia_id: materiaId, nome: '' }); setShowAssModal(true) }
  const openAssEdit = (a) => { setEditingAss(a); setAssForm({ materia_id: a.materia_id, nome: a.nome }); setShowAssModal(true) }
  const saveAss = async (e) => { e.preventDefault(); editingAss ? await assuntosAPI.update(editingAss.id, assForm) : await assuntosAPI.create(assForm); setShowAssModal(false); load() }
  const deleteAss = async (id) => { if (!confirm('Excluir assunto?')) return; await assuntosAPI.delete(id); load() }

  // CRUD Topico
  const openTopCreate = (assuntoId) => {
    setEditingTop(null); setTopForm({ assunto_id: assuntoId, nome: '', prioridade: 'media', peso: 1 })
    let mid = ''; for (const m of materias) { const a = m.assuntos?.find(a => a.id === assuntoId); if (a) { mid = a.materia_id; break } }
    if (mid) assuntosAPI.list(mid).then(r => setAssuntosParaTopico(r.data))
    setShowTopModal(true)
  }
  const openTopEdit = (t) => {
    setEditingTop(t); setTopForm({ assunto_id: t.assunto_id, nome: t.nome, prioridade: t.prioridade, peso: t.peso })
    let mid = ''; for (const m of materias) { for (const a of m.assuntos || []) { if (a.id === t.assunto_id) { mid = a.materia_id; break } } }
    if (mid) assuntosAPI.list(mid).then(r => setAssuntosParaTopico(r.data))
    setShowTopModal(true)
  }
  const saveTop = async (e) => { e.preventDefault(); editingTop ? await topicosAPI.update(editingTop.id, topForm) : await topicosAPI.create(topForm); setShowTopModal(false); load() }
  const deleteTop = async (id) => { if (!confirm('Excluir tópico?')) return; await topicosAPI.delete(id); load() }

  const openSessaoCreate = (topico, assunto, materia) => {
    setSessaoContexto({ topico, assunto, materia })
    setSessaoForm({
      topico_id: topico.id,
      data: todayIso(),
      tipo: 'estudo',
      acertos: 0,
      erros: 0,
      resumo_feito: false,
      observacoes: '',
    })
    setShowSessaoModal(true)
  }

  const saveSessao = async (e) => {
    e.preventDefault()
    const acertos = Number(sessaoForm.acertos)
    const erros = Number(sessaoForm.erros)
    await sessoesAPI.create({
      ...sessaoForm,
      topico_id: Number(sessaoForm.topico_id),
      acertos,
      erros,
      questoes_feitas: acertos + erros,
    })
    setShowSessaoModal(false)
    load()
  }

  const getTopicoStats = (topicoId) => {
    const d = desempenho[topicoId]
    if (!d || d.total_questoes === 0) return null
    return d
  }

  const barColor = (pct) => { if (pct >= 85) return 'bg-accent-500'; if (pct >= 70) return 'bg-blue-500'; if (pct >= 50) return 'bg-amber-500'; return 'bg-red-500' }
  const sessaoTotal = Number(sessaoForm.acertos) + Number(sessaoForm.erros)
  const sessaoLiquido = sessaoTotal > 0 ? Math.round(((Number(sessaoForm.acertos) - Number(sessaoForm.erros)) / sessaoTotal) * 100) : 0
  const sessaoBruto = sessaoTotal > 0 ? Math.round((Number(sessaoForm.acertos) / sessaoTotal) * 100) : 0

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent" /></div>

  return (
    <div className="space-y-4">
      <PageHeader
        icon={ClipboardEdit}
        title="Conteúdo"
        subtitle={`${materias.length} matéria${materias.length === 1 ? '' : 's'} cadastrada${materias.length === 1 ? '' : 's'}`}
      >
        <button onClick={openMatCreate} className="btn-pop inline-flex items-center gap-1.5 bg-primary-700 hover:bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-glow-primary">
          <Plus size={15} /> Matéria
        </button>
      </PageHeader>

      <div className="stagger space-y-2">
        {materias.length === 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Nenhuma matéria cadastrada</h3>
            <p className="mt-1 text-sm text-gray-500">Use o botão Matéria para começar.</p>
          </section>
        )}
        {materias.map((m) => (
          <div key={m.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(`mat-${m.id}`)}>
              <div className="flex items-center gap-2">
                {expanded[`mat-${m.id}`] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                <span className="font-semibold text-gray-900 text-sm">{m.nome}</span>
                {!m.ativo && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inativa</span>}
              </div>
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => openAssCreate(m.id)} className="text-[11px] text-primary-600 hover:bg-primary-50 px-2 py-1 rounded">+ Assunto</button>
                <button onClick={() => openMatEdit(m)} className="text-gray-400 hover:text-primary-600 p-1"><Pencil size={14} /></button>
                <button onClick={() => deleteMat(m.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
              </div>
            </div>

            {expanded[`mat-${m.id}`] && (
              <div className="border-t border-gray-100 bg-gray-50/50">
                {(m.assuntos || []).length === 0 ? (
                  <p className="text-xs text-gray-400 px-4 py-3">Nenhum assunto.</p>
                ) : (
                  (m.assuntos || []).map((a) => (
                    <div key={a.id} className="border-b border-gray-100 last:border-0">
                      <div className="flex items-center justify-between px-6 py-2.5 hover:bg-gray-100/50 cursor-pointer" onClick={() => toggleExpand(`ass-${a.id}`)}>
                        <div className="flex items-center gap-2">
                          {expanded[`ass-${a.id}`] ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                          <span className="font-medium text-gray-700 text-sm">{a.nome}</span>
                        </div>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openTopCreate(a.id)} className="text-[10px] text-accent-600 hover:bg-accent-50 px-1.5 py-1 rounded">+ Tópico</button>
                          <button onClick={() => openAssEdit(a)} className="text-gray-400 hover:text-primary-600 p-1"><Pencil size={13} /></button>
                          <button onClick={() => deleteAss(a.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                        </div>
                      </div>

                      {expanded[`ass-${a.id}`] && (
                        <div className="px-8 py-1 pb-2">
                          {(a.topicos || []).length === 0 ? (
                            <p className="text-xs text-gray-400 py-1">Nenhum tópico.</p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-[10px] text-gray-400 uppercase">
                                  <th className="text-left py-1.5 font-medium">Tópico</th>
                                  <th className="text-left py-1.5 font-medium w-16">Pri.</th>
                                  <th className="text-center py-1.5 font-medium w-12">Total</th>
                                  <th className="text-center py-1.5 font-medium w-10">Ac.</th>
                                  <th className="text-center py-1.5 font-medium w-10">Er.</th>
                                  <th className="text-center py-1.5 font-medium w-16">Líquido</th>
                                  <th className="text-center py-1.5 font-medium w-12">Bruto</th>
                                  <th className="text-right py-1.5 font-medium w-24"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {(a.topicos || []).map((t) => {
                                  const stats = getTopicoStats(t.id)
                                  return (
                                    <tr key={t.id} className="row-hover hover:bg-white/80">
                                      <td className="py-1.5 font-medium text-gray-800">{t.nome}</td>
                                      <td className="py-1.5">
                                        <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${prioridadeColor[t.prioridade]}`}>
                                          {prioridadeLabel[t.prioridade]}
                                        </span>
                                      </td>
                                      {stats ? (
                                        <>
                                          <td className="py-1.5 text-center text-gray-500">{stats.total_questoes}</td>
                                          <td className="py-1.5 text-center text-accent-600 font-semibold">{stats.acertos}</td>
                                          <td className="py-1.5 text-center text-red-500 font-semibold">{stats.erros}</td>
                                          <td className="py-1.5 text-center">
                                            <div className="flex items-center gap-1">
                                              <div className="w-10 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${barColor(stats.percentual_liquido)}`} style={{ width: `${Math.max(2, stats.percentual_liquido)}%` }} />
                                              </div>
                                              <span className="font-bold">{stats.percentual_liquido}%</span>
                                            </div>
                                          </td>
                                          <td className="py-1.5 text-center font-semibold text-gray-500">{stats.percentual_acerto}%</td>
                                        </>
                                      ) : (
                                        <>
                                          <td className="py-1.5 text-center text-gray-300">-</td>
                                          <td className="py-1.5 text-center text-gray-300">-</td>
                                          <td className="py-1.5 text-center text-gray-300">-</td>
                                          <td className="py-1.5 text-center text-gray-300">-</td>
                                          <td className="py-1.5 text-center text-gray-300">-</td>
                                        </>
                                      )}
                                      <td className="py-1.5 text-right">
                                        <button onClick={() => openSessaoCreate(t, a, m)} title="Registrar desempenho" className="text-primary-600 hover:bg-primary-50 p-1 rounded"><ClipboardEdit size={12} /></button>
                                        <button onClick={() => openTopEdit(t)} title="Editar tópico" className="text-gray-400 hover:text-primary-600 p-1"><Pencil size={11} /></button>
                                        <button onClick={() => deleteTop(t.id)} title="Excluir tópico" className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={11} /></button>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showMatModal && <Modal title={editingMat ? 'Editar Matéria' : 'Nova Matéria'} onClose={() => setShowMatModal(false)} onSubmit={saveMat}>
        <input required value={matForm.nome} onChange={e => setMatForm({ ...matForm, nome: e.target.value })} placeholder="Nome da matéria"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        <textarea value={matForm.descricao} onChange={e => setMatForm({ ...matForm, descricao: e.target.value })} placeholder="Descrição" rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none mt-3" />
        <label className="flex items-center gap-2 text-sm mt-2 cursor-pointer">
          <input type="checkbox" checked={matForm.ativo} onChange={e => setMatForm({ ...matForm, ativo: e.target.checked })} className="rounded border-gray-300 text-primary-600" /> Ativa
        </label>
      </Modal>}

      {showAssModal && <Modal title={editingAss ? 'Editar Assunto' : 'Novo Assunto'} onClose={() => setShowAssModal(false)} onSubmit={saveAss}>
        <select value={assForm.materia_id} onChange={e => setAssForm({ ...assForm, materia_id: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="">Selecione a matéria</option>
          {materias.filter(m => m.ativo).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
        <input required value={assForm.nome} onChange={e => setAssForm({ ...assForm, nome: e.target.value })} placeholder="Nome do assunto"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none mt-3" />
      </Modal>}

      {showTopModal && <Modal title={editingTop ? 'Editar Tópico' : 'Novo Tópico'} onClose={() => setShowTopModal(false)} onSubmit={saveTop}>
        <select value={topForm.assunto_id} onChange={e => setTopForm({ ...topForm, assunto_id: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="">Selecione o assunto</option>
          {assuntosParaTopico.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <input required value={topForm.nome} onChange={e => setTopForm({ ...topForm, nome: e.target.value })} placeholder="Nome do tópico"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none mt-3" />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <select value={topForm.prioridade} onChange={e => setTopForm({ ...topForm, prioridade: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option>
          </select>
          <input type="number" min={1} max={5} value={topForm.peso} onChange={e => setTopForm({ ...topForm, peso: Number(e.target.value) })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Peso" />
        </div>
      </Modal>}

      {showSessaoModal && <Modal title="Registrar desempenho" onClose={() => setShowSessaoModal(false)} onSubmit={saveSessao}>
        {sessaoContexto && (
          <div className="mb-3 rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-800">
            <p className="font-semibold text-primary-900">{sessaoContexto.topico.nome}</p>
            <p className="mt-0.5">{sessaoContexto.materia.nome} · {sessaoContexto.assunto.nome}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="text-[11px] font-semibold uppercase text-gray-500">
            Data
            <input type="date" required value={sessaoForm.data} onChange={e => setSessaoForm({ ...sessaoForm, data: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700 outline-none focus:ring-2 focus:ring-primary-500" />
          </label>
          <label className="text-[11px] font-semibold uppercase text-gray-500">
            Tipo
            <select value={sessaoForm.tipo} onChange={e => setSessaoForm({ ...sessaoForm, tipo: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700 outline-none focus:ring-2 focus:ring-primary-500">
              {Object.entries(tipoLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-[11px] font-semibold uppercase text-gray-500">
            Acertos
            <input type="number" required min={0} value={sessaoForm.acertos} onChange={e => setSessaoForm({ ...sessaoForm, acertos: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-accent-700 outline-none focus:ring-2 focus:ring-accent-500" />
          </label>
          <label className="text-[11px] font-semibold uppercase text-gray-500">
            Erros
            <input type="number" required min={0} value={sessaoForm.erros} onChange={e => setSessaoForm({ ...sessaoForm, erros: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-red-600 outline-none focus:ring-2 focus:ring-red-500" />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
          <div>
            <span className="text-gray-500">Total</span>
            <p className="text-base font-bold text-gray-900">{sessaoTotal}</p>
          </div>
          <div>
            <span className="text-gray-500">% líquido</span>
            <p className={`text-base font-bold ${sessaoLiquido >= 70 ? 'text-accent-700' : sessaoLiquido >= 50 ? 'text-amber-700' : 'text-red-600'}`}>{sessaoLiquido}%</p>
          </div>
          <div>
            <span className="text-gray-500">% bruta</span>
            <p className={`text-base font-bold ${sessaoBruto >= 70 ? 'text-accent-700' : sessaoBruto >= 50 ? 'text-amber-700' : 'text-red-600'}`}>{sessaoBruto}%</p>
          </div>
        </div>

        <textarea value={sessaoForm.observacoes} onChange={e => setSessaoForm({ ...sessaoForm, observacoes: e.target.value })} placeholder="Observações"
          className="mt-3 min-h-20 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
      </Modal>}
    </div>
  )
}

function Modal({ title, onClose, onSubmit, children }) {
  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="animate-scale-in bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 mx-3">
        <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
        <form onSubmit={onSubmit}>{children}
          <div className="flex gap-2 justify-end pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
