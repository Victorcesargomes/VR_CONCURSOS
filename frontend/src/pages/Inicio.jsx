import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, BookOpenCheck, CalendarDays, CheckCircle2, Clock, FileQuestion, Flame, LayoutDashboard, ListChecks, Pencil, PlayCircle, Plus, Target, Trash2, TrendingUp } from 'lucide-react'
import { assuntosAPI, calendarioAPI, desempenhoAPI, editaisAPI, engajamentoAPI, materiasAPI, revisoesAPI, sessoesAPI, topicosAPI } from '../api'
import StatCard from '../components/Cards/StatCard'
import PageHeader from '../components/Layout/PageHeader'
import { pctColor } from '../components/Charts/chartTheme'

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
const todayIso = () => new Date().toISOString().slice(0, 10)

const tipoLabel = {
  estudo: 'Estudo novo',
  revisao: 'Revisão',
  simulado: 'Simulado',
  resumo: 'Resumo',
}

const prioridadeColor = {
  alta: 'bg-red-50 text-red-700 border-red-200',
  media: 'bg-amber-50 text-amber-700 border-amber-200',
  baixa: 'bg-slate-50 text-slate-700 border-slate-200',
}

const classificacaoColor = {
  Dominado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Bom: 'bg-sky-50 text-sky-700 border-sky-200',
  Atenção: 'bg-amber-50 text-amber-700 border-amber-200',
  Crítico: 'bg-red-50 text-red-700 border-red-200',
}

const hojeIndiceSemana = () => (new Date().getDay() + 6) % 7

export default function Inicio() {
  const [dash, setDash] = useState(null)
  const [resumoRevisoes, setResumoRevisoes] = useState(null)
  const [revisoes, setRevisoes] = useState([])
  const [sessoesRecentes, setSessoesRecentes] = useState([])
  const [prontidao, setProntidao] = useState(null)
  const [engajamento, setEngajamento] = useState(null)
  const [dias, setDias] = useState([])
  const [materias, setMaterias] = useState([])
  const [assuntos, setAssuntos] = useState([])
  const [topicos, setTopicos] = useState([])
  const [topicosModal, setTopicosModal] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '' })

  const [showPlanoModal, setShowPlanoModal] = useState(false)
  const [editingPlano, setEditingPlano] = useState(null)
  const [planoForm, setPlanoForm] = useState({ dia_semana: 0, materia_id: '', assunto_id: '', tempo_minutos: 60, tipo: 'estudo' })

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
    revisao_id: null,
  })

  const paramsPeriodo = useMemo(() => ({
    data_inicio: filtros.data_inicio || undefined,
    data_fim: filtros.data_fim || undefined,
  }), [filtros])

  const recarregar = async () => {
    const [d, rr, r, c, m, a, t, s] = await Promise.all([
      desempenhoAPI.dashboard(paramsPeriodo),
      revisoesAPI.resumo(),
      revisoesAPI.list({ somente_vencidas: true, limit: 20 }),
      calendarioAPI.list(),
      materiasAPI.list(true),
      assuntosAPI.list(),
      topicosAPI.list(),
      sessoesAPI.list({ ...paramsPeriodo, limit: 10 }),
    ])
    setDash(d.data)
    setResumoRevisoes(rr.data)
    setRevisoes(r.data)
    setDias(c.data)
    setMaterias(m.data)
    setAssuntos(a.data)
    setTopicos(t.data)
    setSessoesRecentes(s.data)
    try {
      const p = await editaisAPI.readinessAtivo()
      setProntidao(p.data)
    } catch {
      setProntidao(null)
    }
    try {
      const e = await engajamentoAPI.stats()
      setEngajamento(e.data)
    } catch {
      setEngajamento(null)
    }
  }

  useEffect(() => {
    recarregar().finally(() => setLoading(false))
  }, [paramsPeriodo])

  const topicosOrdenados = useMemo(() => {
    return [...topicos].sort((a, b) => `${a.materia_nome} ${a.assunto_nome} ${a.nome}`.localeCompare(`${b.materia_nome} ${b.assunto_nome} ${b.nome}`))
  }, [topicos])

  const assuntosDaMateria = assuntos.filter(a => String(a.materia_id) === String(planoForm.materia_id))
  const getDiaPlanos = (dia) => dias.find(d => d.dia === dia)?.planos || []
  const hojeIndice = hojeIndiceSemana()
  const planosHoje = useMemo(() => getDiaPlanos(hojeIndice), [dias, hojeIndice])
  const topicosPorId = useMemo(() => new Map(topicos.map(t => [Number(t.id), t])), [topicos])
  const minutosHoje = planosHoje.reduce((total, plano) => total + Number(plano.tempo_minutos || 0), 0)

  const sugestoesHoje = useMemo(() => {
    const base = dash?.sugestoes?.length ? dash.sugestoes : dash?.pior_topicos || []
    const dentroDoPlano = base.filter(sugestao => {
      if (planosHoje.length === 0) return true
      return planosHoje.some(plano => {
        const mesmaMateria = sugestao.materia_nome === plano.materia_nome
        const mesmoAssunto = !plano.assunto_nome || sugestao.assunto_nome === plano.assunto_nome
        return mesmaMateria && mesmoAssunto
      })
    })
    const lista = dentroDoPlano.length > 0 ? dentroDoPlano : base
    const vistos = new Set()
    return lista.filter(sugestao => {
      const id = Number(sugestao.topico_id)
      if (vistos.has(id)) return false
      vistos.add(id)
      return true
    }).slice(0, 5)
  }, [dash, planosHoje])
  const sistemaVazio = materias.length === 0 && topicos.length === 0 && planosHoje.length === 0 && sessoesRecentes.length === 0 && (dash?.total_questoes || 0) === 0

  const abrirPlanoNovo = (dia) => {
    setEditingPlano(null)
    setPlanoForm({ dia_semana: dia, materia_id: materias[0]?.id || '', assunto_id: '', tempo_minutos: 60, tipo: 'estudo' })
    setShowPlanoModal(true)
  }

  const abrirPlanoEditar = (plano) => {
    setEditingPlano(plano)
    setPlanoForm({
      dia_semana: plano.dia_semana,
      materia_id: plano.materia_id || '',
      assunto_id: plano.assunto_id || '',
      tempo_minutos: plano.tempo_minutos || 60,
      tipo: plano.tipo || 'estudo',
    })
    setShowPlanoModal(true)
  }

  const salvarPlano = async (event) => {
    event.preventDefault()
    const payload = {
      dia_semana: Number(planoForm.dia_semana),
      materia_id: Number(planoForm.materia_id),
      assunto_id: planoForm.assunto_id ? Number(planoForm.assunto_id) : null,
      tempo_minutos: Number(planoForm.tempo_minutos),
      tipo: planoForm.tipo,
    }
    if (editingPlano) await calendarioAPI.update(editingPlano.id, payload)
    else await calendarioAPI.create(payload)
    setShowPlanoModal(false)
    await recarregar()
  }

  const excluirPlano = async (id) => {
    if (!confirm('Excluir este item do calendário?')) return
    await calendarioAPI.delete(id)
    await recarregar()
  }

  const abrirSessaoLivre = () => {
    setSessaoContexto(null)
    setTopicosModal(topicosOrdenados)
    setSessaoForm({
      topico_id: topicosOrdenados[0]?.id || '',
      data: todayIso(),
      tipo: 'estudo',
      acertos: 0,
      erros: 0,
      resumo_feito: false,
      observacoes: '',
      revisao_id: null,
    })
    setShowSessaoModal(true)
  }

  const abrirSessaoDoPlano = async (plano) => {
    const resposta = await topicosAPI.list(plano.assunto_id ? { assunto_id: plano.assunto_id } : { materia_id: plano.materia_id })
    const opcoes = resposta.data
    setTopicosModal(opcoes)
    setSessaoContexto({ tipo: 'plano', label: `${plano.materia_nome}${plano.assunto_nome ? ` · ${plano.assunto_nome}` : ''}` })
    setSessaoForm({
      topico_id: opcoes[0]?.id || '',
      data: todayIso(),
      tipo: plano.tipo || 'estudo',
      acertos: 0,
      erros: 0,
      resumo_feito: plano.tipo === 'resumo',
      observacoes: '',
      revisao_id: null,
    })
    setShowSessaoModal(true)
  }

  const abrirSessaoDoTopico = (sugestao) => {
    const topicoId = Number(sugestao.topico_id || sugestao.id)
    const topico = topicosPorId.get(topicoId)
    setTopicosModal(topicosOrdenados)
    setSessaoContexto({
      tipo: 'sugestao',
      label: `${sugestao.topico_nome || topico?.nome} · ${sugestao.materia_nome || topico?.materia_nome}`,
    })
    setSessaoForm({
      topico_id: topicoId || '',
      data: todayIso(),
      tipo: 'estudo',
      acertos: 0,
      erros: 0,
      resumo_feito: false,
      observacoes: '',
      revisao_id: null,
    })
    setShowSessaoModal(true)
  }

  const abrirRevisao = (revisao) => {
    setTopicosModal(topicosOrdenados)
    setSessaoContexto({ tipo: 'revisao', label: `${revisao.topico_nome} · ${revisao.materia_nome}` })
    setSessaoForm({
      topico_id: revisao.topico_id,
      data: todayIso(),
      tipo: 'revisao',
      acertos: 0,
      erros: 0,
      resumo_feito: false,
      observacoes: '',
      revisao_id: revisao.id,
    })
    setShowSessaoModal(true)
  }

  const salvarSessao = async (event) => {
    event.preventDefault()
    const total = Number(sessaoForm.acertos) + Number(sessaoForm.erros)
    const res = await sessoesAPI.create({
      ...sessaoForm,
      topico_id: Number(sessaoForm.topico_id),
      acertos: Number(sessaoForm.acertos),
      erros: Number(sessaoForm.erros),
      questoes_feitas: total,
      revisao_id: sessaoForm.revisao_id || undefined,
    })
    setShowSessaoModal(false)
    if (res.data.novas_conquistas?.length) {
      window.dispatchEvent(new CustomEvent('vr-conquistas', { detail: res.data.novas_conquistas }))
    }
    await recarregar()
  }

  const concluirSemQuestoes = async (id) => {
    await revisoesAPI.concluir(id)
    await recarregar()
  }

  const removeSessao = async (id) => {
    if (!confirm('Excluir sessão?')) return
    await sessoesAPI.delete(id)
    await recarregar()
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={LayoutDashboard}
        title="Painel de estudos"
        subtitle="Organize a semana, registre cada tentativa e acompanhe a evolução por período."
      >
        {engajamento && (
          <Link to="/conquistas" className="hidden items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm sm:flex">
            <Flame size={16} className="text-amber-500" />
            <span className="font-semibold text-amber-700">{engajamento.streak_atual}d</span>
            <span className="text-amber-600/70">· meta {engajamento.meta_hoje?.hoje_questoes ?? 0}/{engajamento.meta_hoje?.meta_questoes ?? 40}</span>
          </Link>
        )}
        {topicos.length > 0 && <button onClick={abrirSessaoLivre} className="btn-pop inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-glow-primary hover:bg-primary-600">
          <Plus size={16} /> Registrar estudo
        </button>}
      </PageHeader>

      {prontidao && (
        <Link to="/prontidao" className="hover-lift group mb-1 flex flex-wrap items-center gap-4 rounded-xl border border-primary-700/30 bg-gradient-to-r from-primary-800 to-primary-950 p-4 text-white shadow-card">
          <div className="relative h-12 w-12 shrink-0 rounded-full" style={{ background: `conic-gradient(${pctColor(prontidao.score || 0)} 0deg ${(prontidao.score || 0) * 3.6}deg, rgba(255,255,255,0.15) ${(prontidao.score || 0) * 3.6}deg 360deg)` }}>
            <div className="absolute inset-[5px] flex items-center justify-center rounded-full bg-primary-900">
              <span className="text-sm font-extrabold leading-none" style={{ color: pctColor(prontidao.score || 0) }}>{Math.round(prontidao.score || 0)}</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Prontidão para a prova</p>
            <p className="text-xs text-primary-200">
              {prontidao.dias_para_prova != null ? <>Faltam <strong className="text-white">{prontidao.dias_para_prova} dias</strong> · </> : null}
              cobertura {prontidao.cobertura}% · desempenho {prontidao.liquido}% · tendência {prontidao.tendencia}
            </p>
          </div>
          <span className="btn-pop ml-auto rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white group-hover:bg-white/20">Ver detalhes →</span>
        </Link>
      )}

      {sistemaVazio && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Sistema limpo</h3>
              <p className="mt-1 text-sm text-gray-500">Comece cadastrando uma matéria, depois adicione assuntos e tópicos.</p>
            </div>
            <Link to="/conteudo" className="btn-pop inline-flex items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-glow-primary hover:bg-primary-600">
              <Plus size={16} /> Nova matéria
            </Link>
          </div>
        </section>
      )}

      {!sistemaVazio && <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Questões" value={dash?.total_questoes || 0} icon={FileQuestion} color="primary" />
        <StatCard label="% líquido" value={`${dash?.percentual_geral_liquido || 0}%`} icon={TrendingUp} color="accent" />
        <StatCard label="% bruta" value={`${dash?.percentual_geral_acertos || 0}%`} icon={CheckCircle2} color="primary" />
        <StatCard label="Revisões hoje" value={resumoRevisoes?.hoje || 0} icon={Target} color="amber" />
        <StatCard label="Atrasadas" value={resumoRevisoes?.atrasadas || 0} icon={Clock} color="rose" />
      </div>}

      {!sistemaVazio && <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white shadow-card">
        <div className="grid gap-4 p-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpenCheck size={18} className="text-primary-700" />
                  <h3 className="text-base font-bold text-gray-900">Estudar hoje</h3>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {DIAS[hojeIndice]}, {new Date().toLocaleDateString('pt-BR')} · {planosHoje.length} item{planosHoje.length === 1 ? '' : 's'} · {minutosHoje} min
                </p>
              </div>
              <button onClick={() => abrirPlanoNovo(hojeIndice)} className="inline-flex items-center gap-2 rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50">
                <Plus size={14} /> Planejar
              </button>
            </div>

            {planosHoje.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-2">
                {planosHoje.map(plano => (
                  <div key={plano.id} className="hover-lift group rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{plano.materia_nome}</p>
                        <p className="mt-1 truncate text-xs text-gray-500">{plano.assunto_nome || 'Matéria inteira'}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200">{plano.tempo_minutos} min</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase text-gray-400">{tipoLabel[plano.tipo] || plano.tipo}</span>
                      <button onClick={() => abrirSessaoDoPlano(plano)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-800">
                        <PlayCircle size={14} /> Registrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-gray-700">Nenhuma matéria planejada para hoje.</p>
                <p className="mt-1 text-xs text-gray-500">Adicione um item ao calendário semanal para orientar o estudo do dia.</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <h4 className="text-sm font-semibold text-gray-800">Prioridades</h4>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{sugestoesHoje.length}</span>
            </div>
            {sugestoesHoje.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {sugestoesHoje.map(sugestao => (
                  <div key={sugestao.topico_id} className="row-hover px-3 py-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{sugestao.topico_nome}</p>
                        <p className="mt-1 truncate text-xs text-gray-500">{sugestao.materia_nome} · {sugestao.assunto_nome}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${classificacaoColor[sugestao.classificacao] || classificacaoColor['Crítico']}`}>{sugestao.classificacao}</span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{sugestao.percentual_liquido}% líquido</span>
                          <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500">{sugestao.percentual_acerto}% bruto</span>
                        </div>
                      </div>
                      <button onClick={() => abrirSessaoDoTopico(sugestao)} title="Registrar estudo" className="shrink-0 rounded-lg border border-gray-200 p-2 text-primary-700 hover:bg-primary-50">
                        <PlayCircle size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-7 text-center">
                <ListChecks size={20} className="mx-auto text-emerald-600" />
                <p className="mt-2 text-sm font-semibold text-gray-700">Sem tópicos críticos no período.</p>
              </div>
            )}
          </div>
        </div>
      </section>}

      {materias.length > 0 && <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-4 shadow-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={17} className="text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-800">Calendário semanal</h3>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <DateField label="De" value={filtros.data_inicio} onChange={value => setFiltros({ ...filtros, data_inicio: value })} />
            <DateField label="Até" value={filtros.data_fim} onChange={value => setFiltros({ ...filtros, data_fim: value })} />
            <button onClick={() => setFiltros({ data_inicio: '', data_fim: '' })} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">Limpar</button>
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-7">
          {DIAS.map((nome, dia) => (
            <div key={dia} className="rounded-lg border border-gray-200 bg-gray-50/60">
              <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
                <span className="text-xs font-bold text-gray-800">{nome}</span>
                <button onClick={() => abrirPlanoNovo(dia)} className="rounded-md p-1 text-primary-600 hover:bg-primary-50"><Plus size={14} /></button>
              </div>
              <div className="min-h-28 space-y-2 p-2">
                {getDiaPlanos(dia).map(plano => (
                  <div key={plano.id} onClick={() => abrirSessaoDoPlano(plano)} className="hover-lift group cursor-pointer rounded-lg border border-primary-100 bg-white p-2 text-xs shadow-card hover:border-primary-300">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{plano.materia_nome}</p>
                        {plano.assunto_nome && <p className="mt-0.5 text-gray-500">{plano.assunto_nome}</p>}
                        <p className="mt-1 text-[11px] text-gray-400">{tipoLabel[plano.tipo] || plano.tipo} · {plano.tempo_minutos} min</p>
                      </div>
                      <div className="flex opacity-0 transition-opacity group-hover:opacity-100" onClick={event => event.stopPropagation()}>
                        <button onClick={() => abrirPlanoEditar(plano)} className="p-1 text-gray-400 hover:text-primary-600"><Pencil size={12} /></button>
                        <button onClick={() => excluirPlano(plano.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {getDiaPlanos(dia).length === 0 && <p className="px-1 py-4 text-center text-[11px] text-gray-400">Sem matérias</p>}
              </div>
            </div>
          ))}
        </div>
      </section>}

      {revisoes.length > 0 && <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Fila de revisão</h3>
            <p className="text-xs text-gray-500">Revisões atrasadas e de hoje.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{resumoRevisoes?.total_pendentes || 0} pendentes</span>
        </div>

        {revisoes.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {revisoes.map((r) => (
              <div key={r.id} className="row-hover grid gap-3 px-4 py-3 hover:bg-gray-50 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{r.topico_nome}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${prioridadeColor[r.prioridade] || prioridadeColor.media}`}>{r.prioridade}</span>
                    {r.dias_atraso > 0 && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">{r.dias_atraso}d atrasada</span>}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{r.materia_nome} · {r.assunto_nome}</p>
                  <p className="mt-1 text-xs text-gray-400">Prevista: {new Date(r.data_prevista).toLocaleDateString('pt-BR')} · {r.etapa || 'revisão'} · {r.motivo || 'revisão programada'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => abrirRevisao(r)} className="rounded-lg bg-primary-700 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-800">Registrar revisão</button>
                  <button onClick={() => concluirSemQuestoes(r.id)} title="Concluir sem registrar questões" className="rounded-lg border border-gray-200 px-2.5 py-2 text-gray-500 hover:bg-gray-50">
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Nenhuma revisão vencida.</div>
        )}
      </section>}

      {sessoesRecentes.length > 0 && <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white shadow-card">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-800">Sessões recentes no período</h3>
        </div>
        {sessoesRecentes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-400">
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Tópico</th>
                  <th className="px-4 py-2 text-center">Tipo</th>
                  <th className="px-4 py-2 text-center">Ac.</th>
                  <th className="px-4 py-2 text-center">Er.</th>
                  <th className="px-4 py-2 text-center">% líq.</th>
                  <th className="px-4 py-2 text-center">% bruta</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessoesRecentes.map((s) => {
                  const liquido = s.questoes_feitas > 0 ? Math.round(((s.acertos - s.erros) / s.questoes_feitas) * 100) : 0
                  const bruto = s.questoes_feitas > 0 ? Math.round((s.acertos / s.questoes_feitas) * 100) : 0
                  return (
                    <tr key={s.id} className="row-hover text-xs hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500">{new Date(s.data).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-2"><span className="font-medium text-gray-800">{s.topico_nome}</span><span className="ml-1 text-gray-400">· {s.assunto_nome}</span></td>
                      <td className="px-4 py-2 text-center text-gray-500">{tipoLabel[s.tipo] || s.tipo}</td>
                      <td className="px-4 py-2 text-center font-semibold text-accent-600">{s.acertos}</td>
                      <td className="px-4 py-2 text-center font-semibold text-red-500">{s.erros}</td>
                      <td className="px-4 py-2 text-center font-bold">{liquido}%</td>
                      <td className="px-4 py-2 text-center font-semibold text-gray-500">{bruto}%</td>
                      <td className="px-4 py-2"><button onClick={() => removeSessao(s.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Nenhuma sessão no período.</div>
        )}
      </section>}

      {showPlanoModal && (
        <Modal title={editingPlano ? 'Editar calendário' : `Adicionar em ${DIAS[planoForm.dia_semana]}`} onClose={() => setShowPlanoModal(false)} onSubmit={salvarPlano}>
          <label className="text-[11px] font-semibold uppercase text-gray-500">Matéria</label>
          <select required value={planoForm.materia_id} onChange={e => setPlanoForm({ ...planoForm, materia_id: e.target.value, assunto_id: '' })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Selecione</option>
            {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>

          <label className="mt-3 block text-[11px] font-semibold uppercase text-gray-500">Assunto opcional</label>
          <select value={planoForm.assunto_id} onChange={e => setPlanoForm({ ...planoForm, assunto_id: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Matéria inteira</option>
            {assuntosDaMateria.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <input type="number" min={5} value={planoForm.tempo_minutos} onChange={e => setPlanoForm({ ...planoForm, tempo_minutos: Number(e.target.value) })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Minutos" />
            <select value={planoForm.tipo} onChange={e => setPlanoForm({ ...planoForm, tipo: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
              <option value="estudo">Estudo</option>
              <option value="revisao">Revisão</option>
              <option value="simulado">Simulado</option>
              <option value="resumo">Resumo</option>
            </select>
          </div>
        </Modal>
      )}

      {showSessaoModal && (
        <Modal title="Registrar sessão" onClose={() => setShowSessaoModal(false)} onSubmit={salvarSessao}>
          {sessaoContexto && <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{sessaoContexto.label}</div>}
          <label className="text-[11px] font-semibold uppercase text-gray-500">Tópico</label>
          <select required value={sessaoForm.topico_id} onChange={e => setSessaoForm({ ...sessaoForm, topico_id: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Selecione o tópico</option>
            {topicosModal.map(t => <option key={t.id} value={t.id}>{t.materia_nome} · {t.assunto_nome} · {t.nome}</option>)}
          </select>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <input type="date" required value={sessaoForm.data} onChange={e => setSessaoForm({ ...sessaoForm, data: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            <select value={sessaoForm.tipo} onChange={e => setSessaoForm({ ...sessaoForm, tipo: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
              <option value="estudo">Estudo novo</option>
              <option value="revisao">Revisão</option>
              <option value="simulado">Simulado</option>
              <option value="resumo">Resumo</option>
            </select>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <input type="number" required min={0} value={sessaoForm.acertos} onChange={e => setSessaoForm({ ...sessaoForm, acertos: Number(e.target.value) })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-accent-700 outline-none focus:ring-2 focus:ring-accent-500" placeholder="Acertos" />
            <input type="number" required min={0} value={sessaoForm.erros} onChange={e => setSessaoForm({ ...sessaoForm, erros: Number(e.target.value) })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-red-600 outline-none focus:ring-2 focus:ring-red-500" placeholder="Erros" />
          </div>
          <textarea value={sessaoForm.observacoes} onChange={e => setSessaoForm({ ...sessaoForm, observacoes: e.target.value })}
            className="mt-3 min-h-20 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Observações sobre a tentativa" />
        </Modal>
      )}
    </div>
  )
}

function DateField({ label, value, onChange }) {
  return (
    <label className="text-[11px] font-semibold uppercase text-gray-500">
      {label}
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-xs font-normal text-gray-700 outline-none focus:ring-2 focus:ring-primary-500" />
    </label>
  )
}

function Modal({ title, onClose, onSubmit, children }) {
  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="animate-scale-in mx-3 w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl">
        <h3 className="mb-3 text-base font-semibold text-gray-900">{title}</h3>
        <form onSubmit={onSubmit}>
          {children}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancelar</button>
            <button type="submit" className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
