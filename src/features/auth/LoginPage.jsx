import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Input, Button, Typography, Form, Alert } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { useAuth } from './AuthContext'
import TILLogo from '@/shared/components/TILLogo'

const { Text } = Typography

/** Pantalla de acceso: usuario y contraseña que el administrador generó en el portal TIL_Superadmin. */
export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit() {
    const user = username.trim()
    if (!user || !password) return
    setLoading(true)
    setError('')
    try {
      await login(user, password)
      navigate('/', { replace: true })
    } catch (err) {
      const status = err.response?.status
      if (status === 429) setError('Demasiados intentos. Espera unos minutos.')
      else if (status === 423) setError('Cuenta bloqueada temporalmente. Intenta más tarde.')
      else if (status === 403) setError('Tu acceso está restringido. Contacta al administrador.')
      else if (status === 401) setError('Credenciales inválidas.')
      else setError(err.userMessage ?? 'No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', zIndex: 1 }}>
      <Card style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          <TILLogo height={40} />
          <Text style={{ color: '#7aafc8', fontSize: 13, textAlign: 'center' }}>
            Ingresa con las credenciales que te entregó el administrador
          </Text>
        </div>

        <Form layout="vertical" onFinish={onSubmit}>
          <Form.Item label="Usuario" required style={{ marginBottom: 16 }}>
            <Input
              prefix={<UserOutlined />}
              size="large"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </Form.Item>
          <Form.Item label="Contraseña" required style={{ marginBottom: 20 }}>
            <Input.Password
              prefix={<LockOutlined />}
              size="large"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
          <Button type="primary" htmlType="submit" icon={<LoginOutlined />} size="large" block loading={loading} disabled={!username.trim() || !password}>
            Ingresar
          </Button>
        </Form>
      </Card>
    </div>
  )
}
