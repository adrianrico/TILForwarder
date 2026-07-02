import { Card, Statistic } from 'antd'

export default function StatCard({ title, value, prefix, suffix, loading, color, subcategories, extra }) {
  return (
    <Card variant="borderless" style={{ borderRadius: 8 }}>
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        loading={loading}
        styles={{ content: { color: color ?? '#1677ff', fontWeight: 600 } }}
      />
      {!loading && extra && (
        <div style={{ marginTop: 10 }}>{extra}</div>
      )}
      {!loading && subcategories?.length > 0 && (
        <div style={{
          display:       'flex',
          flexWrap:      'wrap',
          gap:           16,
          rowGap:        4,
          marginTop:     10,
          paddingTop:    10,
          borderTop:     '1px solid rgba(128,128,128,0.15)',
        }}>
          {subcategories.map(sub => (
            <div key={sub.label} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: sub.color ?? '#888', lineHeight: 1.3 }}>
                {sub.value}
              </span>
              <span style={{ fontSize: 11, color: '#888', lineHeight: 1.3 }}>
                {sub.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
