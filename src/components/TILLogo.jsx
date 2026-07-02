export default function TILLogo({ height = 36 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <img
        src="/truck.svg"
        alt="TIL truck logo"
        height={height}
        style={{ display: 'block', objectFit: 'contain' }}
      />
      <span
        style={{
          fontSize: height * 0.6,
          fontWeight: 800,
          color: '#0695E4',
          letterSpacing: 3,
          fontFamily: 'Arial, sans-serif',
          lineHeight: 1,
        }}
      >
        TIL
      </span>
    </div>
  )
}
