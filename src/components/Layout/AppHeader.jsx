import { Layout, Button, Typography } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import TILLogo from '../TILLogo'

const { Header } = Layout
const { Title } = Typography

const PAGE_TITLES = {
  '/':                     'Dashboard',
  '/clientes':             'Administración de Clientes',
  '/transportistas':       'Administración de Transportistas',
  '/rutas-personalizadas': 'Administración de Rutas Personalizadas',
  '/rutas-seguimiento':    'Rutas y Seguimiento',
}

export default function AppHeader({ collapsed, onToggle }) {
  const { pathname } = useLocation()
  const pageTitle = PAGE_TITLES[pathname] ?? 'MAYLOB TIL'

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: '#001830',
        padding: '0 24px',
        borderBottom: '1px solid #0a3050',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
        style={{ fontSize: 16, color: '#7aafc8' }}
      />

      <TILLogo height={30} />

      <span style={{ color: '#0a3050', fontSize: 18, fontWeight: 300, marginInline: 2 }}>—</span>

      <Title level={4} style={{ margin: 0, color: '#0695E4', fontWeight: 600 }}>
        {pageTitle}
      </Title>
    </Header>
  )
}
