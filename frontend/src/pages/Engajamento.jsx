import { useEffect, useState } from 'react'
import { CalendarDays, Flame, Lock, Target, Trophy } from 'lucide-react'
import { engajamentoAPI } from '../api'
import PageHeader from '../components/Layout/PageHeader'
import { iconFor } from '../components/conquistaIconMap'

export default function Engajamento() {
  const [stats, setStats] = useState(null)
  const [conq, setConq] = useState({ unlocked: [], locked: [] })
  const [loading, setLoading] = useState(true)

  const recarregar = async () => {
    const [s, c] = await Promise.all([engajamentoAPI.stats(), engajamentoAPI.conquistas()])
    setStats(s.data)
    setConq(c.data)
  }

  useEffect(() => { recarregar().finally(() => setLoading(false)) }, [])

  if (loading || !stats) return <div className="py-20 text-center text-gray-400">Carregando conquistas…</div>

  const meta = stats.meta_hoje || { hoje_questoes: 0, meta_questoes: 40, pct: 0 }
  const metaPct = Math.min(100, Math.round(meta.pct || 0))

  return (
    <div className="space-y-6">
      <PageHeader icon={Trophy} title="Conquistas e engajamento" subtitle="Consistência é o maior preditor de aprovação. Mantenha a sequência!" />

      {/* Streak + meta diária */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 stagger">
        <div className="hover-lift relative flex items-center gap-4 overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-card">
          <div className="icon-pop flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <Flame size={26} />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-amber-700">{stats.streak_atual}<span className="ml-1 text-base font-semibold text-amber-500">dias</span></p>
            <p className="text-xs text-amber-700/70">Sequência atual · recorde {stats.streak_max}d</p>
          </div>
        </div>

        <div className="hover-lift rounded-xl border border-gray-200 bg-white p-5 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <Target size={18} className="text-accent-600" />
            <p className="text-sm font-semibold text-gray-700">Meta diária</p>
          </div>
          <div className="mb-1.5 flex items-end justify-between">
            <span className="text-2xl font-bold text-gray-900">{meta.hoje_questoes}<span className="text-sm font-medium text-gray-400">/{meta.meta_questoes} questões</span></span>
            <span className="text-sm font-semibold text-accent-600">{metaPct}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-600 transition-all duration-500" style={{ width: `${metaPct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">Meta batida em {stats.dias_meta_cumprida} dias</p>
        </div>

        <div className="hover-lift rounded-xl border border-gray-200 bg-white p-5 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <CalendarDays size={18} className="text-primary-700" />
            <p className="text-sm font-semibold text-gray-700">Visão geral</p>
          </div>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-gray-500">Total de questões</dt><dd className="text-right font-semibold text-gray-900">{stats.total_questoes}</dd>
            <dt className="text-gray-500">Dias estudados</dt><dd className="text-right font-semibold text-gray-900">{stats.distinct_study_days}</dd>
            <dt className="text-gray-500">Simulados</dt><dd className="text-right font-semibold text-gray-900">{stats.simulados_feitos}</dd>
            <dt className="text-gray-500">Revisões concluídas</dt><dd className="text-right font-semibold text-gray-900">{stats.revisoes_concluidas}</dd>
          </dl>
        </div>
      </div>

      {/* Conquistas desbloqueadas */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
          <Trophy size={16} className="text-amber-500" /> Desbloqueadas ({conq.unlocked.length})
        </h3>
        {conq.unlocked.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">Nenhuma conquista ainda. Registre estudos para começar!</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 stagger sm:grid-cols-3 lg:grid-cols-4">
            {conq.unlocked.map((c) => {
              const Icon = iconFor(c.icone)
              return (
                <div key={c.slug} className="hover-lift flex flex-col items-center rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 text-center shadow-card">
                  <div className="icon-pop mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                    <Icon size={22} />
                  </div>
                  <p className="text-sm font-bold text-gray-800">{c.nome}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{c.descricao}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bloqueadas */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
          <Lock size={16} className="text-gray-400" /> A desbloquear ({conq.locked.length})
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {conq.locked.map((c) => {
            const Icon = iconFor(c.icone)
            return (
              <div key={c.slug} className="flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 p-4 text-center opacity-70">
                <div className="relative mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                  <Icon size={22} />
                  <Lock size={12} className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-px text-gray-500" />
                </div>
                <p className="text-sm font-semibold text-gray-600">{c.nome}</p>
                <p className="mt-0.5 text-xs text-gray-400">{c.descricao}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
