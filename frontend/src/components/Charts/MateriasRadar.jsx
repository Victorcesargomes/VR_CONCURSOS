import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { shortName, tooltipStyle } from './chartTheme'

// Radar: equilíbrio do % líquido entre as matérias da prova.
// data = [{ subject, A, full }]
export default function MateriasRadar({ data = [] }) {
  if (data.length < 3) {
    return <Empty text="Cadastre e treine ao menos 3 matérias para ver o radar de equilíbrio." />
  }
  return (
    <ResponsiveContainer width="100%" height={270}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569' }} />
        <Radar name="% líquido" dataKey="A" stroke="#002B5C" strokeWidth={2} fill="#00A67D" fillOpacity={0.3} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, '% líquido']} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

function Empty({ text }) {
  return <p className="flex h-[230px] items-center justify-center text-center text-xs text-gray-400">{text}</p>
}
