/**
 * Definición única del menú de navegación (antes duplicada en varios archivos).
 * Cada `key` es la ruta que debe existir en `App.jsx`.
 */
import {
  DashboardOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  RadarChartOutlined,
  FormOutlined,
} from '@ant-design/icons'
import SteeringWheelOutlined from '@/shared/components/SteeringWheelOutlined'

export const menuItems = [
  { key: '/',                     icon: <DashboardOutlined />,     label: 'Dashboard' },
  { key: '/clientes',             icon: <TeamOutlined />,          label: 'Clientes' },
  { key: '/transportistas',       icon: <SteeringWheelOutlined />, label: 'Transportistas' },
  { key: '/rutas-personalizadas', icon: <EnvironmentOutlined />,   label: 'Rutas Personalizadas' },
  { key: '/rutas-seguimiento',    icon: <RadarChartOutlined />,    label: 'Seguimiento' },
  { key: '/maniobras',            icon: <FormOutlined />,          label: 'Maniobras' },
]
