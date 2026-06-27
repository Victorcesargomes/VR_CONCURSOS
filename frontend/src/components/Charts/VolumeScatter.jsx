import { CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { normalizeStatus, statusMeta, statusOrder, tooltipStyle } from './chartTheme'

// Dispersão: eixo X = questões feitas (volume), eixo Y = % líquido (desempenho).
// Quadrantes: pouco treinado (esq.), fraco (inf. dir.), dominado (sup. dir.).
// topicos = [{ topico_nome, materia_nome, total_questoes, percentual_liquido, classificacao }]
export default function VolumeScatter({ topicos = [] }) {
  if (!topicos.length) return <Empty text="Sem tópicos respondidos no período." />

  const data = topicos.map((t) => ({ ...t, status: normalizeStatus(t.classificacao) }))

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const p = payload[0].payload
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-md">
        <p className="font-semibold text-gray-800">{p.topico_nome}</p>
        <p className="text-gray-500">{p.materia_nome}</p>
        <p className="mt-0.5 text-gray-700">{p.total_questoes} questões · <b>{p.percentual_liquido}%</b> líquido</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <ScatterChart margin={{ top: 8, right: 14, bottom: 14, left: -14 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis type="number" dataKey="total_questoes" name="Questões" tick={{ fontSize: 10 }} stroke="#94a3b8" label={{ value: 'Questões feitas', position: 'insideBottom', offset: -8, fontSize: 10, fill: '#94a3b8' }} />
        <YAxis type="number" dataKey="percentual_liquido" name="% líquido" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
        <ZAxis range={[70, 70]} />
        <ReferenceLine y={70} stroke="#cbd5e1" strokeDasharray="4 4" />
        <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="4 4" />
        <Tooltip content={renderTooltip} cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {statusOrder.map((s) => {
          const subset = data.filter((d) => d.status === s)
          if (!subset.length) return null
          return (
            <Scatter key={s} name={statusMeta[s].label} data={subset} fill={statusMeta[s].color} fillOpacity={0.8} />
          )
        })}
      </ScatterChart>
    </ResponsiveContainer>
  )
}

function Empty({ text }) {
  return <p className="flex h-[200px] items-center justify-center text-center text-xs text-gray-400">{text}</p>
}
