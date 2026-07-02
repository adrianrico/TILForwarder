import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import esES from 'antd/locale/es_ES'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary:           '#0695E4',
          colorBgBase:            '#010d1a',
          colorBgLayout:          'transparent',
          colorBgContainer:       'rgba(0, 18, 48, 0.35)',
          colorBgElevated:        'rgba(0, 15, 40, 0.88)',
          colorBgSpotlight:       'rgba(0, 15, 40, 0.92)',
          colorBorder:            'rgba(6, 149, 228, 0.25)',
          colorBorderSecondary:   'rgba(6, 149, 228, 0.14)',
          colorText:              '#c9d8e8',
          colorTextHeading:       '#e8f4ff',
          colorTextSecondary:     '#7aafc8',
          borderRadius:           8,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
