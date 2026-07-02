import { useState, useEffect } from 'react'
import {
  Typography, Button, Table, Input, Space, Popconfirm, Empty, Modal, Form, Divider,
  Switch, Row, Col,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined, TruckOutlined, TeamOutlined, SettingOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transportistasService } from '../services/transportistasService'

const { Title, Text } = Typography

// ── Campos compartidos del formulario de ECO ─────────────────────────────────
function EcoFormFields() {
  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="eco_name" label="Nombre" rules={[{ required: true, message: 'El nombre es obligatorio' }]}>
            <Input allowClear placeholder="Ej. KENWORTH T680" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="eco_number" label="No. ECO">
            <Input allowClear placeholder="Número de ECO" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="eco_plates" label="Placas">
            <Input allowClear placeholder="Placas del vehículo" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="eco_year" label="Año">
            <Input allowClear placeholder="Ej. 2022" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="eco_color" label="Color">
            <Input allowClear placeholder="Color del vehículo" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="eco_serial_number" label="No. de Serie">
            <Input allowClear placeholder="Número de serie" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="eco_engine_serial" label="No. de Serie de Motor">
            <Input allowClear placeholder="Número de serie del motor" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="eco_insurance_company" label="Compañía de Seguros">
            <Input allowClear placeholder="Nombre de la aseguradora" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="eco_insurance_policy" label="No. de Póliza">
        <Input allowClear placeholder="Número de póliza" />
      </Form.Item>
      <Form.Item name="eco_available" label="Disponible" valuePropName="checked">
        <Switch checkedChildren="Disponible" unCheckedChildren="No disponible" />
      </Form.Item>
    </>
  )
}

// ── Sub-tabla de Camiones (ECOs) ──────────────────────────────────────────────
function CamionesSection({ transporter }) {
  const qc = useQueryClient()
  const trId = transporter.transporter_id
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const ecos = transporter.transporter_equipment ?? []

  useEffect(() => {
    if (!editModal) return
    editForm.setFieldsValue({ ...editModal })
  }, [editModal, editForm])

  const saveEcoMutation = useMutation({
    meta:       { label: 'Guardando camión...' },
    mutationFn: (data) => transportistasService.saveEco(data),
    onSuccess: () => {
      Modal.success({ content: 'Camión actualizado' })
      qc.invalidateQueries({ queryKey: ['transportistas'] })
      setEditModal(null)
    },
    onError: () => Modal.error({ content: 'Error al guardar el camión' }),
  })

  const newEcoMutation = useMutation({
    meta:       { label: 'Registrando camión...' },
    mutationFn: (data) => transportistasService.saveEco(data),
    onSuccess: () => {
      Modal.success({ content: 'Camión registrado' })
      qc.invalidateQueries({ queryKey: ['transportistas'] })
      setAddModal(false)
      addForm.resetFields()
    },
    onError: () => Modal.error({ content: 'Error al registrar el camión' }),
  })

  const deleteEcoMutation = useMutation({
    meta:       { label: 'Eliminando camión...' },
    mutationFn: (data) => transportistasService.deleteEco(data),
    onSuccess: () => {
      Modal.success({ content: 'Camión eliminado' })
      qc.invalidateQueries({ queryKey: ['transportistas'] })
    },
    onError: () => Modal.error({ content: 'Error al eliminar el camión' }),
  })

  const columns = [
    { title: 'Nombre',   dataIndex: 'eco_name',   key: 'eco_name' },
    { title: 'No. ECO',  dataIndex: 'eco_number',  key: 'eco_number' },
    { title: 'Placas',   dataIndex: 'eco_plates',  key: 'eco_plates' },
    { title: 'Año',      dataIndex: 'eco_year',    key: 'eco_year', width: 70 },
    {
      title: 'Disponible',
      key: 'eco_available',
      width: 110,
      render: (_, eco) => (
        <Switch
          size="small"
          checked={eco.eco_available ?? true}
          checkedChildren="Sí"
          unCheckedChildren="No"
          onChange={(val) => saveEcoMutation.mutate({ ...eco, eco_tr_id: trId, eco_available: val })}
        />
      ),
    },
    {
      title: () => (
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { addForm.resetFields(); setAddModal(true) }}>
          Agregar Camión
        </Button>
      ),
      key: 'actions',
      width: 180,
      render: (_, eco) => (
        <Space>
          <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => setEditModal(eco)}>
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar este camión?"
            description="Esta acción no se puede deshacer."
            okText="Sí, eliminar"
            cancelText="Cancelar"
            onConfirm={() => deleteEcoMutation.mutate({ eco_id: eco.eco_id, eco_tr_id: trId })}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Space style={{ marginBottom: 8 }}>
        <TruckOutlined />
        <Text strong>Camiones</Text>
      </Space>

      <Table
        columns={columns}
        dataSource={ecos}
        rowKey={(r) => r.eco_id ?? r.eco_name}
        size="small"
        pagination={false}
        style={{ marginBottom: 8 }}
        locale={{ emptyText: 'Sin camiones registrados' }}
      />

      <Modal
        title="Agregar Camión"
        open={addModal}
        onCancel={() => { setAddModal(false); addForm.resetFields() }}
        onOk={() => addForm.submit()}
        confirmLoading={newEcoMutation.isPending}
        okText="Registrar"
        cancelText="Cancelar"
        destroyOnHide
        width={680}
      >
        <Form
          form={addForm}
          layout="vertical"
          initialValues={{ eco_available: true }}
          onFinish={(values) => newEcoMutation.mutate({ ...values, eco_tr_id: trId })}
          style={{ marginTop: 16 }}
        >
          <EcoFormFields />
        </Form>
      </Modal>

      <Modal
        title="Editar Camión"
        open={!!editModal}
        onCancel={() => setEditModal(null)}
        onOk={() => editForm.submit()}
        confirmLoading={saveEcoMutation.isPending}
        okText="Guardar"
        cancelText="Cancelar"
        destroyOnHide
        width={680}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => saveEcoMutation.mutate({ ...values, eco_tr_id: trId, eco_id: editModal?.eco_id })}
          style={{ marginTop: 16 }}
        >
          <EcoFormFields />
        </Form>
      </Modal>
    </>
  )
}

// ── Campos compartidos del formulario de Operador ────────────────────────────
function OperatorFormFields() {
  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="operator_name" label="Nombre" rules={[{ required: true, message: 'El nombre es obligatorio' }]}>
            <Input allowClear placeholder="Nombre completo" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="operator_curp" label="CURP">
            <Input allowClear placeholder="CURP del operador" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="operator_rfc" label="RFC">
            <Input allowClear placeholder="Ej. PEGJ801231ABC" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="operator_nss" label="No. Seguro Social">
            <Input allowClear placeholder="Número de seguro social" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="operator_license" label="No. Licencia">
            <Input allowClear placeholder="Número de licencia" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="operator_address" label="Dirección">
            <Input allowClear placeholder="Dirección del operador" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="operator_available" label="Disponible" valuePropName="checked">
        <Switch checkedChildren="Disponible" unCheckedChildren="No disponible" />
      </Form.Item>
    </>
  )
}

// ── Sub-tabla de Operadores ───────────────────────────────────────────────────
function OperadoresSection({ transporter }) {
  const qc = useQueryClient()
  const trId = transporter.transporter_id
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const operators = transporter.transporter_operators ?? []

  useEffect(() => {
    if (!editModal) return
    editForm.setFieldsValue({ ...editModal })
  }, [editModal, editForm])

  const saveOpMutation = useMutation({
    meta:       { label: 'Guardando operador...' },
    mutationFn: (data) => transportistasService.saveOperator(data),
    onSuccess: () => {
      Modal.success({ content: 'Operador actualizado' })
      qc.invalidateQueries({ queryKey: ['transportistas'] })
      setEditModal(null)
    },
    onError: () => Modal.error({ content: 'Error al guardar el operador' }),
  })

  const newOpMutation = useMutation({
    meta:       { label: 'Registrando operador...' },
    mutationFn: (data) => transportistasService.saveOperator(data),
    onSuccess: () => {
      Modal.success({ content: 'Operador registrado' })
      qc.invalidateQueries({ queryKey: ['transportistas'] })
      setAddModal(false)
      addForm.resetFields()
    },
    onError: () => Modal.error({ content: 'Error al registrar el operador' }),
  })

  const deleteOpMutation = useMutation({
    meta:       { label: 'Eliminando operador...' },
    mutationFn: (data) => transportistasService.deleteOperator(data),
    onSuccess: () => {
      Modal.success({ content: 'Operador eliminado' })
      qc.invalidateQueries({ queryKey: ['transportistas'] })
    },
    onError: () => Modal.error({ content: 'Error al eliminar el operador' }),
  })

  const columns = [
    { title: 'Nombre',      dataIndex: 'operator_name',    key: 'operator_name' },
    { title: 'RFC',         dataIndex: 'operator_rfc',     key: 'operator_rfc' },
    { title: 'No. Licencia', dataIndex: 'operator_license', key: 'operator_license' },
    {
      title: 'Disponible',
      key: 'operator_available',
      width: 110,
      render: (_, op) => (
        <Switch
          size="small"
          checked={op.operator_available ?? true}
          checkedChildren="Sí"
          unCheckedChildren="No"
          onChange={(val) => saveOpMutation.mutate({ ...op, operator_tr_id: trId, operator_available: val })}
        />
      ),
    },
    {
      title: () => (
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { addForm.resetFields(); setAddModal(true) }}>
          Agregar Operador
        </Button>
      ),
      key: 'actions',
      width: 180,
      render: (_, op) => (
        <Space>
          <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => setEditModal(op)}>
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar este operador?"
            description="Esta acción no se puede deshacer."
            okText="Sí, eliminar"
            cancelText="Cancelar"
            onConfirm={() => deleteOpMutation.mutate({ operator_id: op.operator_id, operator_tr_id: trId })}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Space style={{ marginBottom: 8 }}>
        <TeamOutlined />
        <Text strong>Operadores</Text>
      </Space>

      <Table
        columns={columns}
        dataSource={operators}
        rowKey={(r) => r.operator_id ?? r.operator_name}
        size="small"
        pagination={false}
        locale={{ emptyText: 'Sin operadores registrados' }}
      />

      <Modal
        title="Agregar Operador"
        open={addModal}
        onCancel={() => { setAddModal(false); addForm.resetFields() }}
        onOk={() => addForm.submit()}
        confirmLoading={newOpMutation.isPending}
        okText="Registrar"
        cancelText="Cancelar"
        destroyOnHide
        width={680}
      >
        <Form
          form={addForm}
          layout="vertical"
          initialValues={{ operator_available: true }}
          onFinish={(values) => newOpMutation.mutate({ ...values, operator_tr_id: trId })}
          style={{ marginTop: 16 }}
        >
          <OperatorFormFields />
        </Form>
      </Modal>

      <Modal
        title="Editar Operador"
        open={!!editModal}
        onCancel={() => setEditModal(null)}
        onOk={() => editForm.submit()}
        confirmLoading={saveOpMutation.isPending}
        okText="Guardar"
        cancelText="Cancelar"
        destroyOnHide
        width={680}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => saveOpMutation.mutate({
            ...values,
            operator_tr_id: trId,
            operator_id: editModal?.operator_id,
          })}
          style={{ marginTop: 16 }}
        >
          <OperatorFormFields />
        </Form>
      </Modal>
    </>
  )
}

// ── Fila expandida ────────────────────────────────────────────────────────────
function ExpandedRow({ transporter, isCollapsing }) {
  return (
    <div className={isCollapsing ? 'eq-row-exit' : 'eq-row-enter'} style={{ padding: '8px 24px', overflow: 'auto' }}>
      <CamionesSection transporter={transporter} />
      <Divider style={{ margin: '16px 0' }} />
      <OperadoresSection transporter={transporter} />
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Transportistas() {
  const ANIM_MS = 280

  const qc = useQueryClient()
  const [search, setSearch]           = useState('')
  const [edits, setEdits]             = useState({})
  const [expandedKeys, setExpandedKeys]   = useState([])
  const [collapsingKeys, setCollapsingKeys] = useState([])
  const [modalOpen, setModalOpen]     = useState(false)
  const [form] = Form.useForm()

  function toggleExpand(key) {
    if (collapsingKeys.includes(key)) {
      setCollapsingKeys((prev) => prev.filter((k) => k !== key))
      return
    }
    if (expandedKeys.includes(key)) {
      setCollapsingKeys((prev) => [...prev, key])
      setTimeout(() => {
        setExpandedKeys((prev) => prev.filter((k) => k !== key))
        setCollapsingKeys((prev) => prev.filter((k) => k !== key))
      }, ANIM_MS)
    } else {
      setExpandedKeys((prev) => [...prev, key])
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['transportistas'],
    queryFn:  () => transportistasService.readAll().then((r) => r.data?.transporters_data ?? []),
    meta:     { label: 'Cargando transportistas...' },
    retry: false,
  })

  useEffect(() => {
    if (!Array.isArray(data)) return
    const initial = {}
    data.forEach((t) => {
      initial[t.transporter_id] = {
        transporter_name: t.transporter_name ?? '',
        transporter_caat: t.transporter_caat ?? '',
      }
    })
    setEdits(initial)
  }, [data])

  function handleFieldChange(id, field, value) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const saveMutation = useMutation({
    meta:       { label: 'Guardando transportista...' },
    mutationFn: (values) => transportistasService.createOrUpdate(values),
    onSuccess: () => {
      Modal.success({ content: 'Transportista actualizado' })
      qc.invalidateQueries({ queryKey: ['transportistas'] })
    },
    onError: () => Modal.error({ content: 'Error al guardar el transportista' }),
  })

  const createMutation = useMutation({
    meta:       { label: 'Registrando transportista...' },
    mutationFn: (values) => transportistasService.createOrUpdate(values),
    onSuccess: () => {
      Modal.success({ content: 'Transportista registrado' })
      qc.invalidateQueries({ queryKey: ['transportistas'] })
      setModalOpen(false)
      form.resetFields()
    },
    onError: () => Modal.error({ content: 'Error al registrar el transportista' }),
  })

  const deleteMutation = useMutation({
    meta:       { label: 'Eliminando transportista...' },
    mutationFn: (payload) => transportistasService.remove(payload),
    onSuccess: () => {
      Modal.success({ content: 'Transportista eliminado' })
      qc.invalidateQueries({ queryKey: ['transportistas'] })
    },
    onError: () => Modal.error({ content: 'Error al eliminar el transportista' }),
  })

  const filtered = (Array.isArray(data) ? data : []).filter((t) =>
    (t.transporter_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      title: 'Nombre',
      key: 'transporter_name',
      render: (_, record) => {
        const id = record.transporter_id
        return (
          <Input
            allowClear
            value={edits[id]?.transporter_name ?? ''}
            onChange={(e) => handleFieldChange(id, 'transporter_name', e.target.value)}
          />
        )
      },
    },
    {
      title: 'CAAT',
      key: 'transporter_caat',
      render: (_, record) => {
        const id = record.transporter_id
        return (
          <Input
            allowClear
            value={edits[id]?.transporter_caat ?? ''}
            onChange={(e) => handleFieldChange(id, 'transporter_caat', e.target.value)}
          />
        )
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 280,
      render: (_, record) => {
        const id  = record.transporter_id
        const key = record.transporter_id ?? record.transporter_name
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate({
                transporter_id:   id,
                transporter_name: edits[id]?.transporter_name,
                transporter_caat: edits[id]?.transporter_caat,
              })}
            >
              Guardar
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => toggleExpand(key)}
            >
              Equipos
            </Button>
            <Popconfirm
              title="¿Eliminar este transportista?"
              description="Se eliminarán también sus camiones y operadores."
              okText="Sí, eliminar"
              cancelText="Cancelar"
              onConfirm={() => deleteMutation.mutate({
                transporter_id:   id,
                transporter_name: record.transporter_name,
              })}
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
      <style>{`
        @keyframes eq-enter {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes eq-exit {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-10px); }
        }
        .eq-row-enter {
          animation: eq-enter 0.28s ease both;
        }
        .eq-row-exit {
          animation: eq-exit 0.25s ease both;
          pointer-events: none;
        }
      `}</style>

      <div className="maylob-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Administración de Transportistas</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true) }}>
          Nuevo Transportista
        </Button>
      </div>

      <Input.Search
        placeholder="Buscar por nombre..."
        allowClear
        style={{ maxWidth: 320, marginBottom: 16 }}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={{ marginTop: 'auto' }}>
        {isLoading ? (
          <Table loading columns={columns} dataSource={[]} rowKey="transporter_id" />
        ) : !Array.isArray(data) || data.length === 0 ? (
          <Empty description="No hay transportistas registrados aún" style={{ marginTop: 64 }} />
        ) : filtered.length === 0 ? (
          <Empty description={`Sin resultados para "${search}"`} style={{ marginTop: 48 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey={(r) => r.transporter_id ?? r.transporter_name}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 700 }}
            expandable={{
              expandedRowRender: (record) => {
                const key = record.transporter_id ?? record.transporter_name
                return (
                  <ExpandedRow
                    transporter={record}
                    isCollapsing={collapsingKeys.includes(key)}
                  />
                )
              },
              expandedRowKeys: expandedKeys,
              onExpandedRowsChange: setExpandedKeys,
              showExpandColumn: false,
            }}
          />
        )}
      </div>

      <Modal
        title="Nuevo Transportista"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        okText="Registrar"
        cancelText="Cancelar"
        destroyOnHide
      >
        <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)} style={{ marginTop: 16 }}>
          <Form.Item
            name="transporter_name"
            label="Nombre del transportista"
            rules={[{ required: true, message: 'El nombre es obligatorio' }]}
          >
            <Input placeholder="Nombre de la empresa transportista" />
          </Form.Item>
          <Form.Item name="transporter_caat" label="No. CAAT">
            <Input placeholder="Número CAAT" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
