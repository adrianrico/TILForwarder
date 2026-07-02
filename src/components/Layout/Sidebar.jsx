import { useNavigate, useLocation } from 'react-router-dom'
import { Menu } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  RadarChartOutlined,
  FormOutlined,
} from '@ant-design/icons'
import SteeringWheelOutlined from '../SteeringWheelOutlined'

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/clientes', icon: <TeamOutlined />, label: 'Clientes' },
  { key: '/transportistas', icon: <SteeringWheelOutlined />, label: 'Transportistas' },
  { key: '/rutas-personalizadas', icon: <EnvironmentOutlined />, label: 'Rutas Personalizadas' },
  { key: '/rutas-seguimiento', icon: <RadarChartOutlined />, label: 'Seguimiento' },
  { key: '/maniobras', icon: <FormOutlined />, label: 'Maniobras' },
]

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={({ key }) => navigate(key)}
      style={{ height: '100%', borderRight: 0 }}
      inlineCollapsed={collapsed}
    />
  )
}
