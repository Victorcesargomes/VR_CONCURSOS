import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlayCircle, RefreshCw, StopCircle, Timer } from 'lucide-react'
import { assuntosAPI, materiasAPI, questoesAPI, sessoesAPI, topicosAPI } from '../api'
import PageHeader from '../components/Layout/PageHeader'
import { pctColor, shortName } from '../components/Charts/chartTheme'

const ALTERNATIVAS = ['A', 'B', 'C', 'D', 'E']
const fmtTempo = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function Simulados() {
  const [fase, setFase] = useState('lista') // lista | setup | runner | resultado
  const [simulados, setSimulados] = useState([])
  const [materias, setMaterias] = useState([])
  const [assuntos, setAssuntos] = useState([])
  const [topicos, setTopicos] = useState([])

  const [form, setForm] = useState({ materiaId: '', assuntoId: '', topicoId: '', numQuestoes: 10, duracaoMin: 30, banca: '', ano: '', provaOrigem: '' })
  const [slots, setSlots] = useState([])
  const [segundos, setSegundos] = useState(0)
  const [duracaoTotal, setDuracaoTotal] = useState(0)
  const [resultado, setResultado] = useState(null)
  const enviando = useRef(false)
  const slotsRef = useRef([])
  const segundosRef = useRef(0)
  // mantém refs sincronizadas para o auto-submit do timer ler valores atuais
  slotsRef.current = slots
  segundosRef.current = segundos

  const recarregar = async () => {
    const [s, m, a, t] = await Promise.all([
      sessoesAPI.list({ tipos: 'simulado', limit: 50 }),
      materiasAPI.list(true),
      assuntosAPI.list(),
      topicosAPI.list(),
    ])
    setSimulados(s.data)
    setMaterias(m.data)
    setAssuntos(a.data)
    setTopicos(t.data)
  }

  useEffect(() => { recarregar() }, [])

  const assuntosDaMateria = useMemo(() => assuntos.filter((a) => String(a.materia_id) === String(form.materiaId)), [assuntos, form.materiaId])
  const topicosDoAssunto = useMemo(() => topicos.filter((t) => String(t.assunto_id) === String(form.assuntoId)), [topicos, form.assuntoId])

  // Timer
  useEffect(() => {
    if (fase !== 'runner') return
    const id = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) { clearInterval(id); finalizar(true); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [fase])

  const iniciar = () => {
    const n = Math.max(1, Number(form.numQuestoes) || 1)
    const total = Math.max(1, Number(form.duracaoMin) || 1) * 60
    setSlots(Array.from({ length: n }, (_, i) => ({ numero: i + 1, resposta: '', gabarito: '' })))
    setDuracaoTotal(total)
    setSegundos(total)
    enviando.current = false
    setFase('runner')
  }

  const finalizar = async (auto = false) => {
    if (enviando.current) return
    enviando.current = true
    const atuais = slotsRef.current
    const questoes = atuais.map((s) => ({
      numero: s.numero,
      banca: form.banca || null,
      ano: form.ano ? Number(form.ano) : null,
      prova_origem: form.provaOrigem || null,
      resposta: s.resposta || null,
      gabarito: s.gabarito || null,
      acertou: (s.resposta && s.gabarito) ? (s.resposta === s.gabarito) : null,
    }))
    const elapsed = duracaoTotal - segundosRef.current
    const resp = await sessoesAPI.create({
      topico_id: Number(form.topicoId),
      tipo: 'simulado',
      duracao_segundos: elapsed,
      questoes,
    })
    if (resp.data.novas_conquistas?.length) {
      window.dispatchEvent(new CustomEvent('vr-conquistas', { detail: resp.data.novas_conquistas }))
    }
    setResultado({ ...resp.data, duracao_segundos: elapsed })
    setFase('resultado')
    recarregar()
  }

  const responder = (i, campo, valor) => {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, [campo]: s[campo] === valor ? '' : valor } : s)))
  }

  const respondidas = slots.filter((s) => s.resposta && s.gabarito).length
  const pctLiquido = resultado ? Math.round(((resultado.acertos - resultado.erros) / Math.max(1, resultado.questoes_feitas)) * 100) : 0

  return (
    <div className="space-y-5">
      <PageHeader icon={Timer} title="Simulados" subtitle="Treine sob pressão de tempo. As questões erradas viram revisão e vão para o caderno de erros." />

      {fase === 'lista' && (
        <>
          <button onClick={() => setFase('setup')} className="btn-pop flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow-primary hover:bg-primary-600">
            <PlayCircle size={17} /> Novo simulado
          </button>
          <div className="rounded-xl border border-gray-200 bg-white shadow-card">
            <h3 className="border-b border-gray-100 px-4 py-3 text-sm font-bold text-gray-800">Simulados anteriores</h3>
            {simulados.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">Nenhum simulado registrado ainda.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {simulados.map((s) => {
                  const liq = s.questoes_feitas > 0 ? Math.round(((s.acertos - s.erros) / s.questoes_feitas) * 100) : 0
                  return (
                    <li key={s.id} className="row-hover flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 text-sm hover:bg-gray-50">
                      <span className="font-medium text-gray-700">{new Date(s.data).toLocaleDateString('pt-BR')}</span>
                      <span className="text-gray-400">{shortName(`${s.materia_nome} · ${s.assunto_nome} · ${s.topico_nome}`, 42)}</span>
                      <span className="text-gray-500">{s.total_questoes} questões</span>
                      <span className="text-gray-500">{s.duracao_segundos ? `${Math.round(s.duracao_segundos / 60)}min` : '—'}</span>
                      <span className="ml-auto font-bold" style={{ color: pctColor(liq) }}>{liq}% líq.</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {fase === 'setup' && (
        <div className="mx-auto max-w-xl rounded-xl border border-gray-200 bg-white p-5 shadow-card">
          <h3 className="mb-4 text-sm font-bold text-gray-800">Configurar simulado</h3>
          <div className="space-y-3">
            <Select label="Matéria" value={form.materiaId} onChange={(v) => setForm({ ...form, materiaId: v, assuntoId: '', topicoId: '' })} options={materias.map((m) => ({ value: m.id, label: m.nome }))} />
            <Select label="Assunto" value={form.assuntoId} onChange={(v) => setForm({ ...form, assuntoId: v, topicoId: '' })} options={assuntosDaMateria.map((a) => ({ value: a.id, label: a.nome }))} disabled={!form.materiaId} />
            <Select label="Tópico" value={form.topicoId} onChange={(v) => setForm({ ...form, topicoId: v })} options={topicosDoAssunto.map((t) => ({ value: t.id, label: t.nome }))} disabled={!form.assuntoId} />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Nº de questões" value={form.numQuestoes} onChange={(v) => setForm({ ...form, numQuestoes: v })} min={1} />
              <NumberField label="Duração (min)" value={form.duracaoMin} onChange={(v) => setForm({ ...form, duracaoMin: v })} min={1} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Banca (opcional)" value={form.banca} onChange={(v) => setForm({ ...form, banca: v })} placeholder="Ex.: CESPE" />
              <TextField label="Ano (opcional)" value={form.ano} onChange={(v) => setForm({ ...form, ano: v })} placeholder="Ex.: 2024" />
            </div>
            <TextField label="Prova de origem (opcional)" value={form.provaOrigem} onChange={(v) => setForm({ ...form, provaOrigem: v })} placeholder="Ex.: TJ-SP 2024" />
            <div className="flex gap-2 pt-2">
              <button onClick={() => setFase('lista')} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={iniciar} disabled={!form.topicoId} className="btn-pop flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50">
                <PlayCircle size={16} /> Iniciar simulado
              </button>
            </div>
            <p className="text-xs text-gray-400">Dica: para auto-correção, preencha o gabarito de cada questão durante o simulado.</p>
          </div>
        </div>
      )}

      {fase === 'runner' && (
        <div className="space-y-4">
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-card backdrop-blur">
            <div className="flex items-center gap-2">
              <Timer size={20} className={segundos < 60 ? 'text-rose-500' : 'text-primary-700'} />
              <span className={`text-2xl font-bold tabular-nums ${segundos < 60 ? 'text-rose-500' : 'text-gray-800'}`}>{fmtTempo(segundos)}</span>
            </div>
            <span className="text-sm text-gray-400">{respondidas}/{slots.length} respondidas</span>
            <button onClick={() => finalizar(false)} className="btn-pop ml-auto flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
              <StopCircle size={16} /> Finalizar
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
            <ul className="divide-y divide-gray-50">
              {slots.map((s, i) => {
                const status = s.resposta && s.gabarito ? (s.resposta === s.gabarito ? 'acerto' : 'erro') : 'pendente'
                return (
                  <li key={s.numero} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="w-8 font-semibold text-gray-700">{s.numero}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="mr-1 text-xs text-gray-400">Você</span>
                      {ALTERNATIVAS.map((alt) => (
                        <button key={alt} onClick={() => responder(i, 'resposta', alt)} className={`h-7 w-7 rounded-md text-xs font-bold transition ${s.resposta === alt ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{alt}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="mr-1 text-xs text-gray-400">Gabarito</span>
                      {ALTERNATIVAS.map((alt) => (
                        <button key={alt} onClick={() => responder(i, 'gabarito', alt)} className={`h-7 w-7 rounded-md text-xs font-bold transition ${s.gabarito === alt ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{alt}</button>
                      ))}
                    </div>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${status === 'acerto' ? 'bg-emerald-50 text-emerald-700' : status === 'erro' ? 'bg-rose-50 text-rose-700' : 'bg-gray-100 text-gray-400'}`}>
                      {status === 'acerto' ? 'Acerto' : status === 'erro' ? 'Erro' : 'Pendente'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      {fase === 'resultado' && resultado && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ResultCard label="% líquido" value={`${pctLiquido}%`} color={pctColor(pctLiquido)} />
            <ResultCard label="Acertos" value={`${resultado.acertos}/${resultado.questoes_feitas}`} color="#10b981" />
            <ResultCard label="Erros" value={`${resultado.erros}`} color="#ef4444" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-card">
            ⏱ Tempo: <strong>{fmtTempo(resultado.duracao_segundos || 0)}</strong> · As questões erradas foram para o <Link to="/caderno" className="font-semibold text-primary-700 hover:underline">caderno de erros</Link> e geraram revisões automáticas.
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setResultado(null); setFase('setup') }} className="btn-pop rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600">Novo simulado</button>
            <button onClick={() => setFase('lista')} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Voltar à lista</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Select({ label, value, onChange, options, disabled }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      <select disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary-400 focus:outline-none disabled:bg-gray-50">
        <option value="">Selecione…</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function NumberField({ label, value, onChange, min = 0 }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      <input type="number" min={min} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary-400 focus:outline-none" />
    </label>
  )
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary-400 focus:outline-none" />
    </label>
  )
}

function ResultCard({ label, value, color }) {
  return (
    <div className="hover-lift rounded-xl border border-gray-200 bg-white p-5 text-center shadow-card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold" style={{ color }}>{value}</p>
    </div>
  )
}
