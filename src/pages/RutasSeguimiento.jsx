import { useState, useMemo, useEffect } from 'react'
import {
  Typography, Table, Tag, Row, Col, Card, Button, Input, Modal, Space, Popconfirm,
  Form, Select, DatePicker, Radio, InputNumber, Divider, Alert, Timeline, Progress,
} from 'antd'
import {
  EditOutlined, DeleteOutlined, SaveOutlined, EyeOutlined, EyeInvisibleOutlined,
  PlusOutlined, MinusCircleOutlined, SearchOutlined,
  SortAscendingOutlined, SortDescendingOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { maniobrasService } from '../services/maniobrasService'
import { clientesService } from '../services/clientesService'
import { transportistasService } from '../services/transportistasService'
import { rutasService } from '../services/rutasService'
import { toast } from '../utils/toast'
import { isCancelado, processRouteEvents, EventsFieldList } from '../components/RouteEventsFields'
import { LocationStatusTimeline } from '../components/LocationStatusTimeline'

const { Title } = Typography

const filterByLabel = (input, option) =>
  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

function sanitize(value) {
  if (typeof value !== 'string') return value
  return value.replace(/[$`<>{};'"]/g, '').trim()
}

function parseEvents(arr) {
  if (!arr?.length) return []
  const groups = []
  for (let i = 0; i + 3 < arr.length; i += 4) {
    groups.push({ time: arr[i], location: arr[i + 1], status: arr[i + 2], percentage: arr[i + 3] })
  }
  return groups.reverse()
}

// Strips cancelado and normalizes each evento's subeventos for a paso.
function normalizeEvents(events) {
  return (events ?? [])
    .filter(e => e.event_name && !isCancelado(e.event_name))
    .map(e => ({ event_name: e.event_name, sub_events: (e.sub_events ?? []).filter(Boolean) }))
}

// man_current_status is stored as "evento" or "evento / subevento". Split it back apart
// so the Evento and Subevento dropdowns can be pre-selected independently.
function parseManStatus(raw) {
  if (!raw) return { event: '', subevent: '' }
  const idx = raw.indexOf(' / ')
  if (idx === -1) return { event: raw, subevent: '' }
  return { event: raw.slice(0, idx), subevent: raw.slice(idx + 3) }
}

function buildPointMap(record, rutas = []) {
  // Route assigned to this maniobra: prefer the live route (fresh puntos/eventos, matched by
  // man_route.route_id), then the embedded snapshot itself (route deleted since linking),
  // then a same-origin/destination match for legacy maniobras never explicitly linked.
  const route =
    (record.man_route?.route_id ? rutas.find(r => r.route_id === record.man_route.route_id) : null) ??
    record.man_route ??
    rutas.find(
      r => r.route_origin?.location_name      === record.man_load_location &&
           r.route_destination?.location_name === record.man_unload_location
    ) ??
    null

  const points = []
  const seen   = new Set()

  const push = (name, events) => {
    if (!name || seen.has(name)) return
    seen.add(name)
    points.push({ label: name, value: name, events: normalizeEvents(events) })
  }

  const originName = route?.route_origin?.location_name      || record.man_load_location
  const destName    = route?.route_destination?.location_name || record.man_unload_location
  const stops        = route?.route_intermediate_points?.length
    ? route.route_intermediate_points
    : (record.man_intermediate_stops ?? [])

  push(originName, route?.route_origin?.events)
  for (const stop of stops) {
    if (stop.location_name) push(stop.location_name, stop.events)
  }
  push(destName, route?.route_destination?.events)

  return points
}

function ExpandedRow({ record }) {
  const events     = parseEvents(record.man_events)
  const containers = record.man_containers ?? []

  return (
    <div style={{ padding: '8px 8px 4px' }}>
      <Row gutter={[24, 16]}>
        <Col xs={24} lg={containers.length > 0 ? 14 : 24}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Historial de eventos</div>
          {events.length === 0 ? (
            <span style={{ color: '#aaa', fontSize: 12 }}>Sin eventos registrados</span>
          ) : (
            <Timeline
              style={{ maxHeight: 220, overflowY: 'auto', paddingTop: 4 }}
              items={events.map((e, i) => ({
                key: i,
                color: statusColor(e.status),
                children: (
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: '#888', marginRight: 8 }}>{e.time}</span>
                    <strong>{e.location}</strong>
                    {' — '}
                    <Tag color={statusColor(e.status)} style={{ margin: 0 }}>{e.status}</Tag>
                  </div>
                ),
              }))}
            />
          )}
        </Col>

        {containers.length > 0 && (
          <Col xs={24} lg={10}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
              Contenedores ({containers.length})
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', overflowX: 'hidden', paddingRight: 4 }}>
              <Row gutter={[10, 10]}>
                {containers.map((c, i) => {
                  const rows = [
                    ['Tamaño',    c.container_size    ? `${c.container_size} pies` : null],
                    ['Tipo',      c.container_type    || null],
                    ['Contenido', c.container_content || null],
                    ['Peso',      c.container_weight  ? `${c.container_weight} kg` : null],
                  ].filter(([, v]) => v)
                  return (
                    <Col key={c.container_id ?? i} xs={24} sm={12} style={{ display: 'flex' }}>
                      <div style={{
                        background:           'rgba(255,255,255,0.08)',
                        backdropFilter:       'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border:               '1px solid rgba(255,255,255,0.18)',
                        borderRadius:         8,
                        padding:              '8px 10px',
                        fontSize:             12,
                        lineHeight:           1.8,
                        boxShadow:            '0 2px 10px rgba(0,0,0,0.12)',
                        flex:                 1,
                        display:              'flex',
                        flexDirection:        'column',
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                          {c.container_id || '—'}
                        </div>
                        {rows.map(([label, value]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <span style={{ color: '#888', flexShrink: 0 }}>{label}</span>
                            <span style={{ textAlign: 'right' }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </Col>
                  )
                })}
              </Row>
            </div>
          </Col>
        )}
      </Row>
    </div>
  )
}

function toComparableStr(vals) {
  return JSON.stringify(vals, (_, v) => (dayjs.isDayjs(v) ? v.format('YYYY-MM-DD') : v))
}

function statusColor(v) {
  if (typeof v !== 'string' || !v) return 'default'
  const s = v.toLowerCase()
  if (s.includes('inici')) return 'orange'
  if (s.includes('proceso') || s.includes('activ')) return 'green'
  if (s.includes('complet') || s.includes('finaliz')) return 'blue'
  if (s.includes('cancel')) return 'red'
  return 'default'
}

export default function RutasSeguimiento() {
  const [search, setSearch] = useState('')
  const [containerSearch, setContainerSearch] = useState([])
  const [sortOrder, setSortOrder] = useState('desc') // 'desc' = más recientes primero, 'asc' = más antiguas primero
  const [cellState, setCellState] = useState({})
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [initialSnapshot, setInitialSnapshot] = useState(null)
  const [selectedTransporterId, setSelectedTransporterId] = useState(null)
  const [selectedRouteId, setSelectedRouteId] = useState(null)
  const [originalRouteId, setOriginalRouteId] = useState(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['maniobras'],
    queryFn:  () => maniobrasService.getAll().then(r => r.data?.maneuvers_data ?? []),
    retry: false,
  })

  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn:  () => clientesService.readAll().then(r => r.data?.clients_data ?? []),
  })

  const { data: transportistas = [], isLoading: loadingTransportistas } = useQuery({
    queryKey: ['transportistas'],
    queryFn:  () => transportistasService.readAll().then(r => r.data?.transporters_data ?? []),
  })

  const { data: rutas = [], isLoading: loadingRutas } = useQuery({
    queryKey: ['rutas-personalizadas'],
    queryFn:  () => rutasService.readAll().then(r => r.data?.routes_data ?? []),
  })

  const clientMap = useMemo(() => {
    const map = {}
    clientes.forEach(c => { map[c.client_id] = c.client_name })
    return map
  }, [clientes])

  const transporterMap = useMemo(() => {
    const map = {}
    transportistas.forEach(t => { map[t.transporter_id] = t.transporter_name })
    return map
  }, [transportistas])

  const selectedTransporter = useMemo(
    () => transportistas.find(t => t.transporter_id === selectedTransporterId) ?? null,
    [transportistas, selectedTransporterId]
  )

  const currentEcoId      = Form.useWatch('man_eco', form)
  const currentOperatorId = Form.useWatch('man_operator', form)

  // Keep the maniobra's currently assigned ECO/operator selectable even if it was
  // marked "no disponible" afterwards — otherwise the field silently blanks out on edit.
  const ecoOptions = (selectedTransporter?.transporter_equipment ?? [])
    .filter(e => e.eco_available !== false || e.eco_id === currentEcoId)
    .map(e => ({ label: e.eco_name, value: e.eco_id }))

  const operatorOptions = (selectedTransporter?.transporter_operators ?? [])
    .filter(o => o.operator_available !== false || o.operator_id === currentOperatorId)
    .map(o => ({ label: o.operator_name, value: o.operator_id }))

  function resolveEquipmentNames(record) {
    const transporter = transportistas.find(t => t.transporter_id === record.man_transporter)
    const eco = record.man_eco_id
      ? transporter?.transporter_equipment?.find(e => e.eco_id === record.man_eco_id)
      : null
    const operator = record.man_operator_id
      ? transporter?.transporter_operators?.find(o => o.operator_id === record.man_operator_id)
      : null
    return {
      ecoName:      eco?.eco_name           ?? record.man_eco      ?? '',
      operatorName: operator?.operator_name ?? record.man_operator ?? '',
    }
  }

  const clientOptions      = clientes.map(c => ({ label: c.client_name, value: c.client_id }))
  const transporterOptions = transportistas.map(t => ({ label: t.transporter_name, value: t.transporter_id }))
  const rutaOptions        = rutas.map(r => ({
    label: r.route_category ? `${r.route_name} (${r.route_category})` : r.route_name,
    value: r.route_id,
  }))

  useEffect(() => { setCellState({}) }, [data])

  const allManiobras = data ?? []

  const filtered = useMemo(() => {
    let result = allManiobras

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(m =>
        (m.man_id          ?? '').toLowerCase().includes(q) ||
        (m.man_client      ?? '').toLowerCase().includes(q) ||
        (clientMap[m.man_client] ?? '').toLowerCase().includes(q) ||
        (m.man_transporter ?? '').toLowerCase().includes(q) ||
        (transporterMap[m.man_transporter] ?? '').toLowerCase().includes(q)
      )
    }

    if (containerSearch.length > 0) {
      const terms = containerSearch.map(t => t.toLowerCase())
      result = result.filter(m =>
        (m.man_containers ?? []).some(c =>
          terms.some(t => (c.container_id ?? '').toLowerCase().includes(t))
        )
      )
    }

    result = [...result].sort((a, b) => {
      const cmp = (a._id ?? '').localeCompare(b._id ?? '')
      return sortOrder === 'desc' ? -cmp : cmp
    })

    return result
  }, [allManiobras, search, containerSearch, clientMap, transporterMap, sortOrder])

  const tableData = useMemo(() => filtered.map(r => {
    const parsedStatus = parseManStatus(r.man_current_status)
    return {
      ...r,
      _loc: cellState[r.man_id]?.location ?? (r.man_current_location ?? ''),
      _sts: cellState[r.man_id]?.status   ?? parsedStatus.event,
      _sub: cellState[r.man_id]?.subevent ?? parsedStatus.subevent,
    }
  }), [filtered, cellState])

  const saveMutation = useMutation({
    mutationFn: d => maniobrasService.save(d),
    onSuccess: () => {
      toast.success('Maniobra actualizada correctamente')
      queryClient.invalidateQueries({ queryKey: ['maniobras'] })
      setDrawerOpen(false)
      setEditing(null)
    },
    onError: err => toast.error('Error al guardar los cambios', err),
  })

  const [updatingId, setUpdatingId] = useState(null)
  const locationMutation = useMutation({
    mutationFn: d => maniobrasService.updateLocation(d),
    onSuccess: () => {
      toast.success('Ubicación actualizada')
      queryClient.invalidateQueries({ queryKey: ['maniobras'] })
      setUpdatingId(null)
    },
    onError: err => { toast.error('Error al actualizar la ubicación', err); setUpdatingId(null) },
  })

  function handleLocationSave(man_id, man_current_location, man_current_status) {
    setUpdatingId(man_id)
    locationMutation.mutate({ man_id, man_current_location, man_current_status })
  }

  const deleteMutation = useMutation({
    mutationFn: man_id => maniobrasService.remove({ man_id }),
    onSuccess: () => {
      toast.success('Maniobra eliminada correctamente')
      queryClient.invalidateQueries({ queryKey: ['maniobras'] })
    },
    onError: err => toast.error('Error al eliminar la maniobra', err),
  })

  function openEdit(record) {
    const containers = (record.man_containers ?? []).map(c => ({
      container_id:      c.container_id      ?? '',
      container_size:    c.container_size     ?? undefined,
      container_content: c.container_content  ?? '',
      container_type:    c.container_type     ?? '',
      container_weight:  c.container_weight   ?? null,
    }))

    // Match the assigned ECO/operator by id when available; legacy maniobras without an id
    // fall back to matching the snapshot name against the transporter's current equipment.
    const recordTransporter = transportistas.find(t => t.transporter_id === record.man_transporter) ?? null
    const matchedEco = recordTransporter?.transporter_equipment?.find(e =>
      record.man_eco_id ? e.eco_id === record.man_eco_id : e.eco_name === record.man_eco
    ) ?? null
    const matchedOperator = recordTransporter?.transporter_operators?.find(o =>
      record.man_operator_id ? o.operator_id === record.man_operator_id : o.operator_name === record.man_operator
    ) ?? null

    const formValues = {
      man_client:              record.man_client              || undefined,
      man_type:                record.man_type                || undefined,
      man_modality:            record.man_modality            || undefined,
      man_dispatch_date:       record.man_dispatch_date ? dayjs(record.man_dispatch_date) : null,
      man_moni_enable:         record.man_moni_enable === 'true' || record.man_moni_enable === true,
      man_agent:               record.man_agent               ?? '',
      man_executive:           record.man_executive           ?? '',
      man_extra_location:      record.man_extra_location      ?? '',
      man_extra_location_link: record.man_extra_location_link ?? '',
      man_transporter:         record.man_transporter         || undefined,
      man_eco:                 matchedEco?.eco_id             ?? undefined,
      man_operator:            matchedOperator?.operator_id   ?? undefined,
      man_gps_link:            record.man_gps_link            ?? '',
      man_containers:          containers,
    }

    const matchedRoute =
      (record.man_route?.route_id ? rutas.find(r => r.route_id === record.man_route.route_id) : null) ??
      rutas.find(r => r.route_origin === record.man_load_location && r.route_destination === record.man_unload_location) ??
      null

    setEditing(record)
    setSelectedTransporterId(record.man_transporter ?? null)
    setSelectedRouteId(matchedRoute?.route_id ?? null)
    setOriginalRouteId(matchedRoute?.route_id ?? null)
    setIsDirty(false)
    setInitialSnapshot(toComparableStr(formValues))
    form.setFieldsValue(formValues)
    setDrawerOpen(true)
  }

  function handleRowClick(record) {
    setSelected(record)
  }

  function handleTransporterChange(value) {
    setSelectedTransporterId(value)
    form.setFieldsValue({ man_eco: undefined, man_operator: undefined })
  }

  function handleRouteSelect(value) {
    setSelectedRouteId(value ?? null)
    setIsDirty(true)
    if (value === 'nueva') {
      form.setFieldsValue({
        route_name:                '',
        route_category:            undefined,
        route_origin:              { location_name: '', events: [{ event_name: 'cancelado', sub_events: [] }] },
        route_destination:         { location_name: '', events: [{ event_name: 'cancelado', sub_events: [] }] },
        route_intermediate_points: [],
      })
    }
  }

  function handleValuesChange(_, allValues) {
    if (!initialSnapshot) return
    setIsDirty(toComparableStr(allValues) !== initialSnapshot)
  }

  async function onFinish(values) {
    let routeFields
    let newRouteId

    if (selectedRouteId === 'nueva') {
      const processLocation = (loc = {}) => ({
        location_name: sanitize(loc.location_name ?? ''),
        events:         processRouteEvents(loc.events, sanitize),
      })
      const newRoutePayload = {
        route_name:                sanitize(values.route_name ?? ''),
        route_category:            values.route_category      ?? '',
        route_origin:              processLocation(values.route_origin),
        route_destination:         processLocation(values.route_destination),
        route_intermediate_points: (values.route_intermediate_points ?? []).map(processLocation),
      }
      try {
        const res = await rutasService.createOrUpdate(newRoutePayload)
        queryClient.invalidateQueries({ queryKey: ['rutas-personalizadas'] })
        newRouteId = res.data?.route_id ?? ''
        routeFields = {
          man_route_id:           newRouteId,
          man_load_location:      newRoutePayload.route_origin.location_name,
          man_unload_location:    newRoutePayload.route_destination.location_name,
          man_intermediate_stops: newRoutePayload.route_intermediate_points,
        }
      } catch {
        toast.error('Error al crear la nueva ruta')
        return
      }
    } else if (selectedRouteId) {
      const route = rutas.find(r => r.route_id === selectedRouteId)
      newRouteId = route?.route_id ?? ''
      routeFields = {
        man_route_id:           newRouteId,
        man_load_location:      route?.route_origin?.location_name      ?? '',
        man_unload_location:    route?.route_destination?.location_name ?? '',
        man_intermediate_stops: (route?.route_intermediate_points ?? []).map(p => ({
          location_name: p.location_name ?? '',
          events:         p.events        ?? [],
        })),
      }
    } else {
      toast.error('Selecciona una ruta')
      return
    }

    // Route changed vs what the maniobra had before editing: the old current
    // location/status/events no longer correspond to any point of the new route, so
    // reset them — otherwise the Ubicación/Estatus dropdowns could show a stale value
    // that isn't among the new route's options, and progress calculations would mix
    // milestones from two different routes.
    if (newRouteId !== originalRouteId) {
      routeFields.man_current_location = ''
      routeFields.man_current_status   = ''
      routeFields.man_progress         = '0%'
      routeFields.man_events           = []
    }

    const selectedEco = (selectedTransporter?.transporter_equipment ?? [])
      .find(e => e.eco_id === values.man_eco)
    const selectedOperator = (selectedTransporter?.transporter_operators ?? [])
      .find(o => o.operator_id === values.man_operator)

    saveMutation.mutate({
      man_id:                  editing.man_id,
      man_client:              values.man_client,
      man_type:                values.man_type,
      man_modality:            values.man_modality,
      man_dispatch_date:       values.man_dispatch_date?.format('YYYY-MM-DD') ?? '',
      man_agent:               values.man_agent               ?? '',
      man_executive:           values.man_executive            ?? '',
      man_extra_location:      values.man_extra_location      ?? '',
      man_extra_location_link: values.man_extra_location_link ?? '',
      man_eco:                 selectedEco?.eco_name             ?? '',
      man_eco_id:              selectedEco?.eco_id               ?? '',
      man_operator:            selectedOperator?.operator_name   ?? '',
      man_operator_id:         selectedOperator?.operator_id     ?? '',
      man_gps_link:            values.man_gps_link            ?? '',
      man_transporter:         values.man_transporter,
      man_moni_enable:         values.man_moni_enable         ?? true,
      man_containers:          values.man_containers          ?? [],
      ...routeFields,
    })
  }

  const columns = [
    {
      title: '',
      key: 'actions',
      width: 115,
      render: (_, record) => {
        const points       = buildPointMap(record, rutas)
        const location     = record._loc
        const status       = record._sts
        const subevent     = record._sub
        const matchedPoint = points.find(p => p.value === location)
        const isValid      = !!location && !!matchedPoint
        const noLocation   = !isValid || matchedPoint.events.length === 0
        const sentStatus   = status && subevent ? `${status} / ${subevent}` : (status ?? '')
        const unchanged =
          location   === (record.man_current_location ?? '') &&
          sentStatus === (record.man_current_status   ?? '')
        return (
          <Space size={4} onClick={e => e.stopPropagation()}>
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              loading={locationMutation.isPending && updatingId === record.man_id}
              disabled={noLocation || unchanged || !status}
              onClick={() => handleLocationSave(record.man_id, location, sentStatus)}
            />
            <Button
              size="small"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
            <Popconfirm
              title="¿Eliminar esta maniobra?"
              description="Esta acción no se puede deshacer."
              okText="Sí, eliminar"
              cancelText="Cancelar"
              onConfirm={() => deleteMutation.mutate(record.man_id)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      },
    },
    {
      title: 'Contenedor / Fecha',
      key: 'contenedor',
      width: 150,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12 }}>{r.man_containers?.[0]?.container_id ?? '—'}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{r.man_dispatch_date ?? '—'}</div>
        </div>
      ),
    },
    {
      title: 'Cliente',
      key: 'man_client',
      render: (_, r) => clientMap[r.man_client] ?? r.man_client ?? '—',
    },
    {
      title: 'Transportista / ECO',
      key: 'transportista',
      render: (_, r) => {
        const { ecoName } = resolveEquipmentNames(r)
        return (
          <div>
            <div style={{ fontSize: 12 }}>{transporterMap[r.man_transporter] ?? r.man_transporter ?? '—'}</div>
            {ecoName && <div style={{ fontSize: 11, color: '#888' }}>{ecoName}</div>}
          </div>
        )
      },
    },
    {
      title: 'Tipo / Modalidad',
      key: 'tipo',
      width: 110,
      render: (_, r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {r.man_type     && <Tag style={{ margin: 0 }}>{r.man_type}</Tag>}
          {r.man_modality && <Tag style={{ margin: 0 }}>{r.man_modality}</Tag>}
        </div>
      ),
    },
    {
      title: 'Seguimiento',
      key: 'seguimiento',
      width: 190,
      render: (_, r) => (
        <LocationStatusTimeline
          points={buildPointMap(r, rutas)}
          location={r._loc}
          status={r._sts}
          subevent={r._sub}
          onChange={next => setCellState(prev => ({ ...prev, [r.man_id]: next }))}
        />
      ),
    },
    {
      title: 'PROGRESO',
      key: 'progreso',
      width: 130,
      render: (_, r) => {
        const events      = parseEvents(r.man_events)
        const isCancelled = events.some(e => String(e.status ?? '').toUpperCase().includes('CANCEL'))
        const progress    = parseInt(r.man_progress, 10) || 0
        return (
          <Progress
            percent={progress}
            size="small"
            status={isCancelled ? 'exception' : undefined}
          />
        )
      },
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Title level={3} style={{ marginBottom: 16 }}>Seguimiento</Title>

      {isError && (
        <Alert
          description="No se pudo cargar la información de maniobras. Verifica que el backend esté activo."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Buscar por folio, cliente o transportista..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 380 }}
        />
        <Select
          mode="tags"
          placeholder="Filtrar por contenedor(es)..."
          value={containerSearch}
          onChange={setContainerSearch}
          allowClear
          tokenSeparators={[',', ' ']}
          notFoundContent={null}
          style={{ minWidth: 280 }}
          suffixIcon={<SearchOutlined />}
        />
        <Button
          icon={sortOrder === 'desc' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
          onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
        >
          {sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguas primero'}
        </Button>
      </div>

      <Row className="maylob-table-wrap" gutter={[16, 16]} style={{ marginTop: 'auto' }}>
        <Col span={24}>
          <Card title={`Maniobras (${filtered.length})`} size="small" style={{ height: '100%' }}>
            <Table
              columns={columns}
              dataSource={tableData}
              rowKey={r => r._id ?? r.man_id}
              loading={isLoading}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              size="small"
              scroll={{ x: 680 }}
              rowClassName={record => selected?._id === record._id ? 'ant-table-row-selected' : ''}
              onRow={record => ({
                onClick: () => handleRowClick(record),
                style: { cursor: 'pointer' },
              })}
              expandable={{
                expandedRowRender: record => <ExpandedRow record={record} />,
                rowExpandable: () => true,
              }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={`Editar maniobra — ${editing?.man_id ?? ''}`}
        open={drawerOpen}
        onCancel={() => { setDrawerOpen(false); setEditing(null) }}
        destroyOnClose
        centered
        width={800}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} onValuesChange={handleValuesChange}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="man_client"
                label="Cliente"
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <Select
                  showSearch
                  placeholder="Seleccionar cliente"
                  loading={loadingClientes}
                  filterOption={filterByLabel}
                  options={clientOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="man_dispatch_date"
                label="Fecha de Inicio"
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="man_moni_enable" label="Visible en MONITOR">
                <Radio.Group buttonStyle="solid">
                  <Radio.Button value={true}><EyeOutlined /> Visible</Radio.Button>
                  <Radio.Button value={false}><EyeInvisibleOutlined /> No visible</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="man_type"
                label="Tipo"
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <Radio.Group buttonStyle="solid">
                  <Radio.Button value="local">Local</Radio.Button>
                  <Radio.Button value="foránea">Foránea</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="man_modality"
                label="Modalidad"
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <Radio.Group
                  buttonStyle="solid"
                  onChange={e => {
                    const max = e.target.value === 'FULL' ? 4 : 2
                    const current = form.getFieldValue('man_containers') ?? []
                    if (current.length > max) form.setFieldsValue({ man_containers: current.slice(0, max) })
                  }}
                >
                  <Radio.Button value="FULL">Full</Radio.Button>
                  <Radio.Button value="SENCILLO">Sencillo</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="man_agent" label="Agente Aduanal">
                <Input allowClear placeholder="Nombre del agente aduanal" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="man_executive" label="Ejecutivo">
                <Input allowClear placeholder="Nombre del ejecutivo" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Ruta" required>
                <Select
                  showSearch
                  placeholder="Seleccionar ruta"
                  loading={loadingRutas}
                  filterOption={filterByLabel}
                  options={[{ label: 'NUEVA', value: 'nueva' }, ...rutaOptions]}
                  value={selectedRouteId}
                  onChange={handleRouteSelect}
                />
              </Form.Item>
            </Col>
          </Row>

          {selectedRouteId === 'nueva' && (
            <>
              <Form.Item
                name="route_name"
                label="Nombre de la ruta"
                rules={[{ required: true, message: 'El nombre es obligatorio' }]}
              >
                <Input placeholder="Ej. CDMX - VERACRUZ" />
              </Form.Item>
              <Form.Item name="route_category" label="Categoría">
                <Radio.Group buttonStyle="solid">
                  <Radio.Button value="local">Local</Radio.Button>
                  <Radio.Button value="foránea">Foránea</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Divider orientation="left">Punto de Origen</Divider>
              <Form.Item
                name={['route_origin', 'location_name']}
                label="Nombre"
                rules={[{ required: true, message: 'El nombre del origen es obligatorio' }]}
              >
                <Input placeholder="Ciudad o punto de origen" />
              </Form.Item>
              <EventsFieldList name={['route_origin', 'events']} addLabel="Agregar evento de origen" />

              <Divider orientation="left">Punto de Destino</Divider>
              <Form.Item
                name={['route_destination', 'location_name']}
                label="Nombre"
                rules={[{ required: true, message: 'El nombre del destino es obligatorio' }]}
              >
                <Input placeholder="Ciudad o punto de destino" />
              </Form.Item>
              <EventsFieldList name={['route_destination', 'events']} addLabel="Agregar evento de destino" />

              <Divider orientation="left">Puntos Intermedios</Divider>
              <Form.List name="route_intermediate_points">
                {(pointFields, { add: addPoint, remove: removePoint }) => (
                  <>
                    {pointFields.map(({ key: pointKey, name: pointName }) => (
                      <Card
                        key={pointKey}
                        size="small"
                        title={`Punto intermedio ${pointName + 1}`}
                        extra={
                          <Button danger size="small" icon={<MinusCircleOutlined />} onClick={() => removePoint(pointName)}>
                            Eliminar
                          </Button>
                        }
                        style={{ marginBottom: 12, background: '#fafafa' }}
                      >
                        <Form.Item
                          name={[pointName, 'location_name']}
                          label="Nombre del punto"
                          rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                          style={{ marginBottom: 8 }}
                        >
                          <Input allowClear placeholder="Ej. ADUANA, PATIO, TERMINAL" />
                        </Form.Item>
                        <EventsFieldList
                          name={[pointName, 'events']}
                          addLabel="Agregar evento"
                          absolutePath={['route_intermediate_points', pointName, 'events']}
                        />
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => addPoint({ location_name: '', events: [{ event_name: 'cancelado' }] })}
                      icon={<PlusOutlined />}
                      block
                      style={{ marginBottom: 8 }}
                    >
                      Agregar punto intermedio
                    </Button>
                  </>
                )}
              </Form.List>
            </>
          )}

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="man_extra_location" label="Ubicación Extra">
                <Input allowClear placeholder="Ubicación adicional" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="man_extra_location_link" label="Link Ubicación Extra">
                <Input allowClear placeholder="URL de ubicación adicional" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="man_transporter"
                label="Transportista"
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <Select
                  showSearch
                  placeholder="Seleccionar transportista"
                  loading={loadingTransportistas}
                  filterOption={filterByLabel}
                  options={transporterOptions}
                  onChange={handleTransporterChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="man_gps_link" label="GPS Link">
                <Input allowClear placeholder="lat,lng o URL de tracking" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="man_eco" label="ECO">
                <Select
                  allowClear
                  placeholder={selectedTransporterId ? 'Seleccionar ECO' : 'Selecciona un transportista primero'}
                  disabled={!selectedTransporterId}
                  options={ecoOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="man_operator" label="Operador">
                <Select
                  allowClear
                  placeholder={selectedTransporterId ? 'Seleccionar operador' : 'Selecciona un transportista primero'}
                  disabled={!selectedTransporterId}
                  options={operatorOptions}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ marginTop: 8 }}>Contenedores</Divider>

          <Form.List name="man_containers">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <Card
                    key={key}
                    size="small"
                    title={`Contenedor ${name + 1}`}
                    extra={
                      <Button danger size="small" icon={<MinusCircleOutlined />} onClick={() => remove(name)}>
                        Eliminar
                      </Button>
                    }
                    style={{ marginBottom: 12, background: '#fafafa' }}
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name={[name, 'container_id']}
                          label="ID Contenedor"
                          rules={[{ required: true, message: 'El ID del contenedor es obligatorio' }]}
                        >
                          <Input allowClear placeholder="Número / ID del contenedor" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name={[name, 'container_size']} label="Tamaño">
                          <Radio.Group buttonStyle="solid">
                            <Radio.Button value={20}>20 pies</Radio.Button>
                            <Radio.Button value={40}>40 pies</Radio.Button>
                          </Radio.Group>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item name={[name, 'container_content']} label="Contenido">
                          <Input allowClear placeholder="Descripción del contenido" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name={[name, 'container_type']} label="Tipo">
                          <Input allowClear placeholder="Tipo de contenedor" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item name={[name, 'container_weight']} label="Peso (kg)">
                          <InputNumber min={0} style={{ width: '100%' }} placeholder="Peso en kg" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}

                <Form.Item shouldUpdate noStyle>
                  {({ getFieldValue }) => {
                    const modality = getFieldValue('man_modality')
                    const max = modality === 'FULL' ? 4 : modality === 'SENCILLO' ? 2 : 0
                    return (
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        icon={<PlusOutlined />}
                        block
                        disabled={!modality || fields.length >= max}
                        style={{ marginBottom: 8 }}
                      >
                        {modality
                          ? `Agregar contenedor (${fields.length}/${max})`
                          : 'Selecciona una modalidad primero'}
                      </Button>
                    )
                  }}
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item style={{ marginTop: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
              disabled={!isDirty}
            >
              Guardar cambios
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
