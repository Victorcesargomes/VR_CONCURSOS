import { useEffect, useMemo, useState } from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { CalendarClock, Gauge, Layers, RefreshCw, Save, Target, TrendingUp, Trophy } from 'lucide-react'
import { editaisAPI, materiasAPI, metasAPI } from '../api'
import PageHeader from '../components/Layout/PageHeader'
import { normalizeStatus, pctColor, shortName, statusMeta } from '../components/Charts/chartTheme'

const toInputDate = (iso) => (iso ? String(iso).slice(0, 10) : '')

export default function Prontidao() {
  const [readiness, setReadiness] = useState(null)
  const [editais, setEditais] = useState([])
  const [meta, setMeta] = useState(null)
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [editalForm, setEditalForm] = useState({ nome: '', banca: '', vagas: '', data_prova: '' })
  const [pesos, setPesos] = useState({}) // materia_id -> peso
  const [metaForm, setMetaForm] = useState({ questoes_por_dia: 40, questoes_por_semana: 200, minutos_por_dia: 180 })

  const ativo = editais[0] || null

  const recarregar = async () => {
    const [r, eds, ms, mat] = await Promise.all([
      editaisAPI.readinessAtivo(),
      editaisAPI.list(),
      metasAPI.get(),
      materiasAPI.list(true),
    ])
    setReadiness(r.data)
    setEditais(eds.data)
    setMeta(ms.data)
    setMaterias(mat.data)
    const a = eds.data[0]
    if (a) {
      setEditalForm({
        nome: a.nome || '',
        banca: a.banca || '',
        vagas: a.vagas ?? '',
        data_prova: toInputDate(a.data_prova),
      })
      const p = {}
      a.materias.forEach((em) => (p[em.materia_id] = em.peso))
      setPesos(p)
    }
    setMetaForm({
      questoes_por_dia: ms.data.questoes_por_dia ?? 40,
      questoes_por_semana: ms.data.questoes_por_semana ?? 200,
      minutos_por_dia: ms.data.minutos_por_dia ?? 180,
    })
  }

  useEffect(() => {
    recarregar().finally(() => setLoading(false))
  }, [])

  const score = readiness?.score ?? 0
  const scoreColor = pctColor(score)

  const salvarEdital = async () => {
    setSalvando(true)
    try {
      const payload = {
        nome: editalForm.nome || 'Concurso',
        banca: editalForm.banca || null,
        vagas: editalForm.vagas === '' ? null : Number(editalForm.vagas),
        data_prova: editalForm.data_prova || null,
      }
      if (ativo) await editaisAPI.update(ativo.id, payload)
      else await editaisAPI.create({ ...payload, materias: [] })
      await recarregar()
    } finally {
      setSalvando(false)
    }
  }

  const salvarPesos = async () => {
    if (!ativo) return
    setSalvando(true)
    try {
      const lista = materias
        .map((m) => ({ materia_id: m.id, peso: Number(pesos[m.id] || 0) }))
        .filter((x) => x.peso > 0)
      await editaisAPI.setMaterias(ativo.id, lista)
      await recarregar()
    } finally {
      setSalvando(false)
    }
  }

  const salvarMeta = async () => {
    setSalvando(true)
    try {
      await metasAPI.upsert({
        questoes_por_dia: Number(metaForm.questoes_por_dia) || 40,
        questoes_por_semana: Number(metaForm.questoes_por_semana) || 200,
        minutos_por_dia: Number(metaForm.minutos_por_dia) || 180,
        edital_id: ativo?.id || null,
      })
      await recarregar()
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-400">Carregando prontidão…</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Target}
        title="Prontidão para a prova"
        subtitle="Quão pronto você está, com base no edital, no desempenho e na tendência recente."
      >
        <button onClick={() => recarregar()} className="btn-pop flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <RefreshCw size={16} /> Atualizar
        </button>
      </PageHeader>

      {!ativo && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Nenhum edital cadastrado. Configure sua <strong>prova-alvo</strong> abaixo para personalizar a prontidão por peso de matéria. Por enquanto, os números abaixo usam o escopo global (todas as matérias ativas).
        </div>
      )}

      {/* Painel principal: gauge + countdown + sub-scores */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 stagger">
        {/* Gauge */}
        <div className="hover-lift relative flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-5 shadow-card">
          <span className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-primary-400 to-accent-500" />
          <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-500"><Gauge size={15} /> Score de prontidão</p>
          <div className="relative h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ name: 'score', value: score, fill: scoreColor }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: '#eef2f7' }} dataKey="value" angleAxisId={0} cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold" style={{ color: scoreColor }}>{Math.round(score)}</span>
              <span className="text-xs font-medium text-gray-400">/ 100</span>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-gray-500">
            55% cobertura · 30% desempenho · 15% tendência
          </p>
        </div>

        {/* Countdown */}
        <div className="hover-lift relative flex flex-col justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-primary-700 to-primary-900 p-5 text-white shadow-card">
          <span className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-accent-400 to-accent-500" />
          <p className="flex items-center gap-1.5 text-sm font-medium text-primary-200"><CalendarClock size={15} /> Dias para a prova</p>
          {readiness?.dias_para_prova != null ? (
            <>
              <p className="mt-2 text-5xl font-extrabold">{readiness.dias_para_prova}</p>
              <p className="mt-1 text-sm text-primary-200">{ativo?.nome || 'Concurso'} {ativo?.banca ? `· ${ativo.banca}` : ''}</p>
              {readiness.data_prova && (
                <p className="text-xs text-primary-300/80">em {new Date(readiness.data_prova).toLocaleDateString('pt-BR')}</p>
              )}
            </>
          ) : (
            <p className="mt-4 text-sm text-primary-200">Cadastre a data da prova no edital para ver a contagem.</p>
          )}
        </div>

        {/* Sub-scores */}
        <div className="grid grid-cols-1 gap-3">
          <SubScore icon={Layers} label="Cobertura do edital" value={readiness?.cobertura ?? 0} hint="% do conteúdo já estudado" color={pctColor(readiness?.cobertura ?? 0)} />
          <SubScore icon={Trophy} label="Desempenho líquido" value={readiness?.liquido ?? 0} hint="% líquido ponderado por peso" color={pctColor(readiness?.liquido ?? 0)} />
          <SubScore icon={TrendingUp} label="Tendência" value={readiness?.tendencia ?? 50} hint="momentum semanal (50 = estável)" color={pctColor(readiness?.tendencia ?? 50)} />
        </div>
      </div>

      {/* Tabela ponderada por matéria */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800"><Layers size={16} /> Desempenho por matéria (ponderado pelo edital)</h3>
        {readiness?.por_materia?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="pb-2 pr-3 font-semibold">Matéria</th>
                  <th className="pb-2 px-3 text-center font-semibold">Peso</th>
                  <th className="pb-2 px-3 text-center font-semibold">Cobertura</th>
                  <th className="pb-2 px-3 text-center font-semibold">% Líquido</th>
                  <th className="pb-2 px-3 text-center font-semibold">Questões</th>
                  <th className="pb-2 pl-3 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {readiness.por_materia.map((m) => {
                  const st = statusMeta[normalizeStatus(m.classificacao)]
                  return (
                    <tr key={m.materia_id} className="row-hover border-b border-gray-100 last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-gray-800">{shortName(m.materia_nome, 32)}</td>
                      <td className="px-3 text-center text-gray-600">{m.peso}</td>
                      <td className="px-3 text-center">
                        <MiniBar value={m.cobertura} color="#002B5C" />
                      </td>
                      <td className="px-3 text-center font-semibold" style={{ color: pctColor(m.percentual_liquido) }}>{m.percentual_liquido}%</td>
                      <td className="px-3 text-center text-gray-500">{m.total_questoes}</td>
                      <td className="pl-3 text-center">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${st?.badge}`}>{st?.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-gray-400">Nenhuma matéria com tópicos cadastrados ainda.</p>
        )}
      </div>

      {/* Editores */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Edital */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800"><Target size={16} /> Prova-alvo (edital)</h3>
          <div className="space-y-2.5">
            <Field label="Nome do concurso">
              <input value={editalForm.nome} onChange={(e) => setEditalForm({ ...editalForm, nome: e.target.value })} placeholder="Ex.: TJ-SP 2026" className="input-base" />
            </Field>
            <Field label="Banca">
              <input value={editalForm.banca} onChange={(e) => setEditalForm({ ...editalForm, banca: e.target.value })} placeholder="Ex.: Vunesp" className="input-base" />
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Vagas">
                <input type="number" min="0" value={editalForm.vagas} onChange={(e) => setEditalForm({ ...editalForm, vagas: e.target.value })} className="input-base" />
              </Field>
              <Field label="Data da prova">
                <input type="date" value={editalForm.data_prova} onChange={(e) => setEditalForm({ ...editalForm, data_prova: e.target.value })} className="input-base" />
              </Field>
            </div>
            <button onClick={salvarEdital} disabled={salvando} className="btn-pop mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-700 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60">
              <Save size={15} /> {ativo ? 'Atualizar edital' : 'Criar edital'}
            </button>
          </div>
        </div>

        {/* Pesos */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800"><Layers size={16} /> Pesos por matéria</h3>
          {ativo ? (
            <>
              <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {materias.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-2.5 py-1.5">
                    <span className="truncate text-sm text-gray-700" title={m.nome}>{shortName(m.nome, 24)}</span>
                    <input
                      type="number" min="0" step="0.5"
                      value={pesos[m.id] ?? ''}
                      onChange={(e) => setPesos({ ...pesos, [m.id]: e.target.value })}
                      placeholder="0"
                      className="w-16 rounded-md border border-gray-200 px-2 py-1 text-right text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <button onClick={salvarPesos} disabled={salvando} className="btn-pop mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60">
                <Save size={15} /> Salvar pesos
              </button>
              <p className="mt-1.5 text-center text-[11px] text-gray-400">Peso 0 = exclui a matéria do cálculo.</p>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-gray-400">Crie um edital primeiro.</p>
          )}
        </div>

        {/* Metas */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800"><TrendingUp size={16} /> Metas de estudo</h3>
          <div className="space-y-2.5">
            <Field label="Questões por dia">
              <input type="number" min="0" value={metaForm.questoes_por_dia} onChange={(e) => setMetaForm({ ...metaForm, questoes_por_dia: e.target.value })} className="input-base" />
            </Field>
            <Field label="Questões por semana">
              <input type="number" min="0" value={metaForm.questoes_por_semana} onChange={(e) => setMetaForm({ ...metaForm, questoes_por_semana: e.target.value })} className="input-base" />
            </Field>
            <Field label="Minutos por dia">
              <input type="number" min="0" value={metaForm.minutos_por_dia} onChange={(e) => setMetaForm({ ...metaForm, minutos_por_dia: e.target.value })} className="input-base" />
            </Field>
            <button onClick={salvarMeta} disabled={salvando} className="btn-pop mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-600 px-3 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60">
              <Save size={15} /> Salvar metas
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .input-base{width:100%;border-radius:0.5rem;border:1px solid #e5e7eb;padding:0.45rem 0.6rem;font-size:0.875rem;color:#1f2937;background:#fff}
        .input-base:focus{outline:none;border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,243,.15)}
      `}</style>
    </div>
  )
}

function SubScore({ icon: Icon, label, value, hint, color }) {
  return (
    <div className="hover-lift flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-card">
      <div className="icon-pop flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}1a`, color }}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}%</p>
        <p className="truncate text-[11px] text-gray-400">{hint}</p>
      </div>
    </div>
  )
}

function MiniBar({ value, color }) {
  return (
    <div className="mx-auto flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }} />
      </div>
      <span className="w-9 text-left text-xs text-gray-600">{Math.round(value)}%</span>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  )
}
