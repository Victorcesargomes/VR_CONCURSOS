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
