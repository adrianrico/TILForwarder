import { useState, useEffect } from 'react'
import {
  Typography, Button, Table, Input, Select, Space, Popconfirm, Empty, Modal, Form, Divider, Radio, Tag,
} from 'antd'
import { DeleteOutlined, EditOutlined, HolderOutlined, MinusCircleOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { rutasService } from '../services/rutasService'
import { toast } from '../utils/toast'
import { isCancelado, buildEvents, processRouteEvents, EventsFieldList } from '../components/RouteEventsFields'

const { Title, Text } = Typography

function sanitize(value) {
  if (typeof value !== 'string') return value
  return value.replace(/[$`<>{};'"]/g, '').trim()
}

function SortableIntermediatePoint({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderRadius: 8,
    padding: '12px 12px 4px',
    marginBottom: 12,
    background: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  }
  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandle: (
        <HolderOutlined
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', fontSize: 20, color: 'rgba(255,255,255,0.75)', marginRight: 10, padding: 4 }}
        />
      ) })}
    </div>
  )
}

export default function RutasPersonalizadas() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [edits, setEdits] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [eventsModal, setEventsModal] = useState(null)
  const [form] = Form.useForm()
  const [eventsForm] = Form.useForm()
  const intermediatePointsWatch = Form.useWatch('route_intermediate_points', form) || []
  const destinationStep = intermediatePointsWatch.length + 2
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const { data, isLoading } = useQuery({
    queryKey: ['rutas-personalizadas'],
    queryFn:  () => rutasService.readAll().then((r) => r.data?.routes_data ?? []),
    meta:     { label: 'Cargando rutas...' },
    retry: false,
  })

  useEffect(() => {
    if (!Array.isArray(data)) return
    const initial = {}
    data.forEach((r) => {
      initial[r.route_id] = {
        route_name:     r.route_name     ?? '',
        route_category: r.route_category ?? '',
      }
    })
    setEdits(initial)
  }, [data])

  function openEditModal(record) {
    setEditingRoute(record)
    form.setFieldsValue({
      route_name:     record.route_name     ?? '',
      route_category: record.route_category ?? undefined,
      route_origin:      { location_name: record.route_origin?.location_name ?? '',      events: buildEvents(record.route_origin?.events) },
      route_destination: { location_name: record.route_destination?.location_name ?? '', events: buildEvents(record.route_destination?.events) },
      route_intermediate_points: (record.route_intermediate_points ?? []).map(p => ({
        location_name: p.location_name ?? '',
        events: buildEvents(p.events),
      })),
    })
    setModalOpen(true)
  }

  function openEventsModal(route, type, stopIndex) {
    let locationName = ''
    let events = []
    if (type === 'stop') {
      const point = route.route_intermediate_points?.[stopIndex] ?? {}
      locationName = point.location_name ?? ''
      events = point.events ?? []
    } else {
      const loc = type === 'origin' ? route.route_origin : route.route_destination
      locationName = loc?.location_name ?? ''
      events = loc?.events ?? []
    }
    eventsForm.setFieldsValue({ events: buildEvents(events) })
    setEventsModal({ route, type, stopIndex, locationName })
  }

  async function handleSaveEvents() {
    const { route, type, stopIndex } = eventsModal
    let values
    try {
      values = await eventsForm.validateFields()
    } catch {
      return
    }
    const toRealEvents = (list) => processRouteEvents(list ?? [], sanitize)

    if (type === 'stop') {
      const points = (route.route_intermediate_points ?? []).map((p, i) => ({
        location_name: p.location_name,
        events: i === stopIndex ? toRealEvents(values.events) : toRealEvents(p.events),
      }))
      saveEventsMutation.mutate({ route_id: route.route_id, route_name: route.route_name, route_intermediate_points: points })
    } else {
      const fieldKey = type === 'origin' ? 'route_origin' : 'route_destination'
      const locationName = type === 'origin' ? route.route_origin?.location_name : route.route_destination?.location_name
      saveEventsMutation.mutate({
        route_id: route.route_id,
        route_name: route.route_name,
        [fieldKey]: { location_name: locationName, events: toRealEvents(values.events) },
      })
    }
  }

  function handleFieldChange(id, field, value) {
    const safe = typeof value === 'string' ? sanitize(value) : value
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: safe } }))
  }

  const saveMutation = useMutation({
    meta:       { label: 'Guardando ruta...' },
    mutationFn: (values) => rutasService.createOrUpdate(values),
    onSuccess: () => {
      toast.success('Ruta actualizada')
      qc.invalidateQueries({ queryKey: ['rutas-personalizadas'] })
    },
    onError: err => toast.error('Error al guardar la ruta', err),
  })

  const createMutation = useMutation({
    meta:       { label: 'Registrando ruta...' },
    mutationFn: (values) => rutasService.createOrUpdate(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rutas-personalizadas'] }),
    onError: err => toast.error('Error al registrar la ruta', err),
  })

  function submitRoute(values, mode) {
    const processLocation = (loc = {}) => ({
      location_name: sanitize(loc.location_name ?? ''),
      events: processRouteEvents(loc.events, sanitize),
    })
    const payload = {
      route_name:                sanitize(values.route_name ?? ''),
      route_category:            values.route_category ?? '',
      route_origin:              processLocation(values.route_origin),
      route_destination:         processLocation(values.route_destination),
      route_intermediate_points: (values.route_intermediate_points ?? []).map(processLocation),
    }
    if (editingRoute && mode === 'update') payload.route_id = editingRoute.route_id

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(mode === 'update' && editingRoute ? 'Ruta actualizada' : 'Ruta registrada')
        setModalOpen(false)
        setEditingRoute(null)
        form.resetFields()
      },
    })
  }

  async function handleSaveAsNew() {
    try {
      const values = await form.validateFields()
      submitRoute(values, 'new')
    } catch {
      // antd ya muestra los errores de validación
    }
  }

  const saveEventsMutation = useMutation({
    meta:       { label: 'Guardando eventos...' },
    mutationFn: (values) => rutasService.createOrUpdate(values),
    onSuccess: () => {
      toast.success('Eventos actualizados')
      qc.invalidateQueries({ queryKey: ['rutas-personalizadas'] })
      setEventsModal(null)
      eventsForm.resetFields()
    },
    onError: err => toast.error('Error al actualizar eventos', err),
  })

  const deleteMutation = useMutation({
    meta:       { label: 'Eliminando ruta...' },
    mutationFn: (payload) => rutasService.remove(payload),
    onSuccess: () => {
      toast.success('Ruta eliminada')
      qc.invalidateQueries({ queryKey: ['rutas-personalizadas'] })
    },
    onError: err => toast.error('Error al eliminar la ruta', err),
  })

  const filtered = (Array.isArray(data) ? data : []).filter((r) => {
    const matchesName = (r.route_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'todas' || r.route_category === categoryFilter
    return matchesName && matchesCategory
  })

  const tableData = filtered.map((r) => ({
    ...r,
    ...(edits[r.route_id] ?? {}),
  }))

  const columns = [
    {
      title: 'Nombre',
      key: 'route_name',
      width: 240,
      render: (_, record) => {
        const id = record.route_id
        return (
          <Input
            allowClear
            value={record.route_name ?? ''}
            onChange={(e) => handleFieldChange(id, 'route_name', e.target.value)}
          />
        )
      },
    },
    {
      title: 'Categoría',
      key: 'route_category',
      width: 175,
      onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      render: (_, record) => {
        const id = record.route_id
        return (
          <Radio.Group
            buttonStyle="solid"
            value={['local', 'foránea'].includes(record.route_category) ? record.route_category : undefined}
            onChange={(e) => handleFieldChange(id, 'route_category', e.target.value)}
          >
            <Radio.Button value="local">Local</Radio.Button>
            <Radio.Button value="foránea">Foránea</Radio.Button>
          </Radio.Group>
        )
      },
    },
    {
      title: 'Origen',
      key: 'route_origin',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text ellipsis style={{ maxWidth: 130 }}>{record.route_origin?.location_name || '—'}</Text>
          <Button size="small" type="link" style={{ padding: 0, fontSize: 11 }} onClick={() => openEventsModal(record, 'origin')}>
            Ver eventos ({(record.route_origin?.events ?? []).filter(ev => !isCancelado(ev.event_name)).length})
          </Button>
        </Space>
      ),
    },
    {
      title: 'Destino',
      key: 'route_destination',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text ellipsis style={{ maxWidth: 130 }}>{record.route_destination?.location_name || '—'}</Text>
          <Button size="small" type="link" style={{ padding: 0, fontSize: 11 }} onClick={() => openEventsModal(record, 'destination')}>
            Ver eventos ({(record.route_destination?.events ?? []).filter(ev => !isCancelado(ev.event_name)).length})
          </Button>
        </Space>
      ),
    },
    {
      title: 'Puntos Intermedios',
      key: 'route_intermediate_points',
      width: 200,
      render: (_, record) => {
        const points = record.route_intermediate_points ?? []
        if (points.length === 0) return <span style={{ color: '#aaa' }}>—</span>
        return (
          <Space direction="vertical" size={3}>
            {points.map((point, i) => (
              <div key={i}>
                <Text ellipsis style={{ maxWidth: 120, fontSize: 12, display: 'block' }}>
                  {point.location_name || '—'}
                </Text>
                <Button size="small" type="link" style={{ padding: 0, fontSize: 11, height: 'auto' }}
                  onClick={() => openEventsModal(record, 'stop', i)}
                >
                  Ver eventos ({(point.events ?? []).filter(ev => !isCancelado(ev.event_name)).length})
                </Button>
              </div>
            ))}
          </Space>
        )
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 260,
      render: (_, record) => {
        const id = record.route_id
        return (
          <Space wrap>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            >
              Editar
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate({
                route_id:       id,
                route_name:     record.route_name,
                route_category: record.route_category,
              })}
            >
              Guardar
            </Button>
            <Popconfirm
              title="¿Eliminar esta ruta?"
              description="Esta acción no se puede deshacer."
              okText="Sí, eliminar"
              cancelText="Cancelar"
              onConfirm={() => deleteMutation.mutate({ route_id: id })}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                Eliminar
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="maylob-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Administración de Rutas Personalizadas</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRoute(null); form.resetFields(); setModalOpen(true) }}>
          Nueva Ruta
        </Button>
      </div>

      <Space className="maylob-search-filters" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Buscar por nombre de ruta..."
          allowClear
          style={{ width: 300 }}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={categoryFilter}
          onChange={setCategoryFilter}
          style={{ width: 140 }}
          options={[
            { label: 'Todas', value: 'todas' },
            { label: 'Locales', value: 'local' },
            { label: 'Foráneas', value: 'foránea' },
          ]}
        />
      </Space>

      <div className="maylob-table-wrap" style={{ marginTop: 'auto' }}>
        {isLoading ? (
          <Table loading columns={columns} dataSource={[]} rowKey="route_id" />
        ) : !Array.isArray(data) || data.length === 0 ? (
          <Empty description="No hay rutas registradas aún" style={{ marginTop: 64 }} />
        ) : filtered.length === 0 ? (
          <Empty description="Sin resultados con los filtros actuales" style={{ marginTop: 48 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={tableData}
            rowKey={(r) => r.route_id ?? r.route_name}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1115 }}
          />
        )}
      </div>

      <Modal
        title={
          eventsModal?.type === 'origin'       ? `Eventos de Origen — ${eventsModal.route.route_name}`
          : eventsModal?.type === 'destination' ? `Eventos de Destino — ${eventsModal.route.route_name}`
          :                                        `Eventos — ${eventsModal?.locationName} · ${eventsModal?.route?.route_name}`
        }
        open={!!eventsModal}
        onCancel={() => { setEventsModal(null); eventsForm.resetFields() }}
        onOk={handleSaveEvents}
        confirmLoading={saveEventsMutation.isPending}
        okText="Guardar cambios"
        cancelText="Cancelar"
        width={700}
        destroyOnHide
      >
        <Form form={eventsForm} layout="vertical">
          <EventsFieldList name={['events']} addLabel="Agregar evento" />
        </Form>
      </Modal>

      <Modal
        className="rutas-registro-modal"
        title={editingRoute ? `Editar Ruta — ${editingRoute.route_name}` : 'Nueva Ruta Personalizada'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingRoute(null); form.resetFields() }}
        footer={[
          <Button key="cancel" onClick={() => { setModalOpen(false); setEditingRoute(null); form.resetFields() }}>
            Cancelar
          </Button>,
          editingRoute && (
            <Button key="saveNew" onClick={handleSaveAsNew} loading={createMutation.isPending}>
              Guardar nueva
            </Button>
          ),
          <Button key="ok" type="primary" onClick={() => form.submit()} loading={createMutation.isPending}>
            {editingRoute ? 'Actualizar' : 'Registrar'}
          </Button>,
        ]}
        destroyOnHide
        width={760}
        styles={{
          mask:    { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.35)' },
          content: { background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', boxShadow: '0 8px 40px rgba(0,0,0,0.28)', borderRadius: 16 },
          header:  { background: 'transparent' },
          body:    { background: 'transparent', padding: '16px 24px' },
          footer:  { background: 'transparent' },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            route_origin:      { location_name: '', events: [{ event_name: 'cancelado' }] },
            route_destination: { location_name: '', events: [{ event_name: 'cancelado' }] },
            route_intermediate_points: [],
          }}
          onFinish={(values) => submitRoute(values, 'update')}
        >
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

          <Divider orientation="left">Punto de Origen <Tag style={{ marginLeft: 8 }}>Paso 1</Tag></Divider>
          <Form.Item
            name={['route_origin', 'location_name']}
            label="Nombre"
            rules={[{ required: true, message: 'El nombre del origen es obligatorio' }]}
          >
            <Input placeholder="Ciudad o punto de origen" />
          </Form.Item>
          <EventsFieldList name={['route_origin', 'events']} addLabel="Agregar evento de origen" />

          <Divider orientation="left">Punto de Destino <Tag style={{ marginLeft: 8 }}>Paso {destinationStep}</Tag></Divider>
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
            {(pointFields, { add: addPoint, remove: removePoint, move: movePoint }) => {
              function handleDragEnd(event) {
                const { active, over } = event
                if (!over || active.id === over.id) return
                const oldIndex = pointFields.findIndex((f) => f.key === active.id)
                const newIndex = pointFields.findIndex((f) => f.key === over.id)
                if (oldIndex === -1 || newIndex === -1) return
                movePoint(oldIndex, newIndex)
              }
              return (
                <>
                  <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={pointFields.map((f) => f.key)} strategy={verticalListSortingStrategy}>
                      {pointFields.map(({ key: pointKey, name: pointName }) => (
                        <SortableIntermediatePoint key={pointKey} id={pointKey}>
                          {({ dragHandle }) => (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center' }}>
                                  {dragHandle}
                                  Punto intermedio {pointName + 1} · Paso {pointName + 2}
                                </span>
                                <Button danger size="small" icon={<MinusCircleOutlined />} onClick={() => removePoint(pointName)}>
                                  Eliminar punto
                                </Button>
                              </div>
                              <Form.Item
                                name={[pointName, 'location_name']}
                                label="Nombre del punto"
                                rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                                style={{ marginBottom: 8 }}
                              >
                                <Input placeholder="Ej. PUEBLA" />
                              </Form.Item>
                              <EventsFieldList
                                name={[pointName, 'events']}
                                addLabel="Agregar evento"
                                absolutePath={['route_intermediate_points', pointName, 'events']}
                              />
                            </>
                          )}
                        </SortableIntermediatePoint>
                      ))}
                    </SortableContext>
                  </DndContext>
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
              )
            }}
          </Form.List>
        </Form>
      </Modal>
    </div>
  )
}
