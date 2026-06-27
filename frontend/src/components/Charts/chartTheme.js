// Tema compartilhado dos gráficos — cores da marca (navy/teal) + classificações.

export const statusOrder = ['Dominado', 'Bom', 'Atencao', 'Critico']

export const normalizeStatus = (status = '') => {
  if (status === 'Dominado') return 'Dominado'
  if (status === 'Bom') return 'Bom'
  if (status.toLowerCase().startsWith('aten')) return 'Atencao'
  if (status.toLowerCase().startsWith('cr')) return 'Critico'
  return 'Sem dados'
}

export const statusMeta = {
  Dominado: { label: 'Dominado', color: '#10b981', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  Bom: { label: 'Bom', color: '#2563eb', badge: 'text-blue-700 bg-blue-50 border-blue-200' },
  Atencao: { label: 'Atenção', color: '#f59e0b', badge: 'text-amber-700 bg-amber-50 border-amber-200' },
  Critico: { label: 'Crítico', color: '#ef4444', badge: 'text-red-700 bg-red-50 border-red-200' },
  'Sem dados': { label: 'Sem dados', color: '#94a3b8', badge: 'text-gray-600 bg-gray-50 border-gray-200' },
}

// Cor contínua por % líquido (verde → azul → âmbar → vermelho)
export const pctColor = (pct) => {
  if (pct >= 85) return '#10b981'
  if (pct >= 70) return '#2563eb'
  if (pct >= 50) return '#f59e0b'
  return '#ef4444'
}

export const shortName = (value = '', size = 24) => (value.length > size ? `${value.slice(0, size)}...` : value)

// Paleta para séries categóricas (matérias etc.) — começa com as cores da marca.
export const CHART_PALETTE = ['#002B5C', '#00A67D', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316']

export const tooltipStyle = { borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }
