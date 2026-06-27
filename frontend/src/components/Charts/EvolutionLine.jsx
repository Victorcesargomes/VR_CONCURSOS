import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { tooltipStyle } from './chartTheme'

// Linha de evolução do % líquido semanal, com volume de questões em barras suaves.
// data = dashboard.evolucao_semanal: [{ semana, total, acertos, percentual }]
export default function EvolutionLine({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 2, left: -14 }}>
        <defs>
          <linearGradient id="evolVol" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#002B5C" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#002B5C" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="semana" tick={{ fontSize: 10 }} stroke="#94a3b8" />
        <YAxis yAxisId="pct" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
        <YAxis yAxisId="vol" orientation="right" hide />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v, n) => (n === 'percentual' ? [`${v}%`, '% líquido'] : [v, 'Questões'])}
        />
        <Bar yAxisId="vol" dataKey="total" name="volume" fill="url(#evolVol)" radius={[4, 4, 0, 0]} barSize={20} />
        <Line
          yAxisId="pct"
          type="monotone"
          dataKey="percentual"
          name="percentual"
          stroke="#00A67D"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#00A67D' }}
          activeDot={{ r: 5 }}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
