import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, BarChart3, ChevronDown, Filter, LayoutGrid, Target, TrendingUp } from 'lucide-react'
import { assuntosAPI, desempenhoAPI, materiasAPI, revisoesAPI } from '../api'
import EvolutionLine from '../components/Charts/EvolutionLine'
import MateriasDonut from '../components/Charts/MateriasDonut'
import TopicsHeatmap from '../components/Charts/TopicsHeatmap'
import VolumeScatter from '../components/Charts/VolumeScatter'
import MateriasRadar from '../components/Charts/MateriasRadar'
import ReviewFunnel from '../components/Charts/ReviewFunnel'
import { normalizeStatus, pctColor, shortName, statusMeta, statusOrder } from '../components/Charts/chartTheme'

const prioridadeLabel = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }
const prioridadeColor = { baixa: 'bg-slate-100 text-slate-600', media: 'bg-amber-100 text-amber-700', alta: 'bg-red-100 text-red-700' }

const hojeIso = () => new Date().toISOString().slice(0, 10)
const diasAtrasIso = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const PERIODOS = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: 'tudo', label: 'Tudo' },
]

const TIPOS_SESSAO = [
  { value: 'estudo', label: 'Estudo' },
  { value: 'revisao', label: 'Revisão' },
  { value: 'simulado', label: 'Simulado' },
  { value: 'resumo', label: 'Resumo' },
]

export default function Evolucao() {
  const [dashboard, setDashboard] = useState(null)
  const [materias, setMaterias] = useState([])
  const [todasMaterias, setTodasMaterias] = useState([])
  const [todosTopicos, setTodosTopicos] = useState([])
  const [assuntos, setAssuntos] = useState([])
  const [assuntoData, setAssuntoData] = useState(null)
  const [historicoData, setHistoricoData] = useState(null)
  const [resumoRevisoes, setResumoRevisoes] = useState(null)
  const [loading, setLoading] = useState(true)
  const [assuntoLoading, setAssuntoLoading] = useState(false)
  const [selectedMateria, setSelectedMateria] = useState('')
  const [selectedAssunto, setSelectedAssunto] = useState('')
  const [selectedTopico, setSelectedTopico] = useState(null)
  const [filtros, setFiltros] = useState({ data_inicio: diasAtrasIso(29), data_fim: hojeIso() })
  const [periodo, setPeriodo] = useState('30d')
  const [materiaFiltro, setMateriaFiltro] = useState('')
  const [tipos, setTipos] = useState([])
  const [classificacoes, setClassificacoes] = useState([])

  // Parâmetros enviados ao backend (período + matéria + tipos de sessão)
  const paramsPeriodo = useMemo(() => ({
    data_inicio: filtros.data_inicio || undefined,
    data_fim: filtros.data_fim || undefined,
    materia_id: materiaFiltro || undefined,
    tipos: tipos.length ? tipos : undefined,
  }), [filtros, materiaFiltro, tipos])

  const aplicarPreset = (preset) => {
    setPeriodo(preset)
    const fim = hojeIso()
    if (preset === 'tudo') setFiltros({ data_inicio: '', data_fim: '' })
    else if (preset === 'hoje') setFiltros({ data_inicio: fim, data_fim: fim })
    else if (preset === '7d') setFiltros({ data_inicio: diasAtrasIso(6), data_fim: fim })
    else if (preset === '30d') setFiltros({ data_inicio: diasAtrasIso(29), data_fim: fim })
    else if (preset === '90d') setFiltros({ data_inicio: diasAtrasIso(89), data_fim: fim })
  }

  const onPeriodoManual = (campo, valor) => {
    setPeriodo('')
    setFiltros(f => ({ ...f, [campo]: valor }))
  }

  const toggleTipo = (tipo) => setTipos(prev => prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo])
  const toggleClassificacao = (status) => setClassificacoes(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])

  const limparFiltros = () => {
    setMateriaFiltro('')
    setTipos([])
    setClassificacoes([])
    aplicarPreset('30d')
  }

  const filtrosAtivos = materiaFiltro !== '' || tipos.length > 0 || classificacoes.length > 0 || periodo !== '30d'

  useEffect(() => {
    setLoading(true)
    Promise.all([
      desempenhoAPI.dashboard(paramsPeriodo),
      desempenhoAPI.materias(paramsPeriodo),
      desempenhoAPI.topicos(paramsPeriodo),
      materiasAPI.list(),
      revisoesAPI.resumo(),
    ])
      .then(([dash, mats, tops, allMats, rev]) => {
        setDashboard(dash.data)
        setMaterias(mats.data)
        setTodosTopicos(tops.data)
        setTodasMaterias(allMats.data)
        setResumoRevisoes(rev.data)
        if (!selectedMateria && allMats.data[0]) setSelectedMateria(String(allMats.data[0].id))
      })
      .finally(() => setLoading(false))
  }, [paramsPeriodo])

  useEffect(() => {
    if (!selectedMateria) {
      setAssuntos([])
      setSelectedAssunto('')
      return
    }
    assuntosAPI.list(selectedMateria).then(r => {
      setAssuntos(r.data)
      setSelectedAssunto(r.data[0] ? String(r.data[0].id) : '')
      setSelectedTopico(null)
      setHistoricoData(null)
    })
  }, [selectedMateria])

  useEffect(() => {
    if (!selectedAssunto) {
      setAssuntoData(null)
      setSelectedTopico(null)
      setHistoricoData(null)
      return
    }
    setAssuntoLoading(true)
    desempenhoAPI.assuntoDetalhe(selectedAssunto, paramsPeriodo)
      .then(r => setAssuntoData(r.data))
      .catch(() => setAssuntoData(null))
      .finally(() => setAssuntoLoading(false))
  }, [selectedAssunto, paramsPeriodo])

  const topicosComQuestoes = useMemo(() => todosTopicos.filter(t => t.total_questoes > 0), [todosTopicos])
  const materiasComQuestoes = useMemo(() => materias.filter(m => m.total_questoes > 0), [materias])

  // Tópicos após refino por classificação (segmentação local)
  const topicosFiltrados = useMemo(() => {
    if (!classificacoes.length) return topicosComQuestoes
    return topicosComQuestoes.filter(t => classificacoes.includes(normalizeStatus(t.classificacao)))
  }, [topicosComQuestoes, classificacoes])

  const rankingMaterias = useMemo(() => {
    return [...materiasComQuestoes]
      .sort((a, b) => b.percentual_liquido - a.percentual_liquido)
      .map(m => ({ ...m, label: shortName(m.materia_nome, 22) }))
  }, [materiasComQuestoes])

  const statusData = useMemo(() => {
    return statusOrder.map(status => ({
      status,
      name: statusMeta[status].label,
      value: topicosFiltrados.filter(t => normalizeStatus(t.classificacao) === status).length,
      fill: statusMeta[status].color,
    }))
  }, [topicosFiltrados])

  const topicosPrioritarios = useMemo(() => {
    const relevantes = topicosFiltrados
      .filter(t => ['Critico', 'Atencao'].includes(normalizeStatus(t.classificacao)))
      .sort((a, b) => a.percentual_liquido - b.percentual_liquido)
    const base = relevantes.length > 0 ? relevantes : [...topicosFiltrados].sort((a, b) => a.percentual_liquido - b.percentual_liquido)
    return base.slice(0, 6)
  }, [topicosFiltrados])

  const volumeSemanal = dashboard?.evolucao_semanal || []
  const totalAcertos = materiasComQuestoes.reduce((sum, m) => sum + Number(m.acertos || 0), 0)
  const totalErros = materiasComQuestoes.reduce((sum, m) => sum + Number(m.erros || 0), 0)
  const taxaAcerto = (totalAcertos + totalErros) > 0 ? Math.round((totalAcertos / (totalAcertos + totalErros)) * 1000) / 10 : 0
  const temDados = (dashboard?.total_questoes || 0) > 0

  const donutData = useMemo(
    () => materiasComQuestoes.map((m) => ({ name: m.materia_nome, value: m.total_questoes })),
    [materiasComQuestoes]
  )
  const radarData = useMemo(
    () => materiasComQuestoes.map((m) => ({ subject: shortName(m.materia_nome, 12), A: m.percentual_liquido, full: m.materia_nome })),
    [materiasComQuestoes]
  )

  const openHistorico = (topicoId) => {
    setSelectedTopico(topicoId)
    desempenhoAPI.historicoTopico(topicoId, paramsPeriodo).then(r => setHistoricoData(r.data))
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>

  return (
    <div className="space-y-4">
      <section className="animate-fade-in-up overflow-hidden rounded-xl border border-primary-900 bg-primary-950 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white">
              <BarChart3 size={19} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Painel Executivo de Evolução</h2>
              <p className="text-xs text-primary-200">Constância, desempenho, erros e prioridades em uma única leitura.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {filtrosAtivos && (
              <button onClick={limparFiltros} className="btn-pop rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-primary-100 hover:bg-white/10">Limpar filtros</button>
            )}
          </div>
        </div>

        <FilterBar
          periodo={periodo}
          aplicarPreset={aplicarPreset}
          dataInicio={filtros.data_inicio}
          dataFim={filtros.data_fim}
          onPeriodoManual={onPeriodoManual}
          materiaFiltro={materiaFiltro}
          setMateriaFiltro={setMateriaFiltro}
          materias={todasMaterias}
          tipos={tipos}
          toggleTipo={toggleTipo}
          classificacoes={classificacoes}
          toggleClassificacao={toggleClassificacao}
        />

        {!temDados ? (
          <div className="p-8 text-center">
            {filtrosAtivos ? (
              <>
                <h3 className="text-base font-semibold text-white">Nenhum dado para os filtros selecionados</h3>
                <p className="mt-1 text-sm text-primary-200">Ajuste ou limpe os filtros para ver o desempenho.</p>
                <button onClick={limparFiltros} className="btn-pop mt-4 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-400">Limpar filtros</button>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-white">Ainda não há desempenho registrado</h3>
                <p className="mt-1 text-sm text-primary-200">Registre acertos e erros em Conteúdo para liberar os gráficos.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-3">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-5">
              <KpiCard label="Questões" value={dashboard.total_questoes} tone="blue" />
              <KpiCard label="% líquido" value={`${dashboard.percentual_geral_liquido}%`} tone="green" />
              <KpiCard label="% bruta" value={`${taxaAcerto}%`} tone="slate" />
              <KpiCard label="Acertos" value={totalAcertos} tone="green" />
              <KpiCard label="Erros" value={totalErros} tone="red" />
            </div>

            <div className="grid min-w-0 gap-3 lg:grid-cols-2">
              <ChartPanel title="Ranking por matéria">
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={rankingMaterias} layout="vertical" margin={{ top: 8, right: 28, bottom: 8, left: 10 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="label" width={132} tick={{ fontSize: 11 }} stroke="#64748b" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v, n) => [`${v}%`, n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="percentual_liquido" name="Líquido" radius={[0, 6, 6, 0]} barSize={9}>
                      {rankingMaterias.map(m => <Cell key={m.materia_id} fill={pctColor(m.percentual_liquido)} />)}
                    </Bar>
                    <Bar dataKey="percentual_acerto" name="Bruto" fill="#cbd5e1" radius={[0, 6, 6, 0]} barSize={9} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel title="Status dos tópicos">
                <div className="grid h-full gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={66} paddingAngle={3}>
                        {statusData.map(item => <Cell key={item.status} fill={item.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 self-center">
                    {statusData.map(item => (
                      <div key={item.status} className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                          <span className="font-semibold text-gray-700">{item.name}</span>
                        </div>
                        <span className="font-bold text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartPanel>

              <ChartPanel title="Volume semanal">
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={volumeSemanal} margin={{ top: 8, right: 10, bottom: 2, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="semana" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="total" name="Questões" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel title="Acertos x erros">
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={rankingMaterias} margin={{ top: 8, right: 10, bottom: 38, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-28} textAnchor="end" stroke="#94a3b8" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="acertos" name="Acertos" stackId="a" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="erros" name="Erros" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>
            </div>
          </div>
        )}
      </section>

      {temDados && (
        <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-700" />
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Evolução e distribuição</h3>
              <p className="text-xs text-gray-500">Tendência semanal e repartição do esforço por matéria.</p>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <ChartPanel title="Evolução semanal (% líquido)">
              <EvolutionLine data={volumeSemanal} />
            </ChartPanel>
            <ChartPanel title="Distribuição de questões por matéria">
              <MateriasDonut data={donutData} />
            </ChartPanel>
          </div>
        </section>
      )}

      {temDados && (
        <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <LayoutGrid size={16} className="text-primary-700" />
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Análise avançada</h3>
              <p className="text-xs text-gray-500">Onde estão os erros, correlação volume×desempenho e equilíbrio entre matérias.</p>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            <ChartPanel title="Mapa de calor por assunto">
              <TopicsHeatmap topicos={topicosFiltrados} />
            </ChartPanel>
            <ChartPanel title="Volume × desempenho">
              <VolumeScatter topicos={topicosFiltrados} />
            </ChartPanel>
            <ChartPanel title="Equilíbrio entre matérias">
              <MateriasRadar data={radarData} />
            </ChartPanel>
          </div>
        </section>
      )}

      {temDados && (
        <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Filter size={16} className="text-primary-700" />
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Funil de erros e revisão</h3>
              <p className="text-xs text-gray-500">Pipeline do erro até a revisão pendente.</p>
            </div>
          </div>
          <ReviewFunnel questoes={dashboard?.total_questoes || 0} erros={totalErros} resumo={resumoRevisoes} />
        </section>
      )}

      {temDados && (
        <div className="animate-fade-in-up grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
              <AlertTriangle size={16} className="text-amber-600" />
              <h3 className="text-sm font-semibold text-gray-800">Fila de prioridade</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {topicosPrioritarios.map(t => {
                const status = normalizeStatus(t.classificacao)
                return (
                  <div key={t.topico_id} className="row-hover px-4 py-3 hover:bg-gray-50">
                    <p className="line-clamp-2 text-sm font-semibold text-gray-900">{t.topico_nome}</p>
                    <p className="mt-1 text-xs text-gray-500">{t.materia_nome} · {t.assunto_nome}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusMeta[status].badge}`}>{statusMeta[status].label}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">{t.percentual_liquido}% líquido</span>
                      <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500">{t.percentual_acerto}% bruto</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${prioridadeColor[t.prioridade] || prioridadeColor.media}`}>{prioridadeLabel[t.prioridade] || t.prioridade}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Detalhamento</h3>
                <p className="text-xs text-gray-500">Analise matéria, assunto e histórico do tópico.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SelectField label="Materia" value={selectedMateria} onChange={setSelectedMateria}
                  options={todasMaterias.filter(m => m.ativo).map(m => ({ v: m.id, l: m.nome }))} />
                <SelectField label="Assunto" value={selectedAssunto} onChange={setSelectedAssunto}
                  options={assuntos.map(a => ({ v: a.id, l: a.nome }))} />
              </div>
            </div>

            {assuntoLoading ? (
              <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>
            ) : assuntoData && assuntoData.topicos ? (
              <DrilldownTable
                assuntoData={assuntoData}
                selectedTopico={selectedTopico}
                onOpenHistorico={openHistorico}
              />
            ) : (
              <p className="py-8 text-center text-xs text-gray-400">Selecione uma matéria e um assunto.</p>
            )}

            {historicoData && selectedTopico && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <Target size={15} className="text-primary-500" />
                  <h4 className="text-sm font-semibold text-gray-800">{historicoData.topico_nome}</h4>
                </div>
                {historicoData.historico?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={historicoData.historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="data" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Line type="monotone" dataKey="percentual_liquido" stroke="#2563eb" strokeWidth={2} dot={{ r: 4, fill: '#2563eb' }} name="% líquido" />
                      <Line type="monotone" dataKey="media_movel_liquida" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 3, fill: '#f59e0b' }} name="media movel" />
                      <Line type="monotone" dataKey="percentual_acerto" stroke="#10b981" strokeWidth={1.5} dot={{ r: 3, fill: '#10b981' }} name="% bruto" strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-4 text-center text-xs text-gray-400">Nenhuma sessão registrada para este tópico no período.</p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, tone }) {
  const tones = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700 group-hover:bg-blue-100',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100',
    red: 'border-red-200 bg-red-50 text-red-700 group-hover:bg-red-100',
    slate: 'border-slate-200 bg-slate-50 text-slate-700 group-hover:bg-slate-100',
  }
  return (
    <div className="hover-lift group rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase text-gray-400">{label}</p>
          <p className="mt-1 origin-left text-xl font-bold leading-none text-gray-900 transition-transform duration-200 group-hover:scale-[1.05]">{value}</p>
        </div>
        <span className={`icon-pop h-8 w-1.5 shrink-0 rounded-full border ${tones[tone] || tones.slate}`} />
      </div>
    </div>
  )
}

function ChartPanel({ title, className = '', children }) {
  return (
    <section className={`hover-lift min-w-0 rounded-lg border border-gray-200 bg-white p-3 shadow-card ${className}`}>
      <h3 className="mb-2 text-sm font-semibold text-gray-800">{title}</h3>
      {children}
    </section>
  )
}

function DrilldownTable({ assuntoData, selectedTopico, onOpenHistorico }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 text-[10px] uppercase text-gray-400">
            <th className="px-3 py-2 text-left">Tópico</th>
            <th className="px-3 py-2">Pri.</th>
            <th className="px-3 py-2 text-center">Total</th>
            <th className="px-3 py-2 text-center">Ac.</th>
            <th className="px-3 py-2 text-center">Er.</th>
            <th className="px-3 py-2 text-center">% Líq.</th>
            <th className="px-3 py-2 text-center">% Bruta</th>
            <th className="px-3 py-2 text-center">Status</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {assuntoData.topicos.map(t => {
            const status = normalizeStatus(t.classificacao)
            return (
              <tr key={t.topico_id} className={`row-hover hover:bg-gray-50 ${selectedTopico === t.topico_id ? 'bg-primary-50/50' : ''}`}>
                <td className="max-w-[280px] px-3 py-2.5 font-medium text-gray-800">{t.topico_nome}</td>
                <td className="px-3 py-2.5"><span className={`rounded px-1 py-0.5 text-[10px] font-medium ${prioridadeColor[t.prioridade] || 'bg-gray-100'}`}>{prioridadeLabel[t.prioridade]?.charAt(0)}</span></td>
                <td className="px-3 py-2.5 text-center text-gray-500">{t.total_questoes}</td>
                <td className="px-3 py-2.5 text-center font-semibold text-emerald-600">{t.acertos}</td>
                <td className="px-3 py-2.5 text-center font-semibold text-red-500">{t.erros}</td>
                <td className="px-3 py-2.5 text-center font-bold">{t.percentual_liquido}%</td>
                <td className="px-3 py-2.5 text-center font-semibold text-gray-500">{t.percentual_acerto}%</td>
                <td className="px-3 py-2.5 text-center"><span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${statusMeta[status].badge}`}>{statusMeta[status].label}</span></td>
                <td className="px-3 py-2.5">
                  <button onClick={() => onOpenHistorico(t.topico_id)}
                    className={`rounded px-2 py-1 text-[10px] transition-colors ${selectedTopico === t.topico_id ? 'bg-primary-600 text-white' : 'text-primary-600 hover:bg-primary-50'}`}>
                    Histórico
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase text-gray-500">{label}</span>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-3 pr-7 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Selecione</option>
          {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>
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

function FilterBar({ periodo, aplicarPreset, dataInicio, dataFim, onPeriodoManual, materiaFiltro, setMateriaFiltro, materias, tipos, toggleTipo, classificacoes, toggleClassificacao }) {
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-primary-800 bg-primary-900/40 px-4 py-3">
      <FilterGroup label="Período">
        <div className="flex flex-wrap items-center gap-1.5">
          {PERIODOS.map(p => (
            <FilterChip key={p.value} active={periodo === p.value} onClick={() => aplicarPreset(p.value)}>{p.label}</FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <MiniDate label="De" value={dataInicio} onChange={v => onPeriodoManual('data_inicio', v)} />
          <MiniDate label="Até" value={dataFim} onChange={v => onPeriodoManual('data_fim', v)} />
        </div>
      </FilterGroup>

      <FilterGroup label="Matéria">
        <div className="relative">
          <select value={materiaFiltro} onChange={e => setMateriaFiltro(e.target.value)}
            className="cursor-pointer appearance-none rounded-lg border border-white/15 bg-white/5 py-1.5 pl-3 pr-8 text-xs font-medium text-white outline-none focus:ring-2 focus:ring-accent-500">
            <option value="">Todas as matérias</option>
            {materias.filter(m => m.ativo).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-primary-300" />
        </div>
      </FilterGroup>

      <FilterGroup label="Tipo de sessão">
        <div className="flex flex-wrap items-center gap-1.5">
          {TIPOS_SESSAO.map(t => (
            <FilterChip key={t.value} active={tipos.includes(t.value)} onClick={() => toggleTipo(t.value)}>{t.label}</FilterChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Classificação">
        <div className="flex flex-wrap items-center gap-1.5">
          {statusOrder.map(s => (
            <FilterChip key={s} active={classificacoes.includes(s)} dot={statusMeta[s].color} onClick={() => toggleClassificacao(s)}>{statusMeta[s].label}</FilterChip>
          ))}
        </div>
      </FilterGroup>
    </div>
  )
}

function FilterGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-primary-300">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

function FilterChip({ active, dot, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`btn-pop inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active ? 'border-transparent bg-white text-primary-900 shadow-sm' : 'border-white/15 text-primary-200 hover:bg-white/10 hover:text-white'
      }`}>
      {dot && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />}
      {children}
    </button>
  )
}

function MiniDate({ label, value, onChange }) {
  return (
    <label className="text-[10px] font-semibold uppercase text-primary-300">
      {label}
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 block rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs font-normal text-white outline-none focus:ring-2 focus:ring-accent-500 [color-scheme:dark]" />
    </label>
  )
}
