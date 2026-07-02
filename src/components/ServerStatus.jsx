import { useState, useEffect } from 'react'
import { Alert } from 'antd'
import api from '../services/api'

export default function ServerStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const check = async () => {
      try {
        await api.get('/clients/client/', { timeout: 5000 })
        setIsOnline(true)
      } catch (err) {
        if (!err.response || err.response.status >= 500) {
          setIsOnline(false)
        } else {
          setIsOnline(true)
        }
      }
    }

    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [])

  if (isOnline) return null

  return (
    <Alert
      type="error"
      showIcon
      message="Sin conexión con el servidor"
      description="No es posible comunicarse con el servidor. Verifica que el backend esté en ejecución."
      style={{
        marginBottom:         16,
        background:           'rgba(80, 10, 10, 0.45)',
        backdropFilter:       'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border:               '1px solid rgba(255, 80, 80, 0.3)',
      }}
    />
  )
}
