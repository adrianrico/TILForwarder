import { useState, useMemo } from 'react'
import { Typography, Button, Form, Input, InputNumber, Select, DatePicker, Card, Row, Col, Modal, Radio, Divider, Space } from 'antd'
import { SaveOutlined, EyeOutlined, EyeInvisibleOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation } from '@tanstack/react-query'
import { clientesService } from '../services/clientesService'
import { transportistasService } from '../services/transportistasService'
import { maniobrasService } from '../services/maniobrasService'
import { rutasService } from '../services/rutasService'

const { Title } = Typography

const filterByLabel = (input, option) =>
  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

export default function Maniobras() {
  const [form] = Form.useForm()
  const [selectedTransporterId, setSelectedTransporterId] = useState(null)
  const [selectedRouteId, setSelectedRouteId] = useState('otra')

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

  const ecoOptions = (selectedTransporter?.transporter_equipment ?? [])
    .filter(e => e.eco_available !== false)
    .map(e => ({ label: e.eco_name, value: e.eco_name }))

  const operatorOptions = (selectedTransporter?.transporter_operators ?? [])
    .filter(o => o.operator_available !== false)
    .map(o => ({ label: o.operator_name, value: o.operator_name }))

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
      setSelectedRouteId('otra')
    },
    onError: () => Modal.error({ content: 'Error al registrar la maniobra' }),
  })

  function handleRouteSelect(routeId) {
    setSelectedRouteId(routeId ?? 'otra')
    if (!routeId || routeId === 'otra') {
      form.setFieldsValue({ man_load_location: '', man_unload_location: '', man_type: undefined, man_intermediate_stops: [] })
      return
    }
    const route = rutas.find(r => r.route_id === routeId)
    if (!route) return
    form.setFieldsValue({
      man_load_location:        route.route_origin      ?? '',
      man_unload_location:      route.route_destination ?? '',
      man_type:                 route.route_category    ?? undefined,
      man_intermediate_stops:   (route.route_intermediate_stops ?? []).map(s => ({
        stop_name:   s.stop_name   ?? '',
        stop_events: (s.stop_events ?? []).map(e => ({
          event_name:        e.event_name        ?? '',
          event_description: e.event_description ?? '',
        })),
      })),
    })
  }

  function handleTransporterChange(value) {
    setSelectedTransporterId(value)
    form.setFieldsValue({ man_eco: undefined, man_operator: undefined })
  }

  function onFinish(values) {
    createMutation.mutate({
      man_client:          values.man_client,
      man_type:            values.man_type,
      man_modality:        values.man_modality,
      man_dispatch_date:   values.man_dispatch_date?.format('YYYY-MM-DD') ?? '',
      man_agent:           values.man_agent           ?? '',
      man_executive:       values.man_executive        ?? '',
      man_load_location:   values.man_load_location   ?? '',
      man_unload_location: values.man_unload_location ?? '',
      man_transporter:     values.man_transporter,
      man_eco:             values.man_eco              ?? '',
      man_operator:        values.man_operator         ?? '',
      man_moni_enable:          values.man_moni_enable         ?? true,
      man_containers:           values.man_containers          ?? [],
      man_intermediate_stops:   values.man_intermediate_stops  ?? [],
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

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Ruta predefinida">
                <Select
                  showSearch
                  allowClear
                  placeholder="Seleccionar ruta para precargar origen y destino"
                  loading={loadingRutas}
                  filterOption={filterByLabel}
                  options={rutaOptions}
                  value={selectedRouteId}
                  onChange={handleRouteSelect}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="man_load_location" label="Sitio de Carga">
                <Input allowClear placeholder="Nombre del sitio de carga" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="man_unload_location" label="Sitio de Descarga">
                <Input allowClear placeholder="Nombre del sitio de descarga" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ marginTop: 8 }}>Puntos Intermedios</Divider>

          <Form.List name="man_intermediate_stops">
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
                      <Input allowClear placeholder="Ej. ADUANA, PATIO, TERMINAL" />
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
                getFieldValue('man_transporter')
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
    </div>
  )
}
