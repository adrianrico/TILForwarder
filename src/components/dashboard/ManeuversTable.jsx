import { Table, Tag, Progress } from 'antd'

function statusColor(v) {
  if (!v) return 'default'
  const s = v.toLowerCase()
  if (s.includes('inici')) return 'orange'
  if (s.includes('proceso') || s.includes('activ')) return 'green'
  if (s.includes('complet') || s.includes('finaliz')) return 'blue'
  if (s.includes('cancel')) return 'red'
  return 'default'
}

function buildColumns(clientMap, transporterMap) {
  return [
    {
      title: 'Estatus',
      key: 'estatus',
      width: 220,
      render: (_, r) => {
        const status   = r.man_current_status || 'SIN INICIAR'
        const progress = parseInt(r.man_progress, 10) || 0
        return (
          <div>
            <Progress percent={progress} size="small" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 12, color: '#888' }}>{r.man_current_location || '—'}</span>
              <Tag color={statusColor(status)} style={{ marginRight: 0 }}>{status}</Tag>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Carga',
      key: 'carga',
      render: (_, r) => {
        const containerIds = (r.man_containers ?? []).map(c => c.container_id).filter(Boolean)
        return (
          <div>
            <div style={{ fontSize: 12 }}>{containerIds.length > 0 ? containerIds.join(', ') : '—'}</div>
            <div style={{ fontSize: 11, color: '#888' }}>{[r.man_modality, r.man_type].filter(Boolean).join(' · ') || '—'}</div>
          </div>
        )
      },
    },
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_, r) => clientMap[r.man_client] ?? r.man_client ?? '—',
    },
    {
      title: 'Fecha Despacho',
      dataIndex: 'man_dispatch_date',
      key: 'fecha',
      render: (v) => v || '—',
    },
    {
      title: 'Transportista',
      key: 'transportista',
      render: (_, r) => transporterMap[r.man_transporter] ?? r.man_transporter ?? '—',
    },
  ]
}

export default function ManeuversTable({ data, loading, clientMap = {}, transporterMap = {} }) {
  return (
    <Table
      columns={buildColumns(clientMap, transporterMap)}
      dataSource={data}
      loading={loading}
      rowKey={(r) => r._id ?? r.man_id}
      pagination={false}
      size="small"
      scroll={{ x: 800 }}
    />
  )
}
