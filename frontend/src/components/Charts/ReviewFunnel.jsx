// Funil de erros e revisão: questões → erros → revisões pendentes → atrasadas.
// Como o app não rastreia questões individualmente, "acertadas depois" é estimado
// pela evolução do tópico (linha de evolução). Este funil mostra o pipeline real.
export default function ReviewFunnel({ questoes = 0, erros = 0, resumo = {} }) {
  const pendentes = resumo?.total_pendentes ?? 0
  const atrasadas = resumo?.atrasadas ?? 0
  const hoje = resumo?.hoje ?? 0

  const stages = [
    { label: 'Questões respondidas', value: questoes, hint: 'no período', color: '#002B5C' },
    { label: 'Erros', value: erros, hint: 'a corrigir', color: '#ef4444' },
    { label: 'Revisões pendentes', value: pendentes, hint: `${hoje} p/ hoje`, color: '#f59e0b' },
    { label: 'Revisões atrasadas', value: atrasadas, hint: 'urgente', color: '#b91c1c' },
  ]
  const max = Math.max(...stages.map((s) => s.value), 1)

  return (
    <div>
      <div className="space-y-2">
        {stages.map((s) => {
          const widthPct = s.value > 0 ? Math.max((s.value / max) * 100, 10) : 0
          return (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-44 shrink-0">
                <p className="text-xs font-semibold text-gray-700">{s.label}</p>
                <p className="text-[10px] text-gray-400">{s.hint}</p>
              </div>
              <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-gray-100">
                <div
                  className="flex h-full items-center justify-end rounded-lg px-2 text-xs font-bold text-white transition-all duration-500"
                  style={{ width: `${widthPct}%`, backgroundColor: s.color, minWidth: s.value > 0 ? 36 : 0 }}
                >
                  {s.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-gray-400">
        Funil aproximado. O app registra acertos/erros por tópico (sem questões individuais), então a etapa
        "acertadas depois" é percebida na <b>linha de evolução</b> e na mudança de classificação dos tópicos.
      </p>
    </div>
  )
}
