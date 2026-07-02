import api from './api'

export const clientesService = {
  readAll: () => api.get('/clients/client/'),
  create:  (data) => api.post('/clients/client/', data),
  update:  (data) => api.post('/clients/client/', data),
  remove:  (client_id) => api.delete('/clients/client/', { data: { client_id } }),
}
