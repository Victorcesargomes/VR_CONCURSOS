import { pctColor, shortName } from './chartTheme'

// Mapa de calor: tópicos agrupados por assunto, coloridos pelo % líquido
// (verde = dominado, vermelho = crítico) — mostra rapidamente onde estão os erros.
// topicos = [{ topico_nome, assunto_nome, materia_nome, total_questoes, percentual_liquido, erros }]
export default function TopicsHeatmap({ topicos = [] }) {
  if (!topicos.length) return <Empty text="Sem tópicos respondidos no período." />

  const grupos = new Map()
  topicos.forEach((t) => {
    const key = `${t.materia_nome} · ${t.assunto_nome}`
    if (!grupos.has(key)) grupos.set(key, [])
    grupos.get(key).push(t)
  })

  return (
    <div className="max-h-[280px] space-y-2.5 overflow-y-auto pr-1">
      {[...grupos.entries()].map(([assunto, tops]) => (
        <div key={assunto}>
          <p className="mb-1 truncate text-[11px] font-semibold text-gray-500" title={assunto}>{shortName(assunto, 38)}</p>
          <div className="flex flex-wrap gap-1">
            {tops.map((t) => {
              const bg = pctColor(t.percentual_liquido)
              return (
                <span
                  key={t.topico_id ?? t.topico_nome}
                  title={`${t.topico_nome} — ${t.percentual_liquido}% líquido · ${t.total_questoes} questões · ${t.erros} erros`}
                  className="icon-pop inline-flex min-w-[34px] items-center justify-center rounded-md px-1.5 py-1 text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: bg }}
                >
                  {t.percentual_liquido}%
                </span>
              )
            })}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-1.5 pt-1 text-[9px] text-gray-400">
        <span>Crítico</span>
        <span className="h-2 w-6 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
        <span className="h-2 w-6 rounded-sm" style={{ backgroundColor: '#f59e0b' }} />
        <span className="h-2 w-6 rounded-sm" style={{ backgroundColor: '#2563eb' }} />
        <span className="h-2 w-6 rounded-sm" style={{ backgroundColor: '#10b981' }} />
        <span>Dominado</span>
      </div>
    </div>
  )
}

function Empty({ text }) {
  return <p className="flex h-[180px] items-center justify-center text-center text-xs text-gray-400">{text}</p>
}
