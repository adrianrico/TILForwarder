import api from './api'

export const rutasService = {
  readAll:        ()     => api.get('/routes/route'),
  createOrUpdate: (data) => api.post('/routes/route', data),
  remove:         (data) => api.delete('/routes/route/', { data }),
}
