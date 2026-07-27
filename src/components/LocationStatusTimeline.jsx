import { useEffect, useState } from 'react'
import { Modal, Steps, Timeline, Tag, Space, Button } from 'antd'
import { EnvironmentOutlined, CheckCircleFilled, StopOutlined, SaveOutlined } from '@ant-design/icons'

const CANCEL_EVENT = 'CANCELADO'

function useIsDesktop(breakpoint = 768) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= breakpoint : true
  )
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`)
    const handler = e => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isDesktop
}

export function LocationStatusTimeline({ points = [], location, status, subevent, onChange, disabled, onSave, saveDisabled, saving }) {
  const [open, setOpen] = useState(false)
  const isDesktop = useIsDesktop()

  const matchedIndex = points.findIndex(p => p.value === location)
  const matchedPoint  = matchedIndex >= 0 ? points[matchedIndex] : null
  const isValid       = !!location && !!matchedPoint
  // Every location always gets a default "Cancelar" option on top of whatever
  // events its route template defines - cancelling isn't tied to a specific step.
  const events = isValid
    ? [...matchedPoint.events, { event_name: CANCEL_EVENT, sub_events: [] }]
    : []
  const isDisabled = disabled || points.length === 0

  function selectLocation(point) {
    onChange({ location: point.value, status: '', subevent: '' })
  }

  function selectEvent(eventName) {
    onChange({ location, status: eventName, subevent: '' })
  }

  function selectSubEvent(sub) {
    // Stays checked once picked - no toggle-off, so the mark persists like the
    // location step's own "finish" checkmark.
    onChange({ location, status, subevent: sub })
  }

  const sentStatus = status && subevent ? `${status} / ${subevent}` : (status ?? '')
  // Index of the currently selected event within its location's own sequence -
  // everything before it is an already-completed step and gets a checkmark too.
  const currentEventIndex = events.findIndex(e => e.event_name === status)

  async function handleSave() {
    if (!onSave) return
    try {
      await onSave({ location, status, subevent })
      setOpen(false)
    } catch {
      // keep the modal open on failure so the user can retry
    }
  }

  return (
    <>
      <div
        onClick={e => { e.stopPropagation(); if (!isDisabled) setOpen(true) }}
        style={{
          cursor:   isDisabled ? 'not-allowed' : 'pointer',
          opacity:  isDisabled ? 0.5 : 1,
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <EnvironmentOutlined style={{ color: '#888' }} />
          {matchedPoint ? <strong>{matchedPoint.label}</strong> : <span style={{ color: '#aaa' }}>Seleccionar ubicación…</span>}
        </div>
        {sentStatus && (
          <Tag color={sentStatus.toUpperCase().includes(CANCEL_EVENT) ? 'red' : undefined} style={{ marginTop: 2, marginInlineEnd: 0 }}>
            {sentStatus}
          </Tag>
        )}
      </div>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={onSave ? [
          <Button key="cancel" onClick={() => setOpen(false)}>Cerrar</Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={saveDisabled}
            onClick={handleSave}
          >
            Guardar
          </Button>,
        ] : null}
        destroyOnClose
        centered
        width="96vw"
        title="Seguimiento de la maniobra"
        styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
      >
        <div onClick={e => e.stopPropagation()}>
          {points.length === 0 ? (
            <span style={{ color: '#aaa', fontSize: 12 }}>Sin ruta asignada</span>
          ) : (
            <>
              <Steps
                size="small"
                direction={isDesktop ? 'horizontal' : 'vertical'}
                current={matchedIndex >= 0 ? matchedIndex : -1}
                items={points.map(p => ({ title: p.label }))}
                onChange={i => selectLocation(points[i])}
                style={{ cursor: 'pointer', marginBottom: 24 }}
              />

              {!isValid ? (
                <span style={{ color: '#aaa', fontSize: 12 }}>Selecciona una ubicación para ver sus pasos</span>
              ) : (
                <Timeline
                  items={events.map((e, idx) => {
                    const isCancel    = e.event_name === CANCEL_EVENT
                    const isSelected  = e.event_name === status
                    // A step before the currently selected one was necessarily passed
                    // through already, so it counts as completed too (but cancel is a
                    // side branch, not a sequence step, so it never marks others done).
                    const isCompleted = !isCancel && currentEventIndex >= 0 && idx < currentEventIndex
                    const isDone      = isSelected || isCompleted
                    const currentSubIndex = e.sub_events.indexOf(subevent)
                    return {
                      key: e.event_name,
                      color: isDone ? (isCancel ? 'red' : 'blue') : 'gray',
                      dot: isDone ? <CheckCircleFilled style={{ color: isCancel ? '#ff4d4f' : '#1677ff' }} /> : (isCancel ? <StopOutlined style={{ color: '#ff4d4f' }} /> : undefined),
                      children: (
                        <div>
                          <div
                            style={{
                              cursor:   'pointer',
                              fontWeight: isSelected ? 600 : (isCompleted ? 500 : 400),
                              fontSize:   13,
                              color:      isCancel ? '#ff4d4f' : undefined,
                            }}
                            onClick={() => selectEvent(e.event_name)}
                          >
                            {isCancel ? 'Cancelar' : e.event_name}
                          </div>
                          {isSelected && e.sub_events.length > 0 && (
                            <div style={{ paddingLeft: 10, marginTop: 4, borderLeft: '2px dashed #0695E4' }}>
                              <Space size={[4, 4]} wrap>
                                {e.sub_events.map((se, subIdx) => {
                                  const isSubSelected  = se === subevent
                                  const isSubCompleted = currentSubIndex >= 0 && subIdx < currentSubIndex
                                  const isSubDone      = isSubSelected || isSubCompleted
                                  return (
                                    <Tag.CheckableTag
                                      key={se}
                                      checked={isSubDone}
                                      onChange={() => selectSubEvent(se)}
                                    >
                                      {isSubDone && <CheckCircleFilled style={{ marginRight: 4 }} />}
                                      {se}
                                    </Tag.CheckableTag>
                                  )
                                })}
                              </Space>
                            </div>
                          )}
                        </div>
                      ),
                    }
                  })}
                />
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
