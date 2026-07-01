import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  // Serializa arrays como ?tipos=a&tipos=b (em vez de tipos[]=a) para o FastAPI Query(list)
  paramsSerializer: { indexes: null },
})

export const materiasAPI = {
  list: (apenasAtivas = false) => api.get(`/materias/?apenas_ativas=${apenasAtivas}`),
  get: (id) => api.get(`/materias/${id}`),
  create: (data) => api.post('/materias/', data),
  update: (id, data) => api.put(`/materias/${id}`, data),
  delete: (id) => api.delete(`/materias/${id}`),
}

export const assuntosAPI = {
  list: (materiaId) => api.get('/assuntos/', { params: { materia_id: materiaId || undefined } }),
  get: (id) => api.get(`/assuntos/${id}`),
  create: (data) => api.post('/assuntos/', data),
  update: (id, data) => api.put(`/assuntos/${id}`, data),
  delete: (id) => api.delete(`/assuntos/${id}`),
}

export const topicosAPI = {
  list: (params) => api.get('/topicos/', { params }),
  get: (id) => api.get(`/topicos/${id}`),
  create: (data) => api.post('/topicos/', data),
  update: (id, data) => api.put(`/topicos/${id}`, data),
  delete: (id) => api.delete(`/topicos/${id}`),
}

export const calendarioAPI = {
  list: () => api.get('/calendario/'),
  create: (data) => api.post('/calendario/', data),
  update: (id, data) => api.put(`/calendario/${id}`, data),
  delete: (id) => api.delete(`/calendario/${id}`),
}

export const sessoesAPI = {
  list: (params) => api.get('/sessoes/', { params }),
  get: (id) => api.get(`/sessoes/${id}`),
  create: (data) => api.post('/sessoes/', data),
  update: (id, data) => api.put(`/sessoes/${id}`, data),
  delete: (id) => api.delete(`/sessoes/${id}`),
  finalizarSimulado: (id, duracaoSegundos) => api.post(`/sessoes/${id}/finalizar-simulado`, { duracao_segundos: duracaoSegundos }),
}

export const questoesAPI = {
  list: (params) => api.get('/questoes/', { params }),
  cadernoErros: (params) => api.get('/questoes/caderno-erros', { params }),
  create: (data) => api.post('/questoes/', data),
  update: (id, data) => api.put(`/questoes/${id}`, data),
  delete: (id) => api.delete(`/questoes/${id}`),
}

export const engajamentoAPI = {
  stats: () => api.get('/engajamento/stats'),
  conquistas: () => api.get('/engajamento/conquistas'),
  avaliar: () => api.post('/engajamento/conquistas/avaliar'),
}

// Dispara download de um endpoint CSV (trata acentos via BOM já incluído no backend).
export const downloadCSV = async (url, filename) => {
  const res = await api.get(url, { responseType: 'blob' })
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

export const revisoesAPI = {
  list: (params) => api.get('/revisoes/', { params }),
  resumo: () => api.get('/revisoes/resumo'),
  concluir: (id) => api.put(`/revisoes/${id}/concluir`),
}

export const desempenhoAPI = {
  dashboard: (params) => api.get('/desempenho/dashboard', { params }),
  materias: (params) => api.get('/desempenho/materias', { params }),
  assuntos: (materiaId, params = {}) => api.get('/desempenho/assuntos', { params: { ...params, materia_id: materiaId || undefined } }),
  topicos: (params) => api.get('/desempenho/topicos', { params }),
  assuntoDetalhe: (assuntoId, params) => api.get(`/desempenho/assunto/${assuntoId}`, { params }),
  historicoTopico: (topicoId, params) => api.get(`/desempenho/topico/${topicoId}/historico`, { params }),
}

export const editaisAPI = {
  list: () => api.get('/editais/'),
  get: (id) => api.get(`/editais/${id}`),
  create: (data) => api.post('/editais/', data),
  update: (id, data) => api.put(`/editais/${id}`, data),
  delete: (id) => api.delete(`/editais/${id}`),
  setMaterias: (id, materias) => api.put(`/editais/${id}/materias`, materias),
  readinessAtivo: () => api.get('/editais/readiness'),
  readiness: (id) => api.get(`/editais/${id}/readiness`),
}

export const metasAPI = {
  get: (editalId) => api.get('/metas/', { params: { edital_id: editalId || undefined } }),
  upsert: (data) => api.put('/metas/', data),
}
