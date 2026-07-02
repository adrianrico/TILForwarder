import api from './api'

export const transportistasService = {
  readAll:        ()     => api.get('/transporters/transporter/'),
  createOrUpdate: (data) => api.post('/transporters/transporter/', data),
  remove:         (data) => api.delete('/transporters/transporter/', { data }),

  saveOperator:   (data) => api.post('/transporters/operator/', data),
  deleteOperator: (data) => api.post('/transporters/operator/', { ...data, action: 'delete' }),

  saveEco:        (data) => api.post('/transporters/eco/', data),
  deleteEco:      (data) => api.post('/transporters/eco/', { ...data, action: 'delete' }),
}
