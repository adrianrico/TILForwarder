import { useMemo, useState } from 'react'
import { Row, Col, Typography, Alert, DatePicker, Card } from 'antd'
import { useQuery } from '@tanstack/react-query'
import {
  TeamOutlined,
  ApartmentOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import SteeringWheelOutlined from '../components/SteeringWheelOutlined'
import StatCard from '../components/dashboard/StatCard'
import ManeuversTable from '../components/dashboard/ManeuversTable'
import { clientesService } from '../services/clientesService'
import { transportistasService } from '../services/transportistasService'
import { maniobrasService } from '../services/maniobrasService'
import { rutasService } from '../services/rutasService'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const { Title } = Typography
const { RangePicker } = DatePicker
const MEXICO_CENTER = [23.6, -102.6]
const MEXICO_ZOOM = 5

const parseProgress = (m) => parseInt(m.man_progress, 10) || 0
const isCancelled   = (m) => (m.man_current_status ?? '').toUpperCase().includes('CANCEL')

function parseCoords(str) {
  if (!str) return null
  const match = str.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
  if (match) return [parseFloat(match[1]), parseFloat(match[2])]
  return null
}

export default function Dashboard() {
  const clientes = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesService.readAll().then((r) => r.data?.clients_data ?? []),
    meta:     { label: 'Cargando clientes...' },
    retry: false,
  })

  const transportistas = useQuery({
    queryKey: ['transportistas'],
    queryFn: () => transportistasService.readAll().then((r) => r.data?.transporters_data ?? []),
    meta:     { label: 'Cargando transportistas...' },
    retry: false,
  })

  const maniobrasRecientes = useQuery({
    queryKey: ['maniobras-recientes'],
    queryFn: () => maniobrasService.getAll({ page: 1, limit: 5 }).then((r) => r.data?.maneuvers_data ?? []),
    meta:     { label: 'Cargando maniobras...' },
    retry: false,
  })

  const [dateRange, setDateRange] = useState(null) // null | [dayjs, dayjs]
  const hasDateRange = !!(dateRange?.[0] && dateRange?.[1])

  const stats = useQuery({
    queryKey: ['maniobras-stats', dateRange?.[0]?.format('YYYY-MM-DD'), dateRange?.[1]?.format('YYYY-MM-DD')],
    queryFn: () => maniobrasService.getStats({
      date_from: dateRange[0].format('YYYY-MM-DD'),
      date_to:   dateRange[1].format('YYYY-MM-DD'),
    }).then((r) => r.data?.stats),
    enabled:  hasDateRange,
    meta:     { label: 'Cargando totales del rango...' },
    retry: false,
  })

  const rutas = useQuery({
    queryKey: ['rutas-personalizadas'],
    queryFn: () => rutasService.readAll().then((r) => r.data?.routes_data ?? []),
    meta:     { label: 'Cargando rutas...' },
    retry: false,
  })

  const clientesData        = Array.isArray(clientes.data)      ? clientes.data      : []
  const transportistasData  = Array.isArray(transportistas.data) ? transportistas.data : []
  const maniobrasRecientesData = Array.isArray(maniobrasRecientes.data) ? maniobrasRecientes.data : []
  const rutasData            = Array.isArray(rutas.data)         ? rutas.data         : []

  const clientMap = useMemo(() => {
    const map = {}
    clientesData.forEach(c => { map[c.client_id] = c.client_name })
    return map
  }, [clientesData])

  const transporterMap = useMemo(() => {
    const map = {}
    transportistasData.forEach(t => { map[t.transporter_id] = t.transporter_name })
    return map
  }, [transportistasData])

  const clientesActivos   = clientesData.filter(c => c.client_status === 'ACTIVO').length
  const clientesInactivos = clientesData.filter(c => c.client_status === 'INACTIVO').length

  const rutasLocales   = rutasData.filter(r => r.route_category === 'local').length
  const rutasForaneas  = rutasData.filter(r => r.route_category === 'foránea').length

  const recentActivas    = maniobrasRecientesData.filter(m => !isCancelled(m) && parseProgress(m) > 0)
  const recentSinIniciar = maniobrasRecientesData.filter(m => !isCancelled(m) && parseProgress(m) === 0)
  const recentCanceladas = maniobrasRecientesData.filter(isCancelled)

  const maniobrasConGPS = maniobrasRecientesData.filter(m => m.man_gps_link && parseCoords(m.man_gps_link))

  const backendDown =
    clientes.isError && transportistas.isError && maniobrasRecientes.isError && rutas.isError

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      {backendDown && (
        <Alert
          title="Sin conexión al servidor"
          description="Verifica que el backend Node.js esté corriendo en el puerto 8080."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={{ span: 24, order: 1 }} lg={{ span: 14, order: 1 }} className="maylob-dashboard-stats">
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} lg={12}>
              <StatCard
                title="Total Clientes"
                value={clientesData.length}
                prefix={<TeamOutlined />}
                loading={clientes.isLoading}
                subcategories={[
                  { label: 'Activos',   value: clientesActivos,   color: '#52c41a' },
                  { label: 'Inactivos', value: clientesInactivos, color: '#ff4d4f' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} lg={12}>
              <StatCard
                title="Total Transportistas"
                value={transportistasData.length}
                prefix={<SteeringWheelOutlined />}
                loading={transportistas.isLoading}
                color="#52c41a"
              />
            </Col>
            <Col xs={24} sm={12} lg={12}>
              <StatCard
                title={hasDateRange
                  ? `Maniobras ${dateRange[0].format('DD/MM/YY')} – ${dateRange[1].format('DD/MM/YY')}`
                  : 'Últimas 5 Maniobras'}
                value={hasDateRange ? (stats.data?.total ?? 0) : maniobrasRecientesData.length}
                prefix={<ApartmentOutlined />}
                loading={hasDateRange ? stats.isLoading : maniobrasRecientes.isLoading}
                color="#722ed1"
                subcategories={hasDateRange
                  ? [
                      { label: 'Activas',     value: stats.data?.activas ?? 0,     color: '#52c41a' },
                      { label: 'Sin Iniciar', value: stats.data?.sin_iniciar ?? 0, color: '#faad14' },
                      { label: 'Canceladas',  value: stats.data?.canceladas ?? 0,  color: '#ff4d4f' },
                    ]
                  : [
                      { label: 'Activas',     value: recentActivas.length,    color: '#52c41a' },
                      { label: 'Sin Iniciar', value: recentSinIniciar.length, color: '#faad14' },
                      { label: 'Canceladas',  value: recentCanceladas.length, color: '#ff4d4f' },
                    ]}
                extra={
                  <RangePicker
                    size="small"
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    value={dateRange}
                    onChange={setDateRange}
                    allowClear
                  />
                }
              />
            </Col>
            <Col xs={24} sm={12} lg={12}>
              <StatCard
                title="Total Rutas"
                value={rutasData.length}
                prefix={<EnvironmentOutlined />}
                loading={rutas.isLoading}
                color="#13c2c2"
                subcategories={[
                  { label: 'Locales',   value: rutasLocales,  color: '#1677ff' },
                  { label: 'Foráneas',  value: rutasForaneas, color: '#722ed1' },
                ]}
              />
            </Col>
          </Row>
        </Col>

        <Col xs={{ span: 24, order: 3 }} lg={{ span: 10, order: 2 }}>
          <Card title={`Mapa de Seguimiento (${maniobrasConGPS.length} con GPS)`} size="small">
            <div style={{ height: 400 }}>
              <MapContainer center={MEXICO_CENTER} zoom={MEXICO_ZOOM} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {maniobrasConGPS.map(m => {
                  const coords = parseCoords(m.man_gps_link)
                  if (!coords) return null
                  return (
                    <Marker key={m._id ?? m.man_id} position={coords}>
                      <Popup>
                        <strong>{m.man_id}</strong><br />
                        {clientMap[m.man_client] ?? m.man_client}<br />
                        {m.man_current_status}
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            </div>
          </Card>
        </Col>

        <Col xs={{ span: 24, order: 2 }} lg={{ span: 24, order: 3 }}>
          <Card title="Maniobras Recientes" size="small">
            <ManeuversTable
              data={maniobrasRecientesData}
              loading={maniobrasRecientes.isLoading}
              clientMap={clientMap}
              transporterMap={transporterMap}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
