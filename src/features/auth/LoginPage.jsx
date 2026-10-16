import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Input, Button, Typography, Form, Alert } from 'antd'
import { KeyOutlined, LoginOutlined } from '@ant-design/icons'
import { useAuth } from './AuthContext'
import TILLogo from '@/shared/components/TILLogo'

const { Text } = Typography

/** Pantalla de acceso: el administrador ingresa su llave (`ADMIN_API_KEY` del backend). */
export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit() {
    const value = key.trim()
    if (!value) return
    setLoading(true)
    setError('')
    try {
      await login(value)
      navigate('/', { replace: true })
    } catch (err) {
      const status = err.response?.status
      setError(
        status === 401 || status === 403
          ? 'Llave de administrador incorrecta.'
          : err.userMessage ?? 'No se pudo conectar con el servidor.',
      )
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
            Ingresa la llave de administrador
          </Text>
        </div>

        <Form layout="vertical" onFinish={onSubmit}>
          <Form.Item label="Llave de administrador" required style={{ marginBottom: 20 }}>
            <Input.Password
              prefix={<KeyOutlined />}
              size="large"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoFocus
            />
          </Form.Item>
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
          <Button type="primary" htmlType="submit" icon={<LoginOutlined />} size="large" block loading={loading} disabled={!key.trim()}>
            Ingresar
          </Button>
        </Form>
      </Card>
    </div>
  )
}
