import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_PALETTE, shortName, tooltipStyle } from './chartTheme'

// Rosca: distribuição de questões feitas por matéria.
// data = [{ name, value }]
export default function MateriasDonut({ data = [] }) {
  const total = data.reduce((s, d) => s + Number(d.value || 0), 0)
  if (!total) return <Empty text="Sem questões registradas no período." />
  return (
    <div className="grid h-full items-center gap-2 sm:grid-cols-[1fr_0.9fr]">
      <div className="relative">
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v, n) => [`${v} (${total ? Math.round((v / total) * 100) : 0}%)`, n]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{total}</span>
          <span className="text-[10px] font-semibold uppercase text-gray-400">questões</span>
        </div>
      </div>
      <ul className="max-h-[180px] space-y-1 overflow-y-auto pr-1">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1 text-xs">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }} />
              <span className="truncate font-medium text-gray-700">{shortName(d.name, 18)}</span>
            </span>
            <span className="ml-2 shrink-0 font-bold text-gray-900">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Empty({ text }) {
  return <p className="flex h-[180px] items-center justify-center text-center text-xs text-gray-400">{text}</p>
}
