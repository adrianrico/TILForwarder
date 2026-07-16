import { useState, useEffect, useMemo, useCallback } from 'react'
import { Typography, Button, Table, Input, Space, Popconfirm, Empty, Modal, Form, Switch, Radio } from 'antd'
import { DeleteOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesService } from '../services/clientesService'
import { toast } from '../utils/toast'

const { Title } = Typography

const DIRTY_CELL = { style: { backgroundColor: '#ffd591', transition: 'background-color 0.2s' } }

function getClientId(r) {
  // client_id es el identificador que el backend usa para distinguir crear/actualizar
  // en POST /clients/client/ (y el que referencian Maniobras/Rutas). _id (Mongo) casi
  // siempre existe también, así que debe ir después o el update crea un cliente duplicado
  // en vez de modificar el existente.
  return r.client_id ?? r._id ?? r.id
}

function toEdits(client) {
  return {
    client_name:    client.client_name    ?? '',
    client_phone:   client.client_phone   ?? '',
    client_email:   client.client_email   ?? '',
    client_status:  client.client_status  ?? 'ACTIVO',
    client_man_key: client.client_man_key ?? '',
  }
}

function computeDirty(r, e) {
  if (!e) return false
  return (
    e.client_name    !== (r.client_name    ?? '')       ||
    e.client_phone   !== (r.client_phone   ?? '')       ||
    e.client_email   !== (r.client_email   ?? '')       ||
    e.client_status  !== (r.client_status  ?? 'ACTIVO') ||
    e.client_man_key !== (r.client_man_key ?? '')
  )
}

export default function Clientes() {
  const qc = useQueryClient()
  const [edits, setEdits]             = useState({})
  const [search, setSearch]           = useState('')
  const [activeFilter, setActiveFilter] = useState('ACTIVOS')
  const [modalOpen, setModalOpen]     = useState(false)
  const [form] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn:  () => clientesService.readAll().then(r => r.data?.clients_data ?? []),
    meta:     { label: 'Cargando clientes...' },
    retry: false,
  })

  // Solo inicializa edits[id] la primera vez que aparece ese cliente. Un refetch en
  // segundo plano (staleTime, refocus de ventana, invalidateQueries tras guardar otra
  // fila) no debe pisar ediciones aún no guardadas del usuario.
  useEffect(() => {
    if (!Array.isArray(data)) return
    setEdits(prev => {
      const next = {}
      data.forEach(c => {
        const id = getClientId(c)
        next[id] = prev[id] ?? toEdits(c)
      })
      return next
    })
  }, [data])

  const handleFieldChange = useCallback((id, field, value) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }, [])

  const createMutation = useMutation({
    meta:       { label: 'Registrando cliente...' },
    mutationFn: values => clientesService.create(values),
    onSuccess:  () => {
      toast.success('Cliente registrado')
      setModalOpen(false)
      form.resetFields()
      qc.refetchQueries({ queryKey: ['clientes'] })
    },
    onError: err => toast.error('Error al registrar el cliente', err),
  })

  const updateMutation = useMutation({
    meta:       { label: 'Guardando cambios...' },
    mutationFn: payload => clientesService.update(payload),
    onSuccess:  (_, variables) => {
      toast.success('Cliente actualizado')
      // Se descarta el edit local del renglón guardado para que, al llegar el
      // refetch, el useEffect lo reconstruya desde los datos frescos del backend
      // (en vez de seguir mostrando lo que el usuario tecleó).
      setEdits(prev => {
        const next = { ...prev }
        delete next[variables.client_id]
        return next
      })
      qc.invalidateQueries({ queryKey: ['clientes'] })
    },
    onError: err => toast.error('Error al actualizar el cliente', err),
  })

  const deleteMutation = useMutation({
    meta:       { label: 'Eliminando cliente...' },
    mutationFn: client_id => clientesService.remove(client_id),
    onSuccess:  () => {
      toast.success('Cliente eliminado')
      qc.invalidateQueries({ queryKey: ['clientes'] })
    },
    onError: err => toast.error('Error al eliminar el cliente', err),
  })

  // Nuevos objetos en cada cambio de edits → el Table detecta el cambio y re-renderiza.
  // _dirty incrustado en el record para que onCell lo lea sin depender de un closure.
  const tableData = useMemo(() => {
    const list = Array.isArray(data) ? data : []
    const lower = search.toLowerCase()
    return list
      .filter(r => (r.client_name ?? '').toLowerCase().includes(lower))
      .filter(r => {
        const s = r.client_status ?? 'ACTIVO'
        if (activeFilter === 'ACTIVOS')   return s === 'ACTIVO'
        if (activeFilter === 'INACTIVOS') return s === 'INACTIVO'
        return true
      })
      .map(r => {
        const id = getClientId(r)
        return { ...r, _dirty: computeDirty(r, edits[id]) }
      })
  }, [data, search, activeFilter, edits])

  const columns = useMemo(() => [
    {
      title:  'Nombre',
      key:    'client_name',
      onCell: r => r._dirty ? DIRTY_CELL : {},
      render: (_, r) => {
        const id = getClientId(r)
        return (
          <Input
            allowClear
            value={edits[id]?.client_name ?? ''}
            onChange={e => handleFieldChange(id, 'client_name', e.target.value)}
          />
        )
      },
    },
    {
      title:  'Teléfono',
      key:    'client_phone',
      onCell: r => r._dirty ? DIRTY_CELL : {},
      render: (_, r) => {
        const id = getClientId(r)
        return (
          <Input
            allowClear
            placeholder="Sin teléfono"
            value={edits[id]?.client_phone ?? ''}
            onChange={e => handleFieldChange(id, 'client_phone', e.target.value)}
          />
        )
      },
    },
    {
      title:  'Email',
      key:    'client_email',
      onCell: r => r._dirty ? DIRTY_CELL : {},
      render: (_, r) => {
        const id = getClientId(r)
        return (
          <Input
            allowClear
            placeholder="Sin Email"
            value={edits[id]?.client_email ?? ''}
            onChange={e => handleFieldChange(id, 'client_email', e.target.value)}
          />
        )
      },
    },
    {
      title:  'Llave de Seguimiento',
      key:    'client_man_key',
      onCell: r => r._dirty ? DIRTY_CELL : {},
      render: (_, r) => {
        const id = getClientId(r)
        return (
          <Input
            allowClear
            placeholder="sin llave"
            value={edits[id]?.client_man_key ?? ''}
            onChange={e => handleFieldChange(id, 'client_man_key', e.target.value)}
          />
        )
      },
    },
    {
      title:  'Estado',
      key:    'client_status',
      width:  120,
      align:  'center',
      onCell: r => r._dirty ? DIRTY_CELL : {},
      render: (_, r) => {
        const id       = getClientId(r)
        const isActive = (edits[id]?.client_status ?? 'ACTIVO') === 'ACTIVO'
        return (
          <Switch
            checkedChildren="Activo"
            unCheckedChildren="Inactivo"
            checked={isActive}
            onChange={val => handleFieldChange(id, 'client_status', val ? 'ACTIVO' : 'INACTIVO')}
          />
        )
      },
    },
    {
      title:  'Acciones',
      key:    'actions',
      width:  180,
      render: (_, r) => {
        const id = getClientId(r)
        return (
          <Space>
            {r._dirty && (
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                loading={updateMutation.isPending}
                onClick={() => updateMutation.mutate({
                  client_id:      id,
                  client_name:    edits[id]?.client_name,
                  // null en vez de '' para que el backend lo trate como "sin teléfono"
                  // y de verdad lo vacíe, en lugar de rechazarlo como formato inválido.
                  client_phone:   edits[id]?.client_phone || null,
                  client_email:   edits[id]?.client_email,
                  client_status:  edits[id]?.client_status,
                  client_man_key: edits[id]?.client_man_key,
                })}
              >
                Guardar
              </Button>
            )}
            <Popconfirm
              title="¿Eliminar este cliente?"
              description="Esta acción no se puede deshacer."
              okText="Sí, eliminar"
              cancelText="Cancelar"
              onConfirm={() => deleteMutation.mutate(id)}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                Eliminar
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [edits, updateMutation.isPending, deleteMutation.isPending, handleFieldChange])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="maylob-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Administración de Clientes</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Nuevo Cliente
        </Button>
      </div>

      <Space className="maylob-search-filters" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Buscar por nombre..."
          allowClear
          style={{ width: 300 }}
          onChange={e => setSearch(e.target.value)}
        />
        <Radio.Group
          value={activeFilter}
          onChange={e => setActiveFilter(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="ACTIVOS">Activos</Radio.Button>
          <Radio.Button value="INACTIVOS">Inactivos</Radio.Button>
        </Radio.Group>
      </Space>

      <div className="maylob-table-wrap" style={{ marginTop: 'auto' }}>
        {isLoading ? (
          <Table loading columns={columns} dataSource={[]} rowKey={getClientId} />
        ) : !Array.isArray(data) || data.length === 0 ? (
          <Empty description="No hay clientes registrados aún" style={{ marginTop: 64 }} />
        ) : tableData.length === 0 ? (
          <Empty
            description={search ? `Sin resultados para "${search}"` : 'No hay clientes en este estado'}
            style={{ marginTop: 48 }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={tableData}
            rowKey={getClientId}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
          />
        )}
      </div>

      <Modal
        title="Nuevo Cliente"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        okText="Registrar"
        cancelText="Cancelar"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={values => createMutation.mutate({ ...values, client_email: values.client_email ?? '' })}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="client_name" label="Nombre" rules={[{ required: true, message: 'El nombre es obligatorio' }]}>
            <Input placeholder="Nombre del cliente" />
          </Form.Item>
          <Form.Item name="client_phone" label="Teléfono">
            <Input placeholder="Teléfono" />
          </Form.Item>
          <Form.Item name="client_email" label="Email">
            <Input placeholder="correo@ejemplo.com" />
          </Form.Item>
          <Form.Item name="client_man_key" label="LLAVE DE SEGUIMIENTO">
            <Input placeholder="Si se deja en blanco, se usa el ID del cliente" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
