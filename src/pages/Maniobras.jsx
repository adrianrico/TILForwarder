import { useState, useMemo } from 'react'
import { Typography, Button, Form, Input, InputNumber, Select, DatePicker, Card, Row, Col, Modal, Radio, Divider, Space } from 'antd'
import { SaveOutlined, EyeOutlined, EyeInvisibleOutlined, PlusOutlined, MinusCircleOutlined, EditOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesService } from '../services/clientesService'
import { transportistasService } from '../services/transportistasService'
import { maniobrasService } from '../services/maniobrasService'
import { rutasService } from '../services/rutasService'

const { Title, Text } = Typography

const filterByLabel = (input, option) =>
  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

const glassGroupStyle = {
  background:            'rgba(255,255,255,0.06)',
  borderRadius:          14,
  padding:               '20px 20px 4px',
  marginBottom:          16,
  backdropFilter:        'blur(8px)',
  WebkitBackdropFilter:  'blur(8px)',
  boxShadow:
    '10px 10px 24px rgba(0, 4, 12, 0.55), -8px -8px 22px rgba(70, 150, 220, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
}

function sanitize(value) {
  if (typeof value !== 'string') return value
  return value.replace(/[$`<>{};'"]/g, '').trim()
}

export default function Maniobras() {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const [routeForm] = Form.useForm()
  const [selectedTransporterId, setSelectedTransporterId] = useState(null)
  const [selectedRouteId, setSelectedRouteId] = useState(null)
  const [routeModalOpen, setRouteModalOpen] = useState(false)
  const [routeModalMode, setRouteModalMode] = useState('create')

  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesService.readAll().then(r => r.data?.clients_data ?? []),
  })

  const { data: transportistas = [], isLoading: loadingTransportistas } = useQuery({
    queryKey: ['transportistas'],
    queryFn: () => transportistasService.readAll().then(r => r.data?.transporters_data ?? []),
  })

  const { data: rutas = [], isLoading: loadingRutas } = useQuery({
    queryKey: ['rutas-personalizadas'],
    queryFn: () => rutasService.readAll().then(r => r.data?.routes_data ?? []),
  })

  const selectedTransporter = useMemo(
    () => transportistas.find(t => t.transporter_id === selectedTransporterId) ?? null,
    [transportistas, selectedTransporterId]
  )

  const selectedRouteData = useMemo(
    () => rutas.find(r => r.route_id === selectedRouteId) ?? null,
    [rutas, selectedRouteId]
  )

  const ecoOptions = (selectedTransporter?.transporter_equipment ?? [])
    .filter(e => e.eco_available !== false)
    .map(e => ({ label: e.eco_name, value: e.eco_id }))

  const operatorOptions = (selectedTransporter?.transporter_operators ?? [])
    .filter(o => o.operator_available !== false)
    .map(o => ({ label: o.operator_name, value: o.operator_id }))

  const rutaOptions = [
    { label: 'Otra', value: 'otra' },
    ...rutas.map(r => ({
      label: r.route_category ? `${r.route_name} (${r.route_category})` : r.route_name,
      value: r.route_id,
    })),
  ]

  const clientOptions = clientes.map(c => ({
    label: c.client_name,
    value: c.client_id,
  }))

  const transporterOptions = transportistas.map(t => ({
    label: t.transporter_name,
    value: t.transporter_id,
  }))

  const createMutation = useMutation({
    mutationFn: data => maniobrasService.save(data),
    onSuccess: () => {
      Modal.success({ content: 'Maniobra registrada exitosamente' })
      form.resetFields()
      setSelectedTransporterId(null)
      setSelectedRouteId(null)
    },
    onError: () => Modal.error({ content: 'Error al registrar la maniobra' }),
  })

  function handleRouteSelect(routeId) {
    if (!routeId) {
      setSelectedRouteId(null)
      return
    }
    if (routeId === 'otra') {
      routeForm.resetFields()
      setRouteModalMode('create')
      setRouteModalOpen(true)
      return
    }
    setSelectedRouteId(routeId)
    const route = rutas.find(r => r.route_id === routeId)
    if (route?.route_category) {
      form.setFieldsValue({ man_type: route.route_category })
    }
  }

  function openEditRouteModal() {
    if (!selectedRouteData) return
    routeForm.setFieldsValue({
      route_name:               selectedRouteData.route_name       ?? '',
      route_category:           selectedRouteData.route_category   ?? undefined,
      route_origin:             selectedRouteData.route_origin      ?? '',
      route_destination:        selectedRouteData.route_destination ?? '',
      route_origin_events:      selectedRouteData.route_origin_events?.length
        ? selectedRouteData.route_origin_events
        : [{ event_name: 'Cancelado', event_description: '' }],
      route_destination_events: selectedRouteData.route_destination_events?.length
        ? selectedRouteData.route_destination_events
        : [{ event_name: 'Cancelado', event_description: '' }],
      route_intermediate_stops: selectedRouteData.route_intermediate_stops ?? [],
    })
    setRouteModalMode('edit')
    setRouteModalOpen(true)
  }

  const createRouteMutation = useMutation({
    meta:       { label: 'Guardando ruta...' },
    mutationFn: values => rutasService.createOrUpdate(values),
    onError:    () => Modal.error({ content: 'Error al guardar la ruta' }),
  })

  async function handleCreateRoute() {
    let values
    try {
      values = await routeForm.validateFields()
    } catch {
      return
    }

    const processEvents = (events = []) =>
      events.map((ev, i) => ({
        event_id:          `ev_${Date.now()}_${i}`,
        event_name:        sanitize(ev.event_name        ?? ''),
        event_description: sanitize(ev.event_description ?? ''),
      }))
    const processStops = (stops = []) =>
      stops.map(stop => ({
        stop_name:   sanitize(stop.stop_name ?? ''),
        stop_events: processEvents(stop.stop_events ?? []),
      }))

    const payload = {
      route_name:               sanitize(values.route_name        ?? ''),
      route_category:           values.route_category             ?? '',
      route_origin:             sanitize(values.route_origin      ?? ''),
      route_destination:        sanitize(values.route_destination ?? ''),
      route_origin_events:      processEvents(values.route_origin_events),
      route_destination_events: processEvents(values.route_destination_events),
      route_intermediate_stops: processStops(values.route_intermediate_stops ?? []),
    }
    if (routeModalMode === 'edit' && selectedRouteId) {
      payload.route_id = selectedRouteId
    }

    createRouteMutation.mutate(payload, {
      onSuccess: async res => {
        const newRouteId = res?.data?.route_id
        await qc.refetchQueries({ queryKey: ['rutas-personalizadas'] })
        setSelectedRouteId(routeModalMode === 'edit' ? selectedRouteId : (newRouteId ?? null))
        if (payload.route_category) form.setFieldsValue({ man_type: payload.route_category })
        setRouteModalOpen(false)
        routeForm.resetFields()
      },
    })
  }

  function handleTransporterChange(value) {
    setSelectedTransporterId(value)
    form.setFieldsValue({ man_eco: undefined, man_operator: undefined })
  }

  function onFinish(values) {
    const selectedEco = (selectedTransporter?.transporter_equipment ?? [])
      .find(e => e.eco_id === values.man_eco)
    const selectedOperator = (selectedTransporter?.transporter_operators ?? [])
      .find(o => o.operator_id === values.man_operator)

    createMutation.mutate({
      man_client:          values.man_client,
      man_type:            values.man_type,
      man_modality:        values.man_modality,
      man_dispatch_date:   values.man_dispatch_date?.format('YYYY-MM-DD') ?? '',
      man_agent:           values.man_agent           ?? '',
      man_executive:       values.man_executive        ?? '',
      man_load_location:   selectedRouteData?.route_origin      ?? '',
      man_unload_location: selectedRouteData?.route_destination ?? '',
      man_transporter:     values.man_transporter,
      man_eco:             selectedEco?.eco_name             ?? '',
      man_eco_id:          selectedEco?.eco_id               ?? '',
      man_operator:        selectedOperator?.operator_name   ?? '',
      man_operator_id:     selectedOperator?.operator_id     ?? '',
      man_gps_link:        values.man_gps_link ?? '',
      man_route_id:        selectedRouteId ?? '',
      man_moni_enable:          values.man_moni_enable ?? true,
      man_containers:           values.man_containers  ?? [],
      man_intermediate_stops:   selectedRouteData?.route_intermediate_stops ?? [],
    })
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>Captura de Maniobra</Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ man_moni_enable: true }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="man_client"
                label="Cliente"
                rules={[{ required: true, message: 'El cliente es obligatorio' }]}
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
                rules={[{ required: true, message: 'La fecha de inicio es obligatoria' }]}
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
                rules={[{ required: true, message: 'El tipo es obligatorio' }]}
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
                rules={[{ required: true, message: 'La modalidad es obligatoria' }]}
              >
                <Radio.Group
                  buttonStyle="solid"
                  onChange={e => {
                    const max = e.target.value === 'FULL' ? 4 : 2
                    const current = form.getFieldValue('man_containers') ?? []
                    if (current.length > max) {
                      form.setFieldsValue({ man_containers: current.slice(0, max) })
                    }
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

          <div style={glassGroupStyle}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Ruta predefinida"
                  required
                  help={!selectedRouteId ? 'Selecciona una ruta guardada o "Otra" para capturar una nueva' : undefined}
                >
                  <Space.Compact block>
                    <Select
                      showSearch
                      placeholder="Seleccionar ruta"
                      loading={loadingRutas}
                      filterOption={filterByLabel}
                      options={rutaOptions}
                      value={selectedRouteId}
                      onChange={handleRouteSelect}
                      style={{ flex: 1 }}
                    />
                    {selectedRouteId && (
                      <Button icon={<EditOutlined />} onClick={openEditRouteModal}>
                        Editar ruta
                      </Button>
                    )}
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Sitio de Carga">
                  <Text>{selectedRouteData?.route_origin || '—'}</Text>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Sitio de Descarga">
                  <Text>{selectedRouteData?.route_destination || '—'}</Text>
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left" style={{ marginTop: 8 }}>Puntos Intermedios</Divider>

            {selectedRouteData?.route_intermediate_stops?.length ? (
              <Space direction="vertical" size={4} style={{ display: 'flex', marginBottom: 16 }}>
                {selectedRouteData.route_intermediate_stops.map((stop, i) => (
                  <Text key={i}>{i + 1}. {stop.stop_name}</Text>
                ))}
              </Space>
            ) : (
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                Sin puntos intermedios
              </Text>
            )}
          </div>

          <div style={glassGroupStyle}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="man_transporter"
                  label="Transportista"
                  rules={[{ required: true, message: 'El transportista es obligatorio' }]}
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
          </div>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="man_gps_link" label="GPS LINK">
                <Input allowClear placeholder="lat,lng o URL de tracking" />
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

          <Form.Item shouldUpdate style={{ marginTop: 8 }}>
            {({ getFieldValue }) => {
              const ready =
                getFieldValue('man_client') &&
                getFieldValue('man_type') &&
                getFieldValue('man_modality') &&
                getFieldValue('man_dispatch_date') &&
                getFieldValue('man_transporter') &&
                selectedRouteId
              return (
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={createMutation.isPending}
                  disabled={!ready}
                >
                  Registrar Maniobra
                </Button>
              )
            }}
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title={routeModalMode === 'edit' ? 'Editar Ruta Asignada' : 'Nueva Ruta Personalizada'}
        open={routeModalOpen}
        onCancel={() => { setRouteModalOpen(false); routeForm.resetFields() }}
        onOk={handleCreateRoute}
        confirmLoading={createRouteMutation.isPending}
        okText={routeModalMode === 'edit' ? 'Guardar cambios' : 'Registrar y asignar'}
        cancelText="Cancelar"
        destroyOnHide
        width={760}
      >
        <Form
          form={routeForm}
          layout="vertical"
          initialValues={{
            route_origin_events:      [{ event_name: 'Cancelado', event_description: '' }],
            route_destination_events: [{ event_name: 'Cancelado', event_description: '' }],
            route_intermediate_stops: [],
          }}
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

          <Divider orientation="left">Punto de Origen</Divider>
          <Form.Item
            name="route_origin"
            label="Nombre"
            rules={[{ required: true, message: 'El nombre del origen es obligatorio' }]}
          >
            <Input placeholder="Ciudad o punto de origen" />
          </Form.Item>
          <Form.List name="route_origin_events">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }, index) => (
                  <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 4 }}>
                    <Form.Item {...rest} name={[name, 'event_name']} style={{ marginBottom: 0, flex: 1 }}>
                      <Input placeholder="Nombre del evento" disabled={index === 0} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'event_description']} style={{ marginBottom: 0, flex: 2 }}>
                      <Input placeholder="Descripción / notas" />
                    </Form.Item>
                    {index !== 0 && (
                      <MinusCircleOutlined style={{ cursor: 'pointer' }} onClick={() => remove(name)} />
                    )}
                  </Space>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ event_name: '', event_description: '' })}
                  icon={<PlusOutlined />}
                  block
                  style={{ marginBottom: 8 }}
                >
                  Agregar evento de origen
                </Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left">Punto de Destino</Divider>
          <Form.Item
            name="route_destination"
            label="Nombre"
            rules={[{ required: true, message: 'El nombre del destino es obligatorio' }]}
          >
            <Input placeholder="Ciudad o punto de destino" />
          </Form.Item>
          <Form.List name="route_destination_events">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }, index) => (
                  <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 4 }}>
                    <Form.Item {...rest} name={[name, 'event_name']} style={{ marginBottom: 0, flex: 1 }}>
                      <Input placeholder="Nombre del evento" disabled={index === 0} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'event_description']} style={{ marginBottom: 0, flex: 2 }}>
                      <Input placeholder="Descripción / notas" />
                    </Form.Item>
                    {index !== 0 && (
                      <MinusCircleOutlined style={{ cursor: 'pointer' }} onClick={() => remove(name)} />
                    )}
                  </Space>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ event_name: '', event_description: '' })}
                  icon={<PlusOutlined />}
                  block
                  style={{ marginBottom: 8 }}
                >
                  Agregar evento de destino
                </Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left">Puntos Intermedios</Divider>
          <Form.List name="route_intermediate_stops">
            {(stopFields, { add: addStop, remove: removeStop }) => (
              <>
                {stopFields.map(({ key: stopKey, name: stopName }) => (
                  <Card
                    key={stopKey}
                    size="small"
                    title={`Punto intermedio ${stopName + 1}`}
                    extra={
                      <Button danger size="small" icon={<MinusCircleOutlined />} onClick={() => removeStop(stopName)}>
                        Eliminar
                      </Button>
                    }
                    style={{ marginBottom: 12, background: '#fafafa' }}
                  >
                    <Form.Item
                      name={[stopName, 'stop_name']}
                      label="Nombre del punto"
                      rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                      style={{ marginBottom: 8 }}
                    >
                      <Input placeholder="Ej. ADUANA, PATIO, TERMINAL" />
                    </Form.Item>
                    <Form.List name={[stopName, 'stop_events']}>
                      {(evFields, { add: addEv, remove: removeEv }) => (
                        <>
                          {evFields.map(({ key: evKey, name: evName, ...rest }, evIndex) => (
                            <Space key={evKey} align="baseline" style={{ display: 'flex', marginBottom: 4 }}>
                              <Form.Item {...rest} name={[evName, 'event_name']} style={{ marginBottom: 0, flex: 1 }}>
                                <Input placeholder="Nombre del evento" disabled={evIndex === 0} />
                              </Form.Item>
                              <Form.Item {...rest} name={[evName, 'event_description']} style={{ marginBottom: 0, flex: 2 }}>
                                <Input placeholder="Descripción / notas" />
                              </Form.Item>
                              {evIndex !== 0 && (
                                <MinusCircleOutlined
                                  style={{ cursor: 'pointer', color: '#ff4d4f' }}
                                  onClick={() => removeEv(evName)}
                                />
                              )}
                            </Space>
                          ))}
                          <Button
                            type="dashed"
                            size="small"
                            onClick={() => addEv({ event_name: '', event_description: '' })}
                            icon={<PlusOutlined />}
                            block
                            style={{ marginBottom: 4 }}
                          >
                            Agregar evento
                          </Button>
                        </>
                      )}
                    </Form.List>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => addStop({ stop_name: '', stop_events: [{ event_name: 'Cancelado', event_description: '' }] })}
                  icon={<PlusOutlined />}
                  block
                  style={{ marginBottom: 8 }}
                >
                  Agregar punto intermedio
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  )
}
