/**
 * Punto de entrada: monta React con el tema de Ant Design y el idioma español.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import esES from 'antd/locale/es_ES'
import './index.css'
import App from '@/app/App'
import { antdTheme } from '@/app/theme'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider locale={esES} theme={antdTheme}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
