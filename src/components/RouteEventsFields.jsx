import { Button, Form, Input, Space, Tag } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'

export function isCancelado(name) {
  return (name ?? '').toString().trim().toLowerCase() === 'cancelado'
}

export function normalizeSubEvents(subEvents) {
  if (Array.isArray(subEvents)) return subEvents
  if (typeof subEvents === 'string') {
    return subEvents
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(s => s !== '')
  }
  return []
}

export function buildEvents(events) {
  return [
    { event_name: 'cancelado', sub_events: [] },
    ...(events ?? [])
      .filter(ev => !isCancelado(ev.event_name))
      .map(ev => ({ event_name: ev.event_name ?? '', sub_events: normalizeSubEvents(ev.sub_events) })),
  ]
}

export function processRouteEvents(events = [], sanitize = v => v) {
  return events
    .filter(ev => !isCancelado(ev.event_name))
    .map(ev => ({
      event_name: sanitize(ev.event_name ?? ''),
      sub_events: (ev.sub_events ?? []).map(se => sanitize(se ?? '')).filter(se => se !== ''),
    }))
}

export function EventsFieldList({ name, addLabel, absolutePath }) {
  const form = Form.useFormInstance()
  const basePath = absolutePath ?? name

  function addSubEvent(eventName) {
    const path = [...basePath, eventName, 'sub_events']
    const current = form.getFieldValue(path) ?? []
    form.setFieldValue(path, [...current, ''])
  }

  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name: eventName, ...rest }, index) => (
            <div
              key={key}
              style={index > 0 ? { paddingLeft: 12, borderLeft: '2px solid #0695E4', marginBottom: 8 } : { marginBottom: 8 }}
            >
              {index > 0 && <Tag color="blue" style={{ marginBottom: 4 }}>Sub-paso {index}</Tag>}
              <Space align="baseline" style={{ display: 'flex', marginBottom: 4 }}>
                <Form.Item {...rest} name={[eventName, 'event_name']} style={{ marginBottom: 0, flex: 1 }}>
                  <Input placeholder="Nombre del evento" disabled={index === 0} />
                </Form.Item>
                {index !== 0 && (
                  <MinusCircleOutlined style={{ cursor: 'pointer' }} onClick={() => remove(eventName)} />
                )}
                {index > 0 && (
                  <Button type="text" size="small" title="Agregar sub-evento" icon={<PlusOutlined />} onClick={() => addSubEvent(eventName)} />
                )}
              </Space>
              {index > 0 && (
                <Form.List name={[eventName, 'sub_events']}>
                  {(subFields, { remove: removeSub }) => (
                    <div style={{ paddingLeft: 16, borderLeft: '2px dashed #0695E4', marginLeft: 4 }}>
                      {subFields.map(({ key: subKey, name: subName, ...subRest }) => (
                        <Space key={subKey} align="baseline" style={{ display: 'flex', marginBottom: 4, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: -16, top: '50%', width: 12, borderTop: '2px dashed #0695E4' }} />
                          <Form.Item {...subRest} name={[subName]} style={{ marginBottom: 0, flex: 1 }}>
                            <Input placeholder="Sub-evento" />
                          </Form.Item>
                          <MinusCircleOutlined style={{ cursor: 'pointer' }} onClick={() => removeSub(subName)} />
                        </Space>
                      ))}
                    </div>
                  )}
                </Form.List>
              )}
            </div>
          ))}
          <Button
            type="dashed"
            onClick={() => add({ event_name: '', sub_events: [] })}
            icon={<PlusOutlined />}
            block
            style={{ marginBottom: 8 }}
          >
            {addLabel}
          </Button>
        </>
      )}
    </Form.List>
  )
}
