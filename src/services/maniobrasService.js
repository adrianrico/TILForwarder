import api from './api'

export const maniobrasService = {
  getAll:    (params) => api.get('/maneuvers/maneuver/', { params }),
  getStats:  (params) => api.get('/maneuvers/stats/', { params }),
  save:      (data) => api.post('/maneuvers/maneuver/', data),
  remove:    (data) => api.delete('/maneuvers/maneuver/', { data }),
  getGPS:    (params) => api.get('/maneuvers/getGPS/', { params }),
  updateGPS:      (data) => api.patch('/maneuvers/updateTrackingLink/', data),
  updateLocation: (data) => api.patch('/maneuvers/updateLocation/', data),
}
